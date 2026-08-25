"use client";

import React from "react";
import { ShiftItem } from "@/types/jadwal";

interface ShiftCellProps {
  day: number;
  isSunday: boolean;
  shifts: ShiftItem[];
  onClick: () => void;
}

export function ShiftCell({ day, isSunday, shifts, onClick }: ShiftCellProps) {
  return (
    <td
      className={`border-b border-r border-[#041E3F]/5 p-1.5 md:p-2 align-top ${
        isSunday ? "bg-red-50/20" : ""
      }`}
    >
      <div className="flex flex-col gap-1.5 min-w-22.5 md:min-w-27.5">
        {shifts.map((shift, idx) => (
          <div
            key={shift.id || idx}
            onClick={onClick}
            className={`flex flex-col justify-center p-1.5 md:p-2 rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-[#041E3F]/30 min-h-11 md:min-h-13
              ${shift.type === "pagi" ? "bg-[#041E3F]/10 text-[#041E3F]" : ""}
              ${shift.type === "sore" ? "bg-sky-100 text-sky-700" : ""}
              ${shift.type === "malam" ? "bg-[#041E3F] text-[#FFFAF3] shadow-md" : ""}
              ${shift.type === "cuti" ? "bg-amber-100 text-amber-700" : ""}
              ${shift.type === "off" ? "bg-transparent text-[#041E3F]/30 border border-dashed border-[#041E3F]/20 hover:bg-[#041E3F]/5" : ""}
            `}
          >
            {shift.type !== "off" ? (
              <>
                <span className="text-[10px] md:text-xs font-bold truncate text-center">
                  {shift.name}
                </span>
                <span
                  className={`text-[8px] md:text-[9px] font-semibold text-center truncate ${
                    shift.type === "malam" ? "text-[#FFFAF3]/70" : "opacity-70"
                  }`}
                >
                  {shift.label}
                </span>
              </>
            ) : (
              <span className="text-[10px] md:text-xs font-bold text-center">—</span>
            )}
          </div>
        ))}
      </div>
    </td>
  );
}