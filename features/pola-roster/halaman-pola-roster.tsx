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
  RefreshCw,
} from "lucide-react";

import type { PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";
import { PolaFormDialog } from "./form-pola-roster";
import { PolaDeleteDialog } from "./dialog-hapus-pola-roster";
import { labelShiftPola, teksLabelShift } from "./payload";
import { aksiPolaRoster } from "./izin";
import type { RuangPolaRoster } from "./ruang";
import { useSession } from "@/lib/auth/useSession";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

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
  const { permissions } = useSession();
  const aksi = aksiPolaRoster(permissions);
  const { ubah: bolehUbah, hapus: bolehHapus } = aksi;

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

  // Menu titik tiga yang sudah ada dipertahankan di kolom aksi (TB7a, TB19a).
  const kolom = useMemo<ColumnDef<PolaRosterItem>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Pola",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <CalendarRange className="h-4 w-4" />
            </div>
            <span className="font-bold text-navy text-base">{row.original.namaPola}</span>
          </div>
        ),
      },
      {
        id: "siklus",
        header: "Siklus",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-navy/50" />
            <span className="font-bold text-navy/80 font-mono text-sm">{row.original.siklusHari} Hari</span>
          </div>
        ),
      },
      {
        id: "preview",
        header: "Preview Pola",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5 max-w-sm">
            {row.original.detailSiklus.map((detail, idx) => (
              <div
                key={idx}
                title={`Hari ke-${detail.hariKe}`}
                className={`flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold shadow-sm border ${
                  detail.isLibur ? "bg-red-50 text-red-600 border-red-200" : "bg-gading text-navy border-navy/20"
                }`}
              >
                {detail.isLibur ? "OFF" : teksLabelShift(labelShiftPola(detail, shiftList))}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) =>
          !bolehUbah && !bolehHapus ? null : (
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
                <DropdownMenuContent align="end" className="w-44 bg-gading border-navy/10 rounded-xl shadow-lg">
                  {bolehUbah && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPola(row.original);
                        setFormOpen(true);
                      }}
                      className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit Pola
                    </DropdownMenuItem>
                  )}
                  {bolehUbah && bolehHapus && <DropdownMenuSeparator className="bg-navy/5" />}
                  {bolehHapus && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPola(row.original);
                        setDeleteOpen(true);
                      }}
                      className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Hapus Pola
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
      },
    ],
    [shiftList, bolehUbah, bolehHapus],
  );

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
        </div>

        {aksi.buat && (
          <Button
            onClick={() => {
              setSelectedPola(null);
              setFormOpen(true);
            }}
            className="h-11 bg-navy text-gading hover:bg-navy/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" /> Buat Pola Roster
          </Button>
        )}
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-navy/10 pb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pola..."
            aria-label="Cari nama pola"
            className="pl-9 h-11 bg-permukaan border-navy/15 text-navy focus-visible:ring-navy/50 rounded-xl font-medium"
          />
        </div>
      </div>

      {/* 3. TABEL DATA: DataTable, kartu per baris (TB1a sampai TB7a); galat menggantikan tabel (TB15a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat data pola roster atau master shift. Muat ulang halaman untuk mencoba lagi.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredData}
          loading={isLoading}
          emptyMessage={
            dataPola.length === 0
              ? "Belum ada pola roster."
              : "Tidak ada pola roster yang cocok dengan pencarian."
          }
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

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
