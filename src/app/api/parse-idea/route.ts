import { NextRequest, NextResponse } from "next/server";
import { IRSchema } from "@/lib/schemas";

export const maxDuration = 60;

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const SYSTEM_PROMPT = `Anda adalah penerjemah fisika untuk sistem komputasi simbolik (SymPy).
Tugas Anda: membaca skema ide dari pengguna (dalam bahasa Indonesia atau campuran istilah fisika) dan mengubahnya menjadi representasi perantara (IR) yang berisi ekspresi simbolik SymPy.

Aturan:
1. Baca seluruh isi ideaSchema yang diberikan: sistem & acuan, hukum fisika per benda, constraint, target variabel, dan jumlah persamaan yang dideklarasikan.
2. Ubah setiap pernyataan bahasa natural/singkatan (mis. "hukum 2 nwt", "fiktif ke kiri") menjadi ekspresi simbolik matematis dalam sintaks SymPy yang valid. Contoh:
   - "Hukum II Newton translasi sumbu-x pada m1, sertakan gaya fiktif -m1*A" menjadi "Eq(m1*a, T - m1*g*sin(theta) - m1*A*cos(theta))"
   - "Kekekalan energi mekanik: Energi awal = Energi akhir" menjadi "Eq(0.5*m*v1**2 + m*g*h1, 0.5*m*v2**2 + m*g*h2)" (dengan asumsi)
   - "Panjang tali konstan -> a1_rel = a2_rel" menjadi "Eq(a1_rel, a2_rel)"
   Gunakan simbol matematika standar: m, m1, m2, g, a, T, N, theta, alpha, dll. Jangan gunakan spasi dalam simbol (gunakan underscore jika perlu: a_rel, v_x).
3. Anda TIDAK BOLEH menyelesaikan persamaan atau melakukan aljabar. Hanya terjemahkan setiap hukum/constraint menjadi satu persamaan sympy "Eq(sisi_kiri, sisi_kanan)".
4. Kumpulkan semua simbol yang muncul di semua persamaan dalam array "variables".
5. Untuk setiap persamaan, isi field:
   - id: string unik (mis. "eq1", "eq2", ...)
   - sourceLabel: dari blok mana di ideaSchema, mis. "Benda 1: Hukum II Newton (Translasi)"
   - sympyExpr: string ekspresi SymPy yang valid, contoh "Eq(m1*a, T - m1*g*sin(theta) - m1*A*cos(theta))"
   - description: deskripsi singkat dalam bahasa Indonesia (1 kalimat)
6. Untuk setiap constraint, isi field serupa: id, sympyExpr, description.
7. targetVariables: ambil dari blok 4 ideaSchema (field targetVariabel). Daftar variabel yang ingin dicari.
8. declaredEquationCount: salin dari ideaSchema.blok4.totalPersamaan (jumlah persamaan yang diharapkan user).
9. parsingNotes: catat jika ada bagian yang ambigu, tidak jelas, atau tidak bisa diubah menjadi persamaan (mis. "gaya gesek" tanpa koefisien). Jika tidak ada, array kosong.
10. Kembalikan HANYA JSON VALID, tanpa teks lain, tanpa markdown code fence (jangan pakai \`\`\`json ... \`\`\`). Hanya string JSON murni.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: DEEPSEEK_API_KEY not set" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ideaSchema } = body;
  if (!ideaSchema) {
    return NextResponse.json(
      { error: "Missing ideaSchema in request body" },
      { status: 400 }
    );
  }

  const userMessage = JSON.stringify({ ideaSchema }, null, 2);

  try {
    const deepseekRes = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      return NextResponse.json(
        { error: `DeepSeek API error: ${deepseekRes.status} ${errText}` },
        { status: 502 }
      );
    }

    const data = await deepseekRes.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { error: "DeepSeek returned empty response" },
        { status: 502 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          {
            error: "Failed to parse LLM response as JSON",
            raw: rawContent.slice(0, 500),
          },
          { status: 422 }
        );
      }
    }

    const validation = IRSchema.safeParse(parsed);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "LLM output tidak sesuai schema IR",
          details: validation.error.issues,
          received: parsed,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(validation.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
