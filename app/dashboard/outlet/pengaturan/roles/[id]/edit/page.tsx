"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  BuatRoleRequest,
  Permission,
  GetPermissionsResponse,
  GetRoleDetailResponse,
  GetRolesResponse,
  Role,
} from "@/types/role";
import { decodeJWT } from "@/lib/decodeToken";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

const BASIC_PERMISSIONS = ["read-akun", "read-tenant"];
const RESTRICTED_PERMS = [
  "create-permission",
  "update-permission",
  "delete-permission",
];

export default function EditRolePage() {
  useAuthGuard();

  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const roleId = params.id as string;

  const [namaRole, setNamaRole] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [level, setLevel] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const [warningDialog, setWarningDialog] = useState<{
    isOpen: boolean;
    nama: string;
    penjelasan: string;
  } | null>(null);

  // QUERY 1: MASTER PERMISSION
  const { data: allPermissions = [], isLoading: permissionsLoading } = useQuery(
    {
      queryKey: queryKeys.permissions,
      queryFn: async () => {
        const res = await apiClient.get<GetPermissionsResponse>(
          "/permission",
          undefined,
          "pengguna",
        );
        return res.data;
      },
    },
  );

  // QUERY 2: DETAIL ROLE LAMA
  const {
    data: roleDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery({
    queryKey: queryKeys.roleDetail(roleId),
    enabled: !!roleId,
    queryFn: async () => {
      const res = await apiClient.get<GetRoleDetailResponse>(
        `/role/${roleId}`,
        undefined,
        "pengguna",
      );
      return res.data;
    },
  });

  // QUERY 3: ROLES (untuk derivasi currentUserLevel via fallback)
  const { data: roles = [] } = useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => {
      const res = await apiClient.get<GetRolesResponse>(
        "/role",
        undefined,
        "pengguna",
      );
      return res.data;
    },
  });

  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("penggunaToken")
      : null;
  const tokenPayload = token ? decodeJWT(token) : null;

  const currentUserLevel = useMemo(() => {
    const levelFromToken = tokenPayload?.role?.level ?? 0;
    if (levelFromToken) return levelFromToken;

    if (roles.length > 0) {
      const tokenRoleStr =
        typeof tokenPayload?.role === "string"
          ? tokenPayload.role
          : tokenPayload?.role?.nama;

      const foundMyRole = roles.find(
        (r: Role) =>
          r.namaRole === tokenRoleStr || r._id === tokenPayload?.roleID,
      );
      if (foundMyRole) return foundMyRole.level;
      if (tokenRoleStr === "Owner") return 100;
    }

    return 0;
  }, [token, roles]);

  // LOGIKA RBAC KLIEN
  const allowedPermissions = useMemo(() => {
    return allPermissions.filter((p) => !RESTRICTED_PERMS.includes(p.nama));
  }, [allPermissions]);

  const groupedPermissions = useMemo(() => {
    return allowedPermissions.reduce<Record<string, Permission[]>>(
      (acc, permission) => {
        if (!acc[permission.grup]) acc[permission.grup] = [];
        acc[permission.grup].push(permission);
        return acc;
      },
      {},
    );
  }, [allowedPermissions]);

  // DEFENSIVE: Menangkap wewenang terlarang jika ada (fallback ke array kosong jika undef)
  // DEFENSIVE: Ekstrak string 'nama' jika backend mengirim object
  const hiddenExistingPerms = useMemo(() => {
    if (!roleDetail?.permissions) return [];
    return roleDetail.permissions
      .map((p: any) => (typeof p === "object" ? p.nama : p))
      .filter((p: string) => RESTRICTED_PERMS.includes(p));
  }, [roleDetail]);

  // EFFECT: PRE-POPULATE FORM
  useEffect(() => {
    if (roleDetail) {
      setNamaRole(roleDetail.namaRole || "");
      setDeskripsi(roleDetail.deskripsi || "");
      setLevel(roleDetail.level !== undefined ? String(roleDetail.level) : "");

      const safePerms = (roleDetail.permissions || [])
        .map((p: any) => (typeof p === "object" ? p.nama : p))
        .filter((p: string) => !RESTRICTED_PERMS.includes(p));

      setSelectedPermissions(safePerms);
    }
  }, [roleDetail]);

  useEffect(() => {
    if (detailError) {
      toast.error("Gagal Memuat Posisi", {
        description:
          detailError instanceof Error
            ? detailError.message
            : "Data posisi tidak ditemukan.",
      });
    }
  }, [detailError]);

  // MUTATION: UPDATE ROLE
  const updateRoleMutation = useMutation({
    mutationFn: async (payload: BuatRoleRequest) => {
      return await apiClient.put(
        `/role/${roleId}`,
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Perubahan posisi berhasil disimpan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      queryClient.invalidateQueries({ queryKey: queryKeys.roleDetail(roleId) });
      router.push("/dashboard/outlet/pengaturan/roles");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal memperbarui posisi.");
    },
  });

  // HANDLERS SELEKSI PERMISSION
  const handleCheckbox = (nama: string) => {
    const isBasic = BASIC_PERMISSIONS.includes(nama);
    const isUnchecking = selectedPermissions.includes(nama);

    if (isBasic && isUnchecking) {
      let penjelasan =
        "Fungsi dasar aplikasi akan terganggu tanpa wewenang ini.";

      if (nama === "read-akun") {
        penjelasan =
          "Tanpa wewenang ini, staf tidak dapat melihat informasi identitas bisnis klien di dalam sistem.";
      } else if (nama === "read-tenant") {
        penjelasan =
          "Tanpa wewenang ini, aplikasi tidak bisa mengidentifikasi data profil toko atau cabang saat staf tersebut bekerja.";
      }

      setWarningDialog({ isOpen: true, nama, penjelasan });
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(nama) ? prev.filter((p) => p !== nama) : [...prev, nama],
    );
  };

  const confirmUncheckBasic = () => {
    if (warningDialog) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => p !== warningDialog.nama),
      );
      setWarningDialog(null);
    }
  };

  const handleSelectGroup = (items: Permission[]) => {
    const itemNames = items.map((i) => i.nama);
    const isAllGroupSelected = itemNames.every((name) =>
      selectedPermissions.includes(name),
    );

    if (isAllGroupSelected) {
      setSelectedPermissions((prev) =>
        prev.filter(
          (name) =>
            !itemNames.includes(name) || BASIC_PERMISSIONS.includes(name),
        ),
      );

      const containsBasic = itemNames.some((name) =>
        BASIC_PERMISSIONS.includes(name),
      );
      if (containsBasic) {
        toast.info(
          "Grup dikosongkan, namun hak akses dasar tetap dipertahankan demi kestabilan.",
        );
      }
    } else {
      setSelectedPermissions((prev) => {
        const next = [...prev];
        itemNames.forEach((name) => {
          if (!next.includes(name)) next.push(name);
        });
        return next;
      });
    }
  };

  const handleSelectAllGlobal = () => {
    if (selectedPermissions.length === allowedPermissions.length) {
      setSelectedPermissions(BASIC_PERMISSIONS);
    } else {
      setSelectedPermissions(allowedPermissions.map((p) => p.nama));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (selectedPermissions.length === 0) {
      setFormError("Silakan pilih minimal 1 hak akses untuk posisi ini.");
      return;
    }

    const parsedLevel = parseInt(level, 10);

    if (isNaN(parsedLevel) || parsedLevel <= 0) {
      setFormError("Level harus berupa angka lebih besar dari 0.");
      return;
    }

    if (parsedLevel >= currentUserLevel) {
      setFormError(
        `Level harus lebih rendah dari level Anda saat ini (${currentUserLevel}).`,
      );
      return;
    }

    const finalPermissionsNames = [
      ...selectedPermissions,
      ...hiddenExistingPerms,
    ];

    const finalPermissionIds = finalPermissionsNames
      .map((nama) => {
        const matched = allPermissions.find((p) => p.nama === nama);
        return matched ? matched._id : null;
      })
      .filter(Boolean) as string[];

    const payload: BuatRoleRequest = {
      namaRole,
      ...(deskripsi && { deskripsi }),
      level: parsedLevel,
      permissions: finalPermissionIds,
    };

    await updateRoleMutation.mutateAsync(payload);
  };

  if (isLoadingDetail) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/60">
          Memuat rincian posisi...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/pengaturan/roles")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Posisi
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Edit Posisi</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui nama jabatan atau sesuaikan ulang batasan wewenangnya.
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Nama Posisi / Jabatan</label>
            <Input
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              value={namaRole}
              onChange={(e) => setNamaRole(e.target.value)}
              placeholder="Contoh: Manajer Toko, Kasir Depan, Barista"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Deskripsi Pekerjaan{" "}
              <span className="text-[#0A2947]/50 font-medium">
                (opsional)
              </span>
            </label>
            <Input
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Bertanggung jawab atas transaksi penjualan dan laporan kas harian"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">Level Otoritas</label>
            <Input
              type="number"
              className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="Contoh: 100"
              required
            />
            {currentUserLevel > 0 && (
              <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                Level harus antara 1 hingga {currentUserLevel - 1}. Semakin
                tinggi angka, semakin tinggi otoritas jabatan.
              </p>
            )}
          </div>

          {/* Area Hak Akses */}
          <div className="flex flex-col gap-4 pt-4 border-t border-[#0A2947]/10 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-[#0A2947]">
                  Wewenang Menu Sistem
                </label>
                <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                  {selectedPermissions.length} dari {allowedPermissions.length}{" "}
                  pilihan aktif.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllGlobal}
                className="h-8 text-xs font-bold cursor-pointer transition-colors border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 shadow-sm"
                disabled={permissionsLoading || isLoadingDetail}
              >
                {selectedPermissions.length === allowedPermissions.length &&
                allowedPermissions.length > 0
                  ? "Reset Pilihan"
                  : "Pilih Seluruh Sistem"}
              </Button>
            </div>

            {permissionsLoading ? (
              <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#0A2947]/20 bg-[#FFFAF3]">
                <Loader2 className="h-6 w-6 animate-spin text-[#0A2947]/40" />
                <p className="text-sm font-bold text-[#0A2947]/60">
                  Memuat daftar wewenang...
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] overflow-hidden shadow-inner">
                {Object.entries(groupedPermissions).map(([grup, items], i) => {
                  const itemNames = items.map((item) => item.nama);
                  const isGroupAllSelected = itemNames.every((name) =>
                    selectedPermissions.includes(name),
                  );

                  return (
                    <div
                      key={grup}
                      className={`px-5 py-5 ${
                        i < Object.keys(groupedPermissions).length - 1
                          ? "border-b border-[#0A2947]/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-5 border-b border-[#0A2947]/5 pb-2">
                        <p className="text-xs font-bold text-[#0A2947]/50 uppercase tracking-wider">
                          {grup}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectGroup(items)}
                          className={`h-7 px-3 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                            isGroupAllSelected
                              ? "text-[#D4A373] hover:bg-[#D4A373]/10" 
                              : "text-[#718355] hover:bg-[#718355]/10" 
                          }`}
                        >
                          {isGroupAllSelected
                            ? "Kosongkan Grup"
                            : "Pilih Semua di Grup"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                        {items.map((permission) => (
                          <div
                            key={permission._id}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={`edit-${permission._id}`}
                              checked={selectedPermissions.includes(
                                permission.nama,
                              )}
                              onCheckedChange={() =>
                                handleCheckbox(permission.nama)
                              }
                              className="mt-0.5 cursor-pointer border-[#0A2947]/30 data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                            />
                            <div className="grid gap-1 leading-none">
                              <label
                                htmlFor={`edit-${permission._id}`}
                                className="text-sm font-bold cursor-pointer text-[#0A2947]"
                              >
                                {permission.deskripsi || permission.nama}
                              </label>
                              <p className="text-xs font-medium text-[#0A2947]/50 font-mono">
                                {permission.nama}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {formError && (
            <p className="text-sm font-bold text-red-600 px-2">{formError}</p>
          )}

          {/* Tombol Simpan Bawah */}
          <div className="flex justify-end gap-3 border-t border-[#0A2947]/10 pt-6 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/outlet/pengaturan/roles")}
              disabled={updateRoleMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                updateRoleMutation.isPending ||
                permissionsLoading ||
                isLoadingDetail
              }
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm px-6"
            >
              {updateRoleMutation.isPending
                ? "Menyimpan Perubahan..."
                : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>

      {/* ALERT DIALOG */}
      <AlertDialog
        open={warningDialog?.isOpen || false}
        onOpenChange={(open) => {
          if (!open) setWarningDialog(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#0A2947]">
              <AlertTriangle className="h-5 w-5 text-[#D4A373]" />
              Peringatan Hak Akses Vital
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#0A2947]/70 leading-relaxed pt-2">
              Anda mencoba menonaktifkan hak akses dasar{" "}
              <strong className="text-[#0A2947]">{warningDialog?.nama}</strong>.
              <br />
              <br />
              {warningDialog?.penjelasan}
              <br />
              <br />
              Apakah Anda yakin ingin tetap menghapus hak akses ini untuk staf
              Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">
              Batal (Tetap Aktifkan)
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
              onClick={confirmUncheckBasic}
            >
              Ya, Hapus Akses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}