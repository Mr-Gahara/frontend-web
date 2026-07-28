"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { Produk, GetProdukResponse } from "@/types/produk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/data-table";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Plus, Package, Infinity } from "lucide-react"; // <-- Import Infinity Icon

// Helper untuk format Rupiah
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

export default function ProdukPage() {
  // 1. PROTEKSI HALAMAN
  useAuthGuard();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<Produk | null>(null);

  // =========================
  // QUERY PRODUK
  // =========================
  const {
    data: produkList = [],
    isLoading: produkLoading,
    error: produkError,
  } = useQuery({
    queryKey: queryKeys.produk,
    queryFn: async () => {
      const res = await apiClient.get<GetProdukResponse>(
        "/produk",
        undefined,
        "pengguna"
      );
      return res.data || [];
    },
  });

  // =========================
  // ERROR TOAST
  // =========================
  useEffect(() => {
    if (produkError) {
      toast.error("Gagal", {
        description:
          produkError instanceof Error
            ? produkError.message
            : "Gagal memuat data produk.",
      });
    }
  }, [produkError]);

  // =========================
  // MUTATION DELETE
  // =========================
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/produk/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Produk berhasil dihapus.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.produk,
      });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus produk.",
      });
      setDeleteTarget(null);
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = useMemo<ColumnDef<Produk>[]>(
    () => [
      {
        accessorKey: "namaProduk",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Produk
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-[#0A2947]">{row.original.namaProduk}</span>
        ),
      },
      {
        accessorKey: "kategori",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">
            Kategori
          </span>
        ),
        cell: ({ row }) => {
          const catID = row.original.kategoriID;
          const namaKategori =
            typeof catID === "object" && catID !== null
              ? catID.namaKategori
              : row.original.kategori || "-";
          return <span className="font-medium text-[#0A2947]/80 capitalize">{String(namaKategori)}</span>;
        },
      },
      {
        accessorKey: "hargaDasar",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">
            Harga Dasar
          </span>
        ),
        cell: ({ row }) => <span className="font-medium text-[#0A2947]/70 font-mono">{formatRupiah(row.original.hargaDasar)}</span>,
      },
      {
        accessorKey: "hargaJual",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">
            Harga Jual
          </span>
        ),
        cell: ({ row }) => <span className="font-bold text-[#718355] font-mono">{formatRupiah(row.original.hargaJual)}</span>,
      },
      {
        accessorKey: "stok",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">
            Stok
          </span>
        ),
        cell: ({ row }) => {
          const stok = row.original.stok;
          const isUnlimited = row.original.isUnlimitedStok;
          const isHabis = stok <= 0;

          // --- LOGIKA BARU UNTUK UNLIMITED STOK ---
          if (isUnlimited) {
            return (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#D4A373]/10 px-2 py-0.5 text-xs font-bold text-[#D4A373] shadow-sm border border-[#D4A373]/20">
                <Infinity className="w-3.5 h-3.5" /> Unlimited
              </span>
            );
          }

          // Render Normal
          return (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold shadow-sm ${
                isHabis
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-[#0A2947]/5 text-[#0A2947] border border-[#0A2947]/10"
              }`}
            >
              {stok} item
            </span>
          );
        },
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FFFAF3] border-[#0A2947]/10 min-w-37.5">
                <DropdownMenuItem
                  className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
                  onClick={() =>
                    router.push(`/dashboard/inventaris/produk/${row.original._id}/edit`)
                  }
                >
                  Edit Produk
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  Hapus Produk
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [router] 
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shrink-0 shadow-sm">
            <Package className="w-6 h-6 text-[#D4A373]" /> 
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Data Produk</h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelola daftar produk, harga, dan stok toko Anda.
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/dashboard/inventaris/produk/buatProduk")}
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm w-full sm:w-auto font-bold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Tabel Wrapper (Card Cream Gelap) */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4 w-full">
        <DataTable
          columns={columns}
          data={produkList}
          loading={produkLoading}
          emptyMessage="Belum ada produk. Silakan tambah produk baru."
          searchKey="namaProduk"
          searchPlaceholder="Cari nama produk..."
        />
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Hapus produk {deleteTarget?.namaProduk}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini akan menghapus produk secara permanen dari sistem. 
              Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel 
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
              disabled={deleteMutation.isPending}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}