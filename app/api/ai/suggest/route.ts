import { NextResponse } from "next/server";

type SuggestRequest = {
  text?: string;
};

type OpenAIChoice = {
  message?: {
    content?: string | null;
  };
};

type OpenAIResponse = {
  choices?: OpenAIChoice[];
};

function extractTasks(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.tasks)) {
      return parsed.tasks.filter((item: unknown) => typeof item === "string").map((item: string) => item.trim()).filter(Boolean);
    }
  } catch {
    return trimmed
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: Request) {
  const { text }: SuggestRequest = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ tasks: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is required" }, { status: 500 });
  }

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
          content: "You turn a user note into a JSON array of task titles. Respond with only JSON.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch AI suggestions" }, { status: 502 });
  }

  const data: OpenAIResponse = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const tasks = extractTasks(content);

  return NextResponse.json({ tasks });
}
