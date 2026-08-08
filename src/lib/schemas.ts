import { z } from "zod";

// Schema untuk satu persamaan
export const EquationSchema = z.object({
  id: z.string().min(1),
  sourceLabel: z.string().min(1),
  sympyExpr: z.string().min(1),
  description: z.string().min(1),
});

// Schema untuk satu constraint
export const ConstraintSchema = z.object({
  id: z.string().min(1),
  sympyExpr: z.string().min(1),
  description: z.string().min(1),
});

// Schema untuk keseluruhan Intermediate Representation (IR)
export const IRSchema = z.object({
  variables: z.array(z.string()),
  equations: z.array(EquationSchema),
  constraints: z.array(ConstraintSchema),
  targetVariables: z.array(z.string()),
  declaredEquationCount: z.number().int().nonnegative(),
  parsingNotes: z.array(z.string()),
});

// Tipe TypeScript yang dihasilkan dari Zod schema
export type IR = z.infer<typeof IRSchema>;
export type Equation = z.infer<typeof EquationSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
