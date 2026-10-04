import { useSyncExternalStore } from "react";

const langganan = () => () => {};
const snapshotKlien = () => true;
const snapshotServer = () => false;

/**
 * True setelah komponen terhidrasi di browser; false saat render server dan
 * saat render hidrasi pertama, sehingga keluaran keduanya sama.
 *
 * Dipakai untuk bagian yang nilainya berbeda antara server dan browser
 * (waktu sekarang, tanggal hari ini), menggantikan pola useState(false)
 * yang diubah lewat setState di effect, yang ditolak
 * react-hooks/set-state-in-effect.
 */
export function useSudahHidrasi(): boolean {
  return useSyncExternalStore(langganan, snapshotKlien, snapshotServer);
}