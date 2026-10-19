"use client";

import { useId } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth/useSession";
import { useStokKritisGudang } from "./hooks";
import { urlBoleh } from "./izin";
import { PesanGagal } from "./pesan-gagal";
import { TAUTAN_DASHBOARD_GUDANG } from "./ringkasan";
import { formatAngka, lebarBatang } from "./tampilan";

const TAUTAN = "text-[13px] font-medium underline-offset-4 hover:underline";

/** Barang di gudang yang stoknya sudah di batas minimum atau di bawahnya. */
export function PanelStokKritis() {
  const { permissions } = useSession();
  const { data, memuat, gagal, ulangi } = useStokKritisGudang();
  const href = urlBoleh(TAUTAN_DASHBOARD_GUDANG.inventaris, permissions);
  const idJudul = useId();
  const ada = data !== null && data.total > 0;

  return (
    <section aria-labelledby={idJudul} className="flex flex-col gap-3 sm:gap-3.5 min-w-0">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 id={idJudul} className="text-[17px] sm:text-lg font-semibold">
            {ada ? `Stok kritis · ${formatAngka(data.total)} barang` : "Stok kritis"}
          </h2>
          {ada && (
            <p className="text-xs sm:text-[13px] text-navy/60">
              Batang penuh berarti stok sama dengan batas minimum
            </p>
          )}
        </div>
        {href && (
          <Link href={href} className={`hidden sm:inline ${TAUTAN}`}>
            Lihat inventaris gudang
          </Link>
        )}
      </div>

      {gagal ? (
        <PesanGagal pesan="Stok kritis gagal dimuat." ulangi={ulangi} />
      ) : memuat || data === null ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between gap-3">
                <Skeleton className="h-3.5 w-40 bg-krem rounded-md" />
                <Skeleton className="h-3.5 w-28 bg-krem rounded-md" />
              </div>
              <Skeleton className="h-2 w-full bg-krem rounded-full" />
            </div>
          ))}
        </div>
      ) : !ada ? (
        <div className="bg-white rounded-2xl px-5 py-7 flex items-center gap-4 shadow-sm">
          <span
            className="w-11 h-11 rounded-full bg-sage/15 text-sage flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Check className="w-[22px] h-[22px]" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Tidak ada stok kritis di gudang</span>
            <span className="text-[13px] text-navy/60">
              Semua barang yang dipantau masih di atas batas minimumnya.
            </span>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.baris.map((b) => (
            <li
              key={b.id}
              className="bg-white rounded-[14px] sm:rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 flex flex-col gap-2 sm:gap-2.5 shadow-sm"
            >
              <div className="flex justify-between items-start sm:items-center gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-sm font-medium">{b.nama}</span>
                  {b.habis && (
                    <span className="text-[11px] font-bold text-white bg-red-800 px-2 py-0.5 rounded-full">
                      Habis
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-[13px] text-navy/60 whitespace-nowrap">
                  <strong className="text-red-800 font-semibold">{formatAngka(b.stok)}</strong>
                  <span className="hidden sm:inline"> dari </span>
                  <span className="sm:hidden"> / </span>
                  {formatAngka(b.stokMinimum)} {b.satuan}
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-krem rounded-full overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-karamel" style={{ width: lebarBatang(b.isi) }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {href && (
        <Link href={href} className={`sm:hidden self-start py-2.5 ${TAUTAN}`}>
          Lihat inventaris gudang
        </Link>
      )}
    </section>
  );
}