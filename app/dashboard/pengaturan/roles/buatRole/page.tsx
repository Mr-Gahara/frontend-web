"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { GetPermissionsResponse, Permission } from "@/types/role";
import { decodeJWT } from "@/lib/decodeToken";
import { ROLE_TEMPLATES, RoleTemplate } from "@/lib/roleTemplates";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  PlusCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BuatRolePage() {
  useAuthGuard();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(
    null,
  );

  // Dibaca di useEffect agar tidak terjadi hydration mismatch.
  // SSR tidak punya sessionStorage, sehingga nilai level harus 0 dulu
  // saat server render, baru diupdate di client setelah mount.
  const [currentUserLevel, setCurrentUserLevel] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    const token = sessionStorage.getItem("penggunaToken");
    if (token) {
      const payload = decodeJWT(token);
      const level = payload?.role?.level ?? payload?.level ?? 0;
      setCurrentUserLevel(level);
    }
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

  // MUTATION: CREATE ROLE DARI TEMPLATE
  const createRoleMutation = useMutation({
    mutationFn: async (template: RoleTemplate) => {
      // Map nama permission → _id
      const finalPermissionIds = template.permissions
        .map((nama) => {
          const matched = allPermissions.find(
            (p: Permission) => p.nama === nama,
          );
          return matched ? matched._id : null;
        })
        .filter(Boolean) as string[];

      return await apiClient.post(
        "/role",
        {
          namaRole: template.namaRole,
          deskripsi: template.deskripsi,
          permissions: finalPermissionIds,
          level: template.level,
        },
        undefined,
        "pengguna",
      );
    },
    onSuccess: (_, template) => {
      toast.success("Posisi berhasil dibuat", {
        description: `Posisi "${template.namaRole}" telah ditambahkan dari template.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      router.push("/dashboard/pengaturan/roles");
    },
    onError: (err: any, template) => {
      setLoadingTemplateId(null);
      toast.error(`Gagal membuat role "${template.namaRole}"`, {
        description:
          "Pastikan level dan wewenang yang ditetapkan tidak melebihi hak akses Anda.",
      });
    },
  });

  const handleUseTemplate = (template: RoleTemplate) => {
    if (loadingTemplateId) return;
    setLoadingTemplateId(template.id);
    // Pakai mutate (bukan mutateAsync) agar error selalu ditangkap onError
    // dan tidak bubble sebagai unhandled runtime error ke konsol
    createRoleMutation.mutate(template);
  };

  // Label warna badge per rentang level
  const getLevelVariant = (
    level: number,
  ): "outline" | "secondary" | "default" | "destructive" => {
    if (level <= 10) return "outline";
    if (level <= 40) return "secondary";
    if (level <= 60) return "default";
    return "destructive";
  };

  const isDisabled = (template: RoleTemplate) => {
    if (!mounted || permissionsLoading) return true;
    if (currentUserLevel > 0 && template.level >= currentUserLevel) return true;
    return false;
  };

  const disabledReason = (template: RoleTemplate): string | null => {
    // Hanya evaluasi setelah mount agar konsisten dengan SSR (level = 0 di server)
    if (!mounted) return null;
    if (currentUserLevel > 0 && template.level >= currentUserLevel) {
      return `Level ${template.level} melebihi atau setara level Anda (${currentUserLevel})`;
    }
    return null;
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
          onClick={() => router.push("/dashboard/pengaturan/roles")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Posisi
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Tambah Posisi</h1>
          <p className="text-sm text-muted-foreground">
            Pilih salah satu template posisi yang sudah disiapkan, atau buat
            posisi kustom dengan wewenang yang Anda tentukan sendiri.
          </p>
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Template Posisi</p>
          {permissionsLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLE_TEMPLATES.map((template) => {
            const disabled = isDisabled(template);
            const reason = disabledReason(template);
            const isLoading = loadingTemplateId === template.id;

            return (
              <div
                key={template.id}
                className={`relative rounded-xl border bg-card p-5 shadow-sm transition-all ${
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:border-primary/50 hover:shadow-md"
                }`}
              >
                {/* Ikon kunci jika template di-disable karena level */}
                {reason && (
                  <div className="absolute right-3 top-3">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {/* Nama + Level Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold leading-tight">
                      {template.namaRole}
                    </p>
                    <Badge
                      variant={getLevelVariant(template.level)}
                      className="shrink-0 text-xs"
                    >
                      Level {template.level}
                    </Badge>
                  </div>

                  {/* Deskripsi */}
                  <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    {template.deskripsi}
                  </p>

                  {/* Footer: jumlah permission + tombol */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      {template.permissions.length} wewenang
                    </p>

                    {reason ? (
                      <p className="text-xs text-destructive/70 text-right max-w-[160px] leading-snug">
                        {reason}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 cursor-pointer gap-1.5 text-xs"
                        disabled={disabled || !!loadingTemplateId}
                        onClick={() => handleUseTemplate(template)}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Membuat...
                          </>
                        ) : (
                          <>
                            Gunakan
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs text-muted-foreground">atau</p>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Tombol Kustom */}
      <div className="rounded-xl border border-dashed bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Buat Posisi Kustom</p>
            <p className="text-xs text-muted-foreground">
              Tentukan sendiri nama, level, dan wewenang yang dimiliki posisi
              ini.
            </p>
          </div>
          <Button
            variant="default"
            className="cursor-pointer gap-2 shrink-0"
            onClick={() =>
              router.push("/dashboard/pengaturan/roles/buatRole/kostum")
            }
            disabled={!!loadingTemplateId}
          >
            <PlusCircle className="h-4 w-4" />
            Buat Kustom
          </Button>
        </div>
      </div>
    </div>
  );
}
