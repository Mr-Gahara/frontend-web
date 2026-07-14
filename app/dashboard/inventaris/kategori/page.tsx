"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
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
import { ArrowUpDown, MoreHorizontal, Plus, Tag } from "lucide-react";

const emptyForm: KategoriRequest = {
  namaKategori: "",
  kodeKategori: "",
  keterangan: "",
};

export default function KategoriPage() {
  useAuthGuard();

  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [form, setForm] = useState<KategoriRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);

  const queryClient = useQueryClient();

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
        "pengguna",
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

  const saveKategoriMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string;
      data: KategoriRequest;
    }) => {
      if (id) {
        return await apiClient.put<KategoriResponse>(
          `/kategori/${id}`,
          data,
          undefined,
          "pengguna",
        );
      }
      return await apiClient.post<KategoriResponse>(
        "/kategori",
        data,
        undefined,
        "pengguna",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/kategori/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Kategori berhasil dihapus." });
      queryClient.invalidateQueries({ queryKey: queryKeys.kategori });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus kategori.",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    await saveKategoriMutation.mutateAsync({ id: editTarget?._id, data: form });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
  };

  const columns = useMemo<ColumnDef<Kategori>[]>(
    () => [
      {
        accessorKey: "namaKategori",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Kategori <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-[#0A2947]">
            {row.original.namaKategori}
          </span>
        ),
      },
      {
        accessorKey: "kodeKategori",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">Kode</span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-[#0A2947]/70">
            {row.original.kodeKategori}
          </span>
        ),
      },
      {
        accessorKey: "keterangan",
        header: () => (
          <span className="text-xs font-bold text-[#0A2947]/60">
            Keterangan
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-[#0A2947]/70">
            {row.original.keterangan || "-"}
          </span>
        ),
      },
      {
        id: "aksi",
        header: () => (
          <div className="text-right text-xs font-bold text-[#0A2947]/60">
            Aksi
          </div>
        ),
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
              <DropdownMenuContent
                align="end"
                className="bg-[#FFFAF3] border-[#0A2947]/10"
              >
                <DropdownMenuItem
                  className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
                  onClick={() => {
                    setEditTarget(row.original);
                    setForm({
                      namaKategori: row.original.namaKategori,
                      kodeKategori: row.original.kodeKategori,
                      keterangan: row.original.keterangan || "",
                    });
                    setShowDialog(true);
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
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
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shadow-sm">
            <Tag className="w-6 h-6 text-[#0A2947]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Kelola Kategori
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelola seluruh data kategori produk.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setForm(emptyForm);
            setShowDialog(true);
          }}
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="Belum ada kategori."
          searchKey="namaKategori"
          searchPlaceholder="Cari nama kategori..."
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-[#FFFAF3] border-[#0A2947]/10">
          <DialogHeader>
            <DialogTitle className="text-[#0A2947]">
              {editTarget ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription className="text-[#0A2947]/60 font-medium">
              {editTarget
                ? "Perbarui data kategori yang sudah ada."
                : "Isi form berikut untuk menambahkan kategori baru."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Nama Kategori
              </label>
              <Input
                value={form.namaKategori}
                onChange={(e) =>
                  setForm({ ...form, namaKategori: e.target.value })
                }
                placeholder="Masukkan nama kategori"
                required
                className="bg-white border-[#0A2947]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Kode Kategori
              </label>
              <Input
                value={form.kodeKategori}
                onChange={(e) =>
                  setForm({ ...form, kodeKategori: e.target.value })
                }
                placeholder="Masukkan kode kategori"
                required
                className="bg-white border-[#0A2947]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Keterangan
              </label>
              <Input
                value={form.keterangan}
                onChange={(e) =>
                  setForm({ ...form, keterangan: e.target.value })
                }
                placeholder="Keterangan tambahan (opsional)"
                className="bg-white border-[#0A2947]/20"
              />
            </div>
            {formError && (
              <p className="text-sm font-bold text-red-600">{formError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saveKategoriMutation.isPending}
                className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saveKategoriMutation.isPending}
                className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold"
              >
                {saveKategoriMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Hapus kategori {deleteTarget?.namaKategori}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
