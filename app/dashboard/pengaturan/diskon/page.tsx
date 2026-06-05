"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  Diskon,
  DiskonRequest,
  DiskonResponse,
  GetDiskonResponse,
  DiskonCakupan,
  DiskonTipe,
  DiskonStatus,
} from "@/types/diskon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

const emptyForm: DiskonRequest = {
  namaDiskon: "",
  cakupan: "Global",
  tipe: "persen",
  nilai: 0,
  bisaDigabung: false,
  status: "Aktif",
};

export default function DiskonPage() {
  useAuthGuard();

  // Filter (Menggunakan "all" sebagai ganti string kosong untuk kompatibilitas Shadcn Select)
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCakupan, setFilterCakupan] = useState("all");
  const [filterTipe, setFilterTipe] = useState("all");

  // Dialog form
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Diskon | null>(null);

  const [form, setForm] = useState<DiskonRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [nilaiInput, setNilaiInput] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Diskon | null>(null);

  const queryClient = useQueryClient();

  const {
    data = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: [
      ...queryKeys.diskon,
      {
        status: filterStatus,
        cakupan: filterCakupan,
        tipe: filterTipe,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filterStatus && filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      if (filterCakupan && filterCakupan !== "all") {
        params.set("cakupan", filterCakupan);
      }
      if (filterTipe && filterTipe !== "all") {
        params.set("tipe", filterTipe);
      }

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get<GetDiskonResponse>(
        `/diskon${query}`,
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
          error instanceof Error ? error.message : "Gagal memuat data diskon.",
      });
    }
  }, [error]);

  const saveDiskonMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: DiskonRequest }) => {
      if (id) {
        return await apiClient.put<DiskonResponse>(
          `/diskon/${id}`,
          data,
          undefined,
          "pengguna"
        );
      }
      return await apiClient.post<DiskonResponse>(
        "/diskon",
        data,
        undefined,
        "pengguna"
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", {
        description: variables.id
          ? "Diskon berhasil diperbarui."
          : "Diskon berhasil ditambahkan.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.diskon,
      });
      setShowDialog(false);
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan data diskon.");
    },
  });

  const deleteDiskonMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/diskon/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Diskon berhasil dihapus.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.diskon,
      });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus diskon.",
      });
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setNilaiInput("");
    setFormError("");
    setShowDialog(true);
  };

  const openEdit = useCallback((item: Diskon) => {
    setEditTarget(item);
    setForm({
      namaDiskon: item.namaDiskon,
      cakupan: item.cakupan,
      tipe: item.tipe,
      nilai: item.nilai,
      bisaDigabung: item.bisaDigabung,
      status: item.status,
    });
    setNilaiInput(item.nilai.toString());
    setFormError("");
    setShowDialog(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    await saveDiskonMutation.mutateAsync({
      id: editTarget?._id,
      data: form,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDiskonMutation.mutateAsync(deleteTarget._id);
  };

  const columns = useMemo<ColumnDef<Diskon>[]>(
    () => [
      {
        accessorKey: "namaDiskon",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Diskon
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("namaDiskon")}</span>
        ),
      },
      {
        accessorKey: "cakupan",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Cakupan
          </span>
        ),
        cell: ({ row }) => {
          const value = row.getValue("cakupan") as DiskonCakupan;
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                value === "Global"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {value}
            </span>
          );
        },
      },
      {
        accessorKey: "tipe",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Tipe
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("tipe") === "persen" ? "Persen" : "Nominal"}
          </span>
        ),
      },
      {
        accessorKey: "nilai",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Nilai
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span className="font-medium">
              {item.tipe === "persen"
                ? `${item.nilai}%`
                : `Rp ${item.nilai.toLocaleString("id-ID")}`}
            </span>
          );
        },
      },
      {
        accessorKey: "bisaDigabung",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Digabung
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("bisaDigabung") ? "Ya" : "Tidak"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Status
          </span>
        ),
        cell: ({ row }) => {
          const value = row.getValue("status") as DiskonStatus;
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                value === "Aktif"
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {value}
            </span>
          );
        },
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
    [openEdit]
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Kelola Diskon</h1>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh data diskon toko.
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Diskon
        </Button>
      </div>

      {/* Filter Menggunakan Shadcn Select */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-10 bg-background">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Aktif">Aktif</SelectItem>
            <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCakupan} onValueChange={setFilterCakupan}>
          <SelectTrigger className="w-40 h-10 bg-background">
            <SelectValue placeholder="Semua Cakupan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Cakupan</SelectItem>
            <SelectItem value="Global">Global</SelectItem>
            <SelectItem value="Item">Item</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTipe} onValueChange={setFilterTipe}>
          <SelectTrigger className="w-40 h-10 bg-background">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="persen">Persen</SelectItem>
            <SelectItem value="nominal">Nominal</SelectItem>
          </SelectContent>
        </Select>

        {(filterStatus !== "all" || filterCakupan !== "all" || filterTipe !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setFilterStatus("all");
              setFilterCakupan("all");
              setFilterTipe("all");
            }}
            className="cursor-pointer h-10"
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Belum ada data diskon."
        searchKey="namaDiskon"
        searchPlaceholder="Cari nama diskon..."
      />

      {/* Dialog Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Diskon" : "Tambah Diskon"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Perbarui data diskon yang sudah ada."
                : "Isi form berikut untuk menambahkan diskon baru."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Diskon</label>
              <Input
                value={form.namaDiskon}
                onChange={(e) =>
                  setForm({
                    ...form,
                    namaDiskon: e.target.value,
                  })
                }
                placeholder="Masukkan nama diskon"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cakupan</label>
                <Select
                  value={form.cakupan}
                  onValueChange={(value) =>
                    setForm({ ...form, cakupan: value as DiskonCakupan })
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-background">
                    <SelectValue placeholder="Pilih Cakupan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global">Global</SelectItem>
                    <SelectItem value="Item">Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe</label>
                <Select
                  value={form.tipe}
                  onValueChange={(value) =>
                    setForm({ ...form, tipe: value as DiskonTipe })
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-background">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persen">Persen</SelectItem>
                    <SelectItem value="nominal">Nominal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai</label>
              <Input
                type="number"
                min={0}
                className="no-spinner"
                placeholder=""
                max={form.tipe === "persen" ? 100 : undefined}
                value={nilaiInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setNilaiInput(value);
                  setForm({
                    ...form,
                    nilai: value === "" ? 0 : Number(value),
                  });
                }}
                required
              />
              {form.tipe === "persen" && (
                <p className="text-xs text-muted-foreground">Maksimal 100%</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as DiskonStatus })
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-background">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bisa Digabung</label>
                <Select
                  value={form.bisaDigabung ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm({ ...form, bisaDigabung: value === "true" })
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-background">
                    <SelectValue placeholder="Pilih Opsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Tidak</SelectItem>
                    <SelectItem value="true">Ya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saveDiskonMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saveDiskonMutation.isPending}
                className="cursor-pointer"
              >
                {saveDiskonMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
              Hapus diskon {deleteTarget?.namaDiskon}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data diskon akan dihapus
              secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteDiskonMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDiskonMutation.isPending}
              className="cursor-pointer bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteDiskonMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}