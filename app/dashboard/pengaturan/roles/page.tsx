"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useEffect, useMemo, useState } from "react";
import { decodeJWT } from "@/lib/decodeToken";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { Role, GetRolesResponse, GetPermissionsResponse } from "@/types/role";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Shield, ShieldHalf } from "lucide-react";
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
import { Button } from "@/components/ui/button";

const RESTRICTED_PERMS = [
  "create-permission",
  "update-permission",
  "delete-permission",
];

export default function RolesPage() {
  useAuthGuard();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // QUERY 1: MASTER PERMISSION
  const { data: permissionsMaster = [], isLoading: permissionsLoading } =
    useQuery({
      queryKey: queryKeys.permissions,
      queryFn: async () => {
        const res = await apiClient.get<GetPermissionsResponse>(
          "/permission",
          undefined,
          "pengguna",
        );
        return res.data;
      },
    });

  // QUERY 2: ROLES
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
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
        (r) => r.namaRole === tokenRoleStr || r._id === tokenPayload?.roleID,
      );
      if (foundMyRole) return foundMyRole.level;
      if (tokenRoleStr === "Owner") return 100;
    }

    return 0;
  }, [token, roles]);

  const allowedPermissionsMaster = permissionsMaster.filter(
    (p) => !RESTRICTED_PERMS.includes(p.nama),
  );

  const groupMap = allowedPermissionsMaster.reduce(
    (acc, curr) => {
      if (!acc[curr.grup]) acc[curr.grup] = 0;
      acc[curr.grup]++;
      return acc;
    },
    {} as Record<string, number>,
  );

  useEffect(() => {
    if (rolesError) {
      toast.error("Gagal", {
        description:
          rolesError instanceof Error
            ? rolesError.message
            : "Gagal memuat peran.",
      });
    }
  }, [rolesError]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/role/${id}`);
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Posisi karyawan telah dihapus.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal menghapus posisi.",
      });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Ambil _id jika ada, jika tidak fallback ke id tanpa menggunakan 'any'
    const targetId = (deleteTarget as any)._id || (deleteTarget as any).id;

    if (!targetId) {
      toast.error("Gagal", { description: "ID posisi tidak valid." });
      return;
    }

    await deleteMutation.mutateAsync(targetId);
  };

  if (!mounted) return null;

  const isLoading = rolesLoading || permissionsLoading;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Posisi & Hak Akses
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola jabatan karyawan dan batasan wewenang mereka di sistem.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/pengaturan/roles/buatRole")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Posisi
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Memuat data posisi...</p>
        </div>
      )}

      {!isLoading && roles.length === 0 && (
        <div className="text-center py-12 border rounded-xl bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">
            Belum ada posisi karyawan yang dibuat.
          </p>
        </div>
      )}

      {roles.length > 0 && permissionsMaster.length > 0 && (
        <div className="flex flex-col gap-4">
          {roles.map((role, index) => {
            // Bulletproof Identity Check
            const roleIdentifier =
              (role as any)._id || (role as any).id || `fallback-role-${index}`;
            const isExpanded = expandedRoles.has(roleIdentifier);

            const safeRolePerms = (role.permissions || []).filter((p: any) => {
              const permName = typeof p === "object" ? p.nama : p;
              return !RESTRICTED_PERMS.includes(permName);
            });

            const canManage = role.level < currentUserLevel;

            const roleGroupCounts = safeRolePerms.reduce(
              (acc, p: any) => {
                const permName = typeof p === "object" ? p.nama : p;
                const masterData = allowedPermissionsMaster.find(
                  (m) => m.nama === permName,
                );
                if (masterData) {
                  if (!acc[masterData.grup]) acc[masterData.grup] = 0;
                  acc[masterData.grup]++;
                }
                return acc;
              },
              {} as Record<string, number>,
            );

            const summaries = Object.entries(roleGroupCounts).map(
              ([grup, count]) => {
                const totalInGroup = groupMap[grup] || 0;
                const isFullAccess = count === totalInGroup;
                return { grup, isFullAccess, count, totalInGroup };
              },
            );

            return (
              <div
                key={roleIdentifier}
                className="border border-border rounded-xl p-5 bg-card shadow-sm transition-all hover:shadow-md"
              >
                {/* Header & Aksi */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base text-card-foreground capitalize">
                        {role.namaRole}
                      </p>
                      {role.level !== undefined && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                          Level {role.level}
                        </span>
                      )}
                    </div>
                    {role.deskripsi ? (
                      <p className="text-sm text-muted-foreground font-medium">
                        {role.deskripsi}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Tidak ada deskripsi pekerjaan.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-md font-medium">
                      {safeRolePerms.length} / {allowedPermissionsMaster.length}{" "}
                      Akses
                    </span>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/pengaturan/roles/${roleIdentifier}/edit`,
                        )
                      }
                      disabled={!canManage}
                      className="text-sm font-semibold text-primary hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      disabled={!canManage}
                      className="text-sm font-semibold text-destructive hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Garis Besar Wewenang
                  </p>
                  {summaries.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Tidak memiliki hak akses apa pun.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {summaries.map((s, idx) => (
                        <span
                          key={s.grup || idx}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            s.isFullAccess
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {s.isFullAccess ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldHalf className="h-3.5 w-3.5" />
                          )}
                          {s.isFullAccess
                            ? `Akses Penuh ${s.grup}`
                            : `Akses Sebagian ${s.grup}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {safeRolePerms.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpand(roleIdentifier)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {isExpanded
                        ? "Sembunyikan Detail Wewenang"
                        : "Lihat Rincian Spesifik Wewenang"}
                    </button>

                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5 mt-2 p-3 bg-secondary/50 rounded-lg border border-border">
                        {safeRolePerms.map((p: any, pIndex: number) => {
                          const permName = typeof p === "object" ? p.nama : p;
                          const permKey =
                            typeof p === "object" ? p._id || p.id || p.nama : p;
                          const masterData = allowedPermissionsMaster.find(
                            (m) => m.nama === permName,
                          );
                          return (
                            <span
                              key={permKey || `fallback-perm-${pIndex}`}
                              className="text-xs px-2 py-1 rounded-md bg-background border border-border text-foreground"
                            >
                              {masterData?.deskripsi || permName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus posisi {deleteTarget?.namaRole}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Karyawan yang terikat dengan posisi ini akan kehilangan seluruh
              aksesnya ke sistem. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus Posisi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
