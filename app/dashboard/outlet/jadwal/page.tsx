"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import JadwalUtama from "@/components/jadwal/jadwal-utama";
import {
  KaryawanJadwal,
  ShiftItem,
  MasterShiftItem,
  PolaRosterItem,
  JadwalManualPayload,
  JadwalUpdatePayload,
} from "@/types/jadwal";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // ✅ IMPOR TOAST UNTUK NOTIFIKASI ERROR/SUKSES

export default function JadwalOutletPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }, []);
  const handleNextMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }, []);

  const { startDate, endDate } = useMemo(
    () => ({
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      )
        .toISOString()
        .split("T")[0],
    }),
    [currentDate],
  );

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

  const { data: resShift, isLoading: loadShift } = useQuery({
    queryKey: ["shift", "aktif"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/shift?status=Aktif",
        undefined,
        "pengguna",
      ),
  });

  const { data: resPola, isLoading: loadPola } = useQuery({
    queryKey: ["pola-roster"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>("/polaRoster", undefined, "pengguna"),
  });

  const {
    data: resJadwal,
    isLoading: loadJadwal,
    isError: errJadwal,
  } = useQuery({
    queryKey: ["jadwal-shift", startDate, endDate],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        `/jadwalShift?startDate=${startDate}&endDate=${endDate}`,
        undefined,
        "pengguna",
      ),
  });

  const isLoadingAll = loadKaryawan || loadShift || loadPola || loadJadwal;
  const isErrorAll = errKaryawan || errJadwal;

  const queryClient = useQueryClient();

  // ✅ MUTASI: CREATE (Tambah Baru)
  const { mutateAsync: simpanJadwalManual, isPending: isSavingManual } =
    useMutation({
      mutationFn: (payload: JadwalManualPayload) =>
        apiClient.post("/jadwalShift", payload, undefined, "pengguna"),
      onSuccess: () => {
        toast.success("Jadwal Berhasil Dibuat", {
          description: "Jadwal shift baru telah diterapkan.",
        });
        queryClient.invalidateQueries({ queryKey: ["jadwal-shift"] });
      },
      onError: (err: any) => {
        toast.error("Gagal Menyimpan", {
          description: err.message || "Terdapat bentrokan atau kesalahan data.",
        });
        throw err; // Lempar error agar modal tidak tertutup jika gagal
      },
    });

  // MUTASI: UPDATE (Edit Jadwal)
  const { mutateAsync: updateJadwalManual, isPending: isUpdatingManual } =
    useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: JadwalUpdatePayload;
      }) => apiClient.put(`/jadwalShift/${id}`, payload, undefined, "pengguna"),
      onSuccess: () => {
        toast.success("Jadwal Diperbarui", {
          description: "Perubahan jadwal telah disimpan.",
        });
        queryClient.invalidateQueries({ queryKey: ["jadwal-shift"] });
      },
      onError: (err: Error) => {
        toast.error("Gagal Memperbarui", {
          description: err.message || "Gagal mengubah data jadwal.",
        });
        throw err;
      },
    });

  // MUTASI: DELETE (Hapus Jadwal)
  const { mutateAsync: deleteJadwalManual, isPending: isDeletingManual } =
    useMutation({
      mutationFn: (id: string) =>
        apiClient.delete(`/jadwalShift/${id}`, undefined, "pengguna"),
      onSuccess: () => {
        toast.success("Jadwal Dihapus", {
          description: "Jadwal telah dihapus dari sistem.",
        });
        queryClient.invalidateQueries({ queryKey: ["jadwal-shift"] });
      },
      onError: (err: Error) => {
        toast.error("Gagal Menghapus", {
          description:
            err.message || "Terjadi kesalahan saat menghapus jadwal.",
        });
        throw err;
      },
    });

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
      nama: p.namaPola,
      siklus: p.siklusHari,
    }));
  }, [resPola]);

  const mappedDataKaryawan: KaryawanJadwal[] = useMemo(() => {
    if (!resKaryawan?.data) return [];

    const rawData = resKaryawan.data.map((k) => ({
      id: String(k.id || k._id),
      nama: k.namaLengkap || k.nama || "Tanpa Nama",
      role: k.role || "Staf",
      jadwalMap: {} as Record<number, ShiftItem[]>,
    }));

    if (resJadwal?.data) {
      resJadwal.data.forEach((jadwal) => {
        let rawEmpId =
          jadwal.pengguna?.id ||
          jadwal.pengguna?._id ||
          jadwal.penggunaID?._id ||
          jadwal.penggunaID?.id ||
          jadwal.penggunaID ||
          jadwal.karyawan?.id;
        const empId = rawEmpId ? String(rawEmpId) : undefined;

        const empIndex = rawData.findIndex((emp) => emp.id === empId);
        if (empIndex === -1) return;

        let day = 1;
        if (typeof jadwal.tanggalKerja === "string") {
          day = parseInt(jadwal.tanggalKerja.split("T")[0].split("-")[2], 10);
        } else {
          day = new Date(jadwal.tanggalKerja).getDate();
        }

        let shiftType: ShiftItem["type"] = "off";
        let shiftName = "—";
        let shiftLabel = "OFF";

        if (jadwal.isLibur) {
          shiftType = "off";
        } else if (jadwal.shift) {
          const shiftDetail = jadwal.shift;
          if (shiftDetail) {
            shiftName = shiftDetail.namaShift;
            shiftLabel = `${shiftDetail.jamMasuk} - ${shiftDetail.jamPulang}`;
            const jamMasuk = parseInt(shiftDetail.jamMasuk.split(":")[0], 10);
            if (shiftDetail.isLintasHari || jamMasuk >= 18 || jamMasuk < 5) {
              shiftType = "malam";
            } else if (jamMasuk >= 14) {
              shiftType = "sore";
            } else {
              shiftType = "pagi";
            }
          }
        }

        const shiftItemProps: ShiftItem = {
          id: String(jadwal.id || jadwal._id),
          // ✅ FIX 1: Suntikkan ID Asli Master Shift agar Dropdown 100% Prefill
          masterShiftId: jadwal.shift
            ? String(jadwal.shift._id || jadwal.shift.id)
            : undefined,
          type: shiftType,
          name: shiftName,
          label: shiftLabel,
        };

        if (!rawData[empIndex].jadwalMap[day]) {
          rawData[empIndex].jadwalMap[day] = [];
        }
        rawData[empIndex].jadwalMap[day].push(shiftItemProps);
      });
    }

    return rawData.filter((k) =>
      k.nama.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [resKaryawan, resJadwal, searchQuery]);

  if (isErrorAll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Alert
          variant="destructive"
          className="max-w-md bg-red-50 border-red-200"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">
            Gagal Memuat Data
          </AlertTitle>
          <AlertDescription className="text-red-700/80 mt-2">
            Terjadi kesalahan koneksi.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4 bg-[#041E3F] hover:bg-[#041E3F]/90"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <JadwalUtama
        tipeRuang="outlet"
        dataKaryawan={mappedDataKaryawan}
        masterShiftList={masterShiftList}
        polaRosterList={polaRosterList}
        isLoading={isLoadingAll}
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        // ✅ FIX: Bungkus mutateAsync dengan async function yang me-return void
        onSubmitManual={async (data) => {
          await simpanJadwalManual(data);
        }}
        onUpdateManual={async (params) => {
          await updateJadwalManual(params);
        }}
        onDeleteManual={async (id) => {
          await deleteJadwalManual(id);
        }}
        isSavingManual={isSavingManual || isUpdatingManual || isDeletingManual}
      />
    </div>
  );
}
