"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Receipt } from "lucide-react";

import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihDaftar, PilihanPeriode, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { PILIHAN_UKURAN_MUTASI, UKURAN_MUTASI_BAWAAN } from "@/features/akun-kas/mutasi";
import { useDaftarKategoriBeban } from "@/features/kategori-beban/hooks";
import { pesanError } from "@/lib/api/error";
import { IZIN, bolehBukaHalaman } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BebanOperasional } from "@/types/bebanOperasional";
import { DialogBatalBeban, DialogRincianBeban, DialogUbahBeban } from "./dialog-beban";
import { useDaftarBeban } from "./hooks";
import { aksiBeban } from "./izin";
import {
  FILTER_AWAL_BEBAN,
  LABEL_STATUS_BEBAN,
  URL_CATAT_BEBAN,
  jumlahFilterBeban,
  namaKategoriBeban,
  pilFilterBeban,
  type FilterBeban,
} from "./payload";

type JenisDialog = "rincian" | "ubah" | "batal";
type DialogTerbuka = { jenis: JenisDialog; beban: BebanOperasional } | null;

/**
 * Daftar pengeluaran (keputusan BO3a): beban operasional berpaginasi dan
 * berfilter server, termasuk beban yang dibatalkan. Kolom dibatasi ke yang
 * penting, dan rincian dibuka lewat menu titik tiga (TB6a). Ubah dan
 * Batalkan hanya untuk beban AKTIF bagi pemegang update-beban-operasional
 * (BO6a). Filter akun dan kategori hanya dipasang bagi pemegang izin
 * bacanya, agar tidak ada permintaan yang pasti dijawab 403.
 */
export function HalamanPengeluaran() {
  const { permissions } = useSession();
  const aksi = aksiBeban(permissions);
  const bolehCatat = bolehBukaHalaman(URL_CATAT_BEBAN, permissions);
  const bolehAkun = permissions.includes(IZIN.akunKas);
  const bolehKategori = permissions.includes(IZIN.kategoriBeban);
  const [filter, setFilter] = useState<FilterBeban>(FILTER_AWAL_BEBAN);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(UKURAN_MUTASI_BAWAAN);
  const [terbuka, setTerbuka] = useState<DialogTerbuka>(null);
  const daftar = useDaftarBeban(filter, halaman, ukuran);
  const data = useMemo(() => daftar.data?.data ?? [], [daftar.data]);

  const hariIni = useTanggalHariIni();
  const akun = useDaftarAkunKas({ enabled: bolehAkun });
  const kategori = useDaftarKategoriBeban(bolehKategori);
  const namaFilter = {
    akun: (id: string) => akun.data?.find((a) => a.id === id)?.namaAkun,
    kategori: (id: string) => kategori.data?.find((k) => k.id === id)?.namaKategori,
  };
  const ubahFilter = (baru: FilterBeban) => {
    setFilter(baru);
    setHalaman(1);
  };
  const panel = usePanelFilter({ terapan: filter, bawaan: FILTER_AWAL_BEBAN, onTerapkan: ubahFilter });

  const kolom = useMemo<ColumnDef<BebanOperasional>[]>(
    () => [
      {
        id: "tanggal",
        header: "Tanggal",
        cell: ({ row }) => (
          <span className="font-medium text-navy whitespace-nowrap">
            {formatTanggalPendek(row.original.tanggal)}
          </span>
        ),
      },
      {
        id: "keterangan",
        header: "Keterangan",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p
              className={cn(
                "font-bold text-navy break-words",
                row.original.status === "VOID" && "line-through text-navy/50",
              )}
            >
              {row.original.keterangan || "-"}
            </p>
            <p className="text-kecil font-medium text-navy/60">{namaKategoriBeban(row.original.kategori)}</p>
          </div>
        ),
      },
      {
        id: "jumlah",
        header: "Jumlah",
        cell: ({ row }) => (
          <span
            className={cn(
              "font-mono font-bold whitespace-nowrap",
              row.original.status === "VOID" ? "text-navy/50 line-through" : "text-red-800",
            )}
          >
            {formatRupiah(row.original.jumlah)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-kecil font-bold",
              row.original.status === "AKTIF" ? "text-emerald-700" : "text-red-600",
            )}
          >
            {LABEL_STATUS_BEBAN[row.original.status]}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <MenuBeban
            beban={row.original}
            bolehUbah={aksi.ubah}
            onBuka={(jenis) => setTerbuka({ jenis, beban: row.original })}
          />
        ),
      },
    ],
    [aksi.ubah],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <Receipt className="w-6 h-6 text-karamel" />
          </div>
          <div>
            <h1 className="text-judul font-bold tracking-tight text-navy">Pengeluaran</h1>
            <p className="text-isi font-medium text-navy/60">
              Beban operasional toko di luar pembelian stok, dibayar dari akun kas. Beban yang salah
              dibatalkan, lalu dicatat ulang.
            </p>
          </div>
        </div>
        {bolehCatat && (
          <Button
            asChild
            size="aksi"
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto"
          >
            <Link href={URL_CATAT_BEBAN}>
              <Plus className="h-4 w-4" /> Catat Beban
            </Link>
          </Button>
        )}
      </div>

      <BilahFilter
        jumlahAktif={jumlahFilterBeban(filter)}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilFilterBeban(filter, namaFilter, hariIni, ubahFilter)}
        onAturUlangSemua={() => ubahFilter(FILTER_AWAL_BEBAN)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterBeban(panel.draf)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        {bolehAkun && (
          <KelompokFilter judul="Akun kas" htmlFor="filter-akun-beban">
            <PilihDaftar
              id="filter-akun-beban"
              nilai={panel.draf.akunKasID}
              onUbah={(akunKasID) => panel.setDraf({ ...panel.draf, akunKasID })}
              labelSemua="Semua akun"
              opsi={(akun.data ?? []).map((a) => ({ id: a.id, nama: a.namaAkun }))}
            />
          </KelompokFilter>
        )}
        {bolehKategori && (
          <KelompokFilter judul="Kategori" htmlFor="filter-kategori-beban">
            <PilihDaftar
              id="filter-kategori-beban"
              nilai={panel.draf.kategoriBebanID}
              onUbah={(kategoriBebanID) => panel.setDraf({ ...panel.draf, kategoriBebanID })}
              labelSemua="Semua kategori"
              opsi={(kategori.data ?? []).map((k) => ({ id: k.id, nama: k.namaKategori }))}
            />
          </KelompokFilter>
        )}
        <KelompokFilter judul="Status">
          <PilihanSegmen
            label="Status"
            nilai={panel.draf.status || undefined}
            opsi={(["AKTIF", "VOID"] as const).map((v) => ({ nilai: v, label: LABEL_STATUS_BEBAN[v] }))}
            onUbah={(status) => panel.setDraf({ ...panel.draf, status: status ?? "" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Periode">
          <PilihanPeriode
            idAwalan="filter-beban"
            hariIni={hariIni}
            labelDari="Beban dari"
            labelSampai="Beban sampai"
            batasiUrutan
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
          />
        </KelompokFilter>
      </PanelFilter>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
        >
          <p className="text-isi font-medium text-red-600">
            {pesanError(daftar.error, "Gagal memuat daftar pengeluaran.")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void daftar.refetch()}
            disabled={daftar.isFetching}
          >
            Coba Lagi
          </Button>
        </div>
      ) : (
        <DataTable
          columns={kolom}
          data={data}
          loading={daftar.isLoading}
          emptyMessage="Belum ada beban pada filter ini."
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

      {terbuka?.jenis === "rincian" && (
        <DialogRincianBeban beban={terbuka.beban} onTutup={() => setTerbuka(null)} />
      )}
      {terbuka?.jenis === "ubah" && (
        <DialogUbahBeban
          beban={terbuka.beban}
          bolehKategori={bolehKategori}
          onTutup={() => setTerbuka(null)}
        />
      )}
      {terbuka?.jenis === "batal" && (
        <DialogBatalBeban beban={terbuka.beban} onTutup={() => setTerbuka(null)} />
      )}
    </div>
  );
}

function MenuBeban({
  beban,
  bolehUbah,
  onBuka,
}: {
  beban: BebanOperasional;
  bolehUbah: boolean;
  onBuka: (jenis: JenisDialog) => void;
}) {
  const aktif = beban.status === "AKTIF";
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Aksi ${beban.keterangan || beban.id}`}
            className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-gading border-navy/10 rounded-xl shadow-lg">
          <DropdownMenuItem
            onSelect={() => onBuka("rincian")}
            className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
          >
            Lihat rincian
          </DropdownMenuItem>
          {bolehUbah && aktif && (
            <>
              <DropdownMenuItem
                onSelect={() => onBuka("ubah")}
                className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
              >
                Ubah
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-navy/5" />
              <DropdownMenuItem
                onSelect={() => onBuka("batal")}
                className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
              >
                Batalkan
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}