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
import { ArrowUpDown, MoreHorizontal, Plus, Tag, X } from "lucide-react";
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

  // Filter 
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
            className="h-auto p-0 text-xs font-semibold text-[#041E3F]/60 hover:text-[#041E3F] hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Diskon
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-[#041E3F]">{row.getValue("namaDiskon")}</span>
        ),
      },
      {
        accessorKey: "cakupan",
        header: () => (
          <span className="text-xs font-semibold text-[#041E3F]/60">
            Cakupan
          </span>
        ),
        cell: ({ row }) => {
          const value = row.getValue("cakupan") as DiskonCakupan;
          return (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                value === "Global"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-amber-100 text-amber-700"
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
          <span className="text-xs font-semibold text-[#041E3F]/60">
            Tipe
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-[#041E3F]/70">
            {row.getValue("tipe") === "persen" ? "Persen" : "Nominal"}
          </span>
        ),
      },
      {
        accessorKey: "nilai",
        header: () => (
          <span className="text-xs font-semibold text-[#041E3F]/60">
            Nilai
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span className="font-bold text-[#041E3F]">
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
          <span className="text-xs font-semibold text-[#041E3F]/60">
            Digabung
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-[#041E3F]/70">
            {row.getValue("bisaDigabung") ? "Ya" : "Tidak"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-xs font-semibold text-[#041E3F]/60">
            Status
          </span>
        ),
        cell: ({ row }) => {
          const value = row.getValue("status") as DiskonStatus;
          return (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                value === "Aktif"
                  ? "bg-green-100 text-green-700"
                  : "bg-[#041E3F]/10 text-[#041E3F]/60"
              }`}
            >
              {value}
            </span>
          );
        },
      },
      {
        id: "aksi",
        header: () => <div className="text-right text-xs text-[#041E3F]/60">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-[#041E3F]/70 hover:text-[#041E3F] hover:bg-[#041E3F]/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#F2EAE1] border-[#041E3F]/10">
                <DropdownMenuItem
                  className="cursor-pointer text-[#041E3F] hover:bg-[#041E3F]/5 font-medium"
                  onClick={() => openEdit(row.original)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#041E3F]/10" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-medium"
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
          <h1 className="text-2xl font-bold tracking-tight text-[#041E3F]">Kelola Diskon</h1>
          <p className="text-sm text-[#041E3F]/60">
            Kelola seluruh data diskon dan promosi toko.
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-semibold rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Diskon
        </Button>
      </div>

      {/* Filter Menggunakan Shadcn Select */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-11 bg-[#FFFAF3] text-[#041E3F] border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium rounded-xl">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
            <SelectItem value="all" className="cursor-pointer">Semua Status</SelectItem>
            <SelectItem value="Aktif" className="cursor-pointer">Aktif</SelectItem>
            <SelectItem value="Non-Aktif" className="cursor-pointer">Non-Aktif</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCakupan} onValueChange={setFilterCakupan}>
          <SelectTrigger className="w-40 h-11 bg-[#FFFAF3] text-[#041E3F] border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium rounded-xl">
            <SelectValue placeholder="Semua Cakupan" />
          </SelectTrigger>
          <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
            <SelectItem value="all" className="cursor-pointer">Semua Cakupan</SelectItem>
            <SelectItem value="Global" className="cursor-pointer">Global</SelectItem>
            <SelectItem value="Item" className="cursor-pointer">Item</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTipe} onValueChange={setFilterTipe}>
          <SelectTrigger className="w-40 h-11 bg-[#FFFAF3] text-[#041E3F] border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium rounded-xl">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
            <SelectItem value="all" className="cursor-pointer">Semua Tipe</SelectItem>
            <SelectItem value="persen" className="cursor-pointer">Persen</SelectItem>
            <SelectItem value="nominal" className="cursor-pointer">Nominal</SelectItem>
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
            className="cursor-pointer h-11 border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent font-semibold rounded-xl"
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Table DIBUNGKUS CARD */}
      <div className="rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4 mt-2">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="Belum ada data diskon."
          searchKey="namaDiskon"
          searchPlaceholder="Cari nama diskon..."
        />
      </div>

      {/* Dialog Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-135 border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl">
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                  {editTarget ? "Edit Diskon" : "Tambah Diskon"}
                </DialogTitle>
                <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                  {editTarget
                    ? "Perbarui konfigurasi diskon."
                    : "Buat konfigurasi diskon atau promosi baru."}
                </DialogDescription>
              </div>
            </div>
            <button 
              onClick={() => setShowDialog(false)}
              className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6 stroke-[2.5px]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">Nama Diskon</label>
              <Input
                value={form.namaDiskon}
                onChange={(e) =>
                  setForm({
                    ...form,
                    namaDiskon: e.target.value,
                  })
                }
                placeholder="Contoh: Diskon Kemerdekaan"
                className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">Cakupan</label>
                <Select
                  value={form.cakupan}
                  onValueChange={(value) =>
                    setForm({ ...form, cakupan: value as DiskonCakupan })
                  }
                >
                  <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4">
                    <SelectValue placeholder="Pilih Cakupan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium">
                    <SelectItem value="Global" className="cursor-pointer">Global</SelectItem>
                    <SelectItem value="Item" className="cursor-pointer">Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">Tipe Diskon</label>
                <Select
                  value={form.tipe}
                  onValueChange={(value) =>
                    setForm({ ...form, tipe: value as DiskonTipe })
                  }
                >
                  <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium">
                    <SelectItem value="persen" className="cursor-pointer">Persen (%)</SelectItem>
                    <SelectItem value="nominal" className="cursor-pointer">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">Nilai Potongan</label>
              <div className="relative">
                {form.tipe === "nominal" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#041E3F]/50 font-bold">Rp</span>
                )}
                <Input
                  type="number"
                  min={0}
                  className={`no-spinner bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl ${form.tipe === "nominal" ? "pl-11" : "px-4"}`}
                  placeholder="0"
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#041E3F]/50 font-bold">%</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as DiskonStatus })
                  }
                >
                  <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium">
                    <SelectItem value="Aktif" className="cursor-pointer">Aktif</SelectItem>
                    <SelectItem value="Non-Aktif" className="cursor-pointer text-red-600">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">Bisa Digabung?</label>
                <Select
                  value={form.bisaDigabung ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm({ ...form, bisaDigabung: value === "true" })
                  }
                >
                  <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4">
                    <SelectValue placeholder="Pilih Opsi" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium">
                    <SelectItem value="false" className="cursor-pointer">Tidak</SelectItem>
                    <SelectItem value="true" className="cursor-pointer">Ya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600 font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 mt-1">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={saveDiskonMutation.isPending}
              className="w-full h-14 mt-2 rounded-xl cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md transition-all active:scale-[0.98]"
            >
              {saveDiskonMutation.isPending ? "Menyimpan Data..." : "Simpan Konfigurasi"}
            </Button>
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
        <AlertDialogContent className="border-[#041E3F]/10 bg-[#F2EAE1]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#041E3F]">
              Hapus diskon {deleteTarget?.namaDiskon}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#041E3F]/70">
              Tindakan ini tidak dapat dibatalkan. Data diskon akan dihapus
              secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteDiskonMutation.isPending}
              className="cursor-pointer border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDiskonMutation.isPending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deleteDiskonMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}