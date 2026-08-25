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
  CalendarRange,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";
import { MasterShiftItem } from "@/types/jadwal";
import { PolaFormDialog } from "./pola-form-dialog";
import { PolaDeleteDialog } from "./pola-delete-dialog";

interface PolaUtamaProps {
  tipeRuang: "outlet" | "gudang";
  dataPola: PolaRosterItem[];
  masterShiftList: MasterShiftItem[];
  isLoading: boolean;
  onSave: (data: PolaRosterRequest, id?: string) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function PolaUtama({
  tipeRuang,
  dataPola,
  masterShiftList,
  isLoading,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: PolaUtamaProps) {
  // --- STATE LOKAL ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "Semua" | "Aktif" | "Non-Aktif"
  >("Semua");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPola, setSelectedPola] = useState<PolaRosterItem | null>(null);

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return dataPola.filter((pola) => {
      const matchSearch = pola.namaPola
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchStatus =
        filterStatus === "Semua" || pola.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [dataPola, searchQuery, filterStatus]);

  // --- HELPER: GET NAMA SHIFT ---
  const getShiftLabel = (shiftID: string) => {
    const shift = masterShiftList.find((s) => s.id === shiftID);
    return shift ? shift.nama : "Tidak Diketahui";
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[95vw] mx-auto">
      {/* 1. HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#041E3F]">
            Pola Roster {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-sm text-[#041E3F]/60 font-medium">
            Kelola template siklus kerja untuk auto-generate jadwal.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedPola(null);
            setFormOpen(true);
          }}
          className="h-11 bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Pola Roster
        </Button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F2EAE1] p-4 rounded-2xl border border-[#041E3F]/10 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#041E3F]/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pola..."
            className="pl-9 h-11 bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] focus-visible:ring-[#041E3F]/50 rounded-xl font-medium"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={filterStatus}
            onValueChange={(val: any) => setFilterStatus(val)}
          >
            <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-bold h-11 rounded-xl px-4">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
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
      <div className="rounded-2xl border border-[#041E3F]/10 bg-[#FFFAF3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8F3EB] border-b border-[#041E3F]/10">
              <tr>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[20%]">
                  Nama Pola
                </th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[15%]">
                  Siklus
                </th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[40%]">
                  Preview Pola
                </th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[15%] text-center">
                  Status
                </th>
                <th className="p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-xs w-[10%] text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#041E3F]/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center align-middle">
                    <div className="flex flex-col items-center justify-center text-[#041E3F]/50">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <span className="text-sm font-bold">
                        Memuat Data Pola Roster...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="h-32 text-center align-middle text-[#041E3F]/50 text-sm font-bold"
                  >
                    Tidak ada pola roster yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((pola) => (
                  <tr
                    key={pola.id || pola._id}
                    className="hover:bg-[#041E3F]/2 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#041E3F]/5 text-[#041E3F]">
                          <CalendarRange className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-[#041E3F] text-base">
                          {pola.namaPola}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-[#041E3F]/50" />
                        <span className="font-bold text-[#041E3F]/80 font-mono text-sm">
                          {pola.siklusHari} Hari
                        </span>
                      </div>
                    </td>

                    {/* VISUALISASI PREVIEW SIKLUS */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {pola.detailSiklus.map((detail, idx) => (
                          <div
                            key={idx}
                            title={`Hari ke-${detail.hariKe}`}
                            className={`flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold shadow-sm border
                              ${
                                detail.isLibur
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-[#FFFAF3] text-[#041E3F] border-[#041E3F]/20"
                              }
                            `}
                          >
                            {detail.isLibur
                              ? "OFF"
                              : getShiftLabel(detail.shiftID || "")}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                          pola.status === "Aktif"
                            ? "bg-[#718355] text-[#FFFAF3]"
                            : "bg-[#041E3F]/10 text-[#041E3F]/60"
                        }`}
                      >
                        {pola.status || "Aktif"}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#041E3F]/50 hover:text-[#041E3F] hover:bg-[#041E3F]/10 cursor-pointer"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 bg-[#FFFAF3] border-[#041E3F]/10 rounded-xl shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPola(pola);
                              setFormOpen(true);
                            }}
                            className="cursor-pointer font-bold text-[#041E3F] hover:bg-[#041E3F]/5 rounded-lg m-1"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Pola
                          </DropdownMenuItem>

                          {(pola.status === "Aktif" || !pola.status) && (
                            <>
                              <DropdownMenuSeparator className="bg-[#041E3F]/5" />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPola(pola);
                                  setDeleteOpen(true);
                                }}
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

      {/* 4. DIALOGS */}
      <PolaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editTarget={selectedPola}
        masterShiftList={masterShiftList}
        onSubmit={(data) => onSave(data, selectedPola?.id || selectedPola?._id)}
        isPending={isSaving}
      />

      <PolaDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetPola={selectedPola}
        onConfirm={() => onDelete(selectedPola?.id || selectedPola?._id || "")}
        isPending={isDeleting}
      />
    </div>
  );
}
