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
import { Search, Plus, MoreHorizontal, Edit, ArchiveX, Clock, MoonStar, Loader2 } from "lucide-react";

// Import tipe data dan komponen anak
import { ShiftItem, ShiftRequest } from "@/types/shift";
import { ShiftFormDialog } from "./shift-form-dialog";
import { ShiftDeleteDialog } from "./shift-delete-dialog";

interface ShiftUtamaProps {
  tipeRuang: "outlet" | "gudang";
  dataShift: ShiftItem[];
  isLoading: boolean;
  onSave: (data: ShiftRequest, id?: string) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function ShiftUtama({
  tipeRuang,
  dataShift,
  isLoading,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: ShiftUtamaProps) {
  // --- STATE LOKAL ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Aktif" | "Non-Aktif">("Semua");

  // State Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftItem | null>(null);

  // --- FILTERING DATA ---
  const filteredData = useMemo(() => {
    return dataShift.filter((shift) => {
      // Filter Nama
      const matchSearch = shift.namaShift.toLowerCase().includes(searchQuery.toLowerCase());
      // Filter Status
      const matchStatus = filterStatus === "Semua" || shift.status === filterStatus;
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

  const handleFormSubmit = (data: ShiftRequest) => {
    // Jika ada selectedShift, berarti Edit (kirim ID). Jika tidak, berarti Create Baru.
    onSave(data, selectedShift?.id || selectedShift?._id);
  };

  const handleDeleteConfirm = () => {
    if (selectedShift) {
      onDelete(selectedShift.id || selectedShift._id!);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[95vw] mx-auto">
      
      {/* 1. HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#041E3F]">
            Master Shift {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-sm text-[#041E3F]/60 font-medium">
            Kelola jam operasional, toleransi keterlambatan, dan status shift.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="h-11 bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Master Shift
        </Button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F2EAE1] p-4 rounded-2xl border border-[#041E3F]/10 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#041E3F]/40" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama shift..." 
            className="pl-9 h-11 bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] focus-visible:ring-[#041E3F]/50 rounded-xl font-medium"
          />
        </div>

        {/* Filter Status */}
        <div className="w-full sm:w-48">
          <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
            <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-bold h-11 rounded-xl px-4">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
              <SelectItem value="Semua" className="cursor-pointer font-bold">Semua Status</SelectItem>
              <SelectItem value="Aktif" className="cursor-pointer font-bold">Aktif</SelectItem>
              <SelectItem value="Non-Aktif" className="cursor-pointer font-bold text-red-600 focus:text-red-700">Non-Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. TABEL DATA */}
      <div className="rounded-2xl border border-[#041E3F]/10 bg-[#FFFAF3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            {/* Table Header */}
            <thead className="bg-[#F8F3EB] border-b border-[#041E3F]/10">
              <tr>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[30%]">Nama Shift</th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[25%]">Jam Kerja</th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[20%]">Toleransi</th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[15%] text-center">Status</th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[10%] text-right">Aksi</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-[#041E3F]/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center align-middle">
                    <div className="flex flex-col items-center justify-center text-[#041E3F]/50">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <span className="text-sm font-bold">Memuat Data Shift...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center align-middle text-[#041E3F]/50 text-sm font-bold">
                    Tidak ada data shift yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((shift) => (
                  <tr key={shift.id || shift._id} className="hover:bg-[#041E3F]/2 transition-colors group">
                    
                    {/* Kolom Nama */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#041E3F]/5 text-[#041E3F]">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-[#041E3F] text-base">{shift.namaShift}</span>
                      </div>
                    </td>

                    {/* Kolom Jam Kerja */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#041E3F]/80 font-mono tracking-tight text-sm">
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
                      <span className="font-semibold text-[#041E3F]/60">
                        {shift.toleransiTerlambat > 0 ? (
                          <span className="text-[#041E3F] font-bold">{shift.toleransiTerlambat} Menit</span>
                        ) : (
                          "Tepat Waktu (0 Menit)"
                        )}
                      </span>
                    </td>

                    {/* Kolom Status */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                        shift.status === "Aktif" 
                          ? "bg-[#718355] text-[#FFFAF3]" // Sage Green
                          : "bg-[#041E3F]/10 text-[#041E3F]/60" // Abu-abu
                      }`}>
                        {shift.status}
                      </span>
                    </td>

                    {/* Kolom Aksi */}
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#041E3F]/50 hover:text-[#041E3F] hover:bg-[#041E3F]/10 cursor-pointer">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[#FFFAF3] border-[#041E3F]/10 rounded-xl shadow-lg">
                          <DropdownMenuItem onClick={() => handleOpenEdit(shift)} className="cursor-pointer font-bold text-[#041E3F] hover:bg-[#041E3F]/5 rounded-lg m-1">
                            <Edit className="mr-2 h-4 w-4" /> Edit Shift
                          </DropdownMenuItem>
                          
                          {/* Hanya tampilkan opsi hapus/non-aktif jika statusnya masih Aktif */}
                          {shift.status === "Aktif" && (
                            <>
                              <DropdownMenuSeparator className="bg-[#041E3F]/5" />
                              <DropdownMenuItem onClick={() => handleOpenDelete(shift)} className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1">
                                <ArchiveX className="mr-2 h-4 w-4" /> Non-Aktifkan
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