// Tipe data untuk setiap baris di Blok 1
export interface Blok1Item {
  id: string;
  deskripsi: string;
  kerangka: 'Inersia' | 'Non-Inersia' | '';
}

// Tipe data untuk setiap baris di Blok 2
export interface Blok2Item {
  id: string;
  hukum: string;
  kategori:
    | 'Hukum II Newton (Translasi)'
    | 'Hukum II Newton (Rotasi)'
    | 'Kekekalan Energi'
    | 'Kekekalan Momentum'
    | 'Lainnya'
    | '';
}

// Tipe data keseluruhan idea schema (blok 1-4)
export interface IdeaSchema {
  blok1: Blok1Item[];
  blok2: Blok2Item[];
  blok3: string;
  blok4: {
    targetVariabel: string;
    totalPersamaan: number;
    batasKondisi: string;
  };
}

// Tipe data gabungan untuk kiriman lengkap (Fase 2)
export interface FullSubmission {
  problemText: string;
  problemImageBase64: string | null;
  ideaSchema: IdeaSchema;
}

// Tipe hasil dari Symbolic Engine (Fase 4)
export interface SymbolicResult {
  status: "COMPATIBLE" | "INSUFFICIENT_CONSTRAINTS" | "OVERDETERMINED" | "SOLVE_FAILED";
  dofCheck: {
    targetCount: number;
    equationCount: number;
    balanced: boolean;
  };
  solutions: Record<string, string>;
  parseErrors: string[];
  rawLatex: Record<string, string>;
  monteCarlo?: MonteCarloResult;
}

// Tipe hasil Monte Carlo verification (Fase 5)
export interface MonteCarloResult {
  status: "MATCH_SYMBOLIC" | "MATCH_NUMERIC" | "MISMATCH" | "INCONCLUSIVE";
  validIterations: number;
  matchingIterations: number;
  sampleMismatch: {
    substitution: Record<string, number>;
    userValue: number;
    answerValue: number;
  } | null;
}

// Tipe Intermediate Representation (dari Fase 3)
export interface IR {
  variables: string[];
  equations: {
    id: string;
    sourceLabel: string;
    sympyExpr: string;
    description: string;
  }[];
  constraints: {
    id: string;
    sympyExpr: string;
    description: string;
  }[];
  targetVariables: string[];
  declaredEquationCount: number;
  parsingNotes: string[];
}

// Tipe untuk audit per block (dari Fase 6)
export interface BlockAudit {
  block: "SISTEM_ACUAN" | "HUKUM_FISIKA" | "CONSTRAINTS" | "BATAS_DOF";
  verdict: "OK" | "ERROR";
  explanation: string;
}

// Tipe laporan akhir (Fase 6)
export interface IdeaViabilityReport {
  status: "COMPATIBLE" | "INSUFFICIENT_CONSTRAINTS" | "LOGIC_ERROR" | "SOLVE_FAILED" | "OVERDETERMINED";
  blockAudits: BlockAudit[];
  symbolicProof: {
    targetVariable: string;
    solutionLatex: string;
  }[];
  summary: string;
  generatedAt: string;
}
