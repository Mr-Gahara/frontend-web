"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import PolaUtama from "@/components/pola-roster/pola-utama";
import { PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";
import { MasterShiftItem } from "@/types/jadwal";
import { toast } from "sonner";
import { useAuthGuard } from "@/app/hooks/useAuthGuard"; // Sesuaikan path jika berbeda
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function PolaRosterOutletPage() {
  // 1. Keamanan Akses
  useAuthGuard();
  const queryClient = useQueryClient();

  // --- 2. PARALLEL DATA FETCHING ---

  // A. Fetch Pola Roster Outlet
  const {
    data: resPola,
    isLoading: loadPola,
    isError: errPola,
  } = useQuery({
    queryKey: ["pola-roster", "outlet"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/polaRoster?workspace=outlet",
        undefined,
        "pengguna",
      ),
  });

  // B. Fetch Master Shift (HANYA YANG AKTIF)
  const {
    data: resShift,
    isLoading: loadShift,
    isError: errShift,
  } = useQuery({
    queryKey: ["shift", "aktif", "outlet"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/shift?status=Aktif&workspace=outlet",
        undefined,
        "pengguna",
      ),
  });

  // Evaluasi total state
  const isLoadingAll = loadPola || loadShift;
  const isErrorAll = errPola || errShift;

  // --- 3. SAFE DATA MAPPING (DEFENSIVE PROGRAMMING) ---

  // Mapping Master Shift
  const masterShiftList: MasterShiftItem[] = useMemo(() => {
    // Proteksi struktur data axios/fetch
    const rawData = (resShift as any)?.data?.data || resShift?.data || [];
    if (!Array.isArray(rawData)) return [];

    return rawData.map((s: any) => ({
      id: s._id || s.id,
      nama: s.namaShift,
      jam: `${s.jamMasuk} - ${s.jamPulang}`,
    }));
  }, [resShift]);

  // Mapping Pola Roster
  const mappedDataPola: PolaRosterItem[] = useMemo(() => {
    const rawData = (resPola as any)?.data?.data || resPola?.data || [];
    if (!Array.isArray(rawData)) return [];

    return rawData.map((p: any) => {
      // PENTING: Mengamankan pemetaan detailSiklus
      const safeDetailSiklus = Array.isArray(p.detailSiklus)
        ? p.detailSiklus.map((d: any) => {
            // Proteksi: Jika backend melakukan populate(), shiftID akan menjadi object.
            // Kita harus mengekstrak string ID-nya agar komponen Select tidak crash.
            const shiftIdValue = d.shiftID
              ? typeof d.shiftID === "object"
                ? d.shiftID._id || d.shiftID.id
                : d.shiftID
              : "";

            return {
              hariKe: d.hariKe || 0,
              isLibur: !!d.isLibur,
              shiftID: d.isLibur ? "" : shiftIdValue,
            };
          })
        : [];

      return {
        id: p._id || p.id,
        namaPola: p.namaPola || "Tanpa Nama",
        siklusHari: p.siklusHari || 0,
        status: p.status || "Aktif",
        detailSiklus: safeDetailSiklus,
      };
    });
  }, [resPola]);

  // --- 4. MUTATIONS (CREATE, UPDATE, DELETE) ---

  const savePolaMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string;
      data: PolaRosterRequest;
    }) => {
      // Menyuntikkan workspace untuk keamanan berlapis sebelum dikirim ke backend
      const payload = { ...data, workspace: "outlet" };

      if (id) {
        return await apiClient.put(
          `/polaRoster/${id}`,
          payload,
          undefined,
          "pengguna",
        );
      }
      return await apiClient.post(
        "/polaRoster",
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Berhasil", {
        description: `Pola Roster berhasil ${variables.id ? "diperbarui" : "ditambahkan"}.`,
      });
      // Memaksa tabel refresh secara instan
      queryClient.invalidateQueries({ queryKey: ["pola-roster"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", {
        description:
          err.message || "Terjadi kesalahan saat menyimpan Pola Roster.",
      });
    },
  });

  const deletePolaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/polaRoster/${id}`, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Pola Roster berhasil dinonaktifkan.",
      });
      queryClient.invalidateQueries({ queryKey: ["pola-roster"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Menonaktifkan", {
        description:
          err.message || "Terjadi kesalahan saat menonaktifkan Pola Roster.",
      });
    },
  });

  // --- 5. RENDER UI & FATAL ERROR HANDLING ---

  if (isErrorAll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Alert
          variant="destructive"
          className="max-w-md bg-red-50 border-red-200 shadow-sm"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">
            Gagal Memuat Data
          </AlertTitle>
          <AlertDescription className="text-red-700/80 mt-2 font-medium">
            Terjadi kesalahan saat menarik data Pola Roster atau Master Shift
            dari server. Pastikan koneksi internet Anda stabil dan layanan
            aktif.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          className="mt-5 bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-bold px-8 shadow-sm cursor-pointer"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  // Jika aman, render Orkestrator Utama
  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <PolaUtama
        tipeRuang="outlet"
        dataPola={mappedDataPola}
        masterShiftList={masterShiftList}
        isLoading={isLoadingAll}
        onSave={async (data, id) => {
          await savePolaMutation.mutateAsync({ id, data });
        }}
        onDelete={async (id) => {
          await deletePolaMutation.mutateAsync(id);
        }}
        isSaving={savePolaMutation.isPending}
        isDeleting={deletePolaMutation.isPending}
      />
    </div>
  );
}
