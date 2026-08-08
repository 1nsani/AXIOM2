"use client";

import { useState, useEffect } from "react";

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const onboarded = localStorage.getItem("axiom_onboarded");
    if (!onboarded) {
      setIsOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("axiom_onboarded", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const slides = [
    {
      title: "Selamat Datang di AXIOM! 👋",
      content:
        "AXIOM adalah asisten cerdas untuk membantu kamu menyusun dan memverifikasi ide solusi soal fisika olimpiade. Kamu jadi arsitek idenya — AI yang akan menghitung dan mengaudit logika fisikanya.",
    },
    {
      title: "Isi Idea Schema 📝",
      content:
        "Langkah pertama: jelaskan sistem fisis dan kerangka acuan. Lalu tuliskan hukum fisika yang berlaku di setiap benda. Tambahkan constraints (hubungan kinematis) dan tentukan target variabel yang ingin dicari.",
    },
    {
      title: "AI Bekerja 🤖",
      content:
        "Setelah kamu kirim, AI akan: (1) menerjemahkan idemu ke persamaan simbolik, (2) menyelesaikannya dengan SymPy, (3) mengaudit apakah ada kesalahan konsep fisika. Kamu akan mendapatkan laporan lengkap!",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 text-center">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
          {slides[slide].title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {slides[slide].content}
        </p>
        <div className="flex justify-between items-center">
          <button
            onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
            aria-label="Lewati onboarding"
          >
            Lewati
          </button>
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === slide ? "bg-indigo-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide((s) => s + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              aria-label="Lanjut ke slide berikutnya"
            >
              Lanjut
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              aria-label="Mulai menggunakan aplikasi"
            >
              Mulai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
