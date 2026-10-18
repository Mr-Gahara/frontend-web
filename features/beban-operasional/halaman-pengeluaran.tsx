"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Receipt } from "lucide-react";

import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { PILIHAN_UKURAN_MUTASI, UKURAN_MUTASI_BAWAAN } from "@/features/akun-kas/mutasi";
import { useDaftarKategoriBeban } from "@/features/kategori-beban/hooks";
import { pesanError } from "@/lib/api/error";
import { IZIN, bolehBukaHalaman } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BebanOperasional, StatusBeban } from "@/types/bebanOperasional";
import { DialogBatalBeban, DialogRincianBeban, DialogUbahBeban } from "./dialog-beban";
import { useDaftarBeban } from "./hooks";
import { aksiBeban } from "./izin";
import {
  FILTER_AWAL_BEBAN,
  LABEL_STATUS_BEBAN,
  URL_CATAT_BEBAN,
  adaFilterBeban,
  namaKategoriBeban,
  type FilterBeban,
} from "./payload";

const SEMUA = "semua";
const KELAS_LABEL_FILTER = "text-xs font-bold text-navy/70";
const KELAS_PEMICU_FILTER = "w-52 bg-gading border-navy/20 text-navy";

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

  const ubahFilter = (baru: FilterBeban) => {
    setFilter(baru);
    setHalaman(1);
  };

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
            <p className="text-xs font-medium text-navy/60">{namaKategoriBeban(row.original.kategori)}</p>
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
              "text-xs font-bold",
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <Receipt className="w-6 h-6 text-karamel" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Pengeluaran</h1>
            <p className="text-sm font-medium text-navy/60">
              Beban operasional toko di luar pembelian stok, dibayar dari akun kas. Beban yang salah
              dibatalkan, lalu dicatat ulang.
            </p>
          </div>
        </div>
        {bolehCatat && (
          <Button
            asChild
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto font-bold"
          >
            <Link href={URL_CATAT_BEBAN}>
              <Plus className="mr-2 h-4 w-4" /> Catat Beban
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-b border-navy/10 pb-4">
        {bolehAkun && (
          <FilterAkun
            nilai={filter.akunKasID}
            onUbah={(akunKasID) => ubahFilter({ ...filter, akunKasID })}
          />
        )}
        {bolehKategori && (
          <FilterKategori
            nilai={filter.kategoriBebanID}
            onUbah={(kategoriBebanID) => ubahFilter({ ...filter, kategoriBebanID })}
          />
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status-beban" className={KELAS_LABEL_FILTER}>
            Status
          </label>
          <Select
            value={filter.status || SEMUA}
            onValueChange={(v) =>
              ubahFilter({ ...filter, status: v === SEMUA ? "" : (v as StatusBeban) })
            }
          >
            <SelectTrigger id="filter-status-beban" className={KELAS_PEMICU_FILTER}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEMUA}>Semua status</SelectItem>
              <SelectItem value="AKTIF">{LABEL_STATUS_BEBAN.AKTIF}</SelectItem>
              <SelectItem value="VOID">{LABEL_STATUS_BEBAN.VOID}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL_FILTER}>Beban dari</span>
          <PilihTanggal
            label="Beban dari"
            value={filter.dari}
            onChange={(dari) => ubahFilter({ ...filter, dari })}
            tanggalNonaktif={filter.sampai ? { after: filter.sampai } : undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL_FILTER}>Beban sampai</span>
          <PilihTanggal
            label="Beban sampai"
            value={filter.sampai}
            onChange={(sampai) => ubahFilter({ ...filter, sampai })}
            tanggalNonaktif={filter.dari ? { before: filter.dari } : undefined}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!adaFilterBeban(filter)}
          onClick={() => ubahFilter(FILTER_AWAL_BEBAN)}
        >
          Reset Filter
        </Button>
      </div>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center"
        >
          <p className="text-sm font-medium text-red-600">
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

function FilterAkun({ nilai, onUbah }: { nilai: string; onUbah: (id: string) => void }) {
  const akun = useDaftarAkunKas();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="filter-akun-beban" className={KELAS_LABEL_FILTER}>
        Akun kas
      </label>
      <Select value={nilai || SEMUA} onValueChange={(v) => onUbah(v === SEMUA ? "" : v)}>
        <SelectTrigger id="filter-akun-beban" className={KELAS_PEMICU_FILTER}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SEMUA}>Semua akun</SelectItem>
          {(akun.data ?? []).map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.namaAkun}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterKategori({ nilai, onUbah }: { nilai: string; onUbah: (id: string) => void }) {
  const kategori = useDaftarKategoriBeban();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="filter-kategori-beban" className={KELAS_LABEL_FILTER}>
        Kategori
      </label>
      <Select value={nilai || SEMUA} onValueChange={(v) => onUbah(v === SEMUA ? "" : v)}>
        <SelectTrigger id="filter-kategori-beban" className={KELAS_PEMICU_FILTER}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SEMUA}>Semua kategori</SelectItem>
          {(kategori.data ?? []).map((k) => (
            <SelectItem key={k.id} value={k.id}>
              {k.namaKategori}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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