import { loadSymPy, runPython } from "@/lib/pyodide";
import { IR, SymbolicResult, MonteCarloResult } from "@/lib/types";

export async function solveIdea(ir: IR): Promise<SymbolicResult> {
  // Pastikan Pyodide + SymPy sudah termuat
  await loadSymPy();

  // Siapkan JSON string dari IR, amankan dari tanda kutip
  const irJson = JSON.stringify(ir);

  // Bangun kode Python lengkap
  const pythonCode = `
import json
import sympy

# Baca input dari JavaScript
ir = json.loads(r"""${irJson}""")

# Ekstrak data
variables = ir.get("variables", [])
equations = ir.get("equations", [])
constraints = ir.get("constraints", [])
target_vars = ir.get("targetVariables", [])
declared_eq_count = ir.get("declaredEquationCount", 0)

# Buat simbol dari daftar variabel
if variables:
    # Gabungkan semua nama variabel dipisah spasi
    sym_vars = sympy.symbols(" ".join(variables))
    # Jika hanya satu simbol, sym_vars bukan tuple, jadikan tuple
    if not isinstance(sym_vars, tuple):
        sym_vars = (sym_vars,)
    # Buat dictionary: nama -> simbol
    symbol_dict = {str(s): s for s in sym_vars}
else:
    symbol_dict = {}

# Gabungkan semua persamaan (equations + constraints)
all_eqs = []
for eq in equations + constraints:
    all_eqs.append({
        "id": eq.get("id", "?"),
        "expr_str": eq.get("sympyExpr", ""),
        "label": eq.get("sourceLabel", eq.get("description", ""))
    })

valid_exprs = []
parse_errors = []

# Parse setiap persamaan
for eq in all_eqs:
    expr_str = eq["expr_str"]
    if not expr_str:
        parse_errors.append(f"{eq['id']}: ekspresi kosong")
        continue
    try:
        # Gunakan sympify dengan symbol_dict sebagai locals
        expr = sympy.sympify(expr_str, locals=symbol_dict)
        valid_exprs.append(expr)
    except Exception as e:
        parse_errors.append(f"{eq['id']}: {str(e)}")

# Hitung DoF
target_count = len(target_vars)
valid_eq_count = len(valid_exprs)
balanced = target_count == valid_eq_count

if valid_eq_count < target_count:
    status = "INSUFFICIENT_CONSTRAINTS"
elif valid_eq_count > target_count:
    status = "OVERDETERMINED"
else:
    status = "COMPATIBLE"  # sementara, mungkin berubah jika solve gagal

# Siapkan simbol target
target_symbols = []
for tv in target_vars:
    if tv in symbol_dict:
        target_symbols.append(symbol_dict[tv])
    else:
        # Jika variabel target tidak ada di daftar, buat simbol baru
        s = sympy.symbols(tv)
        symbol_dict[tv] = s
        target_symbols.append(s)

solutions = {}
raw_latex = {}

# Coba solve jika ada persamaan valid dan target
if valid_exprs and target_symbols:
    try:
        # solve mengembalikan list of dict untuk setiap solusi
        sol = sympy.solve(valid_exprs, target_symbols, dict=True)
        if sol:
            # Ambil solusi pertama (asumsi sistem memiliki solusi unik)
            first_sol = sol[0]
            for tv, sym in zip(target_vars, target_symbols):
                if sym in first_sol:
                    expr_sol = first_sol[sym]
                    solutions[tv] = str(expr_sol)
                    try:
                        raw_latex[tv] = sympy.latex(expr_sol)
                    except:
                        raw_latex[tv] = str(expr_sol)
                else:
                    solutions[tv] = "tidak ditemukan solusi"
            status = "COMPATIBLE"
        else:
            status = "SOLVE_FAILED"
            parse_errors.append("solve() mengembalikan list kosong (mungkin tidak ada solusi)")
    except Exception as e:
        status = "SOLVE_FAILED"
        parse_errors.append(f"solve() error: {str(e)}")
elif not valid_exprs:
    status = "INSUFFICIENT_CONSTRAINTS"
else:
    # target_symbols kosong? tidak mungkin, tapi jaga-jaga
    status = "INSUFFICIENT_CONSTRAINTS"

# Jika status bukan COMPATIBLE, kosongkan solutions
if status != "COMPATIBLE":
    solutions = {}
    raw_latex = {}

# Bangun hasil akhir sesuai interface SymbolicResult
result = {
    "status": status,
    "dofCheck": {
        "targetCount": target_count,
        "equationCount": valid_eq_count,
        "balanced": balanced
    },
    "solutions": solutions,
    "parseErrors": parse_errors,
    "rawLatex": raw_latex
}

print(json.dumps(result))
`;

  // Jalankan kode Python melalui Pyodide
  const output = await runPython(pythonCode);
  // Parse hasil JSON dari Python
  const result: SymbolicResult = JSON.parse(output);
  return result;
}

