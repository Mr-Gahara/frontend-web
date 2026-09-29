"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { JadwalToolbar } from "./toolbar-jadwal";
import { JadwalGrid } from "./grid-jadwal";
import { FormJadwalDialog } from "./form-jadwal";
import type { PayloadJadwalManual, RuangJadwal } from "./tipe";
import type { KaryawanJadwal, ShiftItem } from "@/types/jadwal";
import type { ShiftItem as MasterShift } from "@/types/shift";

interface JadwalUtamaProps {
  tipeRuang: RuangJadwal;
  dataKaryawan: KaryawanJadwal[];
  shiftList: MasterShift[];
  isLoading: boolean;
  isError: boolean;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSimpan: (payload: PayloadJadwalManual, ada: ShiftItem[]) => Promise<void>;
  onHapus: (id: string) => Promise<void>;
  isSaving: boolean;
}

export default function JadwalUtama({
  tipeRuang,
  dataKaryawan,
  shiftList,
  isLoading,
  isError,
  currentDate,
  onPrevMonth,
  onNextMonth,
  searchQuery,
  onSearchChange,
  onSimpan,
  onHapus,
  isSaving,
}: JadwalUtamaProps) {
  // ✅ Injeksi Next.js Router
  const router = useRouter();

  // State Dialog Manual
  const [isManualOpen, setIsManualOpen] = React.useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = React.useState<{
    id: string;
    nama: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedExistingShifts, setSelectedExistingShifts] = React.useState<
    ShiftItem[]
  >([]);

  // Perhitungan Tanggal
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = React.useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const handleCellClick = React.useCallback(
    (id: string, day: number, shifts: ShiftItem[]) => {
      const emp = dataKaryawan.find((e) => e.id === id);
      if (emp) {
        setSelectedKaryawan({ id: emp.id, nama: emp.nama });
        setSelectedDate(new Date(year, month, day));
        setSelectedExistingShifts(shifts);
        setIsManualOpen(true);
      }
    },
    [dataKaryawan, year, month],
  );

  // Handler untuk tombol "+ Tambah Manual" (Buka pop-up kosongan)
  const handleOpenManualEmpty = React.useCallback(() => {
    setSelectedKaryawan(null);
    setSelectedDate(null);
    setSelectedExistingShifts([]);
    setIsManualOpen(true);
  }, []);

  // ✅ LOGIKA BARU: Navigasi ke halaman Dedicated Auto-Generate
  const handleOpenGenerate = React.useCallback(() => {
    const basePath =
      tipeRuang === "outlet" ? "/dashboard/outlet" : "/dashboard/gudang";
    router.push(`${basePath}/jadwal/generate`);
  }, [router, tipeRuang]);

  return (
    <div className="flex flex-col w-full max-w-[95vw] mx-auto">
      <JadwalToolbar
        tipeRuang={tipeRuang}
        currentDate={currentDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onAddManual={handleOpenManualEmpty}
        onAutoGenerate={handleOpenGenerate} // ✅ Menggunakan fungsi routing
      />

      <JadwalGrid
        dataKaryawan={dataKaryawan}
        isLoading={isLoading}
        isError={isError}
        year={year}
        month={month}
        daysArray={daysArray}
        daysInMonth={daysInMonth}
        onCellClick={handleCellClick}
      />

      {/* Komponen FormGenerateDialog telah DIBUNUH dari sini! */}

      <FormJadwalDialog
        open={isManualOpen}
        onOpenChange={setIsManualOpen}
        penggunaId={selectedKaryawan?.id || null}
        namaKaryawan={selectedKaryawan?.nama || "Pilih Karyawan"}
        tanggal={selectedDate}
        existingShifts={selectedExistingShifts}
        shiftList={shiftList}
        karyawanList={dataKaryawan}
        isPending={isSaving}
        onSimpan={(payload) => onSimpan(payload, selectedExistingShifts)}
        onHapus={onHapus}
      />
    </div>
  );
}
