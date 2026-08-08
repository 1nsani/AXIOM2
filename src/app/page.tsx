"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProblemInput from "@/components/ProblemInput";
import IdeaSchemaForm from "@/components/IdeaSchemaForm";
import ViabilityReportView from "@/components/ViabilityReportView";
import ReportLoadingSkeleton from "@/components/ReportLoadingSkeleton";
import OnboardingModal from "@/components/OnboardingModal";
import ThemeToggle from "@/components/ThemeToggle";
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
  const [problemText, setProblemText] = useState("");
  const [problemImageBase64, setProblemImageBase64] = useState<string | null>(null);
  const [ideaSchema, setIdeaSchema] = useState<IdeaSchema>(emptyIdeaSchema);

  const [appState, setAppState] = useState<AppState>("IDLE");
  const [loadingText, setLoadingText] = useState("");
  const [report, setReport] = useState<IdeaViabilityReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Preload Pyodide
  useEffect(() => {
    loadSymPy().catch((err) => console.warn("Pyodide preload gagal:", err));
  }, []);

  const getFullSubmission = useCallback((): FullSubmission => ({
    problemText,
    problemImageBase64,
    ideaSchema,
  }), [problemText, problemImageBase64, ideaSchema]);

  const handleReset = () => {
    setAppState("IDLE");
    setReport(null);
    setErrorMessage("");
    setProblemText("");
    setProblemImageBase64(null);
    setIdeaSchema(emptyIdeaSchema);
  };

  const handleEdit = () => {
    setAppState("IDLE");
    setReport(null);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    const fullSubmission = getFullSubmission();

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
      setErrorMessage(
        err.message.includes("422")
          ? "Sepertinya ada bagian yang kurang jelas. Coba tulis ulang deskripsi sistem dan hukum fisika dengan lebih detail, lalu kirim lagi."
          : err.message || "Gagal menghubungi server penerjemah. Periksa koneksi internet dan coba lagi."
      );
      return;
    }

    setAppState("SOLVING");
    setLoadingText("Menjalankan kalkulasi simbolik...");

    let symbolicResult: SymbolicResult;
    try {
      symbolicResult = await solveIdea(ir);
    } catch (err: any) {
      setAppState("ERROR");
      setErrorMessage("Gagal menjalankan mesin simbolik. Pastikan browser mendukung WebAssembly. " + (err.message || ""));
      return;
    }

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
      setErrorMessage("Audit logika gagal. Mungkin server AI sedang sibuk. Coba lagi dalam beberapa saat. " + (err.message || ""));
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      {/* Onboarding hanya muncul pertama kali */}
      <OnboardingModal />

      {/* Theme toggle di pojok kanan atas */}
      <div className="fixed top-4 right-4 z-40">
        <ThemeToggle />
      </div>

      <AnimatePresence mode="wait">
        {appState === "IDLE" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto px-4"
          >
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
          </motion.div>
        )}

        {(appState === "PARSING" || appState === "SOLVING" || appState === "AUDITING") && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto px-4"
          >
            <div className="text-center mb-4">
              <p className="text-lg font-medium text-indigo-700 dark:text-indigo-400 animate-pulse">{loadingText}</p>
            </div>
            <ReportLoadingSkeleton />
          </motion.div>
        )}

        {appState === "DONE" && report && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ViabilityReportView
              report={report}
              onReset={handleReset}
              onEdit={handleEdit}
            />
          </motion.div>
        )}

        {appState === "ERROR" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto px-4 text-center"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Oops! Terjadi Kendala</h2>
              <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
            <button
              onClick={() => setAppState("IDLE")}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition min-h-[44px]"
              aria-label="Coba lagi setelah error"
            >
              Coba Lagi
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function generateFallbackSummary(result: SymbolicResult): string {
  const { status, dofCheck } = result;
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
