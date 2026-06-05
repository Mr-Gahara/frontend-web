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
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";

// Helper untuk format Rupiah
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function ProdukPage() {
  // 1. PROTEKSI HALAMAN (SECURITY FIX)
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
      return res.data;
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
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  // =========================
  // TABLE COLUMNS (PERFORMANCE FIX: Dibungkus dengan useMemo)
  // =========================
  const columns = useMemo<ColumnDef<Produk>[]>(
    () => [
      {
        accessorKey: "namaProduk",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Produk
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.namaProduk}</span>
        ),
      },
      {
        accessorKey: "kategori",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Kategori
          </span>
        ),
        cell: ({ row }) => {
          const catID = row.original.kategoriID;
          // Handle populated kategoriID atau fallback ke string kategori
          const namaKategori =
            typeof catID === "object" && catID !== null
              ? catID.namaKategori
              : row.original.kategori || "-";
          return <span>{String(namaKategori)}</span>;
        },
      },
      {
        accessorKey: "hargaDasar",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Harga Dasar
          </span>
        ),
        cell: ({ row }) => <span>{formatRupiah(row.original.hargaDasar)}</span>,
      },
      {
        accessorKey: "hargaJual",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Harga Jual
          </span>
        ),
        cell: ({ row }) => <span>{formatRupiah(row.original.hargaJual)}</span>,
      },
      {
        accessorKey: "stok",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Stok
          </span>
        ),
        cell: ({ row }) => <span>{row.original.stok}</span>,
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/produk/${row.original._id}/edit`)
                  }
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 focus:text-red-500"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [router] // Dependency array: fungsi dan state yang dipanggil di dalam kolom
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Data Produk</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar produk, harga, dan stok toko Anda.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/produk/buatProduk")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Tabel */}
      <div className="w-full">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus produk {deleteTarget?.namaProduk}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus produk secara permanen dari sistem. 
              Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}