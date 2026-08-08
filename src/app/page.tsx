"use client";

import { useState } from "react";
import { loadSymPy, runPython } from "@/lib/pyodide";

export default function Home() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleTestSymPy = async () => {
    setLoading(true);
    try {
      // Pastikan SymPy siap
      await loadSymPy();
      // Jalankan simplifikasi (x**2 - 1)/(x - 1)
      const output = await runPython(`
x = sympy.symbols('x')
expr = (x**2 - 1) / (x - 1)
simplified = sympy.simplify(expr)
simplified
      `);
      setResult(output);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 text-center">
      <h1 className="text-4xl font-bold mb-4">AXIOM — Idea Engine</h1>
      <p className="text-gray-600 mb-8">
        Prototipe Mode 2: Idea Engine untuk Fisika OSN
      </p>

      <button
        onClick={handleTestSymPy}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Test SymPy"}
      </button>

      {result && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border text-left">
          <h2 className="font-semibold mb-2">Hasil:</h2>
          <code className="text-lg">{result}</code>
          <p className="text-sm text-gray-500 mt-2">
            Ekspresi asli: (x² - 1)/(x - 1) disederhanakan menjadi x + 1.
          </p>
        </div>
      )}
    </main>
  );
}
