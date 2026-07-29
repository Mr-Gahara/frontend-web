"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
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
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";

// Komponen dipisah
import PenggunaFormDialog from "@/components/pengguna-form-dialog";
import {
  WidgetTotalUsers,
  WidgetActiveUsers,
  WidgetAccess,
} from "@/app/dashboard/outlet/pengguna/components/bento-pengguna-widgets";

const emptyForm: PenggunaRequest = {
  nama: "",
  pin: "",
  nomorHp: "",
  roleID: "",
  status: "aktif",
  aksesType: ["app"],
};

export default function PenggunaPage() {
  useAuthGuard();
  const token = typeof window !== "undefined" ? sessionStorage.getItem("penggunaToken") : null;
  const payload = token ? decodeJWT(token) : null;
  const currentUserId = payload?._id || payload?.id || "";

  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<PenggunaItem | null>(null);
  const [form, setForm] = useState<PenggunaRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PenggunaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data: penggunaList = [], isLoading: penggunaLoading, error: penggunaError } = useQuery({
    queryKey: queryKeys.pengguna("outlet"),
    queryFn: async () => {
      const res = await apiClient.get<GetPenggunaResponse>("/pengguna?workspace=outlet", undefined, "pengguna");
      return (res as any).data?.data || res.data || [];
    },
  });

  const { data: roleList = [] } = useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => {
      const res = await apiClient.get<GetRolesResponse>("/role", undefined, "pengguna");
      return (res as any).data?.data || res.data || [];
    },
  });

  const currentUserLevel = useMemo(() => {
    const levelFromToken = payload?.role?.level ?? 0;
    if (levelFromToken) return levelFromToken;

    if (roleList.length > 0) {
      const tokenRoleStr = typeof payload?.role === "string" ? payload.role : payload?.role?.nama;
      const foundMyRole = roleList.find(
        (r: Role) => r.namaRole === tokenRoleStr || r._id === payload?.roleID,
      );
      if (foundMyRole) return foundMyRole.level;
      if (tokenRoleStr === "Owner") return 100;
    }
    return 0;
  }, [token, roleList]);

  const isOwner = payload?.role?.nama === "Owner";
  const isSelf = editTarget ? ((editTarget as any)._id || (editTarget as any).id) === currentUserId : false;

  useEffect(() => {
    if (penggunaError) {
      toast.error("Gagal", { description: penggunaError instanceof Error ? penggunaError.message : "Gagal memuat data pengguna." });
    }
  }, [penggunaError]);

  const savePenggunaMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: PenggunaRequest }) => {
      if (id) return await apiClient.put<PenggunaResponse>(`/pengguna/${id}`, data, undefined, "pengguna");
      return await apiClient.post<PenggunaResponse>("/pengguna/register-pengguna", data, undefined, "pengguna");
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", { description: variables.id ? "Pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengguna("outlet") });
      setShowDialog(false);
    },
    onError: (err: any) => { setFormError(err.message || "Gagal menyimpan data pengguna."); },
  });

  const openCreate = () => {
    setEditTarget(null); setForm(emptyForm); setFormError(""); setShowDialog(true);
  };

  const openEdit = (item: PenggunaItem) => {
    setEditTarget(item);
    const roleIdValue = typeof item.roleID === "object" && item.roleID !== null ? (item.roleID as any).id || (item.roleID as any)._id : item.roleID;
    let safeAksesType: ("app" | "web")[] = [];
    if (Array.isArray(item.aksesType)) safeAksesType = item.aksesType;
    else if (typeof item.aksesType === "string") safeAksesType = [item.aksesType];

    setForm({
      nama: item.nama, nomorHp: item.nomorHp || "", pin: "", roleID: roleIdValue || "", status: item.status, aksesType: safeAksesType,
    });
    setFormError(""); setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    const targetId = editTarget ? (editTarget as any).id || (editTarget as any)._id : undefined;
    const formData = { ...form };

    if (!formData.nomorHp || formData.nomorHp.trim() === "") delete formData.nomorHp;
    
    if (targetId && (!formData.pin || formData.pin.trim() === "")) {
      delete formData.pin;
    } else if (formData.pin && formData.pin.trim() !== "") {
      if (!/^\d+$/.test(formData.pin)) { setFormError("PIN harus berupa angka seluruhnya."); return; }
    }

    if (formData.aksesType) {
      const arrayAkses = Array.isArray(formData.aksesType) ? formData.aksesType : typeof formData.aksesType === "string" ? [formData.aksesType] : [];
      const cleanAkses = arrayAkses.filter((a) => a === "web" || a === "app");
      formData.aksesType = Array.from(new Set(cleanAkses)) as ("app" | "web")[];
      if (formData.aksesType.length === 0) { setFormError("Minimal satu Hak Akses Platform harus dipilih."); return; }
    } else {
      setFormError("Minimal satu Hak Akses Platform harus dipilih."); return;
    }
    await savePenggunaMutation.mutateAsync({ id: targetId, data: formData });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const targetId = (deleteTarget as any).id || (deleteTarget as any)._id;
      await apiClient.delete(`/pengguna/${targetId}`, undefined, "pengguna");
      toast.success("Berhasil", { description: "Pengguna berhasil dihapus." });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengguna("outlet") });
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Gagal", { description: err.message || "Gagal menghapus pengguna." });
    } finally { setDeleting(false); }
  };

  const columns: ColumnDef<PenggunaItem>[] = [
    {
      accessorKey: "nama",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <span>Nama Pengguna</span> <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-bold text-[#0A2947]">{row.getValue("nama")}</span>,
    },
    {
      accessorKey: "nomorHp",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <span>Nomor HP</span> <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono text-xs font-medium text-[#0A2947]/70">{row.getValue("nomorHp") || "-"}</span>,
    },
    {
      id: "role",
      header: () => <span className="text-xs font-bold text-[#0A2947]/60">Role</span>,
      accessorFn: (row) => {
        if (typeof row.roleID === "object" && row.roleID !== null) return (row.roleID as any).namaRole || "-";
        if (typeof row.roleID === "string") {
          const foundRole = roleList.find((r: any) => r.id === row.roleID || r._id === row.roleID);
          return foundRole ? foundRole.namaRole : "-";
        }
        return "-";
      },
      cell: ({ row }) => <span className="text-sm font-semibold capitalize text-[#0A2947]">{row.getValue("role") as string}</span>,
    },
    {
      accessorKey: "statusPengguna",
      header: () => <div className="text-xs font-bold text-[#0A2947]/60">Status</div>,
      cell: ({ row }) => {
        const isActive = row.original.status === "aktif";
        return (
          // PALET WARNA: Menggunakan Sage Green untuk status Aktif
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${isActive ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}>
            {isActive ? "Aktif" : "Non-Aktif"}
          </span>
        );
      },
    },
    {
      id: "aksi",
      header: () => <div className="text-right text-xs font-bold text-[#0A2947]/60">Aksi</div>,
      cell: ({ row }) => {
        const targetId = (row.original as any)._id || (row.original as any).id;
        let targetLevel = 0;
        if (typeof row.original.roleID === "object" && row.original.roleID !== null) { targetLevel = (row.original.roleID as any).level ?? 0; } 
        else if (typeof row.original.roleID === "string") {
          const foundRole = roleList.find((r: any) => r.id === row.original.roleID || r._id === row.original.roleID || r.namaRole === row.original.roleID);
          if (foundRole) targetLevel = foundRole.level;
        }

        const isSelfRow = targetId === currentUserId;
        const canEdit = isSelfRow || targetLevel < currentUserLevel;
        const canDelete = !isSelfRow && targetLevel < currentUserLevel;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5">
                  <MoreHorizontal className="h-4 w-4" /> <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FFFAF3] border-[#0A2947]/10">
                <DropdownMenuItem className="cursor-pointer font-bold text-[#0A2947] hover:bg-[#0A2947]/5" onClick={() => openEdit(row.original)} disabled={!canEdit}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                <DropdownMenuItem className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10" onClick={() => setDeleteTarget(row.original)} disabled={!canDelete}>Hapus</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-6 px-4 py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Kelola Pengguna</h1>
          <p className="text-sm text-[#0A2947]/60 font-medium">Kelola seluruh entitas akun dan hak akses platform.</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold">
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      {/* MASTER BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 mt-2 auto-rows-min">
        
        {/* WIDGET KIRI: KARYAWAN AKTIF */}
        <div className="col-span-1 md:col-span-12 xl:col-span-3 xl:row-span-2 flex h-full min-h-125">
          {/* PERUBAHAN: Lempar penggunaList agar bisa mencocokkan Role karyawan di dalam widget */}
          <WidgetActiveUsers penggunaList={penggunaList} roleList={roleList} />
        </div>

        {/* WIDGET TENGAH: TOTAL USERS DARK CARD */}
        <div className="col-span-1 md:col-span-6 xl:col-span-5 flex h-full">
          <WidgetTotalUsers penggunaList={penggunaList} />
        </div>

        {/* WIDGET KANAN: AKSES PLATFORM */}
        <div className="col-span-1 md:col-span-6 xl:col-span-4 flex h-full">
          <WidgetAccess penggunaList={penggunaList} />
        </div>

        {/* TABEL DATA */}
        <div className="col-span-1 md:col-span-12 xl:col-span-9 flex flex-col h-full min-h-112.5">
          <div className="rounded-xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col gap-4 grow h-full">
            <h2 className="text-lg font-bold text-[#0A2947] mb-1">Daftar Pengguna Sistem</h2>
            <DataTable
              columns={columns}
              data={penggunaList}
              loading={penggunaLoading}
              emptyMessage="Belum ada pengguna."
              searchKey="nama"
              searchPlaceholder="Cari nama pengguna..."
            />
          </div>
        </div>

      </div>

      {/* DIALOG FORM */}
      <PenggunaFormDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        editTarget={editTarget}
        form={form}
        setForm={setForm}
        formError={formError}
        handleSubmit={handleSubmit}
        isPending={savePenggunaMutation.isPending}
        isSelf={isSelf}
        isOwner={isOwner}
        roleList={roleList}
        currentUserLevel={currentUserLevel}
      />

      {/* DIALOG HAPUS */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="border-[#0A2947]/10 bg-[#FFFAF3]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Hapus pengguna {deleteTarget?.nama}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70">Tindakan ini tidak dapat dibatalkan. Pengguna akan dihapus secara permanen dari sistem.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 bg-transparent font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold">{deleting ? "Menghapus..." : "Hapus"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
