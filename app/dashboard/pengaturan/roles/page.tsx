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
import { Loader2, Plus, Shield, ShieldHalf, ArrowLeft } from "lucide-react"; // Ditambahkan ArrowLeft
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
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6">
      
      {/* HEADER DENGAN TOMBOL BACK */}
      <div className="flex flex-col gap-4 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold"
          onClick={() => router.push("/dashboard/pengaturan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Laman Pengaturan
        </Button>

        {/* PERBAIKAN RESPONSIVE HEADER: flex-col di mobile, flex-row di desktop */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Posisi & Hak Akses
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Kelola jabatan karyawan dan batasan wewenang mereka di sistem.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/pengaturan/roles/buatRole")}
            className="cursor-pointer bg-[#0A2947] font-bold text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Posisi
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60 mb-4" />
          <p className="text-sm font-bold text-[#0A2947]/60">Memuat data posisi...</p>
        </div>
      )}

      {!isLoading && roles.length === 0 && (
        <div className="text-center py-12 border border-[#0A2947]/10 rounded-2xl bg-[#F2EAE1] shadow-sm">
          <p className="text-sm font-bold text-[#0A2947]/60">
            Belum ada posisi karyawan yang dibuat.
          </p>
        </div>
      )}

      {roles.length > 0 && permissionsMaster.length > 0 && (
        <div className="flex flex-col gap-5">
          {roles.map((role, index) => {
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
                // Dibalut dengan warna Cream Gelap
                className="border border-[#0A2947]/10 rounded-2xl p-5 md:p-6 bg-[#F2EAE1] shadow-sm transition-all hover:shadow-md hover:border-[#0A2947]/30"
              >
                {/* PERBAIKAN RESPONSIVE CARD HEADER */}
                {/* flex-col di mobile, flex-row di layar lebih besar (sm) */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  
                  {/* Bagian Judul dan Deskripsi */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-lg text-[#0A2947] capitalize">
                        {role.namaRole}
                      </p>
                      {role.level !== undefined && (
                        // Menggunakan warna Mustard untuk Badge Level
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D4A373] text-white text-xs font-bold shadow-sm">
                          Level {role.level}
                        </span>
                      )}
                    </div>
                    {role.deskripsi ? (
                      <p className="text-sm text-[#0A2947]/70 font-medium leading-relaxed">
                        {role.deskripsi}
                      </p>
                    ) : (
                      <p className="text-sm text-[#0A2947]/50 italic font-medium">
                        Tidak ada deskripsi pekerjaan.
                      </p>
                    )}
                  </div>

                  {/* Bagian Aksi (Jumlah Akses, Edit, Hapus) */}
                  {/* flex-wrap membiarkan elemen turun ke bawah jika layar sempit */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="text-xs text-[#0A2947] bg-[#FFFAF3] border border-[#0A2947]/10 px-3 py-1.5 rounded-lg font-bold shadow-sm">
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
                      className="text-sm font-bold text-[#0A2947] hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      disabled={!canManage}
                      className="text-sm font-bold text-red-600/60 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Garis Besar Wewenang (Area Khusus) */}
                <div className="mt-5 p-4 bg-[#FFFAF3] rounded-xl border border-[#0A2947]/5 shadow-inner">
                  <p className="text-xs font-bold text-[#0A2947]/50 mb-3 uppercase tracking-wider">
                    Garis Besar Wewenang
                  </p>
                  {summaries.length === 0 ? (
                    <p className="text-sm text-[#0A2947]/50 italic font-medium">
                      Tidak memiliki hak akses apa pun.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {summaries.map((s, idx) => (
                        <span
                          key={s.grup || idx}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                            s.isFullAccess
                              // Sage Green untuk Akses Penuh
                              ? "bg-[#718355] text-[#FFFAF3]"
                              // Mustard untuk Akses Sebagian
                              : "bg-[#D4A373] text-[#0A2947]"
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

                {/* Detail Wewenang (Accordion) */}
                {safeRolePerms.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleExpand(roleIdentifier)}
                      className="text-xs font-bold text-[#0A2947]/60 hover:text-[#0A2947] hover:underline cursor-pointer transition-colors"
                    >
                      {isExpanded
                        ? "Sembunyikan Detail Wewenang"
                        : "Lihat Rincian Spesifik Wewenang"}
                    </button>

                    {isExpanded && (
                      <div className="flex flex-wrap gap-2 mt-3 p-4 bg-[#0A2947]/5 rounded-xl border border-[#0A2947]/10">
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
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#FFFAF3] border border-[#0A2947]/10 text-[#0A2947] font-semibold shadow-sm"
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

      {/* DIALOG HAPUS */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Hapus posisi {deleteTarget?.namaRole}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Karyawan yang terikat dengan posisi ini akan kehilangan seluruh
              aksesnya ke sistem. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 bg-transparent font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold"
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