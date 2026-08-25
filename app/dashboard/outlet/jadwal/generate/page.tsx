"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";

import {
  StepSatuForm,
  GenerateParams,
} from "@/components/jadwal/generate/step-satu-form";
import { StepDuaPreview } from "@/components/jadwal/generate/step-dua-preview";

import { KaryawanJadwal, MasterShiftItem } from "@/types/jadwal";
import { PolaRosterItem } from "@/types/pola-roster";

export default function AutoGenerateJadwalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- 1. STATE WIZARD ---
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [generateParams, setGenerateParams] = useState<
    GenerateParams | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // --- 2. DATA FETCHING (PARALEL) ---

  // A. Fetch Karyawan Outlet
  const {
    data: resKaryawan,
    isLoading: loadKaryawan,
    isError: errKaryawan,
  } = useQuery({
    queryKey: ["pengguna", "outlet"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/pengguna?workspace=outlet",
        undefined,
        "pengguna",
      ),
  });

  // B. Fetch Master Shift (Aktif)
  const {
    data: resShift,
    isLoading: loadShift,
    isError: errShift,
  } = useQuery({
    queryKey: ["shift", "aktif"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/shift?status=Aktif",
        undefined,
        "pengguna",
      ),
  });

  // C. Fetch Pola Roster
  const {
    data: resPola,
    isLoading: loadPola,
    isError: errPola,
  } = useQuery({
    queryKey: ["pola-roster"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>("/polaRoster", undefined, "pengguna"),
  });

  const isLoadingAll = loadKaryawan || loadShift || loadPola;
  const isErrorAll = errKaryawan || errShift || errPola;

  // --- 3. DATA MAPPING (Transformasi Backend ke UI) ---

  const karyawanList: KaryawanJadwal[] = useMemo(() => {
    if (!resKaryawan?.data) return [];
    return resKaryawan.data.map((k) => ({
      id: k.id || k._id,
      nama: k.namaLengkap || k.nama || "Tanpa Nama",
      role: k.role || "Staf",
      jadwalMap: {}, // Kosongkan karena kita tidak butuh data existing di form generate ini
    }));
  }, [resKaryawan]);

  const masterShiftList: MasterShiftItem[] = useMemo(() => {
    if (!resShift?.data) return [];
    return resShift.data.map((s) => ({
      id: s.id,
      nama: s.namaShift,
      jam: `${s.jamMasuk} - ${s.jamPulang}`,
    }));
  }, [resShift]);

  const polaRosterList: PolaRosterItem[] = useMemo(() => {
    if (!resPola?.data) return [];
    return resPola.data.map((p) => ({
      id: p.id,
      namaPola: p.namaPola,
      siklusHari: p.siklusHari,
      detailSiklus: p.detailSiklus || [], // Wajib disertakan agar Step 2 bisa simulasi!
    }));
  }, [resPola]);

  // --- 4. HANDLERS ---

  const handleCancel = () => {
    router.push("/dashboard/outlet/jadwal");
  };

  const handleNextToPreview = (params: GenerateParams) => {
    setGenerateParams(params);
    setCurrentStep(2);
    setSubmitError("");
  };

  const handleBackToForm = () => {
    setCurrentStep(1);
    setSubmitError("");
  };

  const handleFinalSubmit = async (bulkPayload: any) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Sesuai standar API REST, endpoint untuk insert banyak data sekaligus biasanya diberi embel-embel /bulk
      // Jika di backend-mu endpoint-nya beda, sesuaikan string "/jadwalShift/bulk" ini
      await apiClient.post(
        "/jadwalShift/bulk",
        bulkPayload,
        undefined,
        "pengguna",
      );

      queryClient.invalidateQueries({ queryKey: ["jadwal-shift"] });

      // Sukses! Lempar kembali ke halaman kalender
      router.push("/dashboard/outlet/jadwal");
    } catch (error: any) {
      setSubmitError(error.message || "Gagal menyimpan jadwal ke server.");
      setIsSubmitting(false);
    }
  };

  // --- 5. RENDER UI LAYOUT ---

  if (isLoadingAll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#041E3F] mb-4" />
        <p className="text-[#041E3F]/70 font-bold">
          Mempersiapkan mesin generator...
        </p>
      </div>
    );
  }

  if (isErrorAll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="font-bold">
            Gagal mengambil data master dari server. Pastikan koneksi stabil.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-[#041E3F] text-[#FFFAF3] rounded-xl font-bold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-2 sm:px-6 w-full max-w-[95vw] mx-auto min-h-[85vh]">
      {/* TOMBOL KEMBALI GLOBAL */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-2 text-[#041E3F]/60 hover:text-[#041E3F] font-bold text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali ke Kalender Jadwal
      </button>

      {/* ERROR BANNER GLOBAL (Jika API Bulk Insert Gagal) */}
      {submitError && currentStep === 2 && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-6 max-w-6xl mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      {/* DYNAMIC COMPONENT RENDERER */}
      {currentStep === 1 ? (
        <StepSatuForm
          polaRosterList={polaRosterList}
          karyawanList={karyawanList}
          initialData={generateParams}
          onNext={handleNextToPreview}
          onCancel={handleCancel}
        />
      ) : (
        <StepDuaPreview
          params={generateParams!}
          polaRosterList={polaRosterList}
          masterShiftList={masterShiftList}
          karyawanList={karyawanList}
          onBack={handleBackToForm}
          onSubmit={handleFinalSubmit}
          isPending={isSubmitting}
        />
      )}
    </div>
  );
}
