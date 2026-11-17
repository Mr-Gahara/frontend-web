"use client";

import * as React from "react";

/**
 * Kartu bila tabel tidak muat (LT1a; pemilik proyek, 17 November 2026):
 * DataTable tampil sebagai kartu berlabel bila lebar alami tabelnya melebihi
 * wadah, di lebar layar mana pun, dan tetap tabel bila muat. Kartu HP di
 * bawah 640 px tetap diatur CSS (varian `kartu:` di app/globals.css).
 */

/** Lebar alami tabel melebihi wadahnya (toleransi 1 px pembulatan). */
export function tabelMeluber(lebarAlami: number, lebarWadah: number): boolean {
  return lebarAlami > lebarWadah + 1;
}

/**
 * Dalam mode kartu lebar alami tidak dapat diukur, sehingga mode tabel
 * kembali hanya bila wadah sudah selebar lebar alami yang terakhir terukur.
 */
export function bolehKembaliTabel(lebarAlamiTerakhir: number | null, lebarWadah: number): boolean {
  return lebarAlamiTerakhir !== null && lebarWadah >= lebarAlamiTerakhir;
}

/**
 * `pemicu` adalah kunci sederhana isi tabel (jumlah baris, halaman, status
 * muat), bukan array data: array baru di setiap render akan memutar ukur
 * ulang tanpa henti. Saat kunci berubah, tabel diukur ulang dalam mode tabel
 * sebelum dicat (layout effect), sehingga tidak berkedip.
 */
export function useKartuBilaTakMuat(pemicu: string) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [kartu, setKartu] = React.useState(false);
  const kartuRef = React.useRef(false);
  const alami = React.useRef<number | null>(null);
  React.useLayoutEffect(() => {
    kartuRef.current = kartu;
  });

  const wadah = () => ref.current?.querySelector<HTMLElement>('[data-slot="table-container"]') ?? null;

  const ukur = React.useCallback(() => {
    const w = wadah();
    if (!w) return;
    if (kartuRef.current) {
      if (bolehKembaliTabel(alami.current, w.clientWidth)) setKartu(false);
      return;
    }
    alami.current = w.scrollWidth;
    if (tabelMeluber(w.scrollWidth, w.clientWidth)) setKartu(true);
  }, []);

  React.useLayoutEffect(() => {
    setKartu(false);
  }, [pemicu]);

  React.useLayoutEffect(() => {
    if (!kartu) ukur();
  });

  React.useEffect(() => {
    const w = wadah();
    if (!w || typeof ResizeObserver === "undefined") return;
    const pengamat = new ResizeObserver(() => ukur());
    pengamat.observe(w);
    const tabel = w.querySelector("table");
    if (tabel) pengamat.observe(tabel);
    return () => pengamat.disconnect();
  }, [ukur]);

  return { ref, kartu };
}
