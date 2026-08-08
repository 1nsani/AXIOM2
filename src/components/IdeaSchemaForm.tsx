"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IdeaSchema, Blok1Item, Blok2Item } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
}

const emptyBlok1Item = (): Blok1Item => ({
  id: generateId(),
  deskripsi: "",
  kerangka: "",
});

const emptyBlok2Item = (): Blok2Item => ({
  id: generateId(),
  hukum: "",
  kategori: "",
});

interface IdeaSchemaFormProps {
  ideaSchema: IdeaSchema;
  onChangeSchema: (newSchema: IdeaSchema) => void;
  onSubmit?: () => void;
}

export default function IdeaSchemaForm({
  ideaSchema,
  onChangeSchema,
  onSubmit,
}: IdeaSchemaFormProps) {
  // --- Blok 1 handlers ---
  const addBlok1 = () => {
    onChangeSchema({
      ...ideaSchema,
      blok1: [...ideaSchema.blok1, emptyBlok1Item()],
    });
  };

  const removeBlok1 = (id: string) => {
    onChangeSchema({
      ...ideaSchema,
      blok1: ideaSchema.blok1.filter((item) => item.id !== id),
    });
  };

  const updateBlok1Item = (id: string, field: keyof Blok1Item, value: string) => {
    onChangeSchema({
      ...ideaSchema,
      blok1: ideaSchema.blok1.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // --- Blok 2 handlers ---
  const addBlok2 = () => {
    onChangeSchema({
      ...ideaSchema,
      blok2: [...ideaSchema.blok2, emptyBlok2Item()],
    });
  };

  const removeBlok2 = (id: string) => {
    onChangeSchema({
      ...ideaSchema,
      blok2: ideaSchema.blok2.filter((item) => item.id !== id),
    });
  };

  const updateBlok2Item = (id: string, field: keyof Blok2Item, value: string) => {
    onChangeSchema({
      ...ideaSchema,
      blok2: ideaSchema.blok2.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // --- Blok 3 handler ---
  const updateBlok3 = (value: string) => {
    onChangeSchema({
      ...ideaSchema,
      blok3: value,
    });
  };

  // --- Blok 4 handlers ---
  const updateBlok4 = (field: "targetVariabel" | "totalPersamaan" | "batasKondisi", value: string | number) => {
    onChangeSchema({
      ...ideaSchema,
      blok4: { ...ideaSchema.blok4, [field]: value },
    });
  };

  // Indikator keseimbangan
  const targetCount = ideaSchema.blok4.targetVariabel
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;
  const persamaanCount = ideaSchema.blok4.totalPersamaan;
  const isSeimbang = targetCount === persamaanCount;
  const showIndicator = targetCount > 0 || persamaanCount > 0;

  const handleSubmit = () => {
    onSubmit?.();
  };

  return (
    <form
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <h1 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-6">
        AXIOM — Idea Schema Form
      </h1>

      {/* ========== BLOK 1 ========== */}
      <section className="border-l-4 border-indigo-400 dark:border-indigo-500 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
          Blok 1 — Sistem & Acuan
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Definisikan sistem fisis dan kerangka acuan yang digunakan.
        </p>
        <AnimatePresence initial={false}>
          {ideaSchema.blok1.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <label htmlFor={`blok1-deskripsi-${item.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Peninjauan {index + 1}
                </label>
                {ideaSchema.blok1.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlok1(item.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Hapus baris ini"
                    aria-label={`Hapus peninjauan ${index + 1}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    id={`blok1-deskripsi-${item.id}`}
                    type="text"
                    placeholder="Sistem: Massa m1, m2, dan katrol. Kerangka acuan: Non-inersia menempel di bidang miring..."
                    value={item.deskripsi}
                    onChange={(e) => updateBlok1Item(item.id, "deskripsi", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition min-h-[44px]"
                    aria-label={`Deskripsi sistem peninjauan ${index + 1}`}
                  />
                </div>
                <div>
                  <select
                    value={item.kerangka}
                    onChange={(e) => updateBlok1Item(item.id, "kerangka", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition min-h-[44px]"
                    aria-label={`Kerangka acuan peninjauan ${index + 1}`}
                  >
                    <option value="">Pilih kerangka...</option>
                    <option value="Inersia">Inersia</option>
                    <option value="Non-Inersia">Non-Inersia</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          type="button"
          onClick={addBlok1}
          className="mt-3 inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition min-h-[44px]"
          aria-label="Tambah peninjauan baru"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tambah Peninjauan
        </button>
      </section>

      {/* ========== BLOK 2 ========== */}
      <section className="border-l-4 border-green-400 dark:border-green-500 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
          Blok 2 — Hukum Fisika
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tuliskan hukum-hukum fisika yang berlaku pada setiap benda.
        </p>
        <AnimatePresence initial={false}>
          {ideaSchema.blok2.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <label htmlFor={`blok2-hukum-${item.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Benda {index + 1}
                </label>
                {ideaSchema.blok2.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlok2(item.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Hapus baris ini"
                    aria-label={`Hapus benda ${index + 1}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    id={`blok2-hukum-${item.id}`}
                    type="text"
                    placeholder="Hukum II Newton translasi sumbu-x, sertakan gaya fiktif -m1*A"
                    value={item.hukum}
                    onChange={(e) => updateBlok2Item(item.id, "hukum", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition min-h-[44px]"
                    aria-label={`Hukum fisika untuk benda ${index + 1}`}
                  />
                </div>
                <div>
                  <select
                    value={item.kategori}
                    onChange={(e) => updateBlok2Item(item.id, "kategori", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition min-h-[44px]"
                    aria-label={`Kategori hukum untuk benda ${index + 1}`}
                  >
                    <option value="">Pilih kategori...</option>
                    <option value="Hukum II Newton (Translasi)">Hukum II Newton (Translasi)</option>
                    <option value="Hukum II Newton (Rotasi)">Hukum II Newton (Rotasi)</option>
                    <option value="Kekekalan Energi">Kekekalan Energi</option>
                    <option value="Kekekalan Momentum">Kekekalan Momentum</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          type="button"
          onClick={addBlok2}
          className="mt-3 inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium transition min-h-[44px]"
          aria-label="Tambah benda baru"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tambah Benda
        </button>
      </section>

      {/* ========== BLOK 3 ========== */}
      <section className="border-l-4 border-purple-400 dark:border-purple-500 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-400 mb-2">
          Blok 3 — Ikatan / Constraints
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tuliskan hubungan kinematis atau kendala antar variabel.
        </p>
        <textarea
          id="blok3"
          placeholder="Panjang tali konstan → a1_rel = a2_rel"
          value={ideaSchema.blok3}
          onChange={(e) => updateBlok3(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition resize-y min-h-[44px]"
          aria-label="Hubungan kinematis atau constraints"
        />
      </section>

      {/* ========== BLOK 4 ========== */}
      <section className="border-l-4 border-orange-400 dark:border-orange-500 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-orange-700 dark:text-orange-400 mb-2">
          Blok 4 — Batas & Derajat Kebebasan
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tentukan target variabel, jumlah persamaan, dan batasan khusus.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="targetVariabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Variabel
            </label>
            <input
              id="targetVariabel"
              type="text"
              placeholder="T, a_rel, N"
              value={ideaSchema.blok4.targetVariabel}
              onChange={(e) => updateBlok4("targetVariabel", e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition min-h-[44px]"
              aria-label="Target variabel yang ingin dicari"
            />
          </div>
          <div>
            <label htmlFor="totalPersamaan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Persamaan Independen
            </label>
            <input
              id="totalPersamaan"
              type="number"
              min={0}
              value={ideaSchema.blok4.totalPersamaan}
              onChange={(e) =>
                updateBlok4("totalPersamaan", e.target.value === "" ? 0 : parseInt(e.target.value, 10))
              }
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition min-h-[44px]"
              aria-label="Jumlah total persamaan independen"
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="batasKondisi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Batas/Kondisi Khusus <span className="text-gray-400 dark:text-gray-500">(opsional)</span>
          </label>
          <input
            id="batasKondisi"
            type="text"
            placeholder="Batas gaya gesek agar sistem tidak slip"
            value={ideaSchema.blok4.batasKondisi}
            onChange={(e) => updateBlok4("batasKondisi", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition min-h-[44px]"
            aria-label="Batas atau kondisi khusus (opsional)"
          />
        </div>
        {showIndicator && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isSeimbang
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSeimbang ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></span>
            {isSeimbang
              ? "Seimbang (jumlah target = jumlah persamaan)"
              : "Belum Seimbang (periksa kembali)"}
          </motion.div>
        )}
      </section>

      {/* Tombol Kirim */}
      <div className="text-center">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:active:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition text-lg min-w-[200px] min-h-[52px]"
          aria-label="Kirim ide untuk dianalisis"
        >
          Kirim Ide
        </button>
      </div>
    </form>
  );
}
