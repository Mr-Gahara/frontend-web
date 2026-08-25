"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, CalendarDays, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GenerateParams } from "./step-satu-form";
import { KaryawanJadwal, MasterShiftItem } from "@/types/jadwal";
import { PolaRosterItem } from "@/types/pola-roster";
import { cn } from "@/lib/utils";

interface StepDuaPreviewProps {
  params: GenerateParams;
  polaRosterList: PolaRosterItem[];
  masterShiftList: MasterShiftItem[];
  karyawanList: KaryawanJadwal[];
  onBack: () => void;
  onSubmit: (finalPayload: any) => void;
  isPending?: boolean;
}

export function StepDuaPreview({
  params,
  polaRosterList,
  masterShiftList,
  karyawanList,
  onBack,
  onSubmit,
  isPending = false,
}: StepDuaPreviewProps) {
  // --- 1. ENGINE SIMULASI JADWAL (FRONTEND CALCULATOR) ---
  const { simulatedData, dateHeaders, selectedPola } = useMemo(() => {
    const pola = polaRosterList.find((p) => p.id === params.polaId);

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const dates: Date[] = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const targetKaryawans = karyawanList.filter((k) =>
      params.karyawanIds.includes(k.id),
    );

    const simulation = targetKaryawans.map((emp) => {
      const scheduleRow = dates.map((date, index) => {
        const siklusHari = pola?.siklusHari || 7;
        const cycleIndex = index % siklusHari;

        const detailHari = pola?.detailSiklus?.find(
          (d) => d.hariKe === cycleIndex + 1,
        );

        let isLibur = true;
        let shiftID = undefined;
        let shiftLabel = "OFF";
        let jam = "";

        if (detailHari && !detailHari.isLibur && detailHari.shiftID) {
          const shiftMaster = masterShiftList.find(
            (s) => s.id === detailHari.shiftID,
          );
          if (shiftMaster) {
            isLibur = false;
            shiftID = shiftMaster.id;
            shiftLabel = shiftMaster.nama.substring(0, 4).toUpperCase();
            jam = shiftMaster.jam;
          }
        }

        return {
          date: date.toISOString().split("T")[0],
          isLibur,
          shiftID,
          shiftLabel,
          jam,
        };
      });

      return {
        karyawan: emp,
        jadwal: scheduleRow,
      };
    });

    return {
      simulatedData: simulation,
      dateHeaders: dates,
      selectedPola: pola,
    };
  }, [params, polaRosterList, masterShiftList, karyawanList]);

  // --- 2. HANDLER SUBMIT KE BACKEND ---
  const handleFinalSubmit = () => {
    const bulkPayload = simulatedData.flatMap((empRow) =>
      empRow.jadwal.map((j) => ({
        penggunaID: empRow.karyawan.id,
        tanggalKerja: j.date,
        isLibur: j.isLibur,
        shiftID: j.shiftID,
      })),
    );
    onSubmit(bulkPayload);
  };

  return (
    <div className="bg-[#FFFAF3] border border-[#041E3F]/10 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto flex flex-col h-full min-h-[75vh]">
      {/* HEADER */}
      <div className="mb-6 border-b border-[#041E3F]/10 pb-6">
        <h2 className="text-xl font-bold text-[#041E3F]">
          Langkah 2: Pratinjau Jadwal
        </h2>
        <p className="text-sm font-semibold text-[#041E3F]/60 mt-1">
          Periksa kembali simulasi jadwal sebelum disimpan secara permanen.
        </p>
      </div>

      {/* SUMMARY CARD */}
      <div className="flex flex-wrap items-center gap-4 bg-[#F2EAE1] p-4 rounded-xl border border-[#041E3F]/10 mb-6">
        <div className="flex items-center gap-3 pr-4 border-r border-[#041E3F]/15">
          <CalendarDays className="h-5 w-5 text-[#041E3F]/70" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#041E3F]/50 uppercase">
              Pola Terpilih
            </span>
            <span className="text-sm font-bold text-[#041E3F]">
              {selectedPola?.namaPola || "-"}
            </span>
          </div>
        </div>
        <div className="flex flex-col pr-4 border-r border-[#041E3F]/15">
          <span className="text-[10px] font-bold text-[#041E3F]/50 uppercase">
            Rentang Tanggal
          </span>
          <span className="text-sm font-bold text-[#041E3F]">
            {new Date(params.startDate).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
            })}{" "}
            -{" "}
            {new Date(params.endDate).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[#041E3F]/50 uppercase">
            Total Karyawan
          </span>
          <span className="text-sm font-bold text-[#041E3F]">
            {params.karyawanIds.length} Orang
          </span>
        </div>
      </div>

      {/* WARNING LONG RANGE */}
      {dateHeaders.length > 31 && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-200 mb-6 text-sm font-bold">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>Anda men-generate jadwal untuk lebih dari 31 hari. Proses penyimpanan mungkin memakan waktu sedikit lebih lama.</p>
        </div>
      )}

      {/* 🚀 TABLE PREVIEW (PREMIUM UI ALIAS JADWAL GRID) */}
      <div className="flex-1 rounded-2xl border border-[#041E3F]/15 bg-[#F2EAE1] p-3 sm:p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 max-h-[55vh] rounded-xl border border-[#041E3F]/10 bg-[#FFFAF3]">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            
            {/* HEADER TANGGAL */}
            <thead className="bg-[#F8F3EB] sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-3 md:p-4 font-bold text-[#041E3F]/70 uppercase tracking-wider text-[10px] md:text-xs border-b border-r border-[#041E3F]/10 min-w-[200px] sticky left-0 bg-[#F8F3EB] z-30">
                  Staf / Karyawan
                </th>
                {dateHeaders.map((date, idx) => {
                  const isSunday = date.getDay() === 0;
                  return (
                    <th
                      key={idx}
                      className={cn(
                        // ✅ FIX 1: Lebarkan kolom dari min-w-[70px] menjadi min-w-[100px]
                        "p-3 border-b border-r border-[#041E3F]/10 min-w-[100px] text-center",
                        isSunday && "bg-red-50/50"
                      )}
                    >
                      <div className="flex flex-col items-center">
                        <span className={cn("text-[10px] font-bold uppercase", isSunday ? "text-red-500" : "text-[#041E3F]/50")}>
                          {date.toLocaleDateString("id-ID", { weekday: "short" })}
                        </span>
                        <span className={cn("text-base font-black", isSunday ? "text-red-600" : "text-[#041E3F]")}>
                          {date.getDate()}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            {/* BODY KARYAWAN & SHIFT */}
            <tbody className="divide-y divide-[#041E3F]/5">
              {simulatedData.map((row) => (
                <tr key={row.karyawan.id} className="hover:bg-[#041E3F]/[0.02] group transition-colors">
                  
                  {/* Sticky Column Kiri (Avatar) */}
                  <td className="sticky left-0 z-10 bg-[#FFFAF3] group-hover:bg-[#FDF9F2] border-r border-[#041E3F]/10 p-3 md:p-4 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-start md:items-center gap-2 md:gap-3">
                      <Avatar className="hidden sm:flex h-8 w-8 md:h-9 md:w-9 border border-[#041E3F]/10 shrink-0">
                        <AvatarFallback className="bg-[#041E3F]/10 text-[#041E3F] font-bold text-[10px] md:text-xs">
                          {row.karyawan.nama.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#041E3F] text-xs md:text-sm truncate">
                          {row.karyawan.nama}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-semibold text-[#041E3F]/50 uppercase tracking-wider truncate">
                          {row.karyawan.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Render Cells Jadwal (Premium Styling) */}
                  {row.jadwal.map((cell, idx) => {
                    const isSunday = dateHeaders[idx].getDay() === 0;
                    return (
                      <td
                        key={idx}
                        className={cn(
                          // ✅ FIX 2: Perbesar padding sel secara umum
                          "p-2.5 text-center border-r border-[#041E3F]/5 align-middle",
                          isSunday && "bg-red-50/20"
                        )}
                      >
                        {cell.isLibur ? (
                          // ✅ FIX 3: Desain OFF cell yang lebih proporsional
                          <div className="mx-auto flex min-h-[48px] w-full max-w-[85px] items-center justify-center rounded-xl bg-red-50/80 text-[11px] font-bold text-red-600 border border-red-100 shadow-sm">
                            OFF
                          </div>
                        ) : (
                          // ✅ FIX 4: Desain SHIFT cell dengan min-h dan max-w yang dinaikkan, padding longgar, dan font disesuaikan
                          <div className="mx-auto flex flex-col min-h-[48px] w-full max-w-[90px] items-center justify-center rounded-xl bg-[#FFFAF3] text-[#041E3F] border border-[#041E3F]/20 shadow-sm transition-all hover:border-[#041E3F]/40 hover:bg-[#041E3F]/5 px-1 py-1.5">
                            <span className="text-[11px] font-bold leading-tight">{cell.shiftLabel}</span>
                            <span className="text-[10px] font-semibold opacity-60 font-mono tracking-tight mt-0.5">{cell.jam || "Shift"}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#041E3F]/10">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="h-12 px-6 border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 font-bold rounded-xl cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Edit Parameter
        </Button>
        <Button
          onClick={handleFinalSubmit}
          disabled={isPending}
          className="h-12 px-8 bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          {isPending ? "Menyimpan ke Server..." : "Simpan & Terapkan Jadwal"}
          {!isPending && <Check className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}