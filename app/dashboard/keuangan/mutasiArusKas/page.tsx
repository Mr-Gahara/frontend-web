"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
// Types
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
// Mock data mutasi — diganti fetch real saat backend MutasiArusKas tersedia
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
// Helper
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
      className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors cursor-pointer ${
        isActive
          ? "bg-[#FFFAF3] text-[#0A2947] shadow-sm"
          : "text-[#0A2947]/50 hover:text-[#0A2947]"
      }`}
    >
      {children}
    </button>
  );
}
// Kolom DataTable
const columns: ColumnDef<MutasiArusKas>[] = [
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
        Tanggal
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-semibold whitespace-nowrap text-[#0A2947]">
        {formatTanggal(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "tipe",
    header: () => (
      <span className="text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
        Tipe Mutasi
      </span>
    ),
    cell: ({ row }) => {
      const isMasuk = row.original.tipe === "masuk";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold shadow-sm ${
            isMasuk
              ? "bg-[#718355] text-[#FFFAF3]"
              : "bg-[#D4A373] text-[#FFFAF3]"
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
      <span className="text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
        Kategori
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-semibold capitalize text-[#0A2947]/80">
        {row.original.kategori.replace(/-/g, " ")}
      </span>
    ),
  },
  {
    accessorKey: "deskripsi",
    header: () => (
      <span className="text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
        Deskripsi
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-[#0A2947]/70">
        {row.original.deskripsi ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "akunKasID",
    header: () => (
      <span className="text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
        Akun
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-bold text-[#0A2947]">
        {row.original.akunKasID.namaAkun}
      </span>
    ),
  },
  {
    accessorKey: "jumlah",
    header: () => (
      <div className="text-right text-xs font-bold text-[#0A2947]/60 uppercase tracking-wider">
        Jumlah
      </div>
    ),
    cell: ({ row }) => {
      const isMasuk = row.original.tipe === "masuk";
      return (
        <div
          className={`text-right text-sm font-black whitespace-nowrap ${
            isMasuk ? "text-[#718355]" : "text-[#D4A373]"
          }`}
        >
          {isMasuk ? "+ " : "- "}
          {formatRupiah(row.original.jumlah)}
        </div>
      );
    },
  },
];
// Page utama
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
      {/* Tabel mutasi */}
      <div className="bg-[#F2EAE1] border border-[#0A2947]/10 rounded-2xl p-6 shadow-sm flex flex-col w-full">
        {/* Toolbar tabel */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold tracking-wide text-[#0A2947]">
              Laporan Mutasi Arus Kas
            </h2>

            {/* Filter toggle */}
            <div className="flex rounded-lg p-1 border border-[#0A2947]/10 bg-[#0A2947]/5">
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

          <Button
            variant="outline"
            className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {/* DataTable */}
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
