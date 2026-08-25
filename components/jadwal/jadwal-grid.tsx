"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { KaryawanJadwal, ShiftItem } from "@/types/jadwal";
import { ShiftCell } from "./shift-cell";

interface JadwalGridProps {
  dataKaryawan: KaryawanJadwal[];
  isLoading: boolean;
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
  empId,
  onCellClick,
}: {
  day: number;
  isSunday: boolean;
  shifts: ShiftItem[];
  empId: string;
  onCellClick: (id: string, day: number, shifts: ShiftItem[]) => void;
}) {
  const handleClick = React.useCallback(() => {
    onCellClick(empId, day, shifts);
  }, [empId, day, shifts, onCellClick]);

  return (
    <ShiftCell
      day={day}
      isSunday={isSunday}
      shifts={shifts}
      onClick={handleClick}
    />
  );
});

export function JadwalGrid({
  dataKaryawan,
  isLoading,
  year,
  month,
  daysArray,
  daysInMonth,
  onCellClick,
}: JadwalGridProps) {
  return (
    <div className="rounded-2xl border border-[#041E3F]/10 bg-[#F2EAE1] p-4 sm:p-6 shadow-sm mt-6">
      <div className="overflow-x-auto rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] shadow-inner max-h-[65vh] relative custom-scrollbar">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
          {/* HEADER TANGGAL */}
          <thead className="sticky top-0 z-20 bg-[#F8F3EB] shadow-sm">
            <tr>
              <th className="sticky left-0 z-30 bg-[#F8F3EB] border-b border-r border-[#041E3F]/10 p-3 md:p-4 min-w-35 md:min-w-55">
                <span className="font-bold text-[#041E3F]/70 uppercase tracking-wider text-[10px] md:text-xs">
                  Staf / Karyawan
                </span>
              </th>
              {daysArray.map((day) => {
                const isSunday = new Date(year, month, day).getDay() === 0;
                return (
                  <th
                    key={day}
                    className={`border-b border-[#041E3F]/10 p-3 min-w-30 text-center ${isSunday ? "bg-red-50/50" : ""}`}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[10px] font-bold uppercase ${isSunday ? "text-red-500" : "text-[#041E3F]/50"}`}
                      >
                        {new Date(year, month, day).toLocaleString("id-ID", {
                          weekday: "short",
                        })}
                      </span>
                      <span
                        className={`text-base font-black ${isSunday ? "text-red-600" : "text-[#041E3F]"}`}
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
                  <div className="flex flex-col items-center justify-center text-[#041E3F]/50">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span className="text-sm font-bold">
                      Memuat Data Jadwal...
                    </span>
                  </div>
                </td>
              </tr>
            ) : dataKaryawan.length === 0 ? (
              <tr>
                <td
                  colSpan={daysInMonth + 1}
                  className="h-32 text-center align-middle text-[#041E3F]/50 text-sm font-bold"
                >
                  Tidak ada data karyawan / jadwal di bulan ini.
                </td>
              </tr>
            ) : (
              dataKaryawan.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-[#041E3F]/2 group transition-colors"
                >
                  {/* IDENTITAS KARYAWAN */}
                  <td className="sticky left-0 z-10 bg-[#FFFAF3] group-hover:bg-[#FDF9F2] border-b border-r border-[#041E3F]/10 p-3 md:p-4 align-top">
                    <div className="flex items-start md:items-center gap-2 md:gap-3">
                      <Avatar className="hidden sm:flex h-8 w-8 md:h-9 md:w-9 border border-[#041E3F]/10 shrink-0">
                        <AvatarFallback className="bg-[#041E3F]/10 text-[#041E3F] font-bold text-[10px] md:text-xs">
                          {emp.nama.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#041E3F] text-xs md:text-sm truncate">
                          {emp.nama}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-semibold text-[#041E3F]/50 uppercase tracking-wider truncate">
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* KOTAK-KOTAK SHIFT */}
                  {daysArray.map((day) => {
                    const isSunday = new Date(year, month, day).getDay() === 0;
                    const shifts = emp.jadwalMap[day] || [
                      { id: "off", type: "off", label: "OFF", name: "" },
                    ];

                    return (
                      <ShiftCellMemo
                        key={day}
                        day={day}
                        isSunday={isSunday}
                        shifts={shifts}
                        empId={emp.id}
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
