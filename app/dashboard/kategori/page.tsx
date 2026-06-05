"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard"; // (+) SECURITY FIX
import { apiClient } from "@/lib/apiClient";
import {
  Kategori,
  KategoriRequest,
  GetKategoriResponse,
  KategoriResponse,
} from "@/types/kategori";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";

const emptyForm: KategoriRequest = {
  namaKategori: "",
  kodeKategori: "",
  keterangan: "",
};

export default function KategoriPage() {
  // 1. PROTEKSI HALAMAN
  useAuthGuard();

  // Dialog form
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [form, setForm] = useState<KategoriRequest>(emptyForm);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);

  const queryClient = useQueryClient();

  // =========================
  // QUERY: GET KATEGORI
  // =========================
  const {
    data = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.kategori,
    queryFn: async () => {
      const res = await apiClient.get<GetKategoriResponse>(
        "/kategori",
        undefined,
        "pengguna"
      );
      return res.data;
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Gagal", {
        description:
          error instanceof Error
            ? error.message
            : "Gagal memuat data kategori.",
      });
    }
  }, [error]);

  // =========================
  // MUTATION: SAVE KATEGORI (CREATE/UPDATE)
  // =========================
  const saveKategoriMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: KategoriRequest }) => {
      if (id) {
        return await apiClient.put<KategoriResponse>(
          `/kategori/${id}`,
          data,
          undefined,
          "pengguna"
        );
      }
      return await apiClient.post<KategoriResponse>(
        "/kategori",
        data,
        undefined,
        "pengguna"
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", {
        description: variables.id
          ? "Kategori berhasil diperbarui."
          : "Kategori berhasil ditambahkan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.kategori });
      setShowDialog(false);
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan data.");
    },
  });

  // =========================
  // MUTATION: DELETE KATEGORI (+) KONSISTENSI
  // =========================
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/kategori/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Kategori berhasil dihapus.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.kategori });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus kategori.",
      });
    },
  });

  // =========================
  // HANDLERS
  // =========================
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowDialog(true);
  };

  const openEdit = (item: Kategori) => {
    setEditTarget(item);
    setForm({
      namaKategori: item.namaKategori,
      kodeKategori: item.kodeKategori,
      keterangan: item.keterangan || "",
    });
    setFormError("");
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    await saveKategoriMutation.mutateAsync({ id: editTarget?._id, data: form });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  // =========================
  // TABLE COLUMNS (+) PERFORMA FIX (useMemo)
  // =========================
  const columns = useMemo<ColumnDef<Kategori>[]>(
    () => [
      {
        accessorKey: "namaKategori",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Nama Kategori</span>
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("namaKategori")}
          </span>
        ),
      },
      {
        accessorKey: "kodeKategori",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Kode</span>
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.getValue("kodeKategori")}
          </span>
        ),
      },
      {
        accessorKey: "keterangan",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Keterangan
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("keterangan") || "-"}
          </span>
        ),
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
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => openEdit(row.original)}
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
    []
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Kelola Kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh data kategori produk.
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Belum ada kategori."
        searchKey="namaKategori"
        searchPlaceholder="Cari nama kategori..."
      />

      {/* Dialog Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Perbarui data kategori yang sudah ada."
                : "Isi form berikut untuk menambahkan kategori baru."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kategori</label>
              <Input
                value={form.namaKategori}
                onChange={(e) =>
                  setForm({ ...form, namaKategori: e.target.value })
                }
                placeholder="Masukkan nama kategori"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kode Kategori</label>
              <Input
                value={form.kodeKategori}
                onChange={(e) =>
                  setForm({ ...form, kodeKategori: e.target.value })
                }
                placeholder="Masukkan kode kategori"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keterangan</label>
              <Input
                value={form.keterangan}
                onChange={(e) =>
                  setForm({ ...form, keterangan: e.target.value })
                }
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saveKategoriMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saveKategoriMutation.isPending}
                className="cursor-pointer"
              >
                {saveKategoriMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus kategori {deleteTarget?.namaKategori}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data kategori akan dihapus
              secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}