"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import JadwalUtama from "@/components/jadwal/jadwal-utama";
import {
  KaryawanJadwal,
  ShiftItem,
  MasterShiftItem,
  PolaRosterItem,
} from "@/types/jadwal";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function JadwalGudangPage() {
  // --- 1. STATE MANAGEMENT ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // Handler Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };
  const handleNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  // Hitung rentang tanggal untuk API (Awal bulan s/d Akhir bulan)
  const startDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];
  const endDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  )
    .toISOString()
    .split("T")[0];

  // --- 2. DATA FETCHING (PARALEL DENGAN KODE AUTH "pengguna") ---

  // A. Fetch Karyawan Gudang
  const {
    data: resKaryawan,
    isLoading: loadKaryawan,
    isError: errKaryawan,
  } = useQuery({
    queryKey: ["pengguna", "gudang"],
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/pengguna?workspace=gudang", // ✅ Menggunakan parameter query yang benar
        undefined,
        "pengguna",
      ),
  });

  // B. Fetch Master Shift (Hanya yang Aktif)
  const { data: resShift, isLoading: loadShift } = useQuery({
    queryKey: ["shift", "aktif", "gudang"], // KEY BERBEDA
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        "/shift?status=Aktif",
        undefined,
        "pengguna",
      ),
  });

  // C. Fetch Pola Roster
  const { data: resPola, isLoading: loadPola } = useQuery({
    queryKey: ["pola-roster", "gudang"], // KEY BERBEDA
    queryFn: () =>
      apiClient.get<{ data: any[] }>("/polaRoster", undefined, "pengguna"),
  });

  // D. Fetch Jadwal Shift Bulanan
  const {
    data: resJadwal,
    isLoading: loadJadwal,
    isError: errJadwal,
  } = useQuery({
    queryKey: ["jadwal-shift", "gudang", startDate, endDate], // KEY BERBEDA
    queryFn: () =>
      apiClient.get<{ data: any[] }>(
        `/jadwalShift?startDate=${startDate}&endDate=${endDate}`,
        undefined,
        "pengguna",
      ),
  });

  // Total status loading (Tunggu semua data master selesai)
  const isLoadingAll = loadKaryawan || loadShift || loadPola || loadJadwal;
  const isErrorAll = errKaryawan || errJadwal;

  // --- 3. DATA MAPPING (TRANSFORMASI BACKEND KE FORMAT UI) ---

  // Mapping Master Shift
  const masterShiftList: MasterShiftItem[] = useMemo(() => {
    if (!resShift?.data) return [];
    return resShift.data.map((s) => ({
      id: s.id,
      nama: s.namaShift,
      jam: `${s.jamMasuk} - ${s.jamPulang}`,
    }));
  }, [resShift]);

  // Mapping Pola Roster
  const polaRosterList: PolaRosterItem[] = useMemo(() => {
    if (!resPola?.data) return [];
    return resPola.data.map((p) => ({
      id: p.id,
      nama: p.namaPola,
      siklus: p.siklusHari,
    }));
  }, [resPola]);

  // ENGINE UTAMA: Mapping Jadwal per Karyawan
  const mappedDataKaryawan: KaryawanJadwal[] = useMemo(() => {
    if (!resKaryawan?.data) return [];

    const rawData = resKaryawan.data.map((k) => ({
      id: k.id || k._id,
      nama: k.namaLengkap || k.nama || "Tanpa Nama",
      role: k.role || "Staf Gudang",
      jadwalMap: {} as Record<number, ShiftItem[]>,
    }));

    // 2. Suntikkan (Inject) data JadwalShift ke dalam jadwalMap masing-masing karyawan
    if (resJadwal?.data) {
      resJadwal.data.forEach((jadwal) => {
        const empId = jadwal.karyawan?.id;

        const empIndex = rawData.findIndex((emp) => emp.id === empId);
        if (empIndex === -1) return;

        const dateObj = new Date(jadwal.tanggalKerja);
        const day = dateObj.getDate();

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
          id: jadwal.id,
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

    // 3. Filter berdasarkan Kolom Pencarian (SearchQuery)
    return rawData.filter((k) =>
      k.nama.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [resKaryawan, resJadwal, searchQuery]);

  // --- 4. RENDER UI ---

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
            Terjadi kesalahan saat menarik data jadwal atau karyawan gudang dari
            server. Pastikan koneksi internet Anda stabil.
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
        tipeRuang="gudang" // PROP DIUBAH KE GUDANG
        dataKaryawan={mappedDataKaryawan}
        masterShiftList={masterShiftList}
        polaRosterList={polaRosterList}
        isLoading={isLoadingAll}
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}
