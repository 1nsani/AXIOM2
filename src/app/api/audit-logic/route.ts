import { NextRequest, NextResponse } from "next/server";
import { AuditResponseSchema, IdeaViabilityReportSchema } from "@/lib/schemas";
import type { IR, SymbolicResult, IdeaSchema, IdeaViabilityReport } from "@/lib/types";

export const maxDuration = 60;

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const SYSTEM_PROMPT = `Anda adalah Auditor Fisika untuk Olimpiade Sains Nasional (OSN), sangat teliti dalam menemukan kesalahan konsep fisika pada solusi siswa. Tugas Anda: membaca ideaSchema (deskripsi sistem, hukum fisika yang dipakai, constraints, target variabel) dan hasil symbolic check (apakah persamaan cukup dan bisa diselesaikan). Anda TIDAK menghitung ulang aljabar, hanya menilai kebenaran konsep.

Untuk setiap BLOK berikut, berikan audit:
1. SISTEM_ACUAN: Apakah pemilihan kerangka acuan (inersia/non-inersia) sudah tepat? Apakah gaya fiktif (jika non-inersia) sudah diidentifikasi dengan benar? Apakah semua benda relevan dimasukkan?
2. HUKUM_FISIKA: Apakah setiap hukum yang dipilih (Newton, kekekalan energi, momentum) sesuai dengan kondisi sistem? Waspadai: kekekalan energi mekanik digunakan padahal ada gaya non-konservatif (gesekan) yang belum dimasukkan ke Work-Energy, arah gaya fiktif terbalik, hukum rotasi dipakai tanpa torsi, dsb. Periksa setiap benda satu per satu.
3. CONSTRAINTS: Apakah hubungan kinematis (tali, kontak, engsel) dirumuskan dengan benar? Cek konsistensi arah percepatan, kecepatan, dan tanda.
4. BATAS_DOF: Apakah target variabel yang dicari masuk akal? Apakah kondisi khusus (batas gaya gesek statik, ketegangan tali) dirumuskan dengan benar?

Untuk setiap blok, berikan verdict:
- "OK" jika tidak ditemukan kesalahan konsep
- "ERROR" jika ada kesalahan, beserta penjelasan singkat KENAPA salah (1-2 kalimat, dalam bahasa Indonesia)

Keseluruhan: overallVerdict "COMPATIBLE" jika semua block OK, "LOGIC_ERROR" jika ada setidaknya satu ERROR, atau "INSUFFICIENT_CONSTRAINTS" jika blok tidak lengkap.

Ringkasan (summary) 2-3 kalimat untuk siswa, berisi temuan utama dan saran perbaikan.

Kembalikan HANYA JSON valid tanpa teks lain, tanpa markdown fence. Format:
{
  "blockAudits": [
    { "block": "SISTEM_ACUAN", "verdict": "OK", "explanation": "..." },
    { "block": "HUKUM_FISIKA", "verdict": "OK", "explanation": "..." },
    { "block": "CONSTRAINTS", "verdict": "OK", "explanation": "..." },
    { "block": "BATAS_DOF", "verdict": "ERROR", "explanation": "..." }
  ],
  "overallVerdict": "LOGIC_ERROR",
  "summary": "..."
}`;

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

  const { ir, symbolicResult, ideaSchema, problemText } = body;
  if (!ir || !symbolicResult || !ideaSchema) {
    return NextResponse.json(
      { error: "Missing required fields: ir, symbolicResult, ideaSchema" },
      { status: 400 }
    );
  }

  const userContext = {
    problemText: problemText || "(tidak ada teks soal)",
    ideaSchema: ideaSchema,
    symbolicSummary: {
      status: symbolicResult.status,
      dof: symbolicResult.dofCheck,
      solutions: symbolicResult.solutions,
      parseErrors: symbolicResult.parseErrors,
    },
  };

  const userMessage = JSON.stringify(userContext, null, 2);

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

    let auditParsed: any;
    try {
      auditParsed = JSON.parse(rawContent);
    } catch {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
      try {
        auditParsed = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          {
            error: "Failed to parse LLM audit response as JSON",
            raw: rawContent.slice(0, 500),
          },
          { status: 422 }
        );
      }
    }

    const auditValidation = AuditResponseSchema.safeParse(auditParsed);
    if (!auditValidation.success) {
      return NextResponse.json(
        {
          error: "LLM audit output tidak sesuai schema",
          details: auditValidation.error.issues,
          received: auditParsed,
        },
        { status: 422 }
      );
    }

    const audit = auditValidation.data;

    let finalStatus: IdeaViabilityReport["status"] = "COMPATIBLE";
    if (symbolicResult.status !== "COMPATIBLE") {
      finalStatus = symbolicResult.status as any;
    } else {
      const hasError = audit.blockAudits.some((b) => b.verdict === "ERROR");
      if (hasError) {
        finalStatus = "LOGIC_ERROR";
      }
    }

    const symbolicProof = Object.entries(symbolicResult.rawLatex || {}).map(
      ([target, latex]) => ({
        targetVariable: target,
        solutionLatex: latex,
      })
    );
    if (symbolicProof.length === 0 && symbolicResult.solutions) {
      for (const [target, expr] of Object.entries(symbolicResult.solutions)) {
        symbolicProof.push({ targetVariable: target, solutionLatex: expr });
      }
    }

    const report: IdeaViabilityReport = {
      status: finalStatus,
      blockAudits: audit.blockAudits,
      symbolicProof,
      summary: audit.summary,
      generatedAt: new Date().toISOString(),
    };

    const reportValidation = IdeaViabilityReportSchema.safeParse(report);
    if (!reportValidation.success) {
      return NextResponse.json(
        { error: "Generated report invalid", details: reportValidation.error.issues },
        { status: 500 }
      );
    }

    return NextResponse.json(reportValidation.data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
