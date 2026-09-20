"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { StockOpname, StatusOpname } from "@/types/stockOpname";
import type { LingkupLokasi } from "@/features/inventaris/cakupan";
import { useDaftarStockOpname } from "./hooks";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowUpDown,
  Eye,
  RotateCcw,
} from "lucide-react";

// --- HELPERS ---
const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const badgeStatusOpname = (status: StatusOpname) => {
  const map: Record<StatusOpname, string> = {
    DRAFT: "bg-[#D4A373] text-[#0A2947] border-none shadow-sm", // Mustard
    SUBMITTED: "bg-blue-100 text-blue-700 border-none shadow-sm", // Soft Blue
    APPROVED: "bg-[#718355] text-[#FFFAF3] border-none shadow-sm", // Sage Green
    REJECTED: "bg-rose-100 text-rose-700 border-none shadow-sm", // Light Red
    CANCELLED: "bg-[#0A2947]/10 text-[#0A2947]/60 border-none shadow-sm", // Navy Muted
  };

  const labels: Record<StatusOpname, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Review",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };

  const className = map[status] || "bg-[#0A2947]/5 text-[#0A2947]/60";
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
  useAuthGuard();
  const router = useRouter();
  const teks = TEKS[ruang];

  // --- STATE FILTER ---
  const [statusFilter, setStatusFilter] = useState<StatusOpname | "ALL">("ALL");

  // --- QUERY FETCH DATA ---
  // Satu lokasi dikirim ke server; tipe lokasi disaring di klien karena
  // backend tidak mendukung filter tipe.
  const { data: semuaOpname = [], isLoading: memuatOpname } = useDaftarStockOpname(
    lingkup
      ? {
          ...(lingkup.locationID ? { locationID: lingkup.locationID } : {}),
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        }
      : null,
  );
  const opnameList = useMemo(
    () =>
      lingkup?.tipeLokasi
        ? semuaOpname.filter((opn) => opn.lokasi?.tipe === lingkup.tipeLokasi)
        : semuaOpname,
    [semuaOpname, lingkup],
  );
  const isLoading = memuatOpname || memuatLingkup;

  const handleResetFilter = () => {
    setStatusFilter("ALL");
  };

  // --- COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<StockOpname>[]>(
    () => [
      {
        accessorKey: "nomorOpname",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Opname
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold font-mono text-[#0A2947] text-xs sm:text-sm">
            {row.original.nomorOpname}
          </span>
        ),
      },
      {
        accessorKey: "tanggal",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer hidden sm:flex"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal Dibuat
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs sm:text-sm font-medium text-[#0A2947]/70 hidden sm:inline">
            {formatTanggal(row.original.tanggal || row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "lokasi", // Ganti dari locationID ke lokasi
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60 hidden md:inline">
            Lokasi
          </span>
        ),
        cell: ({ row }) => (
          <span className="hidden md:inline text-xs sm:text-sm font-medium text-[#0A2947]/80">
            {/* Membaca dari objek relasi mapper */}
            {row.original.lokasi?.nama || "Lokasi Tidak Diketahui"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">Status</span>
        ),
        cell: ({ row }) => badgeStatusOpname(row.original.status),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-xs font-bold text-[#0A2947]/60">
            Aksi
          </div>
        ),
        cell: ({ row }) => {
          const targetId = row.original.id; 
          return (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm h-8 px-3"
                onClick={() => router.push(`${teks.urlDaftar}/${targetId}`)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Detail
              </Button>
            </div>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shadow-sm hidden sm:block">
            <ClipboardCheck className="w-6 h-6 text-[#0A2947]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2947] truncate">
              {teks.judul}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#0A2947]/60 hidden sm:block">
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
            className="cursor-pointer gap-1.5 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{teks.tombolBuat}</span>
          </Button>
        </div>
      </div>

      {penghalang}

      {/* FILTER SECTION */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        {pemilihLokasi}
        <div className="space-y-1.5 w-full sm:w-64">
          <label className="text-xs font-bold text-[#0A2947]">
            Filter Status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as StatusOpname | "ALL")
            }
          >
            <SelectTrigger className="cursor-pointer w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
              <SelectItem
                value="ALL"
                className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
              >
                Semua Status
              </SelectItem>
              <SelectItem
                value="DRAFT"
                className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
              >
                Draft
              </SelectItem>
              <SelectItem
                value="SUBMITTED"
                className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
              >
                Menunggu Review
              </SelectItem>
              <SelectItem
                value="APPROVED"
                className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
              >
                Disetujui
              </SelectItem>
              <SelectItem
                value="REJECTED"
                className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
              >
                Ditolak
              </SelectItem>
              <SelectItem
                value="CANCELLED"
                className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
              >
                Dibatalkan
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleResetFilter}
          className="cursor-pointer shrink-0 border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm h-10 w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4 mr-2 sm:mr-0" />
          <span className="sm:hidden">Reset Filter</span>
        </Button>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-4 sm:p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={opnameList}
          loading={isLoading}
          emptyMessage="Belum ada data stok opname."
          searchKey="nomorOpname"
          searchPlaceholder="Cari no. opname..."
        />
      </div>
    </div>
  );
}
