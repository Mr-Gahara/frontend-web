"use client";

import { useId } from "react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth/useSession";
import { useJurnalTerbaruGudang } from "./hooks";
import { urlBoleh } from "./izin";
import { PesanGagal } from "./pesan-gagal";
import { TAUTAN_DASHBOARD_GUDANG } from "./ringkasan";
import { formatWaktuSingkat, teksJumlahRingkas } from "./tampilan";

/** Linimasa lima jurnal stok terbaru di gudang. Arah dibaca dari tanda dan teks, tidak dari warna saja. */
export function PanelJurnal() {
  const { permissions } = useSession();
  const { data, memuat, gagal, ulangi } = useJurnalTerbaruGudang();
  const href = urlBoleh(TAUTAN_DASHBOARD_GUDANG.jurnal, permissions);
  const idJudul = useId();

  return (
    <section aria-labelledby={idJudul} className="flex flex-col gap-3 sm:gap-3.5 min-w-0">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <h2 id={idJudul} className="text-[17px] sm:text-lg font-semibold">
          Jurnal terbaru
        </h2>
        {href && (
          <Link href={href} className="text-[13px] font-medium underline-offset-4 hover:underline">
            Lihat jurnal stok
          </Link>
        )}
      </div>

      {gagal ? (
        <PesanGagal pesan="Jurnal terbaru gagal dimuat." ulangi={ulangi} />
      ) : memuat || data === null ? (
        <div className="flex flex-col gap-[18px] pl-1" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3.5 items-start">
              <span className="w-3 h-3 rounded-full bg-krem mt-1 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4 bg-krem rounded-md" />
                <Skeleton className="h-2.5 w-1/2 bg-krem rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl px-5 py-6 shadow-sm text-sm text-navy/60">
          Belum ada jurnal stok di gudang.
        </div>
      ) : (
        <ol className="flex flex-col pl-0.5 sm:pl-1">
          {data.map((j) => {
            const masuk = j.tipeKoreksi === "Masuk";
            return (
              <li key={j.id} className="flex gap-3 sm:gap-3.5">
                <div className="flex flex-col items-center w-2.5 sm:w-3 shrink-0" aria-hidden="true">
                  <span
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1.5 shrink-0 ${masuk ? "bg-emerald-700" : "bg-red-800"}`}
                  />
                  <span className="flex-1 w-0.5 bg-krem" />
                </div>
                <div className="flex-1 min-w-0 pb-4 sm:pb-[18px] flex justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{j.bahanBakuID?.namaBahan ?? "-"}</span>
                    <span className="text-xs text-navy/60">
                      {formatWaktuSingkat(j.tanggal)} · {j.alasan}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${masuk ? "text-emerald-700" : "text-red-800"}`}
                  >
                    <span className="sr-only">{masuk ? "Masuk " : "Keluar "}</span>
                    {teksJumlahRingkas(j)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}