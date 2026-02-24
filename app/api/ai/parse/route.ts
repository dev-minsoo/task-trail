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

export async function POST(request: Request) {
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackResult(trimmed, "AI disabled"));
  }

  const today = new Date().toISOString().slice(0, 10);
  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const modelCandidates = Array.from(
    new Set([configuredModel, "gpt-4.1-mini", "gpt-4o-mini"].filter((value): value is string => Boolean(value)))
  );

  try {
    for (const model of modelCandidates) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
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

  return NextResponse.json(fallbackResult(trimmed, "AI unavailable"));
}
