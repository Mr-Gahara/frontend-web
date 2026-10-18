"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { TipeAset } from "@/types/tipeAset";
import { useDaftarTipeAset, useHapusTipeAset } from "@/features/tipe-aset/hooks";
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
  AlertTriangle,
  Layers,
  Tags,
} from "lucide-react";

/** Pilihan baris per halaman (DataTable opt-in, keputusan TB11a). */
const PILIHAN_UKURAN = [10, 20, 50] as const;

export default function TipeAsetPage() {
  const router = useRouter();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTipeAset, setSelectedTipeAset] = useState<TipeAset | null>(
    null,
  );

  // --- FETCH DATA TIPE ASET ---
  const { data: tipeAsetList = [], isLoading, isError } = useDaftarTipeAset();

  // --- MUTATION DELETE ---
  const deleteMutation = useHapusTipeAset();

  // --- HANDLERS ---

  // preventDefault menahan dialog tetap terbuka sampai hapus berhasil,
  // sehingga dialog bertahan saat gagal (keputusan Fase 0).
  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedTipeAset) return;
    deleteMutation.mutate(selectedTipeAset.id, {
      onSuccess: () => {
        toast.success("Dihapus", {
          description: "Data Tipe Aset berhasil dihapus.",
        });
        setIsDeleteModalOpen(false);
        setSelectedTipeAset(null);
      },
      onError: (galat) => toast.error("Gagal", { description: pesanError(galat) }),
    });
  };

  // Dimemo agar DataTable tidak kembali ke halaman 1 setiap render ulang.
  const filteredList = useMemo(
    () =>
      tipeAsetList.filter((item) =>
        item.namaTipeAset.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tipeAsetList, searchQuery],
  );

  // Aksi baris di menu titik tiga bergaya K-D (TB7a, TB21a).
  const kolom = useMemo<ColumnDef<TipeAset>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Kategori",
        cell: ({ row }) => <span className="font-bold text-navy">{row.original.namaTipeAset}</span>,
      },
      {
        id: "deskripsi",
        header: "Deskripsi",
        cell: ({ row }) => (
          <p className="font-medium text-navy/70 line-clamp-2 max-w-xs">
            {row.original.deskripsi || <span className="italic opacity-50">Tidak ada deskripsi</span>}
          </p>
        ),
      },
      {
        id: "relasi",
        header: "Relasi Tarif",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-navy/5 text-navy border-none shadow-sm px-2.5 py-1 font-bold"
          >
            <Tags className="w-3 h-3 mr-1.5" />
            {row.original.dataTarif?.length || 0} Tarif Terhubung
          </Badge>
        ),
      },
      {
        id: "aksi",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <MenuEditHapus
            onEdit={() => router.push(`/dashboard/outlet/reservasi/tipeAset/${row.original.id}/edit`)}
            onHapus={() => {
              setSelectedTipeAset(row.original);
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
            <Layers className="w-7 h-7 text-karamel" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Kategori Aset
            </h1>
            <p className="text-sm font-medium text-navy/60">
              Kelompokkan aset Anda berdasarkan tipe untuk mempermudah
              pengaturan tarif.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            router.push("/dashboard/outlet/reservasi/tipeAset/buatTipeAset")
          }
          className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold shadow-sm h-11 px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-karamel" /> Tambah Kategori
        </Button>
      </div>

      {/* FILTER & PENCARIAN: baris tanpa panel; total ada di kaki tabel (TB22a) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center border-b border-navy/10 pb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            placeholder="Cari kategori..."
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
          Gagal memuat data tipe aset.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredList}
          loading={isLoading}
          emptyMessage={
            searchQuery
              ? "Tidak ada tipe aset yang cocok dengan pencarian."
              : "Belum ada master data tipe aset."
          }
          pilihanUkuranKlien={PILIHAN_UKURAN}
        />
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Hapus Tipe Aset?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Tipe <b>{selectedTipeAset?.namaTipeAset}</b> akan dihapus secara
              permanen. Sistem secara otomatis akan melepas (<i>unassign</i>)
              tipe ini dari daftar Tarif yang terhubung. Apakah Anda yakin?
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
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Tipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