// Fungsi baru: Monte Carlo verification (Fase 5)
export async function monteCarloVerify(
  userExpr: string,
  answerKeyExpr: string,
  freeSymbols: string[],
  iterations: number = 100
): Promise<MonteCarloResult> {
  await loadSymPy();

  const pythonCode = `
import json
import sympy
import random
import math

user_expr_str = """${userExpr}"""
answer_expr_str = """${answerKeyExpr}"""
free_symbols = ${JSON.stringify(freeSymbols)}
iterations = ${iterations}

# Buat simbol
sym_dict = {}
for s in free_symbols:
    sym_dict[s] = sympy.symbols(s)

# Parse ekspresi
try:
    user_expr = sympy.sympify(user_expr_str, locals=sym_dict)
except Exception as e:
    print(json.dumps({"error": f"Gagal parse userExpr: {str(e)}"}))
    raise SystemExit(0)

try:
    answer_expr = sympy.sympify(answer_expr_str, locals=sym_dict)
except Exception as e:
    print(json.dumps({"error": f"Gagal parse answerKeyExpr: {str(e)}"}))
    raise SystemExit(0)

# 1. Cek simbolik dulu
try:
    diff = sympy.simplify(user_expr - answer_expr)
    if diff == 0:
        result = {
            "status": "MATCH_SYMBOLIC",
            "validIterations": 0,
            "matchingIterations": 0,
            "sampleMismatch": None
        }
        print(json.dumps(result))
        raise SystemExit(0)
except:
    # simplify gagal, lanjut ke Monte Carlo
    pass

# 2. Monte Carlo
valid = 0
match = 0
sample_mismatch = None

for i in range(iterations):
    # Generate random substitution
    subs_dict = {}
    try:
        for s in free_symbols:
            # Rentang aman 0.1 sampai 10, hindari 0
            subs_dict[sym_dict[s]] = random.uniform(0.1, 10.0)
        # Evaluasi numerik
        user_val = float(user_expr.subs(subs_dict).evalf())
        answer_val = float(answer_expr.subs(subs_dict).evalf())
        # Cek domain: mungkin NaN atau inf
        if math.isnan(user_val) or math.isnan(answer_val) or math.isinf(user_val) or math.isinf(answer_val):
            continue
        valid += 1
        if abs(user_val - answer_val) < 1e-6:
            match += 1
        elif sample_mismatch is None:
            # Simpan contoh mismatch pertama
            sample_mismatch = {
                "substitution": {s: subs_dict[sym_dict[s]] for s in free_symbols},
                "userValue": user_val,
                "answerValue": answer_val
            }
    except:
        # Domain error, skip iterasi ini
        continue

# Tentukan status
if valid < 10:
    status = "INCONCLUSIVE"
elif match / valid >= 0.9:
    status = "MATCH_NUMERIC"
else:
    status = "MISMATCH"

result = {
    "status": status,
    "validIterations": valid,
    "matchingIterations": match,
    "sampleMismatch": sample_mismatch
}
print(json.dumps(result))
`;

  const output = await runPython(pythonCode);
  const result: MonteCarloResult = JSON.parse(output);
  return result;
}
