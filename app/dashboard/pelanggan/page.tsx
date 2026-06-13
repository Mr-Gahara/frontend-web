"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { Pelanggan, PelangganRequest, GetPelangganResponse } from "@/types/pelanggan";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Users, Crown, MapPin, ArrowUpDown, MoreHorizontal } from "lucide-react";

const emptyForm: PelangganRequest = {
  namaPelanggan: "",
  tipePelanggan: "umum",
  nomorHp: "",
  email: "",
  alamat: "",
};

export default function PelangganPage() {
  useAuthGuard();
  const queryClient = useQueryClient();

  // STATE: CREATE FORM (Sidebar Kanan)
  const [createForm, setCreateForm] = useState<PelangganRequest>(emptyForm);
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);

  // STATE: EDIT FORM (Dialog Popup)
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Pelanggan | null>(null);
  const [editForm, setEditForm] = useState<PelangganRequest>(emptyForm);
  const [editError, setEditError] = useState("");

  // STATE: DELETE (AlertDialog Popup)
  const [deleteTarget, setDeleteTarget] = useState<Pelanggan | null>(null);
  const [deleting, setDeleting] = useState(false);

  // FETCH DATA PELANGGAN
  const {
    data: pelangganList = [],
    isLoading: pelangganLoading,
    error: pelangganError,
  } = useQuery({
    queryKey: queryKeys.pelanggan,
    queryFn: async () => {
      const res = await apiClient.get<any>("/pelanggan", undefined, "pengguna");
      const fetchedData = res.data?.data || res.data || [];
      return Array.isArray(fetchedData) ? fetchedData : [];
    },
  });

  // ERROR HANDLER GET DATA
  useEffect(() => {
    if (pelangganError) {
      toast.error("Gagal", {
        description:
          pelangganError instanceof Error
            ? pelangganError.message
            : "Gagal memuat data pelanggan.",
      });
    }
  }, [pelangganError]);

  // STATISTIK CALCULATIONS
  const stats = useMemo(() => {
    const total = pelangganList.length;
    const memberCount = pelangganList.filter((p) => p.tipePelanggan === "member").length;
    const korporatCount = pelangganList.filter((p) => p.tipePelanggan === "korporat").length;
    return { total, memberCount, korporatCount };
  }, [pelangganList]);

  // MUTATIONS

  const createMutation = useMutation({
    mutationFn: async (payload: PelangganRequest) => {
      return await apiClient.post("/pelanggan", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pelanggan baru berhasil ditambahkan." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pelanggan });
      setCreateForm(emptyForm);
      setShowConfirmCreate(false);
    },
    onError: (err: any) => {
      toast.error("Gagal", { description: err.message || "Gagal menambahkan pelanggan." });
      setShowConfirmCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PelangganRequest }) => {
      return await apiClient.put(`/pelanggan/${id}`, data, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Data pelanggan berhasil diperbarui." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pelanggan });
      setShowEditDialog(false);
    },
    onError: (err: any) => {
      setEditError(err.message || "Gagal memperbarui data pelanggan.");
    },
  });

  // HANDLERS

  // Buka dialog edit dari row tabel
  const openEdit = (item: Pelanggan) => {
    setEditTarget(item);
    setEditForm({
      namaPelanggan: item.namaPelanggan,
      tipePelanggan: item.tipePelanggan,
      nomorHp: item.nomorHp || "",
      email: item.email || "",
      alamat: item.alamat || "",
    });
    setEditError("");
    setShowEditDialog(true);
  };

  // Submit Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editForm.namaPelanggan.trim()) {
      setEditError("Nama pelanggan wajib diisi.");
      return;
    }

    if (editTarget) {
      const targetId = (editTarget as any)._id || (editTarget as any).id;
      const payload: PelangganRequest = {
        namaPelanggan: editForm.namaPelanggan,
        tipePelanggan: editForm.tipePelanggan,
        nomorHp: editForm.nomorHp?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        alamat: editForm.alamat?.trim() || undefined,
      };
      await updateMutation.mutateAsync({ id: targetId, data: payload });
    }
  };

  // Trigger pop-up konfirmasi simpan baru
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.namaPelanggan.trim()) {
      toast.error("Validasi", { description: "Nama pelanggan wajib diisi." });
      return;
    }
    setShowConfirmCreate(true);
  };

  // Eksekusi simpan baru setelah dikonfirmasi
  const executeCreate = async () => {
    const payload: PelangganRequest = {
      namaPelanggan: createForm.namaPelanggan,
      tipePelanggan: createForm.tipePelanggan,
      nomorHp: createForm.nomorHp?.trim() || undefined,
      email: createForm.email?.trim() || undefined,
      alamat: createForm.alamat?.trim() || undefined,
    };
    await createMutation.mutateAsync(payload);
  };

  // Eksekusi Hapus
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const targetId = (deleteTarget as any)._id || (deleteTarget as any).id;
      await apiClient.delete(`/pelanggan/${targetId}`, undefined, "pengguna");
      toast.success("Berhasil", { description: "Pelanggan berhasil dihapus." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pelanggan });
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus pelanggan.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // TABLE COLUMNS (Untuk DataTable)
  const columns: ColumnDef<Pelanggan>[] = [
    {
      accessorKey: "namaPelanggan",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nama Pelanggan</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.getValue("namaPelanggan")}</span>
          {row.original.alamat && (
            <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {row.original.alamat}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "nomorHp",
      header: () => <span className="text-xs font-semibold text-muted-foreground">Kontak</span>,
      cell: ({ row }) => (
        <div className="flex flex-col space-y-1">
          <span className="text-xs">{row.getValue("nomorHp") || "-"}</span>
          {row.original.email && <span className="text-xs text-muted-foreground">{row.original.email}</span>}
        </div>
      ),
    },
    {
      accessorKey: "tipePelanggan",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Tipe</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const tipe = row.getValue("tipePelanggan") as string;
        const colorClass =
          tipe === "member"
            ? "bg-emerald-700 text-slate-50 font-bold dark:bg-emerald-900/30 dark:text-emerald-400"
            : tipe === "korporat"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-primary/10 text-primary";

        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
            {tipe}
          </span>
        );
      },
    },
    {
      accessorKey: "poinLoyalitas",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Poin</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.getValue("poinLoyalitas")}</span>
      ),
    },
    {
      id: "aksi",
      header: () => <div className="text-right text-xs">Aksi</div>,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(row.original)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelanggan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola data pelanggan, keanggotaan, dan informasi kontak.
        </p>
      </div>

      {/* BENTO LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* WIDGET STATISTIK (TOP ROW)                 */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pelanggan</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </div>
          
          <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pelanggan Member</p>
              <h3 className="text-2xl font-bold">{stats.memberCount}</h3>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Klien Korporat</p>
              <h3 className="text-2xl font-bold">{stats.korporatCount}</h3>
            </div>
          </div>
        </div>

        {/* WIDGET DAFTAR PELANGGAN (KIRI - MAIN)      */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-8 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Daftar Pelanggan</h2>
          <DataTable
            columns={columns}
            data={pelangganList}
            loading={pelangganLoading}
            emptyMessage="Belum ada data pelanggan."
            searchKey="namaPelanggan"
            searchPlaceholder="Cari nama pelanggan..."
          />
        </div>

        {/* WIDGET TAMBAH PELANGGAN (KANAN - SIDEBAR)  */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-4 lg:sticky lg:top-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Tambah Pelanggan Cepat</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Tambahkan data pelanggan baru langsung dari panel ini.
            </p>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nama Pelanggan <span className="text-red-500">*</span></label>
              <Input
                value={createForm.namaPelanggan}
                onChange={(e) => setCreateForm({ ...createForm, namaPelanggan: e.target.value })}
                placeholder="Misal: Budi Santoso"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tipe Pelanggan</label>
              <Select
                value={createForm.tipePelanggan}
                onValueChange={(val) => setCreateForm({ ...createForm, tipePelanggan: val as "umum" | "member" | "korporat" })}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="umum" className="cursor-pointer">Umum</SelectItem>
                  <SelectItem value="member" className="cursor-pointer">Member</SelectItem>
                  <SelectItem value="korporat" className="cursor-pointer">Korporat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nomor WhatsApp / HP</label>
              <Input
                value={createForm.nomorHp}
                onChange={(e) => setCreateForm({ ...createForm, nomorHp: e.target.value })}
                placeholder="Misal: 08123456789"
                type="tel"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Email (Opsional)</label>
              <Input
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="Misal: budi@email.com"
                type="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Alamat (Opsional)</label>
              <Input
                value={createForm.alamat}
                onChange={(e) => setCreateForm({ ...createForm, alamat: e.target.value })}
                placeholder="Misal: Jl. Sudirman No. 123"
              />
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer mt-2"
              disabled={createMutation.isPending}
            >
              Simpan Pelanggan
            </Button>
          </form>
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL DIALOGS                              */}
      {/* ========================================== */}

      {/* DIALOG KONFIRMASI SIMPAN PELANGGAN BARU */}
      <AlertDialog open={showConfirmCreate} onOpenChange={setShowConfirmCreate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Pelanggan Baru?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menambahkan <strong>{createForm.namaPelanggan}</strong> ke dalam daftar pelanggan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMutation.isPending} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCreate}
              disabled={createMutation.isPending}
              className="cursor-pointer"
            >
              {createMutation.isPending ? "Menyimpan..." : "Ya, Simpan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG EDIT PELANGGAN */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pelanggan</DialogTitle>
            <DialogDescription>
              Perbarui informasi data pelanggan di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nama Pelanggan <span className="text-red-500">*</span>
              </label>
              <Input
                value={editForm.namaPelanggan}
                onChange={(e) => setEditForm({ ...editForm, namaPelanggan: e.target.value })}
                placeholder="Misal: Budi Santoso"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Pelanggan</label>
              <Select
                value={editForm.tipePelanggan}
                onValueChange={(val: "umum" | "member" | "korporat") =>
                  setEditForm({ ...editForm, tipePelanggan: val })
                }
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="umum" className="cursor-pointer">Umum</SelectItem>
                  <SelectItem value="member" className="cursor-pointer">Member</SelectItem>
                  <SelectItem value="korporat" className="cursor-pointer">Korporat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nomor WhatsApp / HP <span className="text-muted-foreground font-normal">(opsional)</span>
              </label>
              <Input
                value={editForm.nomorHp ?? ""}
                onChange={(e) => setEditForm({ ...editForm, nomorHp: e.target.value })}
                placeholder="Misal: 08123456789"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email <span className="text-muted-foreground font-normal">(opsional)</span>
              </label>
              <Input
                value={editForm.email ?? ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Misal: budi@email.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Alamat <span className="text-muted-foreground font-normal">(opsional)</span>
              </label>
              <Input
                value={editForm.alamat ?? ""}
                onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                placeholder="Misal: Jl. Sudirman No. 123"
              />
            </div>

            {editError && (
              <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-md">
                {editError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={updateMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="cursor-pointer"
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS PELANGGAN */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pelanggan {deleteTarget?.namaPelanggan}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Riwayat transaksi mungkin tetap tersimpan di sistem, namun data profil ini akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}