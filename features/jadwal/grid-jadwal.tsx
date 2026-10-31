"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { KaryawanJadwal, ShiftItem } from "@/types/jadwal";
import { ShiftCell } from "./sel-shift";

interface JadwalGridProps {
  dataKaryawan: KaryawanJadwal[];
  isLoading: boolean;
  isError?: boolean;
  year: number;
  month: number;
  daysArray: number[];
  daysInMonth: number;
  onCellClick: (penggunaId: string, day: number, shifts: ShiftItem[]) => void;
}

const ShiftCellMemo = React.memo(function ShiftCellMemo({
  day,
  isSunday,
  shifts,
  lain,
  empId,
  namaKaryawan,
  onCellClick,
}: {
  day: number;
  isSunday: boolean;
  shifts: ShiftItem[];
  lain: ShiftItem[] | undefined;
  empId: string;
  namaKaryawan: string;
  onCellClick: (id: string, day: number, shifts: ShiftItem[]) => void;
}) {
  const handleClick = React.useCallback(() => {
    onCellClick(empId, day, shifts);
  }, [empId, day, shifts, onCellClick]);

  return (
    <ShiftCell
      namaKaryawan={namaKaryawan}
      day={day}
      isSunday={isSunday}
      shifts={shifts}
      lain={lain}
      onClick={handleClick}
    />
  );
});

export function JadwalGrid({
  dataKaryawan,
  isLoading,
  isError = false,
  year,
  month,
  daysArray,
  daysInMonth,
  onCellClick,
}: JadwalGridProps) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-krem p-4 sm:p-6 shadow-sm mt-6">
      <div className="overflow-x-auto rounded-xl border border-navy/15 bg-gading shadow-inner max-h-[65vh] relative custom-scrollbar">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
          {/* HEADER TANGGAL */}
          <thead className="sticky top-0 z-20 bg-[#F8F3EB] shadow-sm">
            <tr>
              <th className="sticky left-0 z-30 bg-[#F8F3EB] border-b border-r border-navy/10 p-3 md:p-4 min-w-35 md:min-w-55">
                <span className="font-bold text-navy/70 uppercase tracking-wider text-[10px] md:text-xs">
                  Staf / Karyawan
                </span>
              </th>
              {daysArray.map((day) => {
                const isSunday = new Date(year, month, day).getDay() === 0;
                return (
                  <th
                    key={day}
                    className={`border-b border-navy/10 p-3 min-w-30 text-center ${isSunday ? "bg-red-50/50" : ""}`}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[10px] font-bold uppercase ${isSunday ? "text-red-500" : "text-navy/50"}`}
                      >
                        {new Date(year, month, day).toLocaleString("id-ID", {
                          weekday: "short",
                        })}
                      </span>
                      <span
                        className={`text-base font-black ${isSunday ? "text-red-600" : "text-navy"}`}
                      >
                        {day}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY KARYAWAN & SHIFT */}
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={daysInMonth + 1}
                  className="h-32 text-center align-middle"
                >
                  <div className="flex flex-col items-center justify-center text-navy/50">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span className="text-sm font-bold">
                      Memuat Data Jadwal...
                    </span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan={daysInMonth + 1}
                  role="alert"
                  className="h-32 text-center align-middle text-red-600 text-sm font-bold"
                >
                  <span className="block">Gagal Memuat Data</span>
                  <span className="block font-medium">
                    Data karyawan, jadwal, atau master shift tidak dapat dimuat. Muat ulang halaman untuk mencoba lagi.
                  </span>
                </td>
              </tr>
            ) : dataKaryawan.length === 0 ? (
              <tr>
                <td
                  colSpan={daysInMonth + 1}
                  className="h-32 text-center align-middle text-navy/50 text-sm font-bold"
                >
                  Tidak ada data karyawan / jadwal di bulan ini.
                </td>
              </tr>
            ) : (
              dataKaryawan.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-navy/2 group transition-colors"
                >
                  {/* IDENTITAS KARYAWAN */}
                  <td className="sticky left-0 z-10 bg-gading group-hover:bg-[#FDF9F2] border-b border-r border-navy/10 p-3 md:p-4 align-top">
                    <div className="flex items-start md:items-center gap-2 md:gap-3">
                      <Avatar className="hidden sm:flex h-8 w-8 md:h-9 md:w-9 border border-navy/10 shrink-0">
                        <AvatarFallback className="bg-navy/10 text-navy font-bold text-[10px] md:text-xs">
                          {emp.nama.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-navy text-xs md:text-sm truncate">
                          {emp.nama}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-semibold text-navy/50 uppercase tracking-wider truncate">
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* KOTAK-KOTAK SHIFT */}
                  {daysArray.map((day) => {
                    const isSunday = new Date(year, month, day).getDay() === 0;
                    const lain = emp.lainMap[day];
                    // Sel yang hanya berisi jadwal lokasi lain tidak menawarkan buat:
                    // menjadikannya libur di sini menghapus jadwal lokasi itu (B165).
                    const shifts =
                      emp.jadwalMap[day] ||
                      (lain ? [] : [{ id: "off", type: "off" as const, label: "OFF", name: "" }]);

                    return (
                      <ShiftCellMemo
                        key={day}
                        day={day}
                        isSunday={isSunday}
                        shifts={shifts}
                        lain={lain}
                        empId={emp.id}
                        namaKaryawan={emp.nama}
                        onCellClick={onCellClick}
                      />
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
