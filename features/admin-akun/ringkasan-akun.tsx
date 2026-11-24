"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useJumlahAkun } from "./hooks";
import type { FilterStatusAkun } from "./tampilan";

const KARTU: { status: FilterStatusAkun; judul: string; keterangan: string }[] = [
  { status: "semua", judul: "Semua akun", keterangan: "Akun klien dan admin" },
  { status: "aktif", judul: "Aktif", keterangan: "Dapat login" },
  { status: "non-aktif", judul: "Non-aktif", keterangan: "Kedaluwarsa atau dibekukan" },
];

function KartuJumlah({ status, judul, keterangan }: (typeof KARTU)[number]) {
  const jumlah = useJumlahAkun(status);
  return (
    <section
      aria-label={judul}
      className="flex min-w-0 flex-col gap-0.5 rounded-2xl border-t-[3px] border-karamel bg-navy px-3 py-2.5 text-gading shadow-sm sm:gap-1.5 sm:rounded-3xl sm:border-t-4 sm:p-5"
    >
      <p className="truncate text-kecil font-semibold text-krem/85 sm:text-isi">{judul}</p>
      {jumlah.isLoading ? (
        <Skeleton className="h-8 w-12 rounded-md bg-gading/15 sm:h-9" />
      ) : (
        <p className="text-judul font-black sm:text-tampilan">{jumlah.data ?? "-"}</p>
      )}
      <p className="hidden truncate text-kecil text-krem/75 sm:block">
        {jumlah.isError ? "Gagal memuat jumlah" : keterangan}
      </p>
    </section>
  );
}

/**
 * Kartu ringkas desain B (pemilik proyek, 24 November 2026): hanya
 * ringkasan, tidak dapat diklik; penyaringan tetap lewat filter status
 * (desain A). Angka dari seluruh akun, tidak mengikuti pencarian.
 */
export function RingkasanAkun() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {KARTU.map((k) => (
        <KartuJumlah key={k.status} {...k} />
      ))}
    </div>
  );
}
