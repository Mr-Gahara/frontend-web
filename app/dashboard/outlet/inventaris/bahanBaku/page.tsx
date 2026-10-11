"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useHapusBahanBaku } from "@/features/bahan-baku/hooks";
import { useDaftarInventory, useLokasiBertipe } from "@/features/inventaris/hooks";
import { pesanError } from "@/lib/api/error";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CheckCircle2,
  MoreHorizontal,
  Package,
} from "lucide-react";

export default function DaftarBahanBakuPage() {
  const router = useRouter();
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBahanId, setSelectedBahanId] = useState<string | null>(null);

  // Halaman ini menampilkan stok bahan baku pada satu lokasi outlet.
  const { lokasiId: outletId, isLoading: isLoadingLokasi } = useLokasiBertipe("Outlet");

  const {
    data: inventoryList = [],
    isLoading: isLoadingInventory,
    isError,
  } = useDaftarInventory(outletId ? { locationID: outletId, search: debouncedSearch } : null);

  // Menghapus bahan baku juga menghapus entri inventorinya di backend;
  // invalidasi keduanya ditangani hook.
  const deleteMutation = useHapusBahanBaku();

  const hapusBahanBaku = (id: string) =>
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Berhasil Dihapus", {
          description: "Data bahan baku telah dihapus dari sistem.",
        });
        setDeleteModalOpen(false);
        setSelectedBahanId(null);
      },
      onError: (err) => {
        // Dialog tetap terbuka agar pengguna dapat mencoba lagi (keputusan Fase 0).
        toast.error("Gagal Menghapus", {
          description: pesanError(err, "Terjadi kesalahan saat menghapus data."),
        });
      },
    });

  // --- HANDLER HAPUS ---
  const handleDeleteClick = (id: string) => {
    setSelectedBahanId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBahanId) hapusBahanBaku(selectedBahanId);
  };

  // --- FILTERING (Client-side fallback) ---
  // Baris tanpa data master tidak dapat diedit atau dihapus, jadi tidak ditampilkan.
  const filteredList = inventoryList.filter(
    (inv) => !!inv.item?.id && (inv.item?.nama || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isLoading = isLoadingLokasi || isLoadingInventory;

  const kolom: ColumnDef<(typeof filteredList)[number]>[] = [
    {
      id: "nama",
      header: "Nama Bahan Baku",
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-navy">{row.original.item?.nama || "Item Tidak Dikenal"}</p>
          <p className="text-xs font-medium text-navy/50 mt-0.5">
            ID: {(row.original.item?.id ?? "").substring(0, 8)}
          </p>
        </div>
      ),
    },
    {
      id: "stok",
      header: "Stok Saat Ini",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-navy bg-navy/5 px-2 py-1 rounded-md">
          {row.original.stok} {row.original.item?.satuan || ""}
        </span>
      ),
    },
    {
      id: "stokMinimum",
      header: "Minimal Stok",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-navy/60">
          {row.original.stokMinimum} {row.original.item?.satuan || ""}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.isStokKritis ? (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none shadow-sm px-2.5 py-1">
            <AlertTriangle className="w-3 h-3 mr-1.5" /> Stok Kritis
          </Badge>
        ) : (
          <Badge className="bg-sage text-gading font-bold border-none shadow-sm px-2.5 py-1">
            <CheckCircle2 className="w-3 h-3 mr-1.5" /> Aman
          </Badge>
        ),
    },
    {
      id: "aksi",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const masterId = row.original.item?.id;
        if (!masterId) return null;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gading border-navy/10">
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-navy/80"
                  onClick={() => router.push(`/dashboard/outlet/inventaris/bahanBaku/${masterId}/edit`)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-navy/10" />
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-red-600/80 focus:text-red-700 focus:bg-red-500/10"
                  onClick={() => handleDeleteClick(masterId)}
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-krem border border-navy/10 rounded-xl shrink-0 shadow-sm">
            <Package className="w-7 h-7 text-karamel" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Bahan Baku
            </h1>
            <p className="text-sm font-medium text-navy/60">
              Kelola persediaan bahan mentah di outlet ini untuk keperluan produksi.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            router.push("/dashboard/outlet/inventaris/bahanBaku/buatBahanBaku")
          }
          className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold shadow-sm h-11 px-6 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-karamel" /> Tambah Bahan Baru
        </Button>
      </div>

      {/* PENCARIAN: dijalankan server lewat useDaftarInventory */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
        <Input
          placeholder="Cari nama bahan baku di outlet ini..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-permukaan border-navy/15 text-navy placeholder:text-navy/40 font-medium h-11 rounded-xl"
        />
      </div>

      {/* TABEL DATA */}
      {isError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-center text-sm font-bold text-rose-600"
        >
          Gagal memuat data inventaris outlet. Silakan muat ulang halaman.
        </p>
      ) : (
        <DataTable
          columns={kolom}
          data={filteredList}
          loading={isLoading}
          emptyMessage={
            searchQuery
              ? "Tidak ada bahan baku yang cocok dengan pencarian."
              : "Belum ada data stok bahan baku di outlet ini."
          }
        />
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Hapus Bahan Baku?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Data master bahan baku yang dihapus tidak dapat dikembalikan dan akan hilang dari seluruh lokasi. Pastikan
              bahan baku ini tidak sedang digunakan pada resep produk manapun.
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
              onClick={(e) => {
                // AlertDialogAction menutup dialog secara bawaan; ditahan sampai hapus berhasil.
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 text-gading hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Data Master"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}