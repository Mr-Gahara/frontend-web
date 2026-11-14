"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import type { PerangkatKasir, SesiKasir } from "@/types/sesiKasir";
import { jamLokal, lamaBuka, namaMesin } from "./tampilan";

export type StatusMuat = "memuat" | "gagal" | "siap";

interface PropsBagianKasirBuka {
  sesiBuka: SesiKasir[];
  status: StatusMuat;
  /** Daftar mesin kasir; undefined bila pengguna tidak memegang kelola-perangkat-kasir. */
  daftarMesin: PerangkatKasir[] | undefined;
  sekarang: Date;
  /** Tutup dari web menuntut kelola-perangkat-kasir (POST /sesikasir/:id/tutup). */
  bolehTutup: boolean;
  onTutup: (sesi: SesiKasir) => void;
  hrefRincian: (sesi: SesiKasir) => string;
  onCobaLagi: () => void;
}

/**
 * Tingkat pertama hierarki halaman Mesin Kasir: kasir yang sedang buka,
 * karena itu yang perlu ditindak (pratinjau Revisi 1 dan Revisi 2).
 */
export function BagianKasirBuka({
  sesiBuka,
  status,
  daftarMesin,
  sekarang,
  bolehTutup,
  onTutup,
  hrefRincian,
  onCobaLagi,
}: PropsBagianKasirBuka) {
  return (
    <section aria-labelledby="judul-kasir-buka" className="flex flex-col gap-3">
      <h2 id="judul-kasir-buka" className="text-subjudul font-bold text-navy">
        Kasir yang sedang buka
      </h2>

      {status === "memuat" && (
        <Skeleton aria-label="Memuat kasir yang buka" className="h-32 rounded-[22px] bg-navy/10" />
      )}

      {status === "gagal" && (
        <div
          role="alert"
          className="flex flex-col items-center gap-2.5 rounded-[22px] border border-navy/10 bg-white px-6 py-8 text-center"
        >
          <span className="text-subjudul font-bold text-navy">Kasir yang buka gagal dimuat</span>
          <span className="text-isi text-navy/70">Periksa koneksi, lalu coba lagi.</span>
          <Button onClick={onCobaLagi} className="h-11 bg-navy px-5 font-semibold text-gading hover:bg-navy/90">
            Coba lagi
          </Button>
        </div>
      )}

      {status === "siap" && sesiBuka.length === 0 && (
        <div className="flex flex-col gap-1.5 rounded-[22px] border border-dashed border-navy/25 px-6 py-6 sm:px-7">
          <span className="text-subjudul font-bold text-navy">Semua kasir sedang tutup</span>
          <span className="text-isi text-navy/70">
            Kasir dibuka dari aplikasi di mesin kasir. Begitu ada yang buka, tampil di sini.
          </span>
        </div>
      )}

      {status === "siap" &&
        sesiBuka.map((sesi) => {
          const nama = namaMesin(sesi.installationId, daftarMesin);
          return (
            <article
              key={sesi.id}
              aria-label={`Kasir buka: ${nama}`}
              className="flex flex-col gap-4 rounded-[20px] bg-navy p-5 text-gading sm:rounded-[22px] sm:px-8 sm:py-7 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-10"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-isi text-gading/85">
                  Buka sejak {jamLokal(sesi.dibukaPada)}, sudah {lamaBuka(sesi.dibukaPada, sekarang)}
                </span>
                <h3 className="break-words text-judul font-bold tracking-tight sm:text-tampilan">{nama}</h3>
                <span className="text-isi text-gading/85 sm:text-besar">
                  Laci {sesi.akunKas?.namaAkun ?? "-"}, dibuka oleh {sesi.dibukaOleh?.nama ?? "-"}
                </span>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:gap-x-10">
                <div className="flex flex-col gap-0.5">
                  <span className="text-isi text-gading/85">Uang awal di laci</span>
                  <span className="text-judul font-extrabold sm:text-tampilan">{formatRupiah(sesi.nominalBuka)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {bolehTutup && (
                    <Button
                      onClick={() => onTutup(sesi)}
                      className="h-12 bg-gading px-5 text-besar font-bold text-navy hover:bg-gading/90"
                    >
                      Tutup kasir dari web
                    </Button>
                  )}
                  <Link
                    href={hrefRincian(sesi)}
                    className="py-2.5 text-center text-besar font-semibold text-gading underline underline-offset-4"
                  >
                    Lihat rincian
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
    </section>
  );
}