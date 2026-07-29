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
      router.push("/dashboard/outlet/pengaturan/roles");
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
    createRoleMutation.mutate(template);
  };

  const isDisabled = (template: RoleTemplate) => {
    if (!mounted || permissionsLoading) return true;
    if (currentUserLevel > 0 && template.level >= currentUserLevel) return true;
    return false;
  };

  const disabledReason = (template: RoleTemplate): string | null => {
    if (!mounted) return null;
    if (currentUserLevel > 0 && template.level >= currentUserLevel) {
      return `Level ${template.level} melebihi hak Anda`;
    }
    return null;
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      
      {/* Header & Back Button */}
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
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Tambah Posisi</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Pilih salah satu template posisi yang sudah disiapkan, atau buat
            posisi kustom dengan wewenang Anda sendiri.
          </p>
        </div>
      </div>

      {/* POSISI KUSTOM */}
      {/* PERBAIKAN: Card digelapkan pakai Dark Cream (#F2EAE1) agar tidak nyaru dengan background */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-bold text-[#0A2947]">Buat Posisi Kustom</p>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Tentukan sendiri nama, level, dan wewenang yang dimiliki posisi ini dari nol.
            </p>
          </div>
          <Button
            className="cursor-pointer gap-2 shrink-0 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold w-full sm:w-auto"
            onClick={() =>
              router.push("/dashboard/outlet/pengaturan/roles/buatRole/kostum")
            }
            disabled={!!loadingTemplateId}
          >
            <PlusCircle className="h-4 w-4" />
            Buat Kustom
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-[#0A2947]/10" />
        <p className="text-xs font-bold text-[#0A2947]/40 uppercase tracking-widest">atau gunakan template</p>
        <div className="h-px flex-1 bg-[#0A2947]/10" />
      </div>

      {/* Template Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#0A2947]/70">
          <ShieldCheck className="h-5 w-5 text-[#0A2947]" />
          <p className="text-sm font-bold text-[#0A2947]">Rekomendasi Template Sistem</p>
          {permissionsLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-[#0A2947]/60 ml-2" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_TEMPLATES.map((template) => {
            const disabled = isDisabled(template);
            const reason = disabledReason(template);
            const isLoading = loadingTemplateId === template.id;

            return (
              <div
                key={template.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 min-h-40 ${
                  disabled
                    ? "cursor-not-allowed opacity-60 border-[#0A2947]/5 bg-[#0A2947]/5"
                    : "cursor-pointer border-[#0A2947]/10 bg-[#F2EAE1] hover:border-[#0A2947]/30 hover:shadow-md"
                }`}
              >
                {/* Ikon Gembok */}
                {reason && (
                  <div className="absolute right-4 top-4 p-1.5 bg-[#FFFAF3]/50 rounded-md">
                    <Lock className="h-3.5 w-3.5 text-[#0A2947]/60" />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-bold leading-tight text-[#0A2947]">
                      {template.namaRole}
                    </p>
                    {/* Badge Level: Menggunakan Mustard sebagai aksen kecil yang cakep */}
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[10px] font-bold bg-[#0A2947] text-[#F2EAE1] border-none shadow-sm"
                    >
                      Lvl {template.level}
                    </Badge>
                  </div>

                  <p className="text-xs font-medium leading-relaxed text-[#0A2947]/70 line-clamp-3">
                    {template.deskripsi}
                  </p>
                </div>

                <div className="flex items-end justify-between pt-4 mt-auto">
                  <p className="text-[11px] font-bold text-[#D4A373] bg-[#FFFAF3] px-2 py-1 rounded-md border border-[#0A2947]/5">
                    {template.permissions.length} Wewenang
                  </p>

                  {reason ? (
                    <p className="text-[10px] font-bold text-[#0A2947]/50 text-right max-w-30leading-snug">
                      {reason}
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 cursor-pointer gap-1.5 text-xs font-bold bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 border-none shadow-sm transition-colors"
                      disabled={disabled || !!loadingTemplateId}
                      onClick={() => handleUseTemplate(template)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Membuat...
                        </>
                      ) : (
                        <>
                          Gunakan
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}