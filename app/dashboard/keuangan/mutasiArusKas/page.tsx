"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { KeuanganNavTabs } from "../components/keuangan-nav-tabs";
import { KeuanganSummaryCards } from "../components/keuangan-summary-cards";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TipeMutasi = "masuk" | "keluar";
type KategoriMutasi =
  | "penjualan"
  | "pengeluaran"
  | "transfer-masuk"
  | "transfer-keluar"
  | "penyesuaian";

type MutasiArusKas = {
  _id: string;
  akunKasID: { _id: string; namaAkun: string; nomorAkun: string };
  tipe: TipeMutasi;
  jumlah: number;
  kategori: KategoriMutasi;
  deskripsi?: string;
  referensiID?: string;
  referensiModel?: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Mock data mutasi — diganti fetch real saat backend MutasiArusKas tersedia
// ---------------------------------------------------------------------------

const MOCK_MUTASI: MutasiArusKas[] = [
  {
    _id: "1",
    akunKasID: { _id: "a1", namaAkun: "Bank BCA", nomorAkun: "123-456-7890" },
    tipe: "masuk",
    jumlah: 5000000,
    kategori: "penjualan",
    deskripsi: "Setoran harian Outlet A",
    createdAt: "2025-10-28T08:00:00.000Z",
  },
  {
    _id: "2",
    akunKasID: { _id: "a1", namaAkun: "Bank BCA", nomorAkun: "123-456-7890" },
    tipe: "keluar",
    jumlah: 500000,
    kategori: "pengeluaran",
    deskripsi: "Beli Kopi Arabika",
    createdAt: "2025-10-28T09:00:00.000Z",
  },
  {
    _id: "3",
    akunKasID: { _id: "a1", namaAkun: "Bank BCA", nomorAkun: "123-456-7890" },
    tipe: "masuk",
    jumlah: 2450000,
    kategori: "penjualan",
    deskripsi: "Pencairan Dana Xendit",
    createdAt: "2025-10-28T10:00:00.000Z",
  },
  {
    _id: "4",
    akunKasID: { _id: "a2", namaAkun: "Kas Kecil", nomorAkun: "-" },
    tipe: "keluar",
    jumlah: 700000,
    kategori: "pengeluaran",
    deskripsi: "Token Listrik",
    createdAt: "2025-10-28T11:00:00.000Z",
  },
  {
    _id: "5",
    akunKasID: { _id: "a1", namaAkun: "Bank BCA", nomorAkun: "123-456-7890" },
    tipe: "keluar",
    jumlah: 1000000,
    kategori: "transfer-keluar",
    deskripsi: "Topup Kas Kecil",
    createdAt: "2025-10-28T12:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type FilterTipe = "semua" | "masuk" | "keluar";

function FilterToggle({
  active,
  filter,
  onClick,
  children,
}: {
  active: FilterTipe;
  filter: FilterTipe;
  onClick: (f: FilterTipe) => void;
  children: React.ReactNode;
}) {
  const isActive = active === filter;
  return (
    <button
      onClick={() => onClick(filter)}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Kolom DataTable
// ---------------------------------------------------------------------------

const columns: ColumnDef<MutasiArusKas>[] = [
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tanggal
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-foreground">
        {formatTanggal(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "tipe",
    header: () => (
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tipe Mutasi
      </span>
    ),
    cell: ({ row }) => {
      const isMasuk = row.original.tipe === "masuk";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
            isMasuk
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {isMasuk ? "Masuk" : "Keluar"}
        </span>
      );
    },
  },
  {
    accessorKey: "kategori",
    header: () => (
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Kategori
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm capitalize text-muted-foreground">
        {row.original.kategori.replace(/-/g, " ")}
      </span>
    ),
  },
  {
    accessorKey: "deskripsi",
    header: () => (
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Deskripsi
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.deskripsi ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "akunKasID",
    header: () => (
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Akun
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {row.original.akunKasID.namaAkun}
      </span>
    ),
  },
  {
    accessorKey: "jumlah",
    header: () => (
      <div className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Jumlah
      </div>
    ),
    cell: ({ row }) => {
      const isMasuk = row.original.tipe === "masuk";
      return (
        <div
          className={`text-right text-sm font-medium whitespace-nowrap ${
            isMasuk ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isMasuk ? "+ " : "- "}
          {formatRupiah(row.original.jumlah)}
        </div>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Page utama
// ---------------------------------------------------------------------------

export default function MutasiArusKasPage() {
  const [filterTipe, setFilterTipe] = useState<FilterTipe>("semua");

  // TODO: Ganti MOCK_MUTASI dengan fetch real saat endpoint tersedia
  // const { data: mutasiList = [], isLoading } = useQuery({
  //   queryKey: queryKeys.mutasiArusKas,
  //   queryFn: async () => {
  //     const res = await apiClient.get<MutasiArusKas[]>(
  //       "/mutasi-arus-kas",
  //       undefined,
  //       "pengguna"
  //     );
  //     return Array.isArray(res) ? res : [];
  //   },
  // });

  const mutasiList = MOCK_MUTASI;
  const isLoading = false;

  const filteredData = useMemo(() => {
    if (filterTipe === "semua") return mutasiList;
    return mutasiList.filter((m) => m.tipe === filterTipe);
  }, [mutasiList, filterTipe]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Manajemen Keuangan
        </h1>
        <Button
          variant="secondary"
          className="bg-[#424242] text-white hover:bg-[#525252] border-none shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Laporan
        </Button>
      </div>
      {/* Summary cards */}
      <KeuanganSummaryCards/>

      {/* Navigasi tab keuangan */}
      <KeuanganNavTabs />


      {/* Tabel mutasi */}
      <div className="bg-card rounded-2xl p-6 shadow-sm flex flex-col w-full">
        {/* Toolbar tabel */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold tracking-wide text-foreground">
              Laporan Mutasi Arus Kas
            </h2>

            {/* Filter toggle */}
            <div className="flex rounded-lg p-1 border border-border bg-muted">
              <FilterToggle
                active={filterTipe}
                filter="semua"
                onClick={setFilterTipe}
              >
                Semua
              </FilterToggle>
              <FilterToggle
                active={filterTipe}
                filter="masuk"
                onClick={setFilterTipe}
              >
                Uang Masuk
              </FilterToggle>
              <FilterToggle
                active={filterTipe}
                filter="keluar"
                onClick={setFilterTipe}
              >
                Uang Keluar
              </FilterToggle>
            </div>
          </div>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {/* DataTable dengan override styling dark */}
        <DataTable
          columns={columns}
          data={filteredData}
          loading={isLoading}
          emptyMessage="Belum ada data mutasi arus kas."
        />
      </div>
    </div>
  );
}
