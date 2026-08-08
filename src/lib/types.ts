// Tipe data untuk setiap baris di Blok 1
export interface Blok1Item {
  id: string;
  deskripsi: string;
  kerangka: 'Inersia' | 'Non-Inersia' | '';
}

// Tipe data untuk setiap baris di Blok 2
export interface Blok2Item {
  id: string;
  hukum: string;
  kategori:
    | 'Hukum II Newton (Translasi)'
    | 'Hukum II Newton (Rotasi)'
    | 'Kekekalan Energi'
    | 'Kekekalan Momentum'
    | 'Lainnya'
    | '';
}

// Tipe data keseluruhan form
export interface IdeaSchema {
  blok1: Blok1Item[];
  blok2: Blok2Item[];
  blok3: string;
  blok4: {
    targetVariabel: string;
    totalPersamaan: number;
    batasKondisi: string;
  };
}
