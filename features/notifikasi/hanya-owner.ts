"use client";

import { useCallback, useSyncExternalStore } from "react";
import { penyimpananLokal } from "@/lib/panduan";
import { useSession } from "@/lib/auth/useSession";

/**
 * Pernyataan "Toko ini hanya saya" (PW18, KS10a): Owner melewati langkah
 * karyawan dan absensi kartu Siapkan toko. Disimpan per perangkat di
 * localStorage, karena backend tidak punya tempatnya; kuncinya per akun,
 * sehingga akun lain di perangkat yang sama tidak mewarisinya (keputusan
 * rancangan butir 33). Kartu lonceng dan kotak langkah di halaman berbagi
 * nilainya lewat satu peristiwa di tab yang sama.
 */
const AWALAN = "tachyon.kesiapan.hanyaOwner.";
const PERISTIWA = "tachyon:kesiapan-hanya-owner";

export const kunciHanyaOwner = (akunId: string) => AWALAN + akunId;

function langganan(ubah: () => void): () => void {
  window.addEventListener(PERISTIWA, ubah);
  window.addEventListener("storage", ubah);
  return () => {
    window.removeEventListener(PERISTIWA, ubah);
    window.removeEventListener("storage", ubah);
  };
}

export function bacaHanyaOwner(akunId: string | null): boolean {
  if (!akunId) return false;
  try {
    return penyimpananLokal()?.getItem(kunciHanyaOwner(akunId)) === "ya";
  } catch {
    return false;
  }
}

/** Nilai pernyataan untuk akun sesi beserta penyetelnya. */
export function useHanyaOwner(): { hanyaOwner: boolean; nyatakan: () => void } {
  const { akun } = useSession();
  const akunId = akun?.id ?? null;
  const hanyaOwner = useSyncExternalStore(
    langganan,
    () => bacaHanyaOwner(akunId),
    () => false,
  );
  const nyatakan = useCallback(() => {
    if (!akunId) return;
    try {
      penyimpananLokal()?.setItem(kunciHanyaOwner(akunId), "ya");
    } catch {
      // Penyimpanan ditolak (mode privat): pernyataan tidak tersimpan dan kartu tetap tampil.
    }
    window.dispatchEvent(new Event(PERISTIWA));
  }, [akunId]);
  return { hanyaOwner, nyatakan };
}
