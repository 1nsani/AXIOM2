"use client";

import { useState, useEffect, useCallback } from "react";
import ProblemInput from "@/components/ProblemInput";
import IdeaSchemaForm from "@/components/IdeaSchemaForm";
import ViabilityReportView from "@/components/ViabilityReportView";
import ReportLoadingSkeleton from "@/components/ReportLoadingSkeleton";
import { loadSymPy } from "@/lib/pyodide";
import { solveIdea } from "@/lib/symbolicEngine";
import type { IdeaSchema, FullSubmission, IR, SymbolicResult, IdeaViabilityReport } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
}

const emptyIdeaSchema: IdeaSchema = {
  blok1: [{ id: generateId(), deskripsi: "", kerangka: "" }],
  blok2: [{ id: generateId(), hukum: "", kategori: "" }],
  blok3: "",
  blok4: { targetVariabel: "", totalPersamaan: 0, batasKondisi: "" },
};

type AppState = "IDLE" | "PARSING" | "SOLVING" | "AUDITING" | "DONE" | "ERROR";

export default function Home() {
  // Form state
  const [problemText, setProblemText] = useState("");
  const [problemImageBase64, setProblemImageBase64] = useState<string | null>(null);
  const [ideaSchema, setIdeaSchema] = useState<IdeaSchema>(emptyIdeaSchema);

  // App state
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [loadingText, setLoadingText] = useState("");
  const [report, setReport] = useState<IdeaViabilityReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Preload Pyodide di background
  useEffect(() => {
    // Panggil loadSymPy tanpa await, biarkan berjalan di background
    loadSymPy().catch((err) => {
      console.warn("Pyodide preload gagal, akan dicoba lagi saat submit:", err);
    });
  }, []);

  // Gabungkan fullSubmission
  const getFullSubmission = useCallback((): FullSubmission => ({
    problemText,
    problemImageBase64,
    ideaSchema,
  }), [problemText, problemImageBase64, ideaSchema]);

  // Reset ke IDLE dengan form kosong
  const handleReset = () => {
    setAppState("IDLE");
    setReport(null);
    setErrorMessage("");
    setProblemText("");
    setProblemImageBase64(null);
    setIdeaSchema(emptyIdeaSchema);
  };

  // Kembali ke IDLE tanpa reset form (edit)
  const handleEdit = () => {
    setAppState("IDLE");
    setReport(null);
    setErrorMessage("");
  };

  // Kirim Ide handler
  const handleSubmit = async () => {
    const fullSubmission = getFullSubmission();

    // --- Step 1: Parsing via API ---
    setAppState("PARSING");
    setLoadingText("Menerjemahkan ide kamu...");

    let ir: IR;
    try {
      const parseRes = await fetch("/api/parse-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaSchema: fullSubmission.ideaSchema }),
      });

      if (!parseRes.ok) {
        const errData = await parseRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${parseRes.status})`);
      }

      ir = await parseRes.json();
    } catch (err: any) {
      setAppState("ERROR");
      setErrorMessage(err.message || "Gagal menghubungi server penerjemah.");
      return;
    }

    // --- Step 2: Solving via Pyodide (client-side) ---
    setAppState("SOLVING");
    setLoadingText("Menjalankan kalkulasi simbolik...");

    let symbolicResult: SymbolicResult;
    try {
      symbolicResult = await solveIdea(ir);
    } catch (err: any) {
      setAppState("ERROR");
      setErrorMessage("Gagal menjalankan mesin simbolik: " + (err.message || "error tidak diketahui"));
      return;
    }

    // Jika tidak COMPATIBLE, langsung selesaikan report tanpa audit
    if (symbolicResult.status !== "COMPATIBLE") {
      const fallbackReport: IdeaViabilityReport = {
        status: symbolicResult.status as IdeaViabilityReport["status"],
        blockAudits: [],
        symbolicProof: Object.entries(symbolicResult.rawLatex || {}).map(([v, latex]) => ({
          targetVariable: v,
          solutionLatex: latex,
        })),
        summary: generateFallbackSummary(symbolicResult),
        generatedAt: new Date().toISOString(),
      };
      setReport(fallbackReport);
      setAppState("DONE");
      return;
    }

    // --- Step 3: Audit logic via API ---
    setAppState("AUDITING");
    setLoadingText("Mengaudit logika fisika...");

    try {
      const auditRes = await fetch("/api/audit-logic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ir,
          symbolicResult,
          ideaSchema: fullSubmission.ideaSchema,
          problemText: fullSubmission.problemText,
        }),
      });

      if (!auditRes.ok) {
        const errData = await auditRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${auditRes.status})`);
      }

      const auditReport: IdeaViabilityReport = await auditRes.json();
      setReport(auditReport);
      setAppState("DONE");
    } catch (err: any) {
      setAppState("ERROR");
      setErrorMessage("Audit logika gagal: " + (err.message || "error tidak diketahui"));
    }
  };

  // Render berdasarkan state
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      {appState === "IDLE" && (
        <div className="max-w-4xl mx-auto px-4">
          <ProblemInput
            problemText={problemText}
            onChangeText={setProblemText}
            problemImageBase64={problemImageBase64}
            onChangeImage={setProblemImageBase64}
          />
          <IdeaSchemaForm
            ideaSchema={ideaSchema}
            onChangeSchema={setIdeaSchema}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {(appState === "PARSING" || appState === "SOLVING" || appState === "AUDITING") && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-4">
            <p className="text-lg font-medium text-indigo-700 animate-pulse">{loadingText}</p>
          </div>
          <ReportLoadingSkeleton />
        </div>
      )}

      {appState === "DONE" && report && (
        <ViabilityReportView
          report={report}
          onReset={handleReset}
          onEdit={handleEdit}
        />
      )}

      {appState === "ERROR" && (
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">Oops! Terjadi Kesalahan</h2>
            <p className="text-red-600">{errorMessage}</p>
          </div>
          <button
            onClick={() => setAppState("IDLE")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </main>
  );
}

// Helper untuk membuat summary otomatis saat solving gagal/tidak cukup
function generateFallbackSummary(result: SymbolicResult): string {
  const { status, dofCheck, parseErrors } = result;
  if (status === "INSUFFICIENT_CONSTRAINTS") {
    return `Jumlah persamaan (${dofCheck.equationCount}) kurang dari target variabel (${dofCheck.targetCount}). Tambahkan persamaan atau kurangi target.`;
  }
  if (status === "OVERDETERMINED") {
    return `Terdapat ${dofCheck.equationCount} persamaan untuk ${dofCheck.targetCount} target variabel. Mungkin ada redundansi atau kontradiksi.`;
  }
  if (status === "SOLVE_FAILED") {
    return "Mesin simbolik gagal menyelesaikan sistem persamaan yang diberikan. Periksa kembali rumusan Anda.";
  }
  return status;
}
