// Lazy load Pyodide agar tidak memblok halaman awal

let pyodideInstance: any = null;
let sympyLoaded = false;

async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;

  // Muat Pyodide dari CDN secara dinamis
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
  document.head.appendChild(script);

  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Pyodide"));
  });

  // Inisialisasi Pyodide
  const loadPyodide = (window as any).loadPyodide;
  if (!loadPyodide) {
    throw new Error("loadPyodide tidak tersedia");
  }

  pyodideInstance = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
  });

  return pyodideInstance;
}

export async function loadSymPy(): Promise<void> {
  if (sympyLoaded) return;
  const pyodide = await getPyodide();
  await pyodide.runPythonAsync(`
import micropip
await micropip.install('sympy')
  `);
  sympyLoaded = true;
}

export async function runPython(code: string): Promise<string> {
  const pyodide = await getPyodide();
  // Pastikan SymPy sudah terinstall (toleransi jika belum dipanggil)
  if (!sympyLoaded) {
    await loadSymPy();
  }
  const result = pyodide.runPython(code);
  return String(result);
}
