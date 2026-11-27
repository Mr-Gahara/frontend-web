"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TombolUnduhLaporan } from "@/components/unduh/tombol-unduh-laporan";
import { isNotFound, pesanError } from "@/lib/api/error";
import { PILIHAN_UNDUH_PERIODE, sesiKasirApi } from "./api";
import { useDetailPeriode } from "./hooks";
import { BadgeStatusPeriode } from "./label";
import { URL_LAPORAN_TUTUP_KASIR, judulLaporan, subjudulLaporan, waktuBaris } from "./laporan";
import { AreaCetakStruk } from "./area-cetak-struk";
import { StrukLaporan } from "./struk-laporan";

/**
 * Satu Laporan Tutup Kasir (PW10, desain A): struk di tengah di atas latar
 * krem. Periode yang masih berjalan belum punya laporan (B375), sehingga
 * diganti keterangan. Cetak struk 80 mm dari browser (PW11) dan unduh PDF
 * atau Excel (PW12) hanya untuk periode TUTUP.
 */
export function HalamanLaporanPeriode({ id }: { id: string }) {
  const detail = useDetailPeriode(id);

  if (detail.isLoading) {
    return <Skeleton aria-label="Memuat laporan tutup kasir" className="h-96 w-full rounded-[22px] bg-navy/10" />;
  }

  const periode = detail.data;
  if (!periode) {
    return (
      <div className="flex w-full flex-col items-center gap-4 px-4 py-16 text-center">
        <p role="alert" className="text-isi font-bold text-navy/70">
          {!detail.error || isNotFound(detail.error)
            ? "Laporan tutup kasir tidak ditemukan."
            : pesanError(detail.error, "Gagal memuat laporan tutup kasir.")}
        </p>
        <Button asChild variant="outline">
          <Link href={URL_LAPORAN_TUTUP_KASIR}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Laporan Tutup Kasir
          </Link>
        </Button>
      </div>
    );
  }

  const laporan = periode.laporan;
  return (
    <div className="flex flex-col gap-6">
      <Link
        href={URL_LAPORAN_TUTUP_KASIR}
        className="flex h-11 items-center gap-2 self-start text-besar font-bold text-navy no-underline"
      >
        <ChevronLeft className="size-[18px]" aria-hidden="true" />
        Kembali ke Laporan Tutup Kasir
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <BadgeStatusPeriode status={periode.status} className="self-start text-isi" />
          <h2 className="break-words text-judul font-bold text-navy">{judulLaporan(periode.dibukaPada)}</h2>
          <p className="text-besar text-navy/70">{subjudulLaporan(periode, laporan?.outlet?.nama)}</p>
        </div>
        {/* Cetak hanya periode TUTUP, yang laporannya sudah dipotret (keputusan 8, PW11). */}
        {laporan && (
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {/* Unduh PDF atau Excel bergaris tepi di samping Cetak struk (papan A, PW12). */}
            <TombolUnduhLaporan
              label="Unduh"
              pilihan={PILIHAN_UNDUH_PERIODE}
              unduh={(format) => sesiKasirApi.unduhPeriode(periode.id, format)}
              className="h-11 w-full border border-navy/15 bg-gading px-[18px] text-isi text-navy hover:bg-krem sm:w-auto"
            />
            <Button
              type="button"
              onClick={() => window.print()}
              className="h-11 w-full bg-navy px-[18px] text-isi font-bold text-gading hover:bg-navy/90 sm:w-auto"
            >
              <Printer className="size-4" aria-hidden="true" />
              Cetak struk
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-center rounded-[20px] border border-navy/10 bg-krem px-4 py-10">
        {laporan ? (
          <>
            <StrukLaporan laporan={laporan} />
            <AreaCetakStruk laporan={laporan} />
          </>
        ) : (
          <div className="flex max-w-md flex-col items-center gap-2 rounded-[14px] border border-dashed border-navy/25 bg-gading p-8 text-center">
            <span className="text-subjudul font-bold text-navy">Laporan tersedia setelah semua mesin kasir di outlet ditutup.</span>
            <span className="text-isi text-navy/70">
              Dibuka {waktuBaris(periode.dibukaPada)}; {periode.jumlahSesi} sesi kasir, {periode.sesiBuka} masih buka.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
