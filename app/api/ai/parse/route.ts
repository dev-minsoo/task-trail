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

function normalizeItems(content: string): ParsedItem[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cleaned = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(cleaned);
    const rawItems: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray(parsed.items)
        ? parsed.items
        : [];

    return rawItems
      .map((item) => {
        if (typeof item === "string") {
          return { title: item.trim() };
        }
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const title = typeof record.title === "string" ? record.title.trim() : "";
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
      return titleMatches.filter((title) => title.length > 0).map((title) => ({ title }));
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
      .map((title) => ({ title }));
  }
}

export async function POST(request: Request) {
  const { text }: ParseRequest = await request.json();
  const trimmed = text?.trim() ?? "";

  if (!trimmed) {
    return NextResponse.json({ mode: "fallback", items: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      mode: "fallback",
      items: [{ title: trimmed }],
      message: "AI disabled",
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You convert a user input into a JSON array of task titles (strings). Respond with only a JSON array of strings. No code fences, no extra keys. Today is " +
            today +
            ".",
        },
        { role: "user", content: trimmed },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to parse input" }, { status: 502 });
  }

  const data: OpenAIResponse = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const items = normalizeItems(content);

  return NextResponse.json({ mode: "ai", items });
}
