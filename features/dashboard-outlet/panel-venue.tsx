"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { petakVenue, susunPetak, type PetakVenue } from "./venue";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaftarAset } from "@/features/aset/hooks";
import { useDaftarSesiBooking } from "@/features/sesi-booking/hooks";
import { keTanggalLokal } from "@/lib/waktu";
import type { SesiBookingResponse } from "@/types/sesiBooking";

/** Waktu sekarang yang diperbarui berkala, agar sisa waktu petak ikut berjalan. */
function useSekarang(selangMs = 60_000): Date {
  const [sekarang, setSekarang] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), selangMs);
    return () => clearInterval(id);
  }, [selangMs]);
  return sekarang;
}

function Titik({ warna }: { warna: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${warna}`} aria-hidden="true" />;
}

function Petak({ petak, ringkas }: { petak: PetakVenue; ringkas: boolean }) {
  const ukuran = ringkas
    ? "rounded-xl p-2 sm:p-2.5 text-[11px] sm:text-xs"
    : "rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-xs sm:text-sm";
  if (petak.status === "digunakan") {
    return (
      <li className={`bg-[#0A2947] text-[#FFFAF3] flex flex-col gap-1 min-w-0 shadow-sm ${ukuran}`}>
        <span className="font-black line-clamp-2 break-words">{petak.nama}</span>
        <span className="text-[#F2EAE2]/80 truncate">
          {petak.pelanggan
            ? petak.tipePelanggan
              ? `${petak.pelanggan} · ${petak.tipePelanggan}`
              : petak.pelanggan
            : "Dipakai"}
        </span>
        {petak.sisaMenit !== null && petak.sisaMenit > 0 && (
          <span className="text-[#D4A373] font-bold">Sisa {petak.sisaMenit} menit</span>
        )}
      </li>
    );
  }
  const perbaikan = petak.status === "perbaikan";
  return (
    <li
      className={`bg-[#FFFAF3] flex flex-col gap-1 min-w-0 border ${
        perbaikan ? "border-dashed border-orange-400" : "border-[#718355]/40"
      } ${ukuran}`}
    >
      <span className="font-black text-[#0A2947] line-clamp-2 break-words">{petak.nama}</span>
      <span
        className={`flex items-center gap-1.5 font-medium ${
          perbaikan ? "text-orange-700" : "text-[#4F5E3A]"
        }`}
      >
        <Titik warna={perbaikan ? "bg-orange-500" : "bg-[#718355]"} />
        {perbaikan ? "Perbaikan" : "Kosong"}
      </span>
    </li>
  );
}

/**
 * Petak status venue (keputusan DB6a). Sampai enam aset petaknya besar;
 * lebih dari itu mengecil, dan paling banyak sepuluh yang tampil.
 */
export function PanelVenue({ booking }: { booking: SesiBookingResponse[] }) {
  const aset = useDaftarAset();
  const sekarang = useSekarang();
  const daftar = aset.data ?? [];
  const { tampil, total, ringkas } = susunPetak(petakVenue(daftar, booking, sekarang));
  const dipakai = daftar.filter((a) => a.status === "digunakan").length;
  const perbaikan = daftar.filter((a) => a.status === "perbaikan").length;
  const kosong = total - dipakai - perbaikan;
  const persenDipakai = total > 0 ? Math.round((dipakai / total) * 100) : 0;

  return (
    <section
      aria-label="Status Venue"
      className="bg-[#F2EAE2] border border-[#0A2947]/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-[#0A2947] shadow-sm flex flex-col gap-3 sm:gap-4 h-full"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm sm:text-lg font-bold tracking-wide">Status Venue</h2>
        {!aset.isLoading && !aset.isError && total > 0 && (
          <span className="text-xs font-medium text-[#0A2947]/70">
            {dipakai} dari {total} dipakai
          </span>
        )}
      </div>
      {aset.isLoading ? (
        <Skeleton className="h-40 w-full bg-[#0A2947]/5 rounded-xl" />
      ) : aset.isError ? (
        <p className="text-sm font-medium text-rose-600">Gagal memuat status venue.</p>
      ) : total === 0 ? (
        <p className="text-sm text-[#0A2947]/60">Belum ada aset.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="h-2 rounded-full bg-[#0A2947]/10 overflow-hidden">
              <div className="h-full bg-[#0A2947] rounded-full" style={{ width: `${persenDipakai}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[#0A2947]/80">
              <span className="flex items-center gap-1.5">
                <Titik warna="bg-[#0A2947]" />
                Dipakai {dipakai}
              </span>
              <span className="flex items-center gap-1.5">
                <Titik warna="bg-[#718355]" />
                Kosong {kosong}
              </span>
              <span className="flex items-center gap-1.5">
                <Titik warna="bg-orange-500" />
                Perbaikan {perbaikan}
              </span>
            </div>
          </div>
          <ul
            className={`grid gap-2 ${
              ringkas
                ? "grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]"
                : "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]"
            }`}
          >
            {tampil.map((petak) => (
              <Petak key={petak.id} petak={petak} ringkas={ringkas} />
            ))}
          </ul>
          {tampil.length < total && (
            <p className="text-xs text-[#0A2947]/70">
              Menampilkan {tampil.length} dari {total} aset.{" "}
              <Link href="/dashboard/outlet/reservasi" className="font-bold underline">
                Lihat semua
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Panel venue beserta rincian booking hari ini, bagi pemegang read-booking. */
export function PanelVenueBooking({ hari }: { hari: Date }) {
  const booking = useDaftarSesiBooking(keTanggalLokal(hari));
  return <PanelVenue booking={booking.data ?? []} />;
}