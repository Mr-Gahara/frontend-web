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
  Loader2,
} from "lucide-react";

// Import tipe data dan komponen anak
import type { ShiftItem } from "@/types/shift";
import { ShiftFormDialog } from "./form-shift";
import { ShiftDeleteDialog } from "./dialog-nonaktif-shift";
import { shiftTerpisahPerRuang, type RuangShift } from "./ruang";
import type { NilaiFormShift } from "./schema";

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

  const handleOpenEdit = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setFormOpen(true);
  };

  const handleOpenDelete = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setDeleteOpen(true);
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

        <Button
          onClick={handleOpenCreate}
          className="h-11 bg-navy text-gading hover:bg-navy/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Master Shift
        </Button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-krem p-4 rounded-2xl border border-navy/10 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama shift..."
            aria-label="Cari nama shift"
            className="pl-9 h-11 bg-gading border-navy/15 text-navy focus-visible:ring-navy/50 rounded-xl font-medium"
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
              className="w-full bg-gading text-navy text-sm border-navy/15 focus:ring-navy/50 font-bold h-11 rounded-xl px-4"
            >
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-krem border-navy/10 text-navy font-medium rounded-xl">
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

      {/* 3. TABEL DATA */}
      <div className="rounded-2xl border border-navy/10 bg-gading shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            {/* Table Header */}
            <thead className="bg-[#F8F3EB] border-b border-navy/10">
              <tr>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[30%]">
                  Nama Shift
                </th>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[25%]">
                  Jam Kerja
                </th>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[20%]">
                  Toleransi
                </th>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[15%] text-center">
                  Status
                </th>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[10%] text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-navy/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center align-middle">
                    <div className="flex flex-col items-center justify-center text-navy/50">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <span className="text-sm font-bold">
                        Memuat Data Shift...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={5}
                    role="alert"
                    className="h-32 text-center align-middle text-red-600 text-sm font-bold"
                  >
                    Gagal memuat data shift. Muat ulang halaman untuk mencoba lagi.
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-32 text-center align-middle text-navy/50 text-sm font-bold"
                  >
                    {dataShift.length === 0
                      ? "Belum ada master shift."
                      : "Tidak ada shift yang cocok dengan pencarian atau filter."}
                  </td>
                </tr>
              ) : (
                filteredData.map((shift) => (
                  <tr
                    key={shift.id}
                    className="hover:bg-navy/2 transition-colors group"
                  >
                    {/* Kolom Nama */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-navy text-base">
                          {shift.namaShift}
                        </span>
                      </div>
                    </td>

                    {/* Kolom Jam Kerja */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy/80 font-mono tracking-tight text-sm">
                          {shift.jamMasuk} - {shift.jamPulang}
                        </span>
                        {shift.isLintasHari && (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <MoonStar className="h-3 w-3" /> Lintas Hari
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Kolom Toleransi */}
                    <td className="p-4">
                      <span className="font-semibold text-navy/60">
                        {shift.toleransiTerlambat > 0 ? (
                          <span className="text-navy font-bold">
                            {shift.toleransiTerlambat} Menit
                          </span>
                        ) : (
                          "Tepat Waktu (0 Menit)"
                        )}
                      </span>
                    </td>

                    {/* Kolom Status */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                          shift.status === "Aktif"
                            ? "bg-sage text-gading" // Sage Green
                            : "bg-navy/10 text-navy/60" // Abu-abu
                        }`}
                      >
                        {shift.status}
                      </span>
                    </td>

                    {/* Kolom Aksi */}
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Buka menu" /* [PERBAIKAN] Tambahkan ini agar bisa dibaca Playwright & Screen Reader */
                            className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 bg-gading border-navy/10 rounded-xl shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(shift)}
                            className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Shift
                          </DropdownMenuItem>

                          {/* Hanya tampilkan opsi hapus/non-aktif jika statusnya masih Aktif */}
                          {shift.status === "Aktif" && (
                            <>
                              <DropdownMenuSeparator className="bg-navy/5" />
                              <DropdownMenuItem
                                onClick={() => handleOpenDelete(shift)}
                                className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
                              >
                                <ArchiveX className="mr-2 h-4 w-4" />{" "}
                                Non-Aktifkan
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
