import { loadSymPy, runPython } from "@/lib/pyodide";
import { IR, SymbolicResult } from "@/lib/types";

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

# Jika status sudah bukan COMPATIBLE, kosongkan solutions
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
