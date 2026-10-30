"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  ArchiveX,
  Clock,
  MoonStar,
} from "lucide-react";

// Import tipe data dan komponen anak
import type { ShiftItem } from "@/types/shift";
import { ShiftFormDialog } from "./form-shift";
import { ShiftDeleteDialog } from "./dialog-nonaktif-shift";
import { aksiShift } from "./izin";
import { shiftTerpisahPerRuang, type RuangShift } from "./ruang";
import { useSession } from "@/lib/auth/useSession";
import type { NilaiFormShift } from "./schema";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

interface ShiftUtamaProps {
  tipeRuang: RuangShift;
  dataShift: ShiftItem[];
  isLoading: boolean;
  isError: boolean;
  onSave: (nilai: NilaiFormShift, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function ShiftUtama({
  tipeRuang,
  dataShift,
  isLoading,
  isError,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: ShiftUtamaProps) {
  const { permissions } = useSession();
  const aksi = aksiShift(permissions);
  const { ubah: bolehUbah, nonaktifkan: bolehNonaktifkan } = aksi;

  // --- STATE LOKAL ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "Semua" | "Aktif" | "Non-Aktif"
  >("Semua");

  // State Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftItem | null>(null);

  // --- FILTERING DATA ---
  const filteredData = useMemo(() => {
    return dataShift.filter((shift) => {
      // Filter Nama
      const matchSearch = shift.namaShift
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Filter Status
      const matchStatus =
        filterStatus === "Semua" || shift.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [dataShift, searchQuery, filterStatus]);

  // --- HANDLERS ---
  const handleOpenCreate = () => {
    setSelectedShift(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (nilai: NilaiFormShift) => {
    // Jika ada selectedShift, berarti Edit (kirim ID). Jika tidak, berarti Create Baru.
    try {
      await onSave(nilai, selectedShift?.id);
      // Dialog hanya ditutup bila simpan sukses. Saat gagal, toast error
      // ditampilkan oleh onError di halaman induk dan isian form tetap ada.
      setFormOpen(false);
    } catch {
      // Error sudah ditangani onError mutation di halaman induk.
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedShift) return;
    try {
      await onDelete(selectedShift.id);
      setDeleteOpen(false);
    } catch {
      // Error sudah ditangani onError mutation di halaman induk.
    }
  };

  // Menu titik tiga yang sudah ada dipertahankan di kolom aksi (TB7a, TB19a).
  const kolom = useMemo<ColumnDef<ShiftItem>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Shift",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Clock className="h-4 w-4" />
            </div>
            <span className="font-bold text-navy text-base">{row.original.namaShift}</span>
          </div>
        ),
      },
      {
        id: "jam",
        header: "Jam Kerja",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy/80 font-mono tracking-tight text-sm">
              {row.original.jamMasuk} - {row.original.jamPulang}
            </span>
            {row.original.isLintasHari && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                <MoonStar className="h-3 w-3" /> Lintas Hari
              </span>
            )}
          </div>
        ),
      },
      {
        id: "toleransi",
        header: "Toleransi",
        cell: ({ row }) => (
          <span className="font-semibold text-navy/60">
            {row.original.toleransiTerlambat > 0 ? (
              <span className="text-navy font-bold">{row.original.toleransiTerlambat} Menit</span>
            ) : (
              "Tepat Waktu (0 Menit)"
            )}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
              row.original.status === "Aktif" ? "bg-sage text-gading" : "bg-navy/10 text-navy/60"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const nonaktif = bolehNonaktifkan && row.original.status === "Aktif";
          if (!bolehUbah && !nonaktif) return null;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Buka menu"
                    className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-gading border-navy/10 rounded-xl shadow-lg">
                  {bolehUbah && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedShift(row.original);
                        setFormOpen(true);
                      }}
                      className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit Shift
                    </DropdownMenuItem>
                  )}
                  {/* Opsi non-aktifkan hanya untuk shift yang masih Aktif */}
                  {nonaktif && (
                    <>
                      {bolehUbah && <DropdownMenuSeparator className="bg-navy/5" />}
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedShift(row.original);
                          setDeleteOpen(true);
                        }}
                        className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
                      >
                        <ArchiveX className="mr-2 h-4 w-4" /> Non-Aktifkan
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [bolehUbah, bolehNonaktifkan],
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-[95vw] mx-auto">
      {/* 1. HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Master Shift {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-sm text-navy/60 font-medium">
            Kelola jam operasional, toleransi keterlambatan, dan status shift.
          </p>
          {!shiftTerpisahPerRuang() && (
            <p className="text-xs text-navy/50 font-semibold">
              Daftar shift masih dipakai bersama ruang outlet dan gudang sampai
              backend mendukung shift per lokasi.
            </p>
          )}
        </div>

        {aksi.buat && (
          <Button
            onClick={handleOpenCreate}
            className="h-11 bg-navy text-gading hover:bg-navy/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Master Shift
          </Button>
        )}
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-navy/10 pb-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama shift..."
            aria-label="Cari nama shift"
            className="pl-9 h-11 bg-permukaan border-navy/15 text-navy focus-visible:ring-navy/50 rounded-xl font-medium"
          />
        </div>

        {/* Filter Status */}
        <div className="w-full sm:w-48">
          <Select
            value={filterStatus}
            onValueChange={(val) => setFilterStatus(val as "Semua" | "Aktif" | "Non-Aktif")}
          >
            <SelectTrigger
              aria-label="Filter status shift"
              className="w-full bg-permukaan text-navy text-sm border-navy/15 focus:ring-navy/50 font-bold h-11 rounded-xl px-4"
            >
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-gading border-navy/10 text-navy font-medium rounded-xl">
              <SelectItem value="Semua" className="cursor-pointer font-bold">
                Semua Status
              </SelectItem>
              <SelectItem value="Aktif" className="cursor-pointer font-bold">
                Aktif
              </SelectItem>
              <SelectItem
                value="Non-Aktif"
                className="cursor-pointer font-bold text-red-600 focus:text-red-700"
              >
                Non-Aktif
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. TABEL DATA: DataTable, kartu per baris (TB1a sampai TB7a); galat menggantikan tabel (TB15a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat data shift. Muat ulang halaman untuk mencoba lagi.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredData}
          loading={isLoading}
          emptyMessage={
            dataShift.length === 0
              ? "Belum ada master shift."
              : "Tidak ada shift yang cocok dengan pencarian atau filter."
          }
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

      {/* 4. DIALOG COMPONENTS */}
      <ShiftFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editTarget={selectedShift}
        onSubmit={handleFormSubmit}
        isPending={isSaving}
      />

      <ShiftDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetShift={selectedShift}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </div>
  );
}
