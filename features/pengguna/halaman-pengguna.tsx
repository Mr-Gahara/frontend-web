"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useSession } from "@/lib/auth/useSession";
import { useEffect, useState } from "react";
import { PenggunaItem, PenggunaRequest } from "@/types/pengguna";
import {
  useDaftarPengguna,
  useHapusPengguna,
  useSimpanPengguna,
} from "./hooks";
import { useDaftarRole, useLevelPenggunaAktif } from "@/features/role/hooks";
import { pesanError } from "@/lib/api/error";
import type { Workspace } from "./api";
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
import PenggunaFormDialog from "@/components/pengguna/pengguna-form-dialog";
import {
  WidgetTotalUsers,
  WidgetActiveUsers,
  WidgetAccess,
} from "@/components/pengguna/bento-pengguna-widget";

const emptyForm: PenggunaRequest = {
  nama: "",
  pin: "",
  nomorHp: "",
  roleID: "",
  status: "aktif",
  aksesType: ["web"],
};

/**
 * Halaman manajemen pengguna, dipakai ruang kerja outlet maupun gudang.
 *
 * Sebelumnya kedua halaman berupa salinan 514 baris yang identik. Salinan
 * itu sempat menyimpan bug: halaman gudang menginvalidasi cache pengguna
 * outlet, sehingga tabelnya tidak ikut diperbarui setelah perubahan.
 */
export default function HalamanPengguna({
  workspace,
}: {
  workspace: Workspace;
}) {
  useAuthGuard();
  const { pengguna } = useSession();
  const currentUserId = pengguna?.id ?? "";

  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<PenggunaItem | null>(null);
  const [form, setForm] = useState<PenggunaRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PenggunaItem | null>(null);

  const {
    data: penggunaList = [],
    isLoading: penggunaLoading,
    error: penggunaError,
  } = useDaftarPengguna(workspace);

  const { data: roleList = [] } = useDaftarRole();

  const currentUserLevel = useLevelPenggunaAktif(roleList);

  const isOwner = pengguna?.role === "Owner";
  const isSelf = editTarget ? editTarget.id === currentUserId : false;

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

  const savePenggunaMutation = useSimpanPengguna();

  const simpanPengguna = (id: string | undefined, data: PenggunaRequest) =>
    savePenggunaMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast.success("Berhasil", {
            description: id
              ? "Pengguna berhasil diperbarui."
              : "Pengguna berhasil ditambahkan.",
          });
          setShowDialog(false);
        },
        onError: (err) => {
          setFormError(pesanError(err, "Gagal menyimpan data pengguna."));
        },
      },
    );

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowDialog(true);
  };

  const openEdit = (item: PenggunaItem) => {
    setEditTarget(item);
    // roleID berupa string atau objek hasil populate, tergantung endpoint.
    const roleIdValue =
      typeof item.roleID === "object" && item.roleID !== null
        ? item.roleID.id
        : item.roleID;
    let safeAksesType: ("app" | "web")[] = [];
    if (Array.isArray(item.aksesType)) safeAksesType = item.aksesType;
    else if (typeof item.aksesType === "string")
      safeAksesType = [item.aksesType];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const targetId = editTarget?.id;
    const formData = { ...form };

    if (!formData.nomorHp || formData.nomorHp.trim() === "")
      delete formData.nomorHp;

    if (targetId && (!formData.pin || formData.pin.trim() === "")) {
      delete formData.pin;
    } else if (formData.pin && formData.pin.trim() !== "") {
      // Selaras dengan backend (minimal 6 digit angka) dan input login
      // yang membatasi PIN maksimal 6 karakter: PIN wajib tepat 6 digit.
      if (!/^\d{6}$/.test(formData.pin)) {
        setFormError("PIN harus terdiri dari 6 digit angka.");
        return;
      }
    }

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
    simpanPengguna(targetId, formData);
  };

  const hapusPenggunaMutation = useHapusPengguna();
  const deleting = hapusPenggunaMutation.isPending;

  const handleDelete = () => {
    if (!deleteTarget) return;
    hapusPenggunaMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Berhasil", { description: "Pengguna berhasil dihapus." });
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error("Gagal", {
          description: pesanError(err, "Gagal menghapus pengguna."),
        });
      },
    });
  };

  const columns: ColumnDef<PenggunaItem>[] = [
    {
      accessorKey: "nama",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nama Pengguna</span> <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-bold text-[#0A2947]">{row.getValue("nama")}</span>
      ),
    },
    {
      accessorKey: "nomorHp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-bold text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nomor HP</span> <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-[#0A2947]/70">
          {row.getValue("nomorHp") || "-"}
        </span>
      ),
    },
    {
      id: "role",
      header: () => (
        <span className="text-xs font-bold text-[#0A2947]/60">Role</span>
      ),
      accessorFn: (row) => {
        if (typeof row.roleID === "object" && row.roleID !== null)
          return row.roleID.namaRole || "-";
        if (typeof row.roleID === "string") {
          const foundRole = roleList.find((r) => r.id === row.roleID);
          return foundRole ? foundRole.namaRole : "-";
        }
        return "-";
      },
      cell: ({ row }) => (
        <span className="text-sm font-semibold capitalize text-[#0A2947]">
          {row.getValue("role") as string}
        </span>
      ),
    },
    {
      accessorKey: "statusPengguna",
      header: () => (
        <div className="text-xs font-bold text-[#0A2947]/60">Status</div>
      ),
      cell: ({ row }) => {
        const isActive = row.original.status === "aktif";
        return (
          // PALET WARNA: Menggunakan Sage Green untuk status Aktif
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${isActive ? "bg-[#718355] text-[#FFFAF3]" : "bg-[#0A2947]/10 text-[#0A2947]/60"}`}
          >
            {isActive ? "Aktif" : "Non-Aktif"}
          </span>
        );
      },
    },
    {
      id: "aksi",
      header: () => (
        <div className="text-right text-xs font-bold text-[#0A2947]/60">
          Aksi
        </div>
      ),
      cell: ({ row }) => {
        const targetId = row.original.id;
        let targetLevel = 0;
        if (
          typeof row.original.roleID === "object" &&
          row.original.roleID !== null
        ) {
          targetLevel = row.original.roleID.level ?? 0;
        } else if (typeof row.original.roleID === "string") {
          const foundRole = roleList.find(
            (r) =>
              r.id === row.original.roleID ||
              r.namaRole === row.original.roleID,
          );
          if (foundRole) targetLevel = foundRole.level;
        }

        const isSelfRow = targetId === currentUserId;
        const canEdit = isSelfRow || targetLevel < currentUserLevel;
        const canDelete = !isSelfRow && targetLevel < currentUserLevel;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
                >
                  <MoreHorizontal className="h-4 w-4" />{" "}
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#FFFAF3] border-[#0A2947]/10"
              >
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-[#0A2947] hover:bg-[#0A2947]/5"
                  onClick={() => openEdit(row.original)}
                  disabled={!canEdit}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#0A2947]/10" />
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10"
                  onClick={() => {
                    if (canDelete) setDeleteTarget(row.original);
                  }}
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
    <div className="mx-auto flex w-full max-w-350 flex-col gap-6 px-4 py-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Kelola Pengguna
          </h1>
          <p className="text-sm text-[#0A2947]/60 font-medium">
            Kelola seluruh entitas akun dan hak akses platform.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold"
        >
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
            <h2 className="text-lg font-bold text-[#0A2947] mb-1">
              Daftar Pengguna Sistem
            </h2>
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

      {/* DIALOG FORM
          Dialog baru dirender setelah identitas pengguna tersedia. Tanpa ini,
          isSelf bernilai false pada render pertama karena sesi masih dipulihkan,
          sehingga field PIN sempat tampil saat pengguna mengedit akunnya sendiri. */}
      {currentUserId && (
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
      )}

      {/* DIALOG HAPUS */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-[#0A2947]/10 bg-[#FFFAF3]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Hapus pengguna {deleteTarget?.nama}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70">
              Tindakan ini tidak dapat dibatalkan. Pengguna akan dihapus secara
              permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 bg-transparent font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
