"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ReceiptText } from "lucide-react";
import { PilFilterAktif, TombolFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihanPeriode } from "@/components/filter/panel-filter";
import { DataTable } from "@/components/ui/data-table";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { pesanError } from "@/lib/api/error";
import type { PeriodeKasir } from "@/types/sesiKasir";
import { useDaftarPeriode } from "./hooks";
import { BadgeStatusPeriode } from "./label";
import {
  FILTER_PERIODE_KOSONG,
  PILIHAN_UKURAN_PERIODE,
  UKURAN_PERIODE_BAWAAN,
  jumlahFilterPeriode,
  paramsDaftarPeriode,
  pilFilterPeriode,
  teksSesiPeriode,
  urlLaporanPeriode,
  waktuBaris,
  type FilterPeriode,
} from "./laporan";

/**
 * Daftar Laporan Tutup Kasir (PW10, desain A): satu baris per periode, yaitu
 * gabungan seluruh mesin kasir di outlet per shift atau hari toko (B375).
 * Paginasi dan filter periode dibuka di server (keputusan rancangan butir 27).
 */
export function HalamanLaporanTutupKasir() {
  const [filter, setFilter] = useState<FilterPeriode>(FILTER_PERIODE_KOSONG);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(UKURAN_PERIODE_BAWAAN);
  const daftar = useDaftarPeriode(paramsDaftarPeriode(filter, halaman, ukuran));
  const hariIni = useTanggalHariIni();

  const ubahFilter = (baru: FilterPeriode) => {
    setFilter(baru);
    setHalaman(1);
  };
  const panel = usePanelFilter({ terapan: filter, bawaan: FILTER_PERIODE_KOSONG, onTerapkan: ubahFilter });

  const kolom = useMemo<ColumnDef<PeriodeKasir>[]>(
    () => [
      {
        id: "dibuka",
        header: "Dibuka",
        cell: ({ row }) => <span className="font-semibold text-navy">{waktuBaris(row.original.dibukaPada)}</span>,
      },
      {
        id: "ditutup",
        header: "Ditutup",
        cell: ({ row }) =>
          row.original.ditutupPada ? (
            waktuBaris(row.original.ditutupPada)
          ) : (
            <span className="text-navy/70">Belum ditutup</span>
          ),
      },
      {
        id: "sesi",
        header: "Sesi kasir",
        cell: ({ row }) => teksSesiPeriode(row.original),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <BadgeStatusPeriode status={row.original.status} />,
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link
              href={urlLaporanPeriode(row.original.id)}
              aria-label={`Lihat laporan dibuka ${waktuBaris(row.original.dibukaPada)}`}
              className="font-bold text-navy underline-offset-4 hover:underline"
            >
              {row.original.status === "BUKA" ? "Lihat" : "Lihat laporan"}
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <section
      aria-labelledby="judul-laporan-tutup-kasir"
      className="flex w-full flex-col gap-6 overflow-hidden rounded-2xl border border-navy/10 bg-krem p-4 text-navy shadow-sm sm:p-6"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-lg bg-karamel p-2 shadow-sm">
            <ReceiptText className="h-5 w-5 text-gading" aria-hidden="true" />
          </div>
          <div>
            <h2 id="judul-laporan-tutup-kasir" className="text-subjudul font-bold tracking-wide text-navy">
              Laporan Tutup Kasir
            </h2>
            <p className="text-kecil font-medium text-navy/70">
              Satu laporan per shift atau hari toko, gabungan seluruh mesin kasir di outlet
            </p>
          </div>
        </div>
        <TombolFilter jumlahAktif={jumlahFilterPeriode(filter)} onBuka={panel.buka} terbuka={panel.terbuka} />
      </div>
      <PilFilterAktif
        pil={pilFilterPeriode(filter, hariIni, ubahFilter)}
        onAturUlangSemua={() => ubahFilter(FILTER_PERIODE_KOSONG)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterPeriode(panel.draf)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Periode dibuka">
          <PilihanPeriode
            idAwalan="filter-laporan-tutup-kasir"
            hariIni={hariIni}
            labelDari="Dibuka dari"
            labelSampai="Dibuka sampai"
            batasiUrutan
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
          />
        </KelompokFilter>
      </PanelFilter>

      {daftar.isError ? (
        <p role="alert" className="py-10 text-center text-isi font-bold text-navy/70">
          {pesanError(daftar.error, "Gagal memuat laporan tutup kasir.")}
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={daftar.data?.data ?? []}
          loading={daftar.isLoading}
          emptyMessage={
            jumlahFilterPeriode(filter) > 0
              ? "Belum ada laporan tutup kasir pada periode ini."
              : "Belum ada laporan tutup kasir."
          }
          paginasiServer={{
            halaman,
            jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
            total: daftar.data?.pagination?.total ?? 0,
            ukuran,
            pilihanUkuran: PILIHAN_UKURAN_PERIODE,
            sibuk: daftar.isFetching,
            onGantiHalaman: setHalaman,
            onGantiUkuran: (baru) => {
              setUkuran(baru);
              setHalaman(1);
            },
          }}
        />
      )}
    </section>
  );
}
