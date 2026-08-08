"use client";

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

  // Hitung indikator keseimbangan Blok 4
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
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
        AXIOM — Idea Schema Form
      </h1>

      {/* ========== BLOK 1 ========== */}
      <section className="border-l-4 border-indigo-400 bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-2">
          Blok 1 — Sistem & Acuan
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Definisikan sistem fisis dan kerangka acuan yang digunakan.
        </p>
        {ideaSchema.blok1.map((item, index) => (
          <div key={item.id} className="mb-4 border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Peninjauan {index + 1}
              </label>
              {ideaSchema.blok1.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBlok1(item.id)}
                  className="text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-red-50"
                  title="Hapus baris ini"
                  aria-label="Hapus peninjauan"
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
                  type="text"
                  placeholder="Sistem: Massa m1, m2, dan katrol. Kerangka acuan: Non-inersia menempel di bidang miring..."
                  value={item.deskripsi}
                  onChange={(e) => updateBlok1Item(item.id, "deskripsi", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
                />
              </div>
              <div>
                <select
                  value={item.kerangka}
                  onChange={(e) => updateBlok1Item(item.id, "kerangka", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
                >
                  <option value="">Pilih kerangka...</option>
                  <option value="Inersia">Inersia</option>
                  <option value="Non-Inersia">Non-Inersia</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addBlok1}
          className="mt-3 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tambah Peninjauan
        </button>
      </section>

      {/* ========== BLOK 2 ========== */}
      <section className="border-l-4 border-green-400 bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-green-700 mb-2">
          Blok 2 — Hukum Fisika
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Tuliskan hukum-hukum fisika yang berlaku pada setiap benda.
        </p>
        {ideaSchema.blok2.map((item, index) => (
          <div key={item.id} className="mb-4 border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Benda {index + 1}
              </label>
              {ideaSchema.blok2.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBlok2(item.id)}
                  className="text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-red-50"
                  title="Hapus baris ini"
                  aria-label="Hapus benda"
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
                  type="text"
                  placeholder="Hukum II Newton translasi sumbu-x, sertakan gaya fiktif -m1*A"
                  value={item.hukum}
                  onChange={(e) => updateBlok2Item(item.id, "hukum", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
                />
              </div>
              <div>
                <select
                  value={item.kategori}
                  onChange={(e) => updateBlok2Item(item.id, "kategori", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
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
          </div>
        ))}
        <button
          type="button"
          onClick={addBlok2}
          className="mt-3 inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tambah Benda
        </button>
      </section>

      {/* ========== BLOK 3 ========== */}
      <section className="border-l-4 border-purple-400 bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-purple-700 mb-2">
          Blok 3 — Ikatan / Constraints
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Tuliskan hubungan kinematis atau kendala antar variabel.
        </p>
        <textarea
          placeholder="Panjang tali konstan → a1_rel = a2_rel"
          value={ideaSchema.blok3}
          onChange={(e) => updateBlok3(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition resize-y"
        />
      </section>

      {/* ========== BLOK 4 ========== */}
      <section className="border-l-4 border-orange-400 bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-orange-700 mb-2">
          Blok 4 — Batas & Derajat Kebebasan
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Tentukan target variabel, jumlah persamaan, dan batasan khusus.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Variabel
            </label>
            <input
              type="text"
              placeholder="T, a_rel, N"
              value={ideaSchema.blok4.targetVariabel}
              onChange={(e) => updateBlok4("targetVariabel", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Persamaan Independen
            </label>
            <input
              type="number"
              min={0}
              value={ideaSchema.blok4.totalPersamaan}
              onChange={(e) =>
                updateBlok4("totalPersamaan", e.target.value === "" ? 0 : parseInt(e.target.value, 10))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batas/Kondisi Khusus <span className="text-gray-400">(opsional)</span>
          </label>
          <input
            type="text"
            placeholder="Batas gaya gesek agar sistem tidak slip"
            value={ideaSchema.blok4.batasKondisi}
            onChange={(e) => updateBlok4("batasKondisi", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
          />
        </div>
        {showIndicator && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isSeimbang
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
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
          </div>
        )}
      </section>

      {/* Tombol Kirim */}
      <div className="text-center">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition text-lg min-w-[200px]"
        >
          Kirim Ide
        </button>
      </div>
    </form>
  );
}
