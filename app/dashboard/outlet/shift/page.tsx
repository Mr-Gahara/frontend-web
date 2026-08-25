"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import ShiftUtama from "@/components/shift/shift-utama";
import { ShiftItem, ShiftRequest } from "@/types/shift";
import { toast } from "sonner";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

export default function MasterShiftOutletPage() {
  // Melindungi rute agar hanya bisa diakses user yang sudah login
  useAuthGuard();

  const queryClient = useQueryClient();

  // --- 1. FETCHING DATA (READ) ---
  const { data: resShift, isLoading } = useQuery({
    queryKey: ["shift", "outlet"],
    queryFn: async () => {
      // Kita panggil tanpa filter status agar tabel bisa menampilkan yang Aktif & Non-Aktif
      const res = await apiClient.get<{ data: any[] }>(
        "/shift?workspace=outlet",
        undefined,
        "pengguna",
      );
      // Fallback fallback yang aman
      return (res as any).data?.data || res.data || [];
    },
  });

  // Mapping data agar aman sesuai kontrak Interface UI kita
  const mappedDataShift: ShiftItem[] = useMemo(() => {
    if (!Array.isArray(resShift)) return [];

    return resShift.map((s: any) => {
      if (!s.tenantID) {
        console.warn(
          `Peringatan: Data Shift ${s.namaShift} tidak memiliki tenantID!`,
        );
      }

      return {
        id: s._id || s.id,
        tenantID: s.tenantID,
        namaShift: s.namaShift,
        jamMasuk: s.jamMasuk,
        jamPulang: s.jamPulang,
        isLintasHari: s.isLintasHari,
        toleransiTerlambat: s.toleransiTerlambat,
        status: s.status,
      };
    });
  }, [resShift]);

  // --- 2. MUTATION DATA (CREATE & UPDATE) ---
  const saveShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: ShiftRequest }) => {
      // Pastikan workspace outlet terkirim ke backend jika diperlukan
      const payload = { ...data, workspace: "outlet" };

      if (id) {
        // Mode Edit (PUT)
        return await apiClient.put(
          `/shift/${id}`,
          payload,
          undefined,
          "pengguna",
        );
      }
      // Mode Tambah Baru (POST)
      return await apiClient.post("/shift", payload, undefined, "pengguna");
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", {
        description: `Master shift berhasil ${variables.id ? "diperbarui" : "ditambahkan"}.`,
      });
      // Memaksa TanStack menarik data terbaru dari server
      queryClient.invalidateQueries({ queryKey: ["shift"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", {
        description:
          err.message || "Terjadi kesalahan saat menyimpan master shift.",
      });
    },
  });

  // --- 3. MUTATION DATA (SOFT-DELETE) ---
  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      // Sesuai arsitektur backend, Delete akan mengubah status menjadi "Non-Aktif"
      return await apiClient.delete(`/shift/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Shift berhasil dinonaktifkan dan diarsipkan.",
      });
      queryClient.invalidateQueries({ queryKey: ["shift"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Menonaktifkan", {
        description:
          err.message || "Terjadi kesalahan saat menonaktifkan shift.",
      });
    },
  });

  // --- 4. RENDER UI ---
  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <ShiftUtama
        tipeRuang="outlet"
        dataShift={mappedDataShift}
        isLoading={isLoading}
        // Operasi Save (Terima dari child, oper ke mutasi)
        onSave={async (data, id) => {
          await saveShiftMutation.mutateAsync({ id, data });
        }}
        // Operasi Delete (Terima dari child, oper ke mutasi)
        onDelete={async (id) => {
          await deleteShiftMutation.mutateAsync(id);
        }}
        // Indikator Loading khusus saat proses simpan/hapus
        isSaving={saveShiftMutation.isPending}
        isDeleting={deleteShiftMutation.isPending}
      />
    </div>
  );
}
