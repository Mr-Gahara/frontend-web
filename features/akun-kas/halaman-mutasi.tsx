"use client";

import { TeksDuaBaris } from "@/components/ui/teks-dua-baris";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { useSession } from "@/lib/auth/useSession";
import { useBukaPembelian } from "@/features/pembelian-stok/hooks";
import { bolehBacaPembelianStok } from "@/features/pembelian-stok/izin";
import { DialogUnduhBulan } from "@/components/unduh/dialog-unduh-bulan";
import { EP } from "@/lib/api/endpoints";
import { labelFilterEkspor, paramEkspor, unduhDaftar } from "@/lib/unduh";
import { KelompokFilter, PanelFilter, PilihDaftar, PilihanPeriode, PilihanPil, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggal, formatTanggalPendek } from "@/lib/format";
import type { MutasiKas } from "@/types/akunKas";
import { DialogRincianMutasi } from "./dialog-rincian-mutasi";
import { useDaftarAkunKas, useDaftarMutasi, useRingkasanMutasi } from "./hooks";
import {
  LABEL_ARAH,
  LABEL_JENIS,
  PILIHAN_UKURAN_MUTASI,
  UKURAN_MUTASI_BAWAAN,
  filterAwalMutasi,
  filterServerMutasi,
  gantiArah,
  jumlahFilterMutasi,
  namaAkunBaris,
  namaAkunMutasi,
  pilFilterMutasi,
  idPembelianMutasi,
  pilihanJenis,
  tanggalTransaksiBerbeda,
  teksJumlahMutasi,
  type FilterMutasi,
} from "./mutasi";


function KartuRingkasan({ judul, nilai }: { judul: string; nilai: number }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-permukaan p-4">
      <p className="text-kecil font-bold text-navy/60">{judul}</p>
      <p className="mt-1 text-subjudul font-black tracking-tight text-navy">{formatRupiah(nilai)}</p>
    </div>
  );
}

/** Ringkasan periode: satu akun kas bila dipilih, gabungan seluruh akun kas bila tidak (keputusan NZ1a). */
function RingkasanAkun({ filter, namaAkun }: { filter: FilterMutasi; namaAkun: string }) {
  const ringkasan = useRingkasanMutasi(filter);
  return (
    <section aria-label={`Ringkasan ${namaAkun}`} className="flex flex-col gap-3">
      {ringkasan.isError ? (
        <p role="alert" className="text-isi font-medium text-red-600">
          {pesanError(ringkasan.error, "Gagal memuat ringkasan akun kas.")}
        </p>
      ) : !ringkasan.data ? (
        <p className="text-isi font-medium text-navy/60">Memuat ringkasan...</p>
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
  // Mutasi PEMBELIAN bertaut ke detail pembeliannya (PS10a).
  const { permissions } = useSession();
  const bacaPembelian = bolehBacaPembelianStok(permissions);
  const pembelian = useBukaPembelian();

  const ubahFilter = (baru: FilterMutasi) => {
    setFilter(baru);
    setHalaman(1);
  };
  // Periode bawaan bulan ini mengikuti hari ini (butir 28), tidak dihitung
  // di lencana, dan menjadi tujuan Atur ulang (FL11a).
  const hariIni = useTanggalHariIni();
  const bawaan = useMemo(() => filterAwalMutasi(hariIni), [hariIni]);
  const panel = usePanelFilter({ terapan: filter, bawaan, onTerapkan: ubahFilter });

  const kolom = useMemo<ColumnDef<MutasiKas>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Dicatat",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-navy">{formatTanggal(row.original.createdAt)}</p>
            {tanggalTransaksiBerbeda(row.original) && (
              <p className="text-kecil text-navy/60">
                Tanggal transaksi {formatTanggalPendek(row.original.tanggal)}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "akun",
        header: "Akun Kas",
        meta: { lebarBungkus: 180 },
        cell: ({ row }) => <TeksDuaBaris teks={namaAkunBaris(row.original, akunKas.data)} />,
      },
      {
        accessorKey: "keterangan",
        header: "Keterangan",
        meta: { lebarBungkus: 260 },
        cell: ({ row }) => (
          <div className="max-w-[16rem] lg:max-w-md xl:max-w-xl">
            <p className="font-bold text-navy">{LABEL_JENIS[row.original.jenis]}</p>
            <TeksDuaBaris teks={row.original.keterangan || "-"} className="text-kecil text-navy/70" />
          </div>
        ),
      },
      {
        id: "jumlah",
        meta: { label: "Jumlah" },
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
                {idPembelianMutasi(row.original, bacaPembelian) && (
                  <DropdownMenuItem
                    className="cursor-pointer font-bold text-navy/80"
                    disabled={pembelian.memuat}
                    onClick={() => pembelian.buka(row.original.referensi.id!)}
                  >
                    Lihat pembelian
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pembelian.buka stabil cukup lewat memuat
    [akunKas.data, bacaPembelian, pembelian.memuat],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      <DialogRincianMutasi
        mutasi={dirinci}
        namaAkun={dirinci ? namaAkunBaris(dirinci, akunKas.data) : ""}
        onTutup={() => setDirinci(null)}
      />
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-subjudul font-bold tracking-wide text-navy">
              Laporan Mutasi Kas
            </h2>
            <p className="text-isi font-medium text-navy/60 mt-1">
              Setiap perubahan saldo akun kas, terbaru dicatat lebih dulu.
            </p>
          </div>
          {/* Ekspor buku gabungan per bulan, Masuk dan Keluar terpisah (B350, P85). */}
          <DialogUnduhBulan
            namaData="mutasi kas"
            filterAktif={labelFilterEkspor(pilFilterMutasi(filter, bawaan, akunKas.data, hariIni, ubahFilter))}
            unduh={({ format, bulan }) =>
              unduhDaftar(EP.akunKasMutasi, { ...paramEkspor(filterServerMutasi(filter)), format, bulan: bulan! }, `mutasi-kas_${bulan}.${format}`)
            }
          />
        </div>

        <BilahFilter
          jumlahAktif={jumlahFilterMutasi(filter, bawaan)}
          onBukaFilter={panel.buka}
          filterTerbuka={panel.terbuka}
          pil={pilFilterMutasi(filter, bawaan, akunKas.data, hariIni, ubahFilter)}
          onAturUlangSemua={() => ubahFilter(bawaan)}
        />
        <PanelFilter
          terbuka={panel.terbuka}
          onTerbukaBerubah={panel.ubahTerbuka}
          jumlahAktif={jumlahFilterMutasi(panel.draf, bawaan)}
          onTerapkan={panel.terapkan}
          onAturUlang={panel.aturUlang}
        >
          <KelompokFilter judul="Akun kas" htmlFor="filter-akun">
            <PilihDaftar
              id="filter-akun"
              nilai={panel.draf.akunKasID}
              onUbah={(akunKasID) => panel.setDraf({ ...panel.draf, akunKasID })}
              labelSemua="Semua akun"
              opsi={(akunKas.data ?? []).map((a) => ({ id: a.id, nama: a.namaAkun }))}
            />
          </KelompokFilter>
          <KelompokFilter judul="Arah">
            <PilihanSegmen
              label="Arah"
              nilai={panel.draf.arah || undefined}
              opsi={(["MASUK", "KELUAR"] as const).map((v) => ({ nilai: v, label: LABEL_ARAH[v] }))}
              onUbah={(arah) => panel.setDraf(gantiArah(panel.draf, arah ?? ""))}
            />
          </KelompokFilter>
          <KelompokFilter judul="Jenis">
            <PilihanPil
              label="Jenis"
              nilai={panel.draf.jenis || undefined}
              opsi={pilihanJenis(panel.draf.arah).map((j) => ({ nilai: j, label: LABEL_JENIS[j] }))}
              onUbah={(jenis) => panel.setDraf({ ...panel.draf, jenis: jenis ?? "" })}
            />
          </KelompokFilter>
          <KelompokFilter judul="Periode dicatat">
            <PilihanPeriode
              idAwalan="filter-mutasi"
              hariIni={hariIni}
              labelDari="Dicatat dari"
              labelSampai="Dicatat sampai"
              batasiUrutan
              rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
              onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
            />
          </KelompokFilter>
        </PanelFilter>

        <RingkasanAkun
          filter={filter}
          namaAkun={filter.akunKasID ? namaAkunMutasi(filter.akunKasID, akunKas.data) : "seluruh akun kas"}
        />

        {daftar.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
          >
            <p className="text-isi font-medium text-red-600">
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