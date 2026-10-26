"use client";

import { useEffect, useState } from "react";

/**
 * Waktu sekarang yang diperbarui setiap selangMs dan saat tab kembali
 * terlihat (timer tertunda selama perangkat tidur atau tab dibekukan
 * browser). Untuk isian yang mengikuti jam sampai pengguna mengubahnya,
 * seperti tanggal dan jam transaksi penjualan.
 */
export function useJamBerjalan(selangMs = 30_000): Date {
  const [sekarang, setSekarang] = useState(() => new Date());

  useEffect(() => {
    const perbarui = () => setSekarang(new Date());
    const id = setInterval(perbarui, selangMs);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") perbarui();
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [selangMs]);

  return sekarang;
}