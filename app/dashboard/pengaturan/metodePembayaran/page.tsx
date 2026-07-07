"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Wallet,
  MoreHorizontal,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

import { Button } from "@/components/ui/button";
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

// --- TYPES ---
type AkunKasRef = {
  _id: string;
  namaAkun: string;
  nomorAkun: string;
};

type MetodePembayaran = {
  _id: string;
  namaPembayaran: string;
  kategori: "tunai" | "non-tunai";
  isAutomated: boolean;
  isActive: boolean;
  xenditChannelCode?: string | null;
  akunKasID: AkunKasRef;
};

type GetMetodePembayaranResponse = MetodePembayaran[];

export default function MetodePembayaranListPage() {
  useAuthGuard();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<MetodePembayaran | null>(
    null,
  );

  // --- FETCH DATA ---
  const {
    data = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.metodePembayaran || ["metode-pembayaran"],
    // 1. Kunci return type secara eksplisit
    queryFn: async (): Promise<MetodePembayaran[]> => {
      try {
        // 2. Gunakan Union Type untuk mengakomodasi wrapper object
        const res = await apiClient.get<
          { data: MetodePembayaran[] } | MetodePembayaran[]
        >("/metodepembayaran", undefined, "pengguna");

        // 3. Ekstraksi data yang aman
        if (Array.isArray(res)) return res;
        if (res && "data" in res && Array.isArray(res.data)) return res.data;

        return [];
      } catch (err: any) {
        // Mencegat error jika data kosong / tidak ditemukan (404) agar tidak memicu toast merah
        const isNotFound =
          err?.response?.status === 404 ||
          err?.status === 404 ||
          String(err).toLowerCase().includes("not found");

        if (isNotFound) {
          return []; // Kembalikan array kosong dengan tenang
        }

        // Lempar error murni jika memang masalah server (500) atau jaringan terputus
        throw err;
      }
    },
  });

  // Toast hanya akan muncul jika terjadi error krusial (seperti 500 Internal Server Error)
  useEffect(() => {
    if (error) {
      toast.error("Gangguan Sistem", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat metode pembayaran.",
      });
    }
  }, [error]);

  // --- MUTATION: DELETE ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(
        `/metodepembayaran/${id}`,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      // ... sisa kode Anda tetap sama
      toast.success("Berhasil", {
        description: "Metode pembayaran telah dihapus dari sistem.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.metodePembayaran || ["metode-pembayaran"],
      });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Menghapus", {
        description: err.message || "Gagal menghapus metode pembayaran.",
      });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Tarik ID secara aman, mengantisipasi virtualisasi Mongoose
    const targetId = deleteTarget._id || (deleteTarget as any).id;

    if (!targetId) {
      toast.error("Validasi Gagal", {
        description: "ID tidak ditemukan pada data ini.",
      });
      console.warn(
        "[Inspeksi Butler]: Data tidak memiliki _id atau id:",
        deleteTarget,
      );
      return;
    }

    await deleteMutation.mutateAsync(targetId);
  };

  // --- TABEL COLUMNS ---
  const columns = useMemo<ColumnDef<MetodePembayaran>[]>(
    () => [
      {
        accessorKey: "namaPembayaran",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Pembayaran
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const metode = row.original;
          const isDefault =
            metode.kategori === "tunai" &&
            metode.namaPembayaran.toLowerCase() === "tunai";

          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">{metode.namaPembayaran}</span>
              {isDefault && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] px-1.5 py-0"
                >
                  Default
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "kategori",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Kategori
          </span>
        ),
        cell: ({ row }) => {
          const isTunai = row.getValue("kategori") === "tunai";
          return (
            <span className="text-sm capitalize text-muted-foreground">
              {isTunai ? "Tunai" : "Non Tunai"}
            </span>
          );
        },
      },
      {
        accessorKey: "akunKasID",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Akun Tujuan
          </span>
        ),
        cell: ({ row }) => {
          const akun = row.original.akunKasID;
          if (!akun)
            return <span className="text-xs text-muted-foreground">-</span>;

          return (
            <div className="flex flex-col">
              <span className="font-medium">{akun.namaAkun}</span>
              <span className="text-xs text-muted-foreground">
                {akun.nomorAkun}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "isAutomated",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Sistem
          </span>
        ),
        cell: ({ row }) => {
          const isAuto = row.getValue("isAutomated");
          return isAuto ? (
            <span className="inline-flex items-center text-blue-600 text-xs font-medium">
              <AlertCircle className="w-3 h-3 mr-1" /> Automated
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">Manual</span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Status
          </span>
        ),
        cell: ({ row }) => {
          const isActive = row.getValue("isActive");
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? "Aktif" : "Non-Aktif"}
            </span>
          );
        },
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs">Aksi</div>,
        cell: ({ row }) => {
          const metode = row.original;
          const isDefault =
            metode.kategori === "tunai" &&
            metode.namaPembayaran.toLowerCase() === "tunai";

          return (
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
                  <Link
                    // Gunakan taktik yang sama untuk mengamankan navigasi URL Edit
                    href={`/dashboard/pengaturan/metodePembayaran/${metode._id || (metode as any).id}`}
                  >
                    <DropdownMenuItem className="cursor-pointer">
                      Edit
                    </DropdownMenuItem>
                  </Link>

                  {/* Kunci aksi hapus jika metode adalah default (Tunai) */}
                  {!isDefault && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                        onClick={() => setDeleteTarget(metode)}
                      >
                        Hapus
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
    [],
  );

  const tableData = Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <Wallet className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Metode Pembayaran
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola saluran pembayaran yang terhubung ke Akun Kas Anda.
            </p>
          </div>
        </div>

        <Link href="/dashboard/pengaturan/metodePembayaran/buatMetodePembayaran">
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Metode
          </Button>
        </Link>
      </div>

      {/* Komponen Tabel Shadcn */}
      <DataTable
        columns={columns}
        data={tableData}
        loading={loading}
        emptyMessage="Belum ada data metode pembayaran."
        searchKey="namaPembayaran"
        searchPlaceholder="Cari nama pembayaran..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus metode {deleteTarget?.namaPembayaran}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Metode pembayaran ini akan
              dihapus secara permanen dan tidak lagi tersedia pada sistem POS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="cursor-pointer"
            >
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
