"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, ShoppingCart } from "lucide-react";

import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useDaftarBahanBaku } from "@/features/bahan-baku/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import type { PembelianStok } from "@/types/pembelianStok";
import { useDaftarPembelianStok } from "./hooks";
import { aksiPembelianStok, type RuangPembelian } from "./izin";
import {
  PANJANG_CARI_SUPPLIER,
  filterAwalDaftarPembelian,
  paramDaftarPembelian,
  type FilterPembelian,
} from "./payload";
import { urlCatatPembelian, urlDetailPembelian } from "./ruang";
import { namaAkunPembelian, ringkasBarang } from "./tampilan";

const PILIHAN_UKURAN = [10, 20, 50] as const;
const SEMUA = "SEMUA";
const KELAS_LABEL_FILTER = "text-xs font-bold text-navy/70";
const KELAS_PEMICU_FILTER =
  "h-10 w-full sm:w-48 bg-white border-navy/20 text-navy font-bold focus:ring-navy shadow-sm";

interface Props {
  ruang: RuangPembelian;
  /**
   * Lokasi penerima yang pembeliannya ditampilkan; null selama lokasi belum
   * diketahui. GET /pembelianstok menyaring satu locationID (B103).
   */
  lokasiID: string | null;
  /** Teks di bawah judul halaman. */
  deskripsi: ReactNode;
  /** Bila diisi, tampil menggantikan tabel dan seluruh filter dinonaktifkan. */
  penghalang?: ReactNode;
  /** True selama data yang menentukan lokasi (misalnya lokasi aktif) dimuat. */
  memuatLingkup?: boolean;
  /** Pemilih lokasi di bilah filter (pemegang izin lintas outlet di ruang outlet). */
  pemilihLokasi?: ReactNode;
}

export default function HalamanDaftarPembelianStok({
  ruang,
  lokasiID,
  deskripsi,
  penghalang,
  memuatLingkup = false,
  pemilihLokasi,
}: Props) {
  const { permissions } = useSession();
  // Filter akun kas dan bahan memuat daftar yang menuntut izin bacanya
  // sendiri, sehingga komponennya hanya dipasang bagi pemegang izin itu,
  // seperti filter akun di halaman pengeluaran.
  const bolehAkun = permissions.includes(IZIN.akunKas);
  const bolehBahan = permissions.includes(IZIN.bahan);
  const aksi = aksiPembelianStok(permissions, ruang);

  const [filter, setFilter] = useState<FilterPembelian>(() => filterAwalDaftarPembelian());
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  const kriteria = useMemo(() => ({ ...filter, supplier: cariTertunda }), [filter, cariTertunda]);

  // Mengganti lokasi atau filter kembali ke halaman 1, disesuaikan saat render
  // seperti jurnal stok, agar halaman lama tidak sempat diminta untuk kriteria baru.
  const kunciKriteria = JSON.stringify([lokasiID, kriteria]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  const params = useMemo(
    () => (lokasiID ? paramDaftarPembelian(kriteria, lokasiID, halaman, ukuran) : null),
    [lokasiID, kriteria, halaman, ukuran],
  );
  const { data, isLoading, isFetching, isError } = useDaftarPembelianStok(params);
  const daftar = useMemo(() => data?.data ?? [], [data]);

  const resetFilter = () => {
    setFilter(filterAwalDaftarPembelian());
    setCari("");
  };

  const memuat = isLoading || memuatLingkup;
  const nonaktif = Boolean(penghalang);

  // Kolom ringkas (TB6a): nomor akun, lokasi, pencatat, dan rincian barang ada di detail.
  const kolom = useMemo<ColumnDef<PembelianStok>[]>(
    () => [
      {
        id: "pembelian",
        header: "Pembelian",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={urlDetailPembelian(ruang, row.original.id)}
              className="font-bold text-navy hover:underline"
            >
              {row.original.supplier}
            </Link>
            <span className="text-xs font-medium text-navy/60">
              {formatTanggalPendek(row.original.tanggal)} ·{" "}
              <span className="font-mono break-all">{row.original.nomorFaktur || "-"}</span>
            </span>
          </div>
        ),
      },
      {
        id: "barang",
        header: "Barang",
        cell: ({ row }) => {
          const ringkas = ringkasBarang(row.original.items);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-navy">{ringkas.utama}</span>
              {ringkas.lainnya && (
                <span className="text-xs font-medium text-navy/60">{ringkas.lainnya}</span>
              )}
            </div>
          );
        },
      },
      {
        id: "akun",
        header: "Dibayar dari",
        cell: ({ row }) => (
          <span className="font-medium text-navy">{namaAkunPembelian(row.original)}</span>
        ),
      },
      {
        id: "total",
        header: () => <div className="text-right">Total</div>,
        meta: { label: "Total" },
        cell: ({ row }) => (
          <div className="text-right font-bold text-navy whitespace-nowrap">
            {formatRupiah(row.original.totalBiaya)}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Aksi pembelian {row.original.supplier}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-gading border-navy/10 rounded-xl shadow-lg">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
                >
                  <Link href={urlDetailPembelian(ruang, row.original.id)}>Lihat detail</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [ruang],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <ShoppingCart className="w-6 h-6 text-karamel" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-navy">Pembelian Stok</h1>
            <p className="text-sm font-medium text-navy/60">{deskripsi}</p>
          </div>
        </div>
        {aksi.buat && (
          <Button
            asChild
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto font-bold"
          >
            <Link href={urlCatatPembelian(ruang)}>
              <Plus className="mr-2 h-4 w-4" /> Catat Pembelian
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-navy/10 pb-4 sm:flex sm:flex-wrap sm:items-end">
        {pemilihLokasi && <div className="col-span-2 sm:col-span-1">{pemilihLokasi}</div>}
        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <label htmlFor="cari-supplier-pembelian" className={KELAS_LABEL_FILTER}>
            Cari supplier
          </label>
          <Input
            id="cari-supplier-pembelian"
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            maxLength={PANJANG_CARI_SUPPLIER}
            placeholder="Nama supplier"
            disabled={nonaktif}
            className="h-10 w-full sm:w-56 bg-white border-navy/20 text-navy"
          />
        </div>
        {bolehAkun && (
          <FilterAkun
            nilai={filter.akunKasID}
            onUbah={(akunKasID) => setFilter((f) => ({ ...f, akunKasID }))}
            nonaktif={nonaktif}
          />
        )}
        {bolehBahan && (
          <FilterBahan
            nilai={filter.bahanBakuID}
            onUbah={(bahanBakuID) => setFilter((f) => ({ ...f, bahanBakuID }))}
            nonaktif={nonaktif}
          />
        )}
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL_FILTER}>Pembelian dari</span>
          <PilihTanggal
            label="Pembelian dari"
            value={filter.dari}
            onChange={(dari) => setFilter((f) => ({ ...f, dari }))}
            tanggalNonaktif={filter.sampai ? { after: filter.sampai } : undefined}
            disabled={nonaktif}
            className="h-10 w-full sm:w-44"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className={KELAS_LABEL_FILTER}>Pembelian sampai</span>
          <PilihTanggal
            label="Pembelian sampai"
            value={filter.sampai}
            onChange={(sampai) => setFilter((f) => ({ ...f, sampai }))}
            tanggalNonaktif={filter.dari ? { before: filter.dari } : undefined}
            disabled={nonaktif}
            className="h-10 w-full sm:w-44"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={resetFilter}
          disabled={nonaktif}
          className="col-span-2 h-10 justify-self-end font-bold text-amber-800 hover:bg-navy/5 hover:text-amber-900 sm:col-span-1"
        >
          Reset Filter
        </Button>
      </div>

      {penghalang ??
        (isError ? (
          <p
            role="alert"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
          >
            Gagal memuat pembelian stok. Coba muat ulang halaman.
          </p>
        ) : (
          <DataTable
            columns={kolom}
            data={daftar}
            loading={memuat}
            emptyMessage="Belum ada pembelian pada filter ini."
            paginasiServer={{
              halaman,
              jumlahHalaman: data?.pagination?.totalPages ?? 1,
              total: data?.pagination?.total ?? 0,
              ukuran,
              pilihanUkuran: PILIHAN_UKURAN,
              sibuk: isFetching,
              onGantiHalaman: setHalaman,
              onGantiUkuran: (berikut) => {
                setUkuran(berikut);
                setHalaman(1);
              },
            }}
          />
        ))}
    </div>
  );
}

function FilterAkun({
  nilai,
  onUbah,
  nonaktif,
}: {
  nilai: string;
  onUbah: (nilai: string) => void;
  nonaktif: boolean;
}) {
  const akun = useDaftarAkunKas();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="filter-akun-pembelian" className={KELAS_LABEL_FILTER}>
        Akun kas
      </label>
      <Select value={nilai || SEMUA} onValueChange={(v) => onUbah(v === SEMUA ? "" : v)} disabled={nonaktif}>
        <SelectTrigger id="filter-akun-pembelian" className={KELAS_PEMICU_FILTER}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gading border-navy/10 text-navy">
          <SelectItem value={SEMUA} className="font-bold">
            Semua akun kas
          </SelectItem>
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

function FilterBahan({
  nilai,
  onUbah,
  nonaktif,
}: {
  nilai: string;
  onUbah: (nilai: string) => void;
  nonaktif: boolean;
}) {
  const bahan = useDaftarBahanBaku();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="filter-bahan-pembelian" className={KELAS_LABEL_FILTER}>
        Bahan baku
      </label>
      <Select value={nilai || SEMUA} onValueChange={(v) => onUbah(v === SEMUA ? "" : v)} disabled={nonaktif}>
        <SelectTrigger id="filter-bahan-pembelian" className={KELAS_PEMICU_FILTER}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gading border-navy/10 text-navy">
          <SelectItem value={SEMUA} className="font-bold">
            Semua bahan
          </SelectItem>
          {(bahan.data ?? []).map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.namaBahan}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}