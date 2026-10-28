"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StockOpname, StatusOpname } from "@/types/stockOpname";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";
import { useDebounce } from "@/hooks/use-debounce";
import { useHalamanStockOpname } from "./hooks";
import { PANJANG_CARI_OPNAME, paramHalamanOpname } from "./filter";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  Plus,
  Eye,
  RotateCcw,
  Search,
} from "lucide-react";

const PILIHAN_UKURAN = [10, 20, 50] as const;

// --- HELPERS ---
const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const badgeStatusOpname = (status: StatusOpname) => {
  const map: Record<StatusOpname, string> = {
    DRAFT: "bg-karamel text-navy border-none shadow-sm", // Mustard
    SUBMITTED: "bg-blue-100 text-blue-700 border-none shadow-sm", // Soft Blue
    APPROVED: "bg-sage text-gading border-none shadow-sm", // Sage Green
    REJECTED: "bg-rose-100 text-rose-700 border-none shadow-sm", // Light Red
    CANCELLED: "bg-navy/10 text-navy/60 border-none shadow-sm", // Navy Muted
  };

  const labels: Record<StatusOpname, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Review",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };

  const className = map[status] || "bg-navy/5 text-navy/60";
  return (
    <Badge className={`${className} px-2.5 py-0.5 font-bold`}>
      {labels[status] || status}
    </Badge>
  );
};

const TEKS = {
  outlet: {
    judul: "Stok Opname",
    deskripsi: "Kelola perhitungan fisik stok dan sinkronisasi saldo inventaris.",
    tombolBuat: "Buat Opname Baru",
    urlDaftar: "/dashboard/outlet/inventaris/stockOpname",
  },
  gudang: {
    judul: "Stok Opname Gudang",
    deskripsi: "Kelola dan pantau dokumen perhitungan fisik stok untuk Gudang Pusat.",
    tombolBuat: "Buat Opname Gudang",
    urlDaftar: "/dashboard/gudang/stockOpname",
  },
} as const;

interface Props {
  ruang: keyof typeof TEKS;
  /** null selama cakupan lokasi belum diketahui. */
  lingkup: LingkupLokasi | null;
  /** True selama data yang menentukan lingkup masih dimuat. */
  memuatLingkup?: boolean;
  /** Pemilih lokasi, ditampilkan di samping filter status (owner di ruang outlet). */
  pemilihLokasi?: ReactNode;
  /** Pesan yang ditampilkan di atas filter bila daftar tidak dapat dimuat. */
  penghalang?: ReactNode;
}

export default function HalamanDaftarStockOpname({
  ruang,
  lingkup,
  memuatLingkup = false,
  pemilihLokasi,
  penghalang,
}: Props) {
  const router = useRouter();
  const teks = TEKS[ruang];

  // --- STATE FILTER ---
  const [statusFilter, setStatusFilter] = useState<StatusOpname | "ALL">("ALL");
  const [cari, setCari] = useState("");
  const cariTertunda = useDebounce(cari, 400);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  // Mengganti lingkup, status, atau pencarian kembali ke halaman 1, disesuaikan
  // saat render seperti Belanja Stok, agar halaman lama tidak sempat diminta.
  const kunciKriteria = JSON.stringify([lingkup, statusFilter, cariTertunda]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  // --- QUERY FETCH DATA ---
  // Lokasi atau tipe lokasi, status, dan pencarian disaring server, sehingga
  // halaman dan total tetap benar (B106, B108, B109; keputusan rancangan butir 27).
  // Urutan mengikuti backend, terbaru dulu: mengurutkan di klien hanya
  // mengurutkan satu halaman.
  const params = lingkup ? paramHalamanOpname(lingkup, statusFilter, cariTertunda, halaman, ukuran) : null;
  const { data, isLoading: memuatOpname, isError, isFetching } = useHalamanStockOpname(params);
  const opnameList = useMemo(() => data?.data ?? [], [data]);
  const isLoading = memuatOpname || memuatLingkup;

  const handleResetFilter = () => {
    setStatusFilter("ALL");
    setCari("");
  };

  // --- COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<StockOpname>[]>(
    () => [
      {
        accessorKey: "nomorOpname",
        header: () => <span className="text-xs font-bold text-navy/60">No. Opname</span>,
        cell: ({ row }) => (
          <span className="font-bold font-mono text-navy text-xs sm:text-sm">
            {row.original.nomorOpname}
          </span>
        ),
      },
      {
        accessorKey: "tanggal",
        header: () => (
          <span className="text-xs font-bold text-navy/60 hidden sm:inline">Tanggal Dibuat</span>
        ),
        cell: ({ row }) => (
          <span className="text-xs sm:text-sm font-medium text-navy/70 hidden sm:inline">
            {formatTanggal(row.original.tanggal || row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "lokasi",
        header: () => (
          <span className="text-xs font-bold text-navy/60 hidden md:inline">
            Lokasi
          </span>
        ),
        cell: ({ row }) => (
          <span className="hidden md:inline text-xs sm:text-sm font-medium text-navy/80">
            {row.original.lokasi?.nama || "Lokasi Tidak Diketahui"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs font-bold text-navy/60">Status</span>
        ),
        cell: ({ row }) => badgeStatusOpname(row.original.status),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-xs font-bold text-navy/60">
            Aksi
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer bg-gading border-navy/20 text-navy hover:bg-navy/5 font-bold shadow-sm h-8 px-3"
              onClick={() => router.push(`${teks.urlDaftar}/${row.original.id}`)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Detail
            </Button>
          </div>
        ),
      },
    ],
    [router, teks.urlDaftar],
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shadow-sm hidden sm:block">
            <ClipboardCheck className="w-6 h-6 text-navy" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy truncate">
              {teks.judul}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-navy/60 hidden sm:block">
              {teks.deskripsi}
            </p>
          </div>
        </div>
        <div className="flex shrink-0">
          <Button
            onClick={() =>
              router.push(`${teks.urlDaftar}/buatStockOpname`)
            }
            size="sm"
            className="cursor-pointer gap-1.5 bg-navy text-gading hover:bg-navy/90 font-bold shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{teks.tombolBuat}</span>
          </Button>
        </div>
      </div>

      {penghalang}

      {/* FILTER SECTION */}
      <div className="rounded-2xl border border-navy/10 bg-krem p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        {pemilihLokasi}
        <div className="space-y-1.5 w-full sm:w-64">
          <label className="text-xs font-bold text-navy">
            Filter Status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as StatusOpname | "ALL")
            }
          >
            <SelectTrigger className="cursor-pointer w-full bg-gading border-navy/20 text-navy font-bold">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-gading border-navy/10 text-navy">
              <SelectItem
                value="ALL"
                className="cursor-pointer font-bold hover:bg-navy/5"
              >
                Semua Status
              </SelectItem>
              <SelectItem
                value="DRAFT"
                className="cursor-pointer font-bold hover:bg-navy/5"
              >
                Draft
              </SelectItem>
              <SelectItem
                value="SUBMITTED"
                className="cursor-pointer font-bold hover:bg-navy/5"
              >
                Menunggu Review
              </SelectItem>
              <SelectItem
                value="APPROVED"
                className="cursor-pointer font-bold hover:bg-navy/5"
              >
                Disetujui
              </SelectItem>
              <SelectItem
                value="REJECTED"
                className="cursor-pointer font-bold hover:bg-navy/5"
              >
                Ditolak
              </SelectItem>
              <SelectItem
                value="CANCELLED"
                className="cursor-pointer font-bold hover:bg-navy/5"
              >
                Dibatalkan
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-full sm:w-64">
          <label htmlFor={`cari-opname-${ruang}`} className="text-xs font-bold text-navy">
            Cari No. Opname
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
            <Input
              id={`cari-opname-${ruang}`}
              type="search"
              placeholder="Cari no. opname..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              maxLength={PANJANG_CARI_OPNAME}
              className="h-10 pl-9 bg-gading border-navy/20 text-navy"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleResetFilter}
          className="cursor-pointer shrink-0 border-navy/20 text-navy hover:bg-navy/5 font-bold shadow-sm h-10 w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4 mr-2 sm:mr-0" />
          <span className="sm:hidden">Reset Filter</span>
        </Button>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={opnameList}
          loading={isLoading}
          emptyMessage={
            isError
              ? "Gagal memuat stok opname. Coba muat ulang halaman."
              : "Belum ada data stok opname."
          }
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
      </div>
    </div>
  );
}
