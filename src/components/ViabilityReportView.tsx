"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import katex from "katex";
import type { IdeaViabilityReport } from "@/lib/types";

function renderLatex(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false });
  } catch {
    return latex;
  }
}

interface ViabilityReportViewProps {
  report: IdeaViabilityReport;
  onReset: () => void;
  onEdit: () => void;
}

const statusConfig: Record<
  IdeaViabilityReport["status"],
  { color: string; icon: React.ReactNode; text: string; badgeClass: string }
> = {
  COMPATIBLE: {
    color: "green",
    text: "Ide Kamu Sesuai!",
    icon: (
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badgeClass: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-400",
  },
  INSUFFICIENT_CONSTRAINTS: {
    color: "yellow",
    text: "Persamaan Belum Cukup",
    icon: (
      <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    badgeClass: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400",
  },
  LOGIC_ERROR: {
    color: "red",
    text: "Ada Kesalahan Konsep",
    icon: (
      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badgeClass: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-400",
  },
  SOLVE_FAILED: {
    color: "gray",
    text: "Sistem Tidak Bisa Diselesaikan",
    icon: (
      <svg className="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
      </svg>
    ),
    badgeClass: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300",
  },
  OVERDETERMINED: {
    color: "orange",
    text: "Persamaan Berlebih (Overdetermined)",
    icon: (
      <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    badgeClass: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-400",
  },
};

export default function ViabilityReportView({ report, onReset, onEdit }: ViabilityReportViewProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const config = statusConfig[report.status] || statusConfig.SOLVE_FAILED;

  const toggleBlock = (block: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [block]: !prev[block] }));
  };

  const blockLabels: Record<string, string> = {
    SISTEM_ACUAN: "Sistem & Acuan",
    HUKUM_FISIKA: "Hukum Fisika",
    CONSTRAINTS: "Ikatan / Constraints",
    BATAS_DOF: "Batas & DoF",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-8"
    >
      {/* Badge status dengan animasi scale-in */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-4">{config.icon}</div>
        <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold border ${config.badgeClass} mb-4`}>
          {config.text}
        </span>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl">{report.summary}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Dibuat pada {new Date(report.generatedAt).toLocaleString("id-ID")}
        </p>
      </motion.div>

      {/* Block audits */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Audit Per Blok</h2>
        {report.blockAudits.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Tidak ada audit logika untuk status ini.
          </p>
        ) : (
          report.blockAudits.map((audit) => (
            <div
              key={audit.block}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleBlock(audit.block)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition min-h-[44px]"
                aria-expanded={!!expandedBlocks[audit.block]}
                aria-label={`Audit ${blockLabels[audit.block] || audit.block}: ${audit.verdict === "OK" ? "Benar" : "Ada kesalahan"}`}
              >
                <div className="flex items-center gap-3">
                  {audit.verdict === "OK" ? (
                    <span className="text-green-500 text-lg" role="img" aria-label="Benar">✅</span>
                  ) : (
                    <span className="text-red-500 text-lg" role="img" aria-label="Salah">❌</span>
                  )}
                  <span className="font-medium dark:text-white">{blockLabels[audit.block] || audit.block}</span>
                </div>
                <svg
                  className={`w-5 h-5 transform transition-transform dark:text-gray-400 ${
                    expandedBlocks[audit.block] ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedBlocks[audit.block] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-4 pb-4 pt-0 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700"
                >
                  <p className="mt-2">{audit.explanation}</p>
                </motion.div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Symbolic proof */}
      {report.symbolicProof.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Bukti Simbolik</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border-l-4 border-indigo-400 dark:border-indigo-500 space-y-3">
            {report.symbolicProof.map((proof, idx) => (
              <div key={idx} className="text-sm flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">{proof.targetVariable}:</span>{" "}
                <span
                  dangerouslySetInnerHTML={{ __html: renderLatex(proof.solutionLatex) }}
                  className="text-base"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-4 pt-4 flex-wrap"
      >
        <button
          onClick={onReset}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-6 rounded-lg transition min-h-[44px]"
          aria-label="Coba ide baru dari awal"
        >
          Coba Ide Lain
        </button>
        <button
          onClick={onEdit}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg transition min-h-[44px]"
          aria-label="Edit ide yang sudah dikirim"
        >
          Edit Ide Ini
        </button>
      </motion.div>
    </motion.div>
  );
}
