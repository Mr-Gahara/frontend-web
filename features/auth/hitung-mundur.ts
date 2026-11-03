"use client";

import { useEffect, useState } from "react";

/** Sisa detik sebagai m:ss, tidak pernah negatif. */
export function formatSisa(detik: number): string {
  const d = Math.max(0, Math.floor(detik));
  return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, "0")}`;
}

/**
 * Hitung mundur kirim ulang kode. Lama tunggunya asumsi pratinjau dan
 * disesuaikan dengan aturan OTP backend (N3, N4) saat disambungkan.
 */
export function useHitungMundur(awal: number) {
  const [sisa, setSisa] = useState(awal);
  useEffect(() => {
    if (sisa <= 0) return;
    const t = setTimeout(() => setSisa((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sisa]);
  return { sisa, ulang: () => setSisa(awal) };
}