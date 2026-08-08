import { z } from "zod";

// --- Schema untuk persamaan/constraint (dari Fase 3) ---
export const EquationSchema = z.object({
  id: z.string().min(1),
  sourceLabel: z.string().min(1),
  sympyExpr: z.string().min(1),
  description: z.string().min(1),
});

export const ConstraintSchema = z.object({
  id: z.string().min(1),
  sympyExpr: z.string().min(1),
  description: z.string().min(1),
});

// --- Schema untuk IR ---
export const IRSchema = z.object({
  variables: z.array(z.string()),
  equations: z.array(EquationSchema),
  constraints: z.array(ConstraintSchema),
  targetVariables: z.array(z.string()),
  declaredEquationCount: z.number().int().nonnegative(),
  parsingNotes: z.array(z.string()),
});

export type IR = z.infer<typeof IRSchema>;
export type Equation = z.infer<typeof EquationSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;

// --- Schema untuk audit per block (dari LLM) ---
export const BlockAuditSchema = z.object({
  block: z.enum(["SISTEM_ACUAN", "HUKUM_FISIKA", "CONSTRAINTS", "BATAS_DOF"]),
  verdict: z.enum(["OK", "ERROR"]),
  explanation: z.string().min(1),
});

// --- Schema respons audit dari DeepSeek ---
export const AuditResponseSchema = z.object({
  blockAudits: z.array(BlockAuditSchema),
  overallVerdict: z.enum(["COMPATIBLE", "INSUFFICIENT_CONSTRAINTS", "LOGIC_ERROR"]),
  summary: z.string().min(1),
});

export type BlockAudit = z.infer<typeof BlockAuditSchema>;
export type AuditResponse = z.infer<typeof AuditResponseSchema>;

// --- Schema laporan akhir (Idea Viability Report) ---
export const IdeaViabilityReportSchema = z.object({
  status: z.enum(["COMPATIBLE", "INSUFFICIENT_CONSTRAINTS", "LOGIC_ERROR", "SOLVE_FAILED", "OVERDETERMINED"]),
  blockAudits: z.array(BlockAuditSchema),
  symbolicProof: z.array(
    z.object({
      targetVariable: z.string(),
      solutionLatex: z.string(),
    })
  ),
  summary: z.string(),
  generatedAt: z.string(),
});

export type IdeaViabilityReport = z.infer<typeof IdeaViabilityReportSchema>;
