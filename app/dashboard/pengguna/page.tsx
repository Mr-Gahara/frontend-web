"use client";

import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { decodeJWT } from "@/lib/decodeToken";

import {
  PenggunaItem,
  GetPenggunaResponse,
  PenggunaRequest,
  PenggunaResponse,
} from "@/types/pengguna";

import { Role, GetRolesResponse } from "@/types/role";

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

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";

const emptyForm: PenggunaRequest = {
  nama: "",
  pin: "",
  nomorHp: "",
  roleID: "",
  status: "aktif",
  aksesType: ["app"],
};

export default function PenggunaPage() {
  // 1. EKSTRAKSI TOKEN AWAL
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("penggunaToken")
      : null;
  const payload = token ? decodeJWT(token) : null;
  const currentUserId = payload?._id || payload?.id || "";

  // STATE
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<PenggunaItem | null>(null);
  const [form, setForm] = useState<PenggunaRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PenggunaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const queryClient = useQueryClient();

  // QUERY PENGGUNA
  const {
    data: penggunaList = [],
    isLoading: penggunaLoading,
    error: penggunaError,
  } = useQuery({
    queryKey: queryKeys.pengguna,
    queryFn: async () => {
      const res = await apiClient.get<GetPenggunaResponse>(
        "/pengguna",
        undefined,
        "pengguna",
      );
      return (res as any).data?.data || res.data || [];
    },
  });

  // QUERY ROLE
  const { data: roleList = [] } = useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => {
      const res = await apiClient.get<GetRolesResponse>(
        "/role",
        undefined,
        "pengguna",
      );
      return (res as any).data?.data || res.data || [];
    },
  });

  // 2. LEVEL HIERARKI
  // Coba ambil dari token dulu. Jika tidak ada (token lama),
  // fallback ke roleList yang sudah di-fetch.
  const currentUserLevel = useMemo(() => {
    const levelFromToken = payload?.role?.level ?? 0;
    if (levelFromToken) return levelFromToken;

    if (roleList.length > 0) {
      const tokenRoleStr =
        typeof payload?.role === "string" ? payload.role : payload?.role?.nama;

      const foundMyRole = roleList.find(
        (r: Role) => r.namaRole === tokenRoleStr || r._id === payload?.roleID,
      );
      if (foundMyRole) return foundMyRole.level;
      if (tokenRoleStr === "Owner") return 100;
    }

    return 0;
  }, [token, roleList]);

  const isOwner = payload?.role?.nama === "Owner";

  const isSelf = editTarget
    ? ((editTarget as any)._id || (editTarget as any).id) === currentUserId
    : false;

  // ERROR HANDLER
  useEffect(() => {
    if (penggunaError) {
      toast.error("Gagal", {
        description:
          penggunaError instanceof Error
            ? penggunaError.message
            : "Gagal memuat data pengguna.",
      });
    }
  }, [penggunaError]);

  // MUTATION SAVE
  const savePenggunaMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string;
      data: PenggunaRequest;
    }) => {
      if (id) {
        return await apiClient.put<PenggunaResponse>(
          `/pengguna/${id}`,
          data,
          undefined,
          "pengguna",
        );
      }

      return await apiClient.post<PenggunaResponse>(
        "/pengguna/register-pengguna",
        data,
        undefined,
        "pengguna",
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", {
        description: variables.id
          ? "Pengguna berhasil diperbarui."
          : "Pengguna berhasil ditambahkan.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pengguna,
      });

      setShowDialog(false);
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal menyimpan data pengguna.");
    },
  });

  // OPEN CREATE
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowDialog(true);
  };

  // OPEN EDIT
  const openEdit = (item: PenggunaItem) => {
    setEditTarget(item);

    const roleIdValue =
      typeof item.roleID === "object" && item.roleID !== null
        ? (item.roleID as any).id || (item.roleID as any)._id
        : item.roleID;

    let safeAksesType: ("app" | "web")[] = [];
    if (Array.isArray(item.aksesType)) {
      safeAksesType = item.aksesType;
    } else if (typeof item.aksesType === "string") {
      safeAksesType = [item.aksesType];
    }

    setForm({
      nama: item.nama,
      nomorHp: item.nomorHp || "",
      pin: "",
      roleID: roleIdValue || "",
      status: item.status,
      aksesType: safeAksesType,
    });

    setFormError("");
    setShowDialog(true);
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const targetId = editTarget
      ? (editTarget as any).id || (editTarget as any)._id
      : undefined;

    const formData = { ...form };

    // Sanitasi Nomor HP
    if (!formData.nomorHp || formData.nomorHp.trim() === "") {
      delete formData.nomorHp;
    }

    // Sanitasi & Validasi PIN
    if (targetId && (!formData.pin || formData.pin.trim() === "")) {
      delete formData.pin;
    } else if (formData.pin && formData.pin.trim() !== "") {
      if (!/^\d+$/.test(formData.pin)) {
        setFormError("PIN harus berupa angka seluruhnya.");
        return;
      }
    }

    // Validasi Akses Type
    if (formData.aksesType) {
      const arrayAkses = Array.isArray(formData.aksesType)
        ? formData.aksesType
        : typeof formData.aksesType === "string"
          ? [formData.aksesType]
          : [];

      const cleanAkses = arrayAkses.filter((a) => a === "web" || a === "app");
      formData.aksesType = Array.from(new Set(cleanAkses)) as ("app" | "web")[];

      if (formData.aksesType.length === 0) {
        setFormError("Minimal satu Hak Akses Platform harus dipilih.");
        return;
      }
    } else {
      setFormError("Minimal satu Hak Akses Platform harus dipilih.");
      return;
    }

    await savePenggunaMutation.mutateAsync({
      id: targetId,
      data: formData,
    });
  };

  // DELETE
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const targetId = (deleteTarget as any).id || (deleteTarget as any)._id;
      await apiClient.delete(`/pengguna/${targetId}`, undefined, "pengguna");

      toast.success("Berhasil", {
        description: "Pengguna berhasil dihapus.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pengguna,
      });

      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus pengguna.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // TABLE COLUMNS
  const columns: ColumnDef<PenggunaItem>[] = [
    {
      accessorKey: "nama",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nama Pengguna</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("nama")}</span>
      ),
    },
    {
      accessorKey: "nomorHp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nomor HP</span>
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.getValue("nomorHp") || "-"}
        </span>
      ),
    },
    {
      id: "role",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground">
          Role
        </span>
      ),
      accessorFn: (row) => {
        if (typeof row.roleID === "object" && row.roleID !== null) {
          return (row.roleID as any).namaRole || "-";
        }
        if (typeof row.roleID === "string") {
          const foundRole = roleList.find(
            (r: any) => r.id === row.roleID || r._id === row.roleID,
          );
          return foundRole ? foundRole.namaRole : "-";
        }
        return "-";
      },
      cell: ({ row }) => (
        <span className="text-sm capitalize">
          {row.getValue("role") as string}
        </span>
      ),
    },
    {
      accessorKey: "statusPengguna",
      header: () => (
        <div className="text-xs font-semibold text-muted-foreground">
          Status
        </div>
      ),
      cell: ({ row }) => {
        const isActive = row.original.status === "aktif";
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
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
        const targetId = (row.original as any)._id || (row.original as any).id;
        let targetLevel = 0;

        if (
          typeof row.original.roleID === "object" &&
          row.original.roleID !== null
        ) {
          targetLevel = (row.original.roleID as any).level ?? 0;
        } else if (typeof row.original.roleID === "string") {
          const foundRole = roleList.find(
            (r: any) =>
              r.id === row.original.roleID ||
              r._id === row.original.roleID ||
              r.namaRole === row.original.roleID,
          );
          if (foundRole) targetLevel = foundRole.level;
        }

        const isSelf = targetId === currentUserId;
        const canEdit = isSelf || targetLevel < currentUserLevel;
        const canDelete = !isSelf && targetLevel < currentUserLevel;

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
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => openEdit(row.original)}
                  disabled={!canEdit}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                  disabled={!canDelete}
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
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh akun pengguna sistem.
          </p>
        </div>

        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={penggunaList}
        loading={penggunaLoading}
        emptyMessage="Belum ada pengguna."
        searchKey="nama"
        searchPlaceholder="Cari pengguna..."
      />

      {/* FORM DIALOG */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Perbarui data pengguna."
                : "Isi form berikut untuk menambahkan pengguna baru."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Pengguna</label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Masukkan nama pengguna"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nomor HP{" "}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </label>
              <Input
                value={form.nomorHp ?? ""}
                onChange={(e) => setForm({ ...form, nomorHp: e.target.value })}
                placeholder="contoh: 08123456789"
              />
            </div>

            {(!isSelf || isOwner) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">PIN</label>
                <Input
                  type="password"
                  value={form.pin ?? ""}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  placeholder={
                    editTarget ? "Kosongkan jika tidak diubah" : "Masukkan PIN"
                  }
                  required={!editTarget}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={form.roleID}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    roleID: value,
                  })
                }
                disabled={isSelf}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roleList
                    .filter((role: Role) => role.level < currentUserLevel)
                    .map((role: Role, index: number) => {
                      const roleIdValue =
                        (role as any).id ||
                        (role as any)._id ||
                        `role-fallback-${index}`;

                      return (
                        <SelectItem
                          key={roleIdValue}
                          value={String(roleIdValue)}
                        >
                          {role.namaRole}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Hak Akses Platform</label>
              <div className="flex flex-col gap-2.5 rounded-md border border-input p-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="akses-web"
                    checked={form.aksesType?.includes("web")}
                    onCheckedChange={(checked) => {
                      setForm((prev) => ({
                        ...prev,
                        aksesType: checked
                          ? [...(prev.aksesType || []), "web"]
                          : (prev.aksesType || []).filter((a) => a !== "web"),
                      }));
                    }}
                    disabled={isSelf}
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor="akses-web"
                    className="text-sm font-medium leading-none cursor-pointer text-foreground"
                  >
                    Web Dashboard (Backoffice)
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="akses-app"
                    checked={form.aksesType?.includes("app")}
                    onCheckedChange={(checked) => {
                      setForm((prev) => ({
                        ...prev,
                        aksesType: checked
                          ? [...(prev.aksesType || []), "app"]
                          : (prev.aksesType || []).filter((a) => a !== "app"),
                      }));
                    }}
                    disabled={isSelf}
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor="akses-app"
                    className="text-sm font-medium leading-none cursor-pointer text-foreground"
                  >
                    Mobile App (POS Kasir)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Pengguna</label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as "aktif" | "non-aktif" })
                }
                disabled={isSelf}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-md">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={savePenggunaMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savePenggunaMutation.isPending}
                className="cursor-pointer"
              >
                {savePenggunaMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
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
              Hapus pengguna {deleteTarget?.nama}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengguna akan dihapus secara
              permanen dari sistem.
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
