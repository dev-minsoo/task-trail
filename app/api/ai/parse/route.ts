import { NextResponse } from "next/server";

type ParseRequest = {
  text?: string;
};

type ParsedItem = {
  title: string;
  date: string;
};

type OpenAIChoice = {
  message?: {
    content?: string | null;
  };
};

type OpenAIResponse = {
  choices?: OpenAIChoice[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeItems(content: string): ParsedItem[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    const rawItems: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray(parsed.items)
        ? parsed.items
        : [];

    return rawItems
      .map((item) => {
        if (typeof item === "string") {
          return { title: item.trim(), date: "" };
        }
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const title = typeof record.title === "string" ? record.title.trim() : "";
          const date =
            typeof record.date === "string" && DATE_PATTERN.test(record.date) ? record.date : "";
          return { title, date };
        }
        return { title: "", date: "" };
      })
      .filter((item) => item.title.length > 0);
  } catch {
    return trimmed
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .map((title) => ({ title, date: "" }));
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
      items: [{ title: trimmed, date: "" }],
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
            "You convert a user input into a JSON array of tasks. Each task is an object with: title (string) and date (YYYY-MM-DD or empty string). Use today's date for relative dates. Respond with only JSON. Today is " +
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
