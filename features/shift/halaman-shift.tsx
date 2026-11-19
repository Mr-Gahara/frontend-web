"use client";

import React, { useState, useMemo } from "react";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
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
import type { RuangShift } from "./ruang";
import { useSession } from "@/lib/auth/useSession";
import type { NilaiFormShift } from "./schema";
import type { JamOperasional } from "@/types/tenant";
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
  /** Jam buka toko untuk peringatan form shift (JO1a); hanya ruang outlet. */
  jamOperasional?: JamOperasional | null;
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
  jamOperasional,
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
  const panel = usePanelFilter<"Semua" | "Aktif" | "Non-Aktif">({ terapan: filterStatus, bawaan: "Semua", onTerapkan: setFilterStatus });
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
            <span className="font-bold text-navy text-besar">{row.original.namaShift}</span>
          </div>
        ),
      },
      {
        id: "jam",
        header: "Jam Kerja",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy/80 font-mono tracking-tight text-isi">
              {row.original.jamMasuk} - {row.original.jamPulang}
            </span>
            {row.original.isLintasHari && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-mikro font-bold px-2 py-0.5 rounded-md">
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
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-kecil font-bold shadow-sm ${
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight text-navy">
            Master Shift {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-isi text-navy/60 font-medium">
            Kelola jam operasional, toleransi keterlambatan, dan status shift.
          </p>
        </div>

        {aksi.buat && (
          <Button
            onClick={handleOpenCreate}
            size="aksi"
            className="w-full sm:w-auto bg-navy text-gading hover:bg-navy/90 shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Tambah Master Shift
          </Button>
        )}
      </div>

      {/* 2. FILTER & SEARCH (FL1a): cari di bilah, status di panel */}
      <BilahFilter
        cari={{
          id: `cari-shift-${tipeRuang}`,
          label: "Cari nama shift",
          placeholder: "Cari nama shift...",
          value: searchQuery,
          onChange: setSearchQuery,
        }}
        jumlahAktif={filterStatus === "Semua" ? 0 : 1}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={
          filterStatus === "Semua"
            ? []
            : [{ kunci: "status", label: `Status: ${filterStatus}`, onHapus: () => setFilterStatus("Semua") }]
        }
        onAturUlangSemua={() => setFilterStatus("Semua")}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={panel.draf === "Semua" ? 0 : 1}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Status">
          <PilihanSegmen
            label="Status"
            nilai={panel.draf === "Semua" ? undefined : panel.draf}
            opsi={[
              { nilai: "Aktif", label: "Aktif" },
              { nilai: "Non-Aktif", label: "Non-Aktif" },
            ]}
            onUbah={(status) => panel.setDraf(status ?? "Semua")}
          />
        </KelompokFilter>
      </PanelFilter>

      {/* 3. TABEL DATA: DataTable, kartu per baris (TB1a sampai TB7a); galat menggantikan tabel (TB15a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-isi font-bold text-rose-600"
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
        jamOperasional={jamOperasional}
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
