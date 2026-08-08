"use client";

import { useState } from "react";
import katex from "katex";
import type { IdeaViabilityReport } from "@/lib/types";

// Helper render LaTeX ke HTML
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
    badgeClass: "bg-green-100 border-green-300 text-green-800",
  },
  INSUFFICIENT_CONSTRAINTS: {
    color: "yellow",
    text: "Persamaan Belum Cukup",
    icon: (
      <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    badgeClass: "bg-yellow-100 border-yellow-300 text-yellow-800",
  },
  LOGIC_ERROR: {
    color: "red",
    text: "Ada Kesalahan Konsep",
    icon: (
      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badgeClass: "bg-red-100 border-red-300 text-red-800",
  },
  SOLVE_FAILED: {
    color: "gray",
    text: "Sistem Tidak Bisa Diselesaikan",
    icon: (
      <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
      </svg>
    ),
    badgeClass: "bg-gray-100 border-gray-300 text-gray-800",
  },
  OVERDETERMINED: {
    color: "orange",
    text: "Persamaan Berlebih (Overdetermined)",
    icon: (
      <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    badgeClass: "bg-orange-100 border-orange-300 text-orange-800",
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Badge status */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">{config.icon}</div>
        <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold border ${config.badgeClass} mb-4`}>
          {config.text}
        </span>
        <p className="text-gray-700 max-w-2xl">{report.summary}</p>
        <p className="text-xs text-gray-400 mt-2">
          Dibuat pada {new Date(report.generatedAt).toLocaleString("id-ID")}
        </p>
      </div>

      {/* Block audits (collapsible) */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">Audit Per Blok</h2>
        {report.blockAudits.map((audit) => (
          <div
            key={audit.block}
            className="bg-white border rounded-lg shadow-sm overflow-hidden transition-all"
          >
            <button
              onClick={() => toggleBlock(audit.block)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                {audit.verdict === "OK" ? (
                  <span className="text-green-500 text-lg">✅</span>
                ) : (
                  <span className="text-red-500 text-lg">❌</span>
                )}
                <span className="font-medium">{blockLabels[audit.block] || audit.block}</span>
              </div>
              <svg
                className={`w-5 h-5 transform transition-transform ${
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
              <div className="px-4 pb-4 pt-0 text-sm text-gray-600 border-t border-gray-100">
                <p className="mt-2">{audit.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Symbolic proof */}
      {report.symbolicProof.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Bukti Simbolik</h2>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-indigo-400 space-y-3">
            {report.symbolicProof.map((proof, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium text-gray-700">{proof.targetVariable}:</span>{" "}
                <span
                  dangerouslySetInnerHTML={{ __html: renderLatex(proof.solutionLatex) }}
                  className="text-base"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition"
        >
          Coba Ide Lain
        </button>
        <button
          onClick={onEdit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Edit Ide Ini
        </button>
      </div>
    </div>
  );
}
