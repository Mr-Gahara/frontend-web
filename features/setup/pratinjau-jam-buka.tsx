"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HARI, HARI_KOSONG, NILAI_AWAL_JAM_BUKA, type JamHari, type NilaiJamBuka } from "./jam-buka";
import { KerangkaSetup } from "./kerangka-setup";
import { LangkahJamBuka } from "./langkah-jam-buka";
import { daftarLangkah, LANGKAH_JAM_BUKA, type KunciLangkah, type LangkahSetup } from "./langkah";

/**
 * Pratinjau development langkah jam buka di dalam kerangka wizard (pemilik
 * proyek, 7 November 2026; keputusan rancangan butir 30): data contoh per
 * keadaan, tanpa API. Rute pemakainya memanggil notFound() di produksi.
 * Dihapus setelah langkah ini tersambung dan uji alur nyatanya lolos.
 */

export const URL_PRATINJAU_JAM_BUKA = "/setup/pratinjauJamBuka";

const jam = (teks: string) => {
  const [j, m] = teks.split(":");
  return { jam: j, menit: m };
};
const buka = (b: string, t: string): JamHari => ({ status: "buka", buka: jam(b), tutup: jam(t) });
const LIBUR: JamHari = { ...HARI_KOSONG, status: "libur" };
const DUA_EMPAT: JamHari = { ...HARI_KOSONG, status: "24jam" };

type Keadaan = "awal" | "24jam" | "kosong" | "biasa" | "malam" | "campuran" | "libur" | "gagal";

const KEADAAN: readonly { kunci: Keadaan; label: string; nilai: NilaiJamBuka }[] = [
  { kunci: "awal", label: "Belum memilih", nilai: NILAI_AWAL_JAM_BUKA },
  { kunci: "24jam", label: "Buka 24 jam", nilai: { ...NILAI_AWAL_JAM_BUKA, mode: "24jam" } },
  { kunci: "kosong", label: "Jam tertentu, kosong", nilai: { ...NILAI_AWAL_JAM_BUKA, mode: "tertentu" } },
  {
    kunci: "biasa",
    label: "Terisi biasa",
    nilai: { mode: "tertentu", hari: HARI.map((_, i) => (i === 6 ? LIBUR : buka("08:00", "22:00"))) },
  },
  {
    kunci: "malam",
    label: "Lewat tengah malam",
    nilai: { mode: "tertentu", hari: HARI.map((_, i) => buka("10:00", i >= 4 ? "02:00" : "23:00")) },
  },
  {
    kunci: "campuran",
    label: "Campuran",
    nilai: {
      mode: "tertentu",
      hari: HARI.map((_, i) => (i === 0 ? LIBUR : i === 5 ? DUA_EMPAT : buka("09:00", "01:00"))),
    },
  },
  { kunci: "libur", label: "Semua libur", nilai: { mode: "tertentu", hari: HARI.map(() => LIBUR) } },
  { kunci: "gagal", label: "Gagal disimpan", nilai: { ...NILAI_AWAL_JAM_BUKA, mode: "24jam" } },
];

/** Setup inti Basic dengan jam buka sesudah lokasi outlet; tiga langkah pertama selesai. */
const LANGKAH: readonly LangkahSetup[] = daftarLangkah("basic").flatMap((l) =>
  l.kunci === "lokasi" ? [l, LANGKAH_JAM_BUKA] : [l],
);
const INDEKS = LANGKAH.findIndex((l) => l.kunci === "jamBuka");
const SELESAI: Record<KunciLangkah, boolean> = {
  toko: true,
  owner: true,
  lokasi: true,
  jamBuka: false,
  kategori: false,
  bahanBaku: false,
  produk: false,
  pajak: false,
  booking: false,
  gudang: false,
};

export function PratinjauJamBuka() {
  const [keadaan, setKeadaan] = useState<Keadaan>("awal");
  const [catatan, setCatatan] = useState("");
  const pilihan = KEADAAN.find((k) => k.kunci === keadaan) ?? KEADAAN[0];

  return (
    <div className="bg-permukaan">
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-karamel bg-white/70 p-4">
          <p className="text-isi font-semibold text-navy">
            Pratinjau development langkah jam buka. Tidak ada yang tersimpan, dan halaman ini tidak ada di produksi.
          </p>
          <div role="group" aria-label="Keadaan pratinjau" className="flex flex-wrap gap-2">
            {KEADAAN.map((k) => (
              <button
                key={k.kunci}
                type="button"
                aria-pressed={keadaan === k.kunci}
                onClick={() => {
                  setKeadaan(k.kunci);
                  setCatatan("");
                }}
                className={cn(
                  "h-10 cursor-pointer rounded-full border border-navy/15 px-3.5 text-isi font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel",
                  keadaan === k.kunci ? "bg-navy text-gading" : "bg-white text-navy",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
          {catatan && (
            <p role="status" className="text-isi text-navy">
              {catatan}
            </p>
          )}
        </div>
      </div>
      <KerangkaSetup plan="basic" langkah={LANGKAH} indeksAktif={INDEKS} selesaiLangkah={SELESAI} namaToko="Kopi Senja">
        <LangkahJamBuka
          key={keadaan}
          nomor={INDEKS + 1}
          total={LANGKAH.length}
          teksLanjut="Simpan dan lanjut"
          awal={pilihan.nilai}
          onKembali={() => setCatatan("Kembali ditekan: wizard pindah ke langkah Lokasi outlet.")}
          onLanjut={async () => {
            if (keadaan === "gagal") throw new Error("Gagal menyimpan jam buka. Coba lagi.");
            setCatatan("Isian sah: wizard pindah ke langkah Kategori.");
          }}
        />
      </KerangkaSetup>
    </div>
  );
}