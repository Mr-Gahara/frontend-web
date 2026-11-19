"use client";

import { useState } from "react";

/**
 * Draf panel filter (FL3a): panel dibuka dengan salinan filter terapan,
 * pilihan berlaku hanya lewat Terapkan, dan menutup panel tanpa Terapkan
 * membuang draf. Atur ulang mengembalikan draf ke bawaan halaman (FL11a);
 * halaman tetap memegang filter terapan dan aturan halaman 1-nya sendiri.
 */
export function usePanelFilter<T>({
  terapan,
  bawaan,
  onTerapkan,
}: {
  terapan: T;
  bawaan: T;
  onTerapkan: (nilai: T) => void;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [draf, setDraf] = useState<T>(terapan);

  const ubahTerbuka = (buka: boolean) => {
    if (buka) setDraf(terapan);
    setTerbuka(buka);
  };

  return {
    terbuka,
    buka: () => ubahTerbuka(true),
    ubahTerbuka,
    draf,
    setDraf,
    terapkan: () => {
      onTerapkan(draf);
      setTerbuka(false);
    },
    aturUlang: () => setDraf(bawaan),
  };
}
