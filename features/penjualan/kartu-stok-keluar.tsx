import { Info } from "lucide-react";
import type { Penjualan } from "@/types/penjualan";
import type { Lokasi } from "@/types/location";
import { kalimatLokasiStok, kalimatStokKosong, PESAN_VOID_STOK, susunStokKeluar } from "./stok-keluar";

const KELAS_JENIS = {
  "Bahan baku": "bg-sage/15 text-navy",
  "Stok produk": "bg-navy/8 text-navy",
} as const;

// Kolom desktop Barang, Jenis, Jumlah keluar; di bawah sm baris bertumpuk.
const GRID = "sm:grid sm:grid-cols-[minmax(0,1fr)_160px_160px] sm:gap-4";

/**
 * Stok yang keluar karena penjualan ini (VD3a, desain A pemilik proyek
 * 12 November 2026). Daftar, bukan Table, agar baris rata dengan judul
 * kelompok produk seperti di kanvas (pemilik proyek, 12 November 2026).
 */
export function KartuStokKeluar({
  penjualan,
  outlet,
}: {
  penjualan: Pick<Penjualan, "itemPenjualan" | "rincianStok" | "statusPenjualan">;
  outlet: Lokasi | null;
}) {
  const { kelompok, tanpaPotong } = susunStokKeluar(penjualan);
  const kosong = kelompok.length === 0;

  return (
    <section
      aria-labelledby="judul-stok-keluar"
      className="overflow-hidden rounded-2xl border border-navy/10 bg-krem shadow-sm"
    >
      <div className="flex flex-col gap-3 px-4 pt-5 pb-4 sm:px-6">
        <div>
          <h2 id="judul-stok-keluar" className="font-bold text-navy">Stok Keluar</h2>
          <p className="mt-1 text-sm text-navy/70">
            {kosong ? kalimatStokKosong(penjualan.statusPenjualan) : kalimatLokasiStok(penjualan.rincianStok, outlet)}
          </p>
        </div>
        {!kosong && penjualan.statusPenjualan === "VOID" && (
          <p className="flex items-start gap-2 text-sm font-semibold text-navy">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="underline decoration-navy/40 decoration-1 underline-offset-4">{PESAN_VOID_STOK}</span>
          </p>
        )}
      </div>

      {!kosong && (
        <div className="bg-gading text-sm">
          <div
            aria-hidden="true"
            className={`hidden border-b border-navy/10 px-6 py-3 text-xs font-semibold text-navy/60 ${GRID}`}
          >
            <span>Barang</span>
            <span>Jenis</span>
            <span className="text-right">Jumlah keluar</span>
          </div>
          {kelompok.map((k) => (
            <div key={k.produkID} className="border-b border-navy/10">
              <h3 className="border-t border-navy/5 bg-krem px-4 py-2.5 text-[13px] font-bold text-navy sm:px-6">
                {k.judul}
              </h3>
              <ul>
                {k.baris.map((b) => (
                  <li
                    key={b.kunci}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 sm:items-baseline sm:px-6 ${GRID}`}
                  >
                    <div className="min-w-0 sm:contents">
                      <p className="font-semibold text-navy">{b.nama}</p>
                      <span
                        className={`mt-1 inline-block justify-self-start rounded-full px-2.5 py-0.5 text-xs font-semibold sm:mt-0 ${KELAS_JENIS[b.jenis]}`}
                      >
                        {b.jenis}
                      </span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-right font-mono text-[15px] font-bold text-red-800">
                      {b.jumlah}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {tanpaPotong.length > 0 && (
            <p className="px-4 pt-3 pb-4 text-xs text-navy/60 sm:px-6">
              {tanpaPotong.join(", ")} tidak memotong stok.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
