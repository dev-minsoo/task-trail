import { NextResponse } from "next/server";

type ParseRequest = {
  text?: string;
};

type ParsedItem = {
  title: string;
};

type OpenAIChoice = {
  message?: {
    content?: string | null;
  };
};

type OpenAIResponse = {
  choices?: OpenAIChoice[];
};

type ParseResult = {
  mode: "ai" | "fallback";
  todo: string[];
  message?: string;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_INPUT_CHARS = 4_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_TRACKED_CLIENTS = 2_000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function normalizeItems(content: string): ParsedItem[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cleaned = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const normalizeTitle = (value: string) => value.replace(/\s+/g, " ").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const rawItems: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { todo?: unknown }).todo)
        ? ((parsed as { todo?: unknown }).todo as unknown[])
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
          ? ((parsed as { items?: unknown }).items as unknown[])
          : [];

    return rawItems
      .map((item) => {
        if (typeof item === "string") {
          return { title: normalizeTitle(item) };
        }
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const title = typeof record.title === "string" ? normalizeTitle(record.title) : "";
          return { title };
        }
        return { title: "" };
      })
      .filter((item) => item.title.length > 0);
  } catch {
    const titleMatches = Array.from(cleaned.matchAll(/"title"\s*:\s*"([^"]+)"/g)).map(
      (match) => match[1]?.trim() ?? ""
    );
    if (titleMatches.length > 0) {
      return titleMatches
        .map((title) => normalizeTitle(title))
        .filter((title) => title.length > 0)
        .map((title) => ({ title }));
    }

    return cleaned
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^```/i.test(line))
      .filter((line) => !/^\[\s*\]\s*$/.test(line))
      .filter((line) => !/^\{\s*$/.test(line))
      .filter((line) => !/^\}\s*,?$/.test(line))
      .filter((line) => !/^\]\s*$/.test(line))
      .map((title) => normalizeTitle(title))
      .filter((title) => title.length > 0)
      .map((title) => ({ title }));
  }
}

function fallbackResult(trimmed: string, message: string): ParseResult {
  return {
    mode: "fallback",
    todo: trimmed ? [trimmed] : [],
    message,
  };
}

function parseClientId(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.protocol === requestUrl.protocol && originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}

function checkRateLimit(clientId: string) {
  const now = Date.now();

  if (rateLimitBuckets.size > MAX_TRACKED_CLIENTS) {
    for (const [key, bucket] of rateLimitBuckets.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(key);
      }
    }
  }

  const current = rateLimitBuckets.get(clientId);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }

  current.count += 1;
  rateLimitBuckets.set(clientId, current);
  return { allowed: true };
}

function mapUpstreamErrorToMessage(status: number, errorText: string) {
  const lowerText = errorText.toLowerCase();
  if (status === 429 || lowerText.includes("insufficient_quota")) {
    return "AI credit is exhausted";
  }
  if (status === 401 || status === 403) {
    return "AI authentication failed";
  }
  if (lowerText.includes("model_not_found") || lowerText.includes("does not exist")) {
    return "AI model unavailable";
  }
  if (status >= 500) {
    return "AI service temporarily unavailable";
  }
  return "AI unavailable";
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  let body: ParseRequest;
  try {
    body = (await request.json()) as ParseRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { text } = body;
  const trimmed = text?.trim() ?? "";

  if (!trimmed) {
    return NextResponse.json({ mode: "fallback", todo: [] });
  }

  if (trimmed.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      {
        error: "Input too long",
        message: `Please keep AI input under ${MAX_INPUT_CHARS} characters.`,
      },
      { status: 413 }
    );
  }

  const clientId = parseClientId(request);
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.retryAfterMs ?? 0) / 1_000));
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `AI request limit reached. Try again in ${retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": `${retryAfterSeconds}`,
        },
      }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackResult(trimmed, "AI disabled"));
  }

  const today = new Date().toISOString().slice(0, 10);
  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const configuredTimeout = Number(process.env.OPENAI_TIMEOUT_MS);
  const timeoutMs =
    Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_TIMEOUT_MS;
  const modelCandidates = Array.from(
    new Set([configuredModel, "gpt-4.1-mini", "gpt-4o-mini"].filter((value): value is string => Boolean(value)))
  );
  let fallbackMessage = "AI unavailable";

  try {
    for (const model of modelCandidates) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You convert a user input into natural, concise TODOs. Output Format: {\"todo\":[\"todo1\",\"todo2\"]}. Use natural task phrasing in the same language as the input (Korean or English) and fix spacing. Respond with only JSON, no code fences. Today is " +
                  today +
                  ".",
              },
              { role: "user", content: trimmed },
            ],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });
      } catch (error) {
        const isTimeout = (error as { name?: string }).name === "AbortError";
        fallbackMessage = isTimeout ? "AI request timed out" : "AI unavailable";
        console.error("AI parse upstream request failed", {
          model,
          isTimeout,
          timeoutMs,
          error,
        });
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        fallbackMessage = mapUpstreamErrorToMessage(response.status, errorText);
        console.error("AI parse upstream failed", {
          status: response.status,
          model,
          body: errorText.slice(0, 500),
        });
        continue;
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const items = normalizeItems(content);

      return NextResponse.json({ mode: "ai", todo: items.map((item) => item.title) });
    }
  } catch (error) {
    console.error("AI parse request failed", error);
  }

  return NextResponse.json(fallbackResult(trimmed, fallbackMessage));
}
