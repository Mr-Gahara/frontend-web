"use client";

import { useEffect, useState } from "react";
import { keTanggalLokal, msSampaiTengahMalam } from "@/lib/waktu";

/**
 * Tanggal lokal hari ini (YYYY-MM-DD) yang berganti sendiri tepat setelah
 * pukul 00.00. Layar POS sering dibiarkan terbuka melewati tengah malam,
 * dan "hari ini" yang dikunci saat halaman dibuka membuat pencatatan dan
 * tampilan memakai hari kemarin (temuan 26 Oktober 2026). Diperiksa ulang
 * saat tab kembali terlihat, karena timer tertunda selama perangkat tidur
 * atau tab dibekukan browser.
 */
export function useHariIni(): string {
  const [hariIni, setHariIni] = useState(() => keTanggalLokal(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const perbarui = () => {
      setHariIni(keTanggalLokal(new Date()));
      clearTimeout(timer);
      timer = setTimeout(perbarui, msSampaiTengahMalam(new Date()));
    };
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") perbarui();
    };
    timer = setTimeout(perbarui, msSampaiTengahMalam(new Date()));
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  return hariIni;
}