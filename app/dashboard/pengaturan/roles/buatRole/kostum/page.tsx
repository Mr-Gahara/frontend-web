"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  BuatRoleRequest,
  GetPermissionsResponse,
  GetRolesResponse,
  Permission,
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

// HANYA Wewenang "Read" esensial.
// update-pengguna tidak dimasukkan agar tidak membocorkan wewenang edit staf lain.
const BASIC_PERMISSIONS = ["read-akun", "read-tenant"];
const RESTRICTED_PERMS = [
  "create-permission",
  "update-permission",
  "delete-permission",
];

export default function BuatRoleKostumPage() {
  useAuthGuard();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [namaRole, setNamaRole] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [level, setLevel] = useState("");

  const [selectedPermissions, setSelectedPermissions] =
    useState<string[]>(BASIC_PERMISSIONS);
  const [formError, setFormError] = useState("");

  // State untuk mengontrol Alert Dialog Wewenang Dasar
  const [warningDialog, setWarningDialog] = useState<{
    isOpen: boolean;
    nama: string;
    penjelasan: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // QUERY: MASTER PERMISSION
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

  // QUERY: ROLES (untuk derivasi currentUserLevel via fallback)
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

  // MUTATION: BUAT ROLE BARU
  const createRoleMutation = useMutation({
    mutationFn: async (payload: BuatRoleRequest) => {
      return await apiClient.post("/role", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Posisi karyawan baru telah berhasil dibuat.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      router.push("/dashboard/pengaturan/roles");
    },
    onError: (err: any) => {
      setFormError(err.message || "Gagal membuat posisi baru.");
    },
  });

  // HANDLERS SELEKSI PERMISSION
  const handleCheckbox = (nama: string) => {
    const isBasic = BASIC_PERMISSIONS.includes(nama);
    const isUnchecking = selectedPermissions.includes(nama);

    // Jika mencoba menghilangkan hak akses dasar, tahan proses dan tampilkan Alert
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
      return; // Hentikan fungsi agar checkbox tidak langsung hilang
    }

    // Toggle normal untuk hak akses lainnya
    setSelectedPermissions((prev) =>
      prev.includes(nama) ? prev.filter((p) => p !== nama) : [...prev, nama],
    );
  };

  // Eksekusi pelepasan ceklis jika Owner bersikeras di Alert Dialog
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

    // MAPPING: Konversi Nama ke _id untuk dikirim ke Backend
    const finalPermissionIds = selectedPermissions
      .map((nama) => {
        const matched = allPermissions.find((p) => p.nama === nama);
        return matched ? matched._id : null;
      })
      .filter(Boolean) as string[];

    const payload: BuatRoleRequest = {
      namaRole,
      ...(deskripsi && { deskripsi }),
      permissions: finalPermissionIds,
      level: parsedLevel,
    };

    await createRoleMutation.mutateAsync(payload);
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => router.push("/dashboard/pengaturan/roles/buatRole")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Pilih Template
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Tambah Posisi Kustom
          </h1>
          <p className="text-sm text-muted-foreground">
            Buat jabatan baru dan tentukan batasan wewenang kerjanya.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Posisi / Jabatan</label>
            <Input
              value={namaRole}
              onChange={(e) => setNamaRole(e.target.value)}
              placeholder="Contoh: Manajer Toko, Kasir Depan, Barista"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Deskripsi Pekerjaan{" "}
              <span className="text-muted-foreground font-normal">
                (opsional)
              </span>
            </label>
            <Input
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Bertanggung jawab atas transaksi penjualan dan laporan kas harian"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Level</label>
            <Input
              type="number"
              className="no-spinner"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="Contoh: 100"
              required
            />
            {currentUserLevel > 0 && (
              <p className="text-xs text-muted-foreground">
                Level harus antara 1 hingga {currentUserLevel - 1}. Semakin
                tinggi angka, semakin tinggi otoritas jabatan.
              </p>
            )}
          </div>

          {/* Area Hak Akses */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">
                  Wewenang Menu Sistem
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedPermissions.length} dari {allowedPermissions.length}{" "}
                  pilihan aktif.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllGlobal}
                className="h-8 text-xs cursor-pointer"
                disabled={permissionsLoading}
              >
                {selectedPermissions.length === allowedPermissions.length &&
                allowedPermissions.length > 0
                  ? "Reset Pilihan"
                  : "Pilih Seluruh Sistem"}
              </Button>
            </div>

            {permissionsLoading ? (
              <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Memuat daftar wewenang...
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {Object.entries(groupedPermissions).map(([grup, items], i) => {
                  const itemNames = items.map((item) => item.nama);
                  const isGroupAllSelected = itemNames.every((name) =>
                    selectedPermissions.includes(name),
                  );

                  return (
                    <div
                      key={grup}
                      className={`px-4 py-4 ${
                        i < Object.keys(groupedPermissions).length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      {/* Header Grup Kategori */}
                      <div className="flex items-center justify-between mb-4 border-b border-muted pb-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {grup}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectGroup(items)}
                          className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer"
                        >
                          {isGroupAllSelected
                            ? "Kosongkan Grup"
                            : "Pilih Semua di Grup"}
                        </Button>
                      </div>

                      {/* Item di dalam Kategori */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        {items.map((permission) => (
                          <div
                            key={permission._id}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={permission._id}
                              checked={selectedPermissions.includes(
                                permission.nama,
                              )}
                              onCheckedChange={() =>
                                handleCheckbox(permission.nama)
                              }
                              className="mt-0.5 cursor-pointer"
                            />
                            <div className="grid gap-1 leading-none">
                              <label
                                htmlFor={permission._id}
                                className="text-sm font-medium cursor-pointer text-foreground"
                              >
                                {permission.deskripsi || permission.nama}
                              </label>
                              <p className="text-xs text-muted-foreground font-mono">
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
            <p className="text-sm font-medium text-destructive">{formError}</p>
          )}

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-3 border-t pt-5 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push("/dashboard/pengaturan/roles/buatRole")
              }
              disabled={createRoleMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending || permissionsLoading}
              className="cursor-pointer"
            >
              {createRoleMutation.isPending
                ? "Menyimpan Posisi..."
                : "Simpan Posisi Baru"}
            </Button>
          </div>
        </form>
      </div>

      {/* ALERT DIALOG: Peringatan Hak Akses Dasar */}
      <AlertDialog
        open={warningDialog?.isOpen || false}
        onOpenChange={(open) => {
          if (!open) setWarningDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Peringatan Hak Akses Vital
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Anda mencoba menonaktifkan hak akses dasar{" "}
              <strong>{warningDialog?.nama}</strong>.
              <br />
              <br />
              {warningDialog?.penjelasan}
              <br />
              <br />
              Apakah Anda yakin ingin tetap menghapus hak akses ini untuk staff
              Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal (Tetap Aktifkan)
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700 focus:ring-red-600"
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