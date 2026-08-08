import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY tidak diset di environment" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: "Balas dengan kata OK saja",
          },
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `DeepSeek API error: ${response.status} ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "(tidak ada balasan)";

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
