"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Trash2,
  CalendarRange,
  Loader2,
  RefreshCw,
} from "lucide-react";

import type { PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";
import { PolaFormDialog } from "./form-pola-roster";
import { PolaDeleteDialog } from "./dialog-hapus-pola-roster";
import { labelShiftPola, teksLabelShift } from "./payload";
import { polaTerpisahPerRuang, type RuangPolaRoster } from "./ruang";

interface PolaUtamaProps {
  tipeRuang: RuangPolaRoster;
  dataPola: PolaRosterItem[];
  shiftList: ShiftItem[];
  isLoading: boolean;
  isError: boolean;
  onSave: (data: PolaRosterRequest, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function PolaUtama({
  tipeRuang,
  dataPola,
  shiftList,
  isLoading,
  isError,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: PolaUtamaProps) {
  // --- STATE LOKAL ---
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPola, setSelectedPola] = useState<PolaRosterItem | null>(null);

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return dataPola.filter((pola) =>
      pola.namaPola.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [dataPola, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[95vw] mx-auto">
      {/* 1. HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Pola Roster {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-sm text-navy/60 font-medium">
            Kelola template siklus kerja untuk auto-generate jadwal.
          </p>
          {!polaTerpisahPerRuang() && (
            <p className="text-xs text-navy/50 font-semibold">
              Daftar pola roster masih dipakai bersama ruang outlet dan gudang
              sampai backend mendukung pola roster per lokasi.
            </p>
          )}
        </div>

        <Button
          onClick={() => {
            setSelectedPola(null);
            setFormOpen(true);
          }}
          className="h-11 bg-navy text-gading hover:bg-navy/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Pola Roster
        </Button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-krem p-4 rounded-2xl border border-navy/10 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pola..."
            aria-label="Cari nama pola"
            className="pl-9 h-11 bg-gading border-navy/15 text-navy focus-visible:ring-navy/50 rounded-xl font-medium"
          />
        </div>
      </div>

      {/* 3. TABEL DATA */}
      <div className="rounded-2xl border border-navy/10 bg-gading shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8F3EB] border-b border-navy/10">
              <tr>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[20%]">
                  Nama Pola
                </th>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[15%]">
                  Siklus
                </th>
                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[55%]">
                  Preview Pola
                </th>

                <th className="p-4 font-bold text-navy/70 uppercase tracking-wider text-xs w-[10%] text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-navy/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center align-middle">
                    <div className="flex flex-col items-center justify-center text-navy/50">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <span className="text-sm font-bold">
                        Memuat Data Pola Roster...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={4}
                    role="alert"
                    className="h-32 text-center align-middle text-red-600 text-sm font-bold"
                  >
                    Gagal memuat data pola roster atau master shift. Muat ulang halaman untuk mencoba lagi.
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-32 text-center align-middle text-navy/50 text-sm font-bold"
                  >
                    {dataPola.length === 0
                      ? "Belum ada pola roster."
                      : "Tidak ada pola roster yang cocok dengan pencarian."}
                  </td>
                </tr>
              ) : (
                filteredData.map((pola) => (
                  <tr
                    key={pola.id}
                    className="hover:bg-navy/2 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
                          <CalendarRange className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-navy text-base">
                          {pola.namaPola}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-navy/50" />
                        <span className="font-bold text-navy/80 font-mono text-sm">
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
                                  : "bg-gading text-navy border-navy/20"
                              }
                            `}
                          >
                            {detail.isLibur
                              ? "OFF"
                              : teksLabelShift(labelShiftPola(detail, shiftList))}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 text-right">
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
                        <DropdownMenuContent
                          align="end"
                          className="w-44 bg-gading border-navy/10 rounded-xl shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPola(pola);
                              setFormOpen(true);
                            }}
                            className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Pola
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-navy/5" />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPola(pola);
                              setDeleteOpen(true);
                            }}
                            className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Pola
                          </DropdownMenuItem>
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
        shiftList={shiftList}
        onSubmit={async (data) => {
          try {
            // [PERBAIKAN] Gunakan await agar dialog menunggu API selesai
            await onSave(data, selectedPola?.id);
            setFormOpen(false); // Hanya tertutup jika API sukses
          } catch {
            // Jika API gagal (misal 500 error), dialog tetap terbuka
          }
        }}
        isPending={isSaving}
      />

      <PolaDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetPola={selectedPola}
        onConfirm={async () => {
          try {
            // [PERBAIKAN] Gunakan await
            await onDelete(selectedPola?.id ?? "");
            setDeleteOpen(false); // Hanya tertutup jika API sukses
          } catch {
            // Jika API gagal, dialog tetap terbuka
          }
        }}
        isPending={isDeleting}
      />
    </div>
  );
}
