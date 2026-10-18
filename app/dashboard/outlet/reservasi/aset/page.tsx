"use client";

import { namaTipeAset } from "@/features/aset/tampilan";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { Aset, StatusAset } from "@/types/aset";
import { useDaftarAset, useHapusAset } from "@/features/aset/hooks";
import { pesanError } from "@/lib/api/error";
import { toast } from "sonner";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import MenuEditHapus from "@/components/menu-edit-hapus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Box,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  PlayCircle,
} from "lucide-react";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

function lencanaStatus(status: StatusAset) {
  switch (status) {
    case "tersedia":
      return (
        <Badge className="bg-sage text-gading font-bold border-none shadow-sm px-2.5 py-1">
          <CheckCircle2 className="w-3 h-3 mr-1.5" /> Tersedia
        </Badge>
      );
    case "digunakan":
      return (
        <Badge className="bg-navy text-gading/91 font-bold border-none shadow-sm px-2.5 py-1">
          <PlayCircle className="w-3 h-3 mr-1.5" /> Digunakan (Booking)
        </Badge>
      );
    case "perbaikan":
      return (
        <Badge className="bg-[#af8861] text-gading font-bold border-none shadow-sm px-2.5 py-1">
          <Wrench className="w-3 h-3 mr-1.5" /> Perbaikan
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="px-2.5 py-1">
          {status}
        </Badge>
      );
  }
}

export default function AsetPage() {
  const router = useRouter();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAset, setSelectedAset] = useState<Aset | null>(null);

  // --- FETCH DATA ASET ---
  const { data: asetList = [], isLoading, isError } = useDaftarAset();

  // --- MUTATION DELETE ---
  const deleteMutation = useHapusAset();

  // --- HANDLERS ---

  // preventDefault menahan dialog tetap terbuka sampai hapus berhasil,
  // sehingga dialog bertahan saat gagal (keputusan Fase 0).
  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedAset) return;
    deleteMutation.mutate(selectedAset.id, {
      onSuccess: () => {
        toast.success("Dihapus", { description: "Data aset berhasil dihapus." });
        setIsDeleteModalOpen(false);
        setSelectedAset(null);
      },
      onError: (galat) => toast.error("Gagal", { description: pesanError(galat) }),
    });
  };

  // --- DAFTAR DAN KOLOM ---

  // Dimemo agar DataTable tidak kembali ke halaman 1 setiap render ulang.
  const filteredList = useMemo(() => {
    const daftar = Array.isArray(asetList) ? asetList : [];
    return daftar.filter((item) =>
      item?.namaAset?.toLowerCase().includes((searchQuery || "").toLowerCase()),
    );
  }, [asetList, searchQuery]);

  // Aksi baris di menu titik tiga bergaya K-D (TB7a, TB21a); baris ID
  // dibuang seperti di inventaris gudang (TB17a).
  const kolom = useMemo<ColumnDef<Aset>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Aset",
        cell: ({ row }) => <span className="font-bold text-navy">{row.original.namaAset}</span>,
      },
      {
        id: "tipe",
        header: "Kategori / Tipe",
        cell: ({ row }) => (
          <span className="font-bold text-navy/80 bg-navy/5 px-2.5 py-1 rounded-md text-xs">
            {namaTipeAset(row.original)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => lencanaStatus(row.original.status),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <MenuEditHapus
            onEdit={() => router.push(`/dashboard/outlet/reservasi/aset/${row.original.id}/edit`)}
            onHapus={() => {
              setSelectedAset(row.original);
              setIsDeleteModalOpen(true);
            }}
          />
        ),
      },
    ],
    [router],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-krem border border-navy/10 rounded-xl shrink-0 shadow-sm">
            <Box className="w-7 h-7 text-karamel" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Manajemen Aset
            </h1>
            <p className="text-sm font-medium text-navy/60">
              Kelola meja, lapangan, ruangan, atau fasilitas yang dapat disewa.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            router.push("/dashboard/outlet/reservasi/aset/buatAset")
          }
          className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold shadow-sm h-11 px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-karamel" /> Tambah Aset Baru
        </Button>
      </div>

      {/* FILTER & PENCARIAN: baris tanpa panel; total ada di kaki tabel (TB22a) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center border-b border-navy/10 pb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            placeholder="Cari nama aset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-permukaan border-navy/20 text-navy placeholder:text-navy/40 font-medium h-11"
          />
        </div>
      </div>

      {/* TABEL DATA: DataTable (TB1a sampai TB7a); galat menggantikan tabel (TB15a) */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat data aset.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredList}
          loading={isLoading}
          emptyMessage={
            searchQuery ? "Tidak ada aset yang cocok dengan pencarian." : "Belum ada master data aset."
          }
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Hapus Data Aset?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Aset <b>{selectedAset?.namaAset}</b> akan dihapus secara permanen.
              Pastikan aset ini tidak sedang terhubung dengan riwayat transaksi
              yang penting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="border-navy/20 text-navy hover:bg-navy/5 font-bold cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 text-gading hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Aset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
