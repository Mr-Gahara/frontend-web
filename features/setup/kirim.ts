"use client";

import { useState } from "react";
import { pesanError } from "@/lib/api/error";

/**
 * Menjalankan penyimpanan langkah ke server: tombol ditahan selama
 * berjalan, dan penolakan server tampil sebagai galat langkah, bukan
 * dilempar ke luar form.
 */
export function useKirim<T>(aksi: (nilai: T) => unknown, pesanGagal: string) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const kirim = async (nilai: T) => {
    setGalat("");
    setSibuk(true);
    try {
      await aksi(nilai);
    } catch (err) {
      setGalat(pesanError(err, pesanGagal));
    } finally {
      setSibuk(false);
    }
  };
  return { kirim, sibuk, galat, setGalat };
}
