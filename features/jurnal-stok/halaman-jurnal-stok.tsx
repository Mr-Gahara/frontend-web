"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { JurnalStok } from "@/types/jurnalStok";
import { useDaftarJurnalStok } from "./hooks";
import {
  saringJurnal,
  type FilterAlasan,
  type FilterArah,
  type LingkupJurnal,
} from "./filter";
import { formatWaktuJurnal, teksJumlahJurnal } from "./tampilan";
import { DialogRincianJurnal } from "./dialog-rincian-jurnal";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, BookOpen, MapPin, Filter, MoreHorizontal } from "lucide-react";

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

/** Pilihan baris per halaman (DataTable opt-in, pemilik proyek 17 Oktober 2026). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

interface Props {
  ruang: keyof typeof TEKS;
  /** Cakupan data; null selama lokasi belum diketahui. */
  lingkup: LingkupJurnal | null;
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
  lingkup,
  deskripsi,
  penghalang,
  memuatLingkup = false,
  pemilihLokasi,
}: Props) {
  const teks = TEKS[ruang];
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 500);
  const [arah, setArah] = useState<FilterArah>("ALL");
  const [alasan, setAlasan] = useState<FilterAlasan>("ALL");

  const { data: semua = [], isLoading, isError } = useDaftarJurnalStok(lingkup);

  const daftar = useMemo(
    () =>
      lingkup ? saringJurnal(semua, lingkup, { cari: cariTertunda, arah, alasan }) : [],
    [semua, lingkup, cariTertunda, arah, alasan],
  );

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

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {pemilihLokasi}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
            <Input
              placeholder="Cari nama barang..."
              aria-label="Cari nama barang"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              disabled={nonaktif}
              className="pl-9 h-10 bg-gading border-navy/20 text-navy focus-visible:ring-navy font-medium shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={arah}
              onValueChange={(nilai) => setArah(nilai as FilterArah)}
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
              onValueChange={(nilai) => setAlasan(nilai as FilterAlasan)}
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
          </div>
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
            pilihanUkuranKlien={PILIHAN_UKURAN}
          />
        ))}
    </div>
  );
}
