"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { PANJANG_CARI_SERVER } from "@/features/inventaris/cakupan";
import type { JurnalStok } from "@/types/jurnalStok";
import { useHalamanJurnalStok } from "./hooks";
import { periodeAwalJurnal, type FilterAlasan, type FilterArah } from "./filter";
import { formatWaktuJurnal, teksJumlahJurnal } from "./tampilan";
import { DialogRincianJurnal } from "./dialog-rincian-jurnal";

import { PilihTanggal } from "@/components/pilih-tanggal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, MapPin, Filter, MoreHorizontal } from "lucide-react";

const TEKS = {
  outlet: {
    labelTransfer: "Suplai / Transfer",
    kolomAlasan: "Alasan / Konteks",
    kolomJumlah: "Pergerakan Angka",
    kosongJudul: "Buku Jurnal Kosong",
    kosongIsi: "Belum ada riwayat pergerakan barang di outlet ini.",
  },
  gudang: {
    labelTransfer: "Transfer Distribusi",
    kolomAlasan: "Alasan Jurnal",
    kolomJumlah: "Pergerakan Fisik",
    kosongJudul: "Tidak Ada Catatan Ditemukan",
    kosongIsi: "Belum ada pergerakan stok yang sesuai dengan filter Anda.",
  },
} as const;

const WARNA_ALASAN: Record<string, string> = {
  "Transfer Gudang": "bg-blue-50 text-blue-700 border-blue-200",
  "Stok Opname": "bg-amber-50 text-amber-700 border-amber-200",
  "Rusak/Hilang": "bg-rose-50 text-rose-700 border-rose-200",
};
const WARNA_ALASAN_LAIN = "bg-slate-50 text-slate-700 border-slate-200";

/** Pilihan baris per halaman (pemilik proyek 17 Oktober 2026); yang pertama menjadi ukuran awal. */
const PILIHAN_UKURAN = [10, 20, 50] as const;

const KELAS_LABEL_FILTER = "text-xs font-bold text-navy/70";

interface Props {
  ruang: keyof typeof TEKS;
  /**
   * Lokasi yang jurnalnya ditampilkan; null selama lokasi belum diketahui.
   * GET /jurnalstok hanya menyaring satu locationID (B102).
   */
  lokasiID: string | null;
  /** Teks di bawah judul halaman. */
  deskripsi: ReactNode;
  /** Bila diisi, tampil menggantikan tabel dan seluruh filter dinonaktifkan. */
  penghalang?: ReactNode;
  /** True selama data yang menentukan lingkup (misalnya lokasi aktif) dimuat. */
  memuatLingkup?: boolean;
  /** Pemilih lokasi di bilah filter (owner di ruang outlet). */
  pemilihLokasi?: ReactNode;
}

export default function HalamanJurnalStok({
  ruang,
  lokasiID,
  deskripsi,
  penghalang,
  memuatLingkup = false,
  pemilihLokasi,
}: Props) {
  const teks = TEKS[ruang];
  const [periode, setPeriode] = useState(() => periodeAwalJurnal());
  const [arah, setArah] = useState<FilterArah>("ALL");
  const [alasan, setAlasan] = useState<FilterAlasan>("ALL");
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  // Mengganti lokasi atau pencarian (yang ditunda) kembali ke halaman 1,
  // disesuaikan saat render, bukan lewat effect, agar halaman lama tidak
  // sempat diminta untuk kriteria baru.
  const kunciKriteria = JSON.stringify([lokasiID, cariTertunda]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  const { data, isLoading, isFetching, isError } = useHalamanJurnalStok(
    lokasiID
      ? { lokasiID, arah, alasan, dari: periode.dari, sampai: periode.sampai, cari: cariTertunda }
      : null,
    halaman,
    ukuran,
  );
  const daftar = useMemo(() => data?.data ?? [], [data]);

  /** Setiap perubahan filter kembali ke halaman 1. */
  const ubahFilter = (ubah: () => void) => {
    ubah();
    setHalaman(1);
  };
  const resetFilter = () =>
    ubahFilter(() => {
      setPeriode(periodeAwalJurnal());
      setArah("ALL");
      setAlasan("ALL");
      setCari("");
    });

  const memuat = isLoading || memuatLingkup;
  const nonaktif = Boolean(penghalang);
  const [dirinci, setDirinci] = useState<JurnalStok | null>(null);

  // Kolom ringkas (TB6a, J-A): pencatat dan keterangan utuh ada di dialog rincian.
  const kolom = useMemo<ColumnDef<JurnalStok>[]>(
    () => [
      {
        id: "barang",
        header: "Barang",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "font-bold",
                row.original.bahanBakuID ? "text-navy" : "text-rose-500 line-through",
              )}
            >
              {row.original.bahanBakuID?.namaBahan || "Master Data Terhapus"}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-navy/60">
              <MapPin className="h-3 w-3 text-karamel" aria-hidden="true" />
              {row.original.locationID?.nama || "Lokasi Tidak Diketahui"}
            </span>
          </div>
        ),
      },
      {
        id: "waktu",
        header: "Waktu",
        cell: ({ row }) => {
          const waktu = formatWaktuJurnal(row.original.tanggal);
          return (
            <div>
              <p className="font-medium text-navy">{waktu.tanggal}</p>
              <p className="text-xs text-navy/60">Pukul {waktu.jam}</p>
            </div>
          );
        },
      },
      {
        id: "alasan",
        header: teks.kolomAlasan,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase font-black tracking-wider border",
              WARNA_ALASAN[row.original.alasan] ?? WARNA_ALASAN_LAIN,
            )}
          >
            {row.original.alasan}
          </Badge>
        ),
      },
      {
        id: "jumlah",
        header: () => <div className="text-right">{teks.kolomJumlah}</div>,
        meta: { label: teks.kolomJumlah },
        cell: ({ row }) => (
          <div
            className={cn(
              "text-right font-mono font-bold",
              row.original.tipeKoreksi === "Masuk" ? "text-emerald-700" : "text-red-800",
            )}
          >
            {teksJumlahJurnal(row.original)}
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
    [teks],
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-navy/10 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-navy flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-karamel" />
            Buku Jurnal Stok
          </h1>
          <p className="text-sm font-medium text-navy/60">{deskripsi}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:flex-wrap sm:items-end md:w-auto">
          {pemilihLokasi && <div className="col-span-2 sm:col-span-1">{pemilihLokasi}</div>}
          <div className="flex flex-col gap-1">
            <span className={KELAS_LABEL_FILTER}>Dari tanggal</span>
            <PilihTanggal
              label="Dari tanggal"
              value={periode.dari}
              onChange={(dari) => ubahFilter(() => setPeriode((p) => ({ ...p, dari })))}
              tanggalNonaktif={{ after: periode.sampai }}
              disabled={nonaktif}
              className="h-10 w-full sm:w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className={KELAS_LABEL_FILTER}>Sampai tanggal</span>
            <PilihTanggal
              label="Sampai tanggal"
              value={periode.sampai}
              onChange={(sampai) => ubahFilter(() => setPeriode((p) => ({ ...p, sampai })))}
              tanggalNonaktif={{ before: periode.dari }}
              disabled={nonaktif}
              className="h-10 w-full sm:w-44"
            />
          </div>

          <Select
            value={arah}
            onValueChange={(nilai) => ubahFilter(() => setArah(nilai as FilterArah))}
            disabled={nonaktif}
          >
            <SelectTrigger
              aria-label="Filter arah"
              className="w-full sm:w-[140px] h-10 bg-white border-navy/20 text-navy font-bold focus:ring-navy shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 mr-2 text-navy/50" />
              <SelectValue placeholder="Semua Arah" />
            </SelectTrigger>
            <SelectContent className="bg-white border-navy/10 text-navy">
              <SelectItem value="ALL" className="font-bold">Semua Arah</SelectItem>
              <SelectItem value="Masuk" className="font-bold text-emerald-600">Barang Masuk</SelectItem>
              <SelectItem value="Keluar" className="font-bold text-rose-600">Barang Keluar</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={alasan}
            onValueChange={(nilai) => ubahFilter(() => setAlasan(nilai as FilterAlasan))}
            disabled={nonaktif}
          >
            <SelectTrigger
              aria-label="Filter alasan"
              className="w-full sm:w-[160px] h-10 bg-white border-navy/20 text-navy font-bold focus:ring-navy shadow-sm"
            >
              <SelectValue placeholder="Semua Alasan" />
            </SelectTrigger>
            <SelectContent className="bg-white border-navy/10 text-navy">
              <SelectItem value="ALL" className="font-bold">Semua Alasan</SelectItem>
              <SelectItem value="Transfer Gudang" className="font-medium">{teks.labelTransfer}</SelectItem>
              <SelectItem value="Stok Opname" className="font-medium">Stok Opname</SelectItem>
              <SelectItem value="Rusak/Hilang" className="font-medium">Rusak / Hilang</SelectItem>
              <SelectItem value="Lainnya" className="font-medium">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <label htmlFor={`cari-jurnal-${ruang}`} className={KELAS_LABEL_FILTER}>
              Cari bahan
            </label>
            <Input
              id={`cari-jurnal-${ruang}`}
              type="search"
              placeholder="Cari nama bahan..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              maxLength={PANJANG_CARI_SERVER}
              disabled={nonaktif}
              className="h-10 w-full sm:w-48 bg-white border-navy/20 text-navy"
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
      </div>

      <DialogRincianJurnal jurnal={dirinci} onTutup={() => setDirinci(null)} />

      {penghalang ??
        (isError ? (
          <p
            role="alert"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
          >
            Gagal memuat jurnal stok. Coba muat ulang halaman.
          </p>
        ) : (
          <DataTable
            columns={kolom}
            data={daftar}
            loading={memuat}
            emptyMessage={`${teks.kosongJudul}. ${teks.kosongIsi}`}
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
