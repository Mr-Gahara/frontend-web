"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggal, formatTanggalPendek } from "@/lib/format";
import type { ArahMutasi, JenisMutasi, MutasiKas } from "@/types/akunKas";
import { DialogRincianMutasi } from "./dialog-rincian-mutasi";
import { useDaftarAkunKas, useDaftarMutasi, useRingkasanMutasi } from "./hooks";
import {
  LABEL_ARAH,
  LABEL_JENIS,
  PILIHAN_UKURAN_MUTASI,
  UKURAN_MUTASI_BAWAAN,
  filterAwalMutasi,
  gantiArah,
  namaAkunBaris,
  namaAkunMutasi,
  pilihanJenis,
  tanggalTransaksiBerbeda,
  teksJumlahMutasi,
  type FilterMutasi,
} from "./mutasi";

const SEMUA = "semua";
const KELAS_LABEL = "text-xs font-bold text-navy/70";
const KELAS_PEMICU = "w-52 bg-permukaan border-navy/20 text-navy";

function KartuRingkasan({ judul, nilai }: { judul: string; nilai: number }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-permukaan p-4">
      <p className="text-xs font-bold text-navy/60">{judul}</p>
      <p className="mt-1 text-lg font-black tracking-tight text-navy">{formatRupiah(nilai)}</p>
    </div>
  );
}

/** Ringkasan periode: satu akun kas bila dipilih, gabungan seluruh akun kas bila tidak (keputusan NZ1a). */
function RingkasanAkun({ filter, namaAkun }: { filter: FilterMutasi; namaAkun: string }) {
  const ringkasan = useRingkasanMutasi(filter);
  return (
    <section aria-label={`Ringkasan ${namaAkun}`} className="flex flex-col gap-3">
      {ringkasan.isError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {pesanError(ringkasan.error, "Gagal memuat ringkasan akun kas.")}
        </p>
      ) : !ringkasan.data ? (
        <p className="text-sm font-medium text-navy/60">Memuat ringkasan...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KartuRingkasan judul="Saldo awal periode" nilai={ringkasan.data.saldoAwalPeriode} />
          <KartuRingkasan judul="Total uang masuk" nilai={ringkasan.data.totalMasuk} />
          <KartuRingkasan judul="Total uang keluar" nilai={ringkasan.data.totalKeluar} />
          <KartuRingkasan judul="Saldo akhir periode" nilai={ringkasan.data.saldoAkhirPeriode} />
        </div>
      )}
    </section>
  );
}

/**
 * Buku mutasi gabungan seluruh akun kas (keputusan MK1a): filter akun,
 * periode, arah, dan jenis diterapkan backend bersama paginasi. Periode
 * menyaring waktu dicatat, bukan tanggal transaksi, mengikuti backend.
 */
export function HalamanMutasi() {
  const [filter, setFilter] = useState<FilterMutasi>(() => filterAwalMutasi());
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(UKURAN_MUTASI_BAWAAN);
  const akunKas = useDaftarAkunKas();
  const daftar = useDaftarMutasi(filter, halaman, ukuran);
  const [dirinci, setDirinci] = useState<MutasiKas | null>(null);

  const ubahFilter = (baru: FilterMutasi) => {
    setFilter(baru);
    setHalaman(1);
  };

  const kolom = useMemo<ColumnDef<MutasiKas>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Dicatat",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-navy">{formatTanggal(row.original.createdAt)}</p>
            {tanggalTransaksiBerbeda(row.original) && (
              <p className="text-xs text-navy/60">
                Tanggal transaksi {formatTanggalPendek(row.original.tanggal)}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "akun",
        header: "Akun Kas",
        cell: ({ row }) => namaAkunBaris(row.original, akunKas.data),
      },
      {
        accessorKey: "keterangan",
        header: "Keterangan",
        cell: ({ row }) => (
          <div className="max-w-[16rem] lg:max-w-md xl:max-w-xl">
            <p className="font-bold text-navy">{LABEL_JENIS[row.original.jenis]}</p>
            <p className="truncate text-xs text-navy/70" title={row.original.keterangan || undefined}>
              {row.original.keterangan || "-"}
            </p>
          </div>
        ),
      },
      {
        id: "jumlah",
        header: () => <div className="text-right">Jumlah</div>,
        cell: ({ row }) => (
          <div
            className={`text-right font-mono font-bold ${
              row.original.arah === "MASUK" ? "text-emerald-700" : "text-red-800"
            }`}
          >
            {teksJumlahMutasi(row.original)}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gading border-navy/10">
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-navy/80"
                  onClick={() => setDirinci(row.original)}
                >
                  Lihat detail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [akunKas.data],
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      <DialogRincianMutasi
        mutasi={dirinci}
        namaAkun={dirinci ? namaAkunBaris(dirinci, akunKas.data) : ""}
        onTutup={() => setDirinci(null)}
      />
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-wide text-navy">
            Laporan Mutasi Arus Kas
          </h2>
          <p className="text-sm font-medium text-navy/60 mt-1">
            Setiap perubahan saldo akun kas, terbaru dicatat lebih dulu.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-akun" className={KELAS_LABEL}>
              Akun kas
            </label>
            <Select
              value={filter.akunKasID || SEMUA}
              onValueChange={(v) => ubahFilter({ ...filter, akunKasID: v === SEMUA ? "" : v })}
            >
              <SelectTrigger id="filter-akun" className={KELAS_PEMICU}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMUA}>Semua akun</SelectItem>
                {(akunKas.data ?? []).map((akun) => (
                  <SelectItem key={akun.id} value={akun.id}>
                    {akun.namaAkun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className={KELAS_LABEL}>Dicatat dari</span>
            <PilihTanggal
              label="Dicatat dari"
              value={filter.dari}
              onChange={(dari) => ubahFilter({ ...filter, dari })}
              tanggalNonaktif={filter.sampai ? { after: filter.sampai } : undefined}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className={KELAS_LABEL}>Dicatat sampai</span>
            <PilihTanggal
              label="Dicatat sampai"
              value={filter.sampai}
              onChange={(sampai) => ubahFilter({ ...filter, sampai })}
              tanggalNonaktif={filter.dari ? { before: filter.dari } : undefined}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-arah" className={KELAS_LABEL}>
              Arah
            </label>
            <Select
              value={filter.arah || SEMUA}
              onValueChange={(v) => ubahFilter(gantiArah(filter, v === SEMUA ? "" : (v as ArahMutasi)))}
            >
              <SelectTrigger id="filter-arah" className={KELAS_PEMICU}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMUA}>Semua arah</SelectItem>
                <SelectItem value="MASUK">{LABEL_ARAH.MASUK}</SelectItem>
                <SelectItem value="KELUAR">{LABEL_ARAH.KELUAR}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-jenis" className={KELAS_LABEL}>
              Jenis
            </label>
            <Select
              value={filter.jenis || SEMUA}
              onValueChange={(v) => ubahFilter({ ...filter, jenis: v === SEMUA ? "" : (v as JenisMutasi) })}
            >
              <SelectTrigger id="filter-jenis" className={KELAS_PEMICU}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMUA}>Semua jenis</SelectItem>
                {pilihanJenis(filter.arah).map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {LABEL_JENIS[jenis]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" onClick={() => ubahFilter(filterAwalMutasi())}>
            Reset Filter
          </Button>
        </div>

        <RingkasanAkun
          filter={filter}
          namaAkun={filter.akunKasID ? namaAkunMutasi(filter.akunKasID, akunKas.data) : "seluruh akun kas"}
        />

        {daftar.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
          >
            <p className="text-sm font-medium text-red-600">
              {pesanError(daftar.error, "Gagal memuat mutasi arus kas.")}
            </p>
            <Button type="button" variant="outline" onClick={() => daftar.refetch()} disabled={daftar.isFetching}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <DataTable
            columns={kolom}
            data={daftar.data?.data ?? []}
            loading={daftar.isLoading}
            emptyMessage="Tidak ada mutasi pada filter ini."
            paginasiServer={{
              halaman,
              jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
              total: daftar.data?.pagination?.total ?? 0,
              ukuran,
              pilihanUkuran: PILIHAN_UKURAN_MUTASI,
              sibuk: daftar.isFetching,
              onGantiHalaman: setHalaman,
              onGantiUkuran: (baru) => {
                setUkuran(baru);
                setHalaman(1);
              },
            }}
          />
        )}
      </div>
    </div>
  );
}