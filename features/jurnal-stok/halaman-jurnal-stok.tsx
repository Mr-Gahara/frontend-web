"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import { formatWaktuJurnal } from "./tampilan";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  MapPin,
  CalendarClock,
  User,
  Filter,
} from "lucide-react";

const TEKS = {
  outlet: {
    labelTransfer: "Suplai / Transfer",
    kolomAlasan: "Alasan / Konteks",
    kolomJumlah: "Pergerakan Angka",
    kosongJudul: "Buku Jurnal Kosong",
    kosongIsi: "Belum ada riwayat pergerakan barang di outlet ini.",
    jumlahSkeleton: 5,
  },
  gudang: {
    labelTransfer: "Transfer Distribusi",
    kolomAlasan: "Alasan Jurnal",
    kolomJumlah: "Pergerakan Fisik",
    kosongJudul: "Tidak Ada Catatan Ditemukan",
    kosongIsi: "Belum ada pergerakan stok yang sesuai dengan filter Anda.",
    jumlahSkeleton: 6,
  },
} as const;

const WARNA_ALASAN: Record<string, string> = {
  "Transfer Gudang": "bg-blue-50 text-blue-700 border-blue-200",
  "Stok Opname": "bg-amber-50 text-amber-700 border-amber-200",
  "Rusak/Hilang": "bg-rose-50 text-rose-700 border-rose-200",
};
const WARNA_ALASAN_LAIN = "bg-slate-50 text-slate-700 border-slate-200";

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

  const { data: semua = [], isLoading, isError } = useDaftarJurnalStok();

  const daftar = useMemo(
    () =>
      lingkup ? saringJurnal(semua, lingkup, { cari: cariTertunda, arah, alasan }) : [],
    [semua, lingkup, cariTertunda, arah, alasan],
  );

  const memuat = isLoading || memuatLingkup;
  const nonaktif = Boolean(penghalang);

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-[#0A2947]/10 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-[#0A2947] flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-[#D4A373]" />
            Buku Jurnal Stok
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">{deskripsi}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {pemilihLokasi}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
            <Input
              placeholder="Cari nama barang..."
              aria-label="Cari nama barang"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              disabled={nonaktif}
              className="pl-9 h-10 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947] font-medium shadow-sm"
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
                className="w-full sm:w-[140px] h-10 bg-white border-[#0A2947]/20 text-[#0A2947] font-bold focus:ring-[#0A2947] shadow-sm"
              >
                <Filter className="w-3.5 h-3.5 mr-2 text-[#0A2947]/50" />
                <SelectValue placeholder="Semua Arah" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
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
                className="w-full sm:w-[160px] h-10 bg-white border-[#0A2947]/20 text-[#0A2947] font-bold focus:ring-[#0A2947] shadow-sm"
              >
                <SelectValue placeholder="Semua Alasan" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
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

      {penghalang ?? (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#F2EAE1] text-[11px] uppercase tracking-wider font-black text-[#0A2947]/60 border-b border-[#0A2947]/10">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Waktu Transaksi</th>
                  <th className="px-6 py-4">Informasi Barang</th>
                  <th className="px-6 py-4">{teks.kolomAlasan}</th>
                  <th className="px-6 py-4 text-right">{teks.kolomJumlah}</th>
                  <th className="px-6 py-4 rounded-tr-2xl">PIC (Penanggung Jawab)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A2947]/5">
                {memuat ? (
                  Array.from({ length: teks.jumlahSkeleton }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-48 bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24 bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <span className="text-rose-600 font-bold">
                        Gagal memuat jurnal stok. Coba muat ulang halaman.
                      </span>
                    </td>
                  </tr>
                ) : daftar.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center flex flex-col items-center justify-center w-full"
                    >
                      <BookOpen className="w-12 h-12 mb-3 text-[#0A2947]/20" />
                      <span className="text-[#0A2947]/50 font-bold text-lg">{teks.kosongJudul}</span>
                      <span className="text-[#0A2947]/40 font-medium text-sm mt-1">{teks.kosongIsi}</span>
                    </td>
                  </tr>
                ) : (
                  daftar.map((jurnal) => <BarisJurnal key={jurnal.id} jurnal={jurnal} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BarisJurnal({ jurnal }: { jurnal: JurnalStok }) {
  const masuk = jurnal.tipeKoreksi === "Masuk";
  const waktu = formatWaktuJurnal(jurnal.tanggal);

  return (
    <tr className="hover:bg-[#FFFAF3]/60 transition-colors group">
      {/* KOLOM 1: TANGGAL */}
      <td className="px-6 py-4 align-top">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-[#0A2947] flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-[#0A2947]/40" />
            {waktu.tanggal}
          </span>
          <span className="text-[11px] font-bold text-[#0A2947]/50">Pukul {waktu.jam}</span>
        </div>
      </td>

      {/* KOLOM 2: BARANG & LOKASI */}
      <td className="px-6 py-4 align-top">
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "font-bold text-base",
              jurnal.bahanBakuID ? "text-[#0A2947]" : "text-rose-500 line-through",
            )}
          >
            {jurnal.bahanBakuID?.namaBahan || "Master Data Terhapus"}
          </span>
          <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#D4A373]" />
            {jurnal.locationID?.nama || "Lokasi Tidak Diketahui"}
          </span>
        </div>
      </td>

      {/* KOLOM 3: ALASAN */}
      <td className="px-6 py-4 align-top">
        <div className="flex flex-col items-start gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase font-black tracking-wider border",
              WARNA_ALASAN[jurnal.alasan] ?? WARNA_ALASAN_LAIN,
            )}
          >
            {jurnal.alasan}
          </Badge>
          {jurnal.keterangan && (
            <span
              className="text-[11px] font-medium text-[#0A2947]/60 italic max-w-[200px] truncate"
              title={jurnal.keterangan}
            >
              &quot;{jurnal.keterangan}&quot;
            </span>
          )}
        </div>
      </td>

      {/* KOLOM 4: PERGERAKAN */}
      <td className="px-6 py-4 align-top text-right">
        <div
          className={cn(
            "inline-flex flex-col items-end px-3 py-1.5 rounded-lg border",
            masuk ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100",
          )}
        >
          <span
            className={cn(
              "text-lg font-mono font-black flex items-center gap-1",
              masuk ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {masuk ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {masuk ? "+" : "-"}
            {jurnal.jumlah}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold uppercase",
              masuk ? "text-emerald-700/60" : "text-rose-700/60",
            )}
          >
            {jurnal.bahanBakuID?.satuan || "UNIT"}
          </span>
        </div>
      </td>

      {/* KOLOM 5: PENCATAT */}
      <td className="px-6 py-4 align-top">
        <div className="flex items-center gap-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-[#0A2947]/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#0A2947]/50" />
          </div>
          <span className="font-bold text-[#0A2947] capitalize">
            {jurnal.dicatatOleh?.nama || "Sistem Otomatis"}
          </span>
        </div>
      </td>
    </tr>
  );
}