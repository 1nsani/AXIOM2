"use client";

import { useRef } from "react";

interface ProblemInputProps {
  problemText: string;
  onChangeText: (text: string) => void;
  problemImageBase64: string | null;
  onChangeImage: (base64: string | null) => void;
}

export default function ProblemInput({
  problemText,
  onChangeText,
  problemImageBase64,
  onChangeImage,
}: ProblemInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hanya terima gambar
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diperbolehkan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onChangeImage(base64);
    };
    reader.readAsDataURL(file);

    // Reset input agar bisa memilih file yang sama lagi
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    onChangeImage(null);
  };

  return (
    <section className="border-l-4 border-blue-400 bg-white rounded-lg shadow p-4 md:p-6 mb-6">
      <h2 className="text-xl font-semibold text-blue-700 mb-2">
        Soal Fisika
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Masukkan teks soal dan/atau unggah gambar (scan/foto).
      </p>

      {/* Textarea soal */}
      <textarea
        placeholder="Tempel atau ketik soal OSN di sini..."
        value={problemText}
        onChange={(e) => onChangeText(e.target.value)}
        rows={6}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition resize-y mb-4"
      />

      {/* Upload gambar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 3a3 3 0 11-6 0 3 3 0 016 0zm-2 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          Unggah Gambar Soal
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {problemImageBase64 && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-red-500 hover:text-red-700 text-sm font-medium transition"
          >
            Hapus gambar
          </button>
        )}
      </div>

      {/* Preview gambar */}
      {problemImageBase64 && (
        <div className="mt-4">
          <img
            src={problemImageBase64}
            alt="Preview soal"
            className="max-w-full max-h-64 rounded-md border border-gray-200 object-contain"
          />
        </div>
      )}
    </section>
  );
}
