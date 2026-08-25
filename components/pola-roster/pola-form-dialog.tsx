"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, X, Info, Coffee, Briefcase } from "lucide-react";
import { PolaRosterRequest, DetailSiklusItem, PolaRosterItem } from "@/types/pola-roster";
import { MasterShiftItem } from "@/types/jadwal";

interface PolaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: PolaRosterItem | null;
  masterShiftList: MasterShiftItem[];
  onSubmit: (data: PolaRosterRequest) => void;
  isPending?: boolean;
}

export function PolaFormDialog({
  open,
  onOpenChange,
  editTarget,
  masterShiftList,
  onSubmit,
  isPending = false,
}: PolaFormDialogProps) {
  
  const [namaPola, setNamaPola] = useState("");
  const [siklusStr, setSiklusStr] = useState("");
  const [detailSiklus, setDetailSiklus] = useState<DetailSiklusItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setNamaPola(editTarget.namaPola);
        setSiklusStr(String(editTarget.siklusHari));
        
        const safeDetail = editTarget.detailSiklus.map(d => ({
          hariKe: d.hariKe,
          isLibur: d.isLibur,
          // Extract string ID dengan aman
          shiftID: d.isLibur ? undefined : (d.shiftID || (d.shift as any)?._id || (d.shift as any)?.id || ""),
        }));
        setDetailSiklus(safeDetail);
      } else {
        setNamaPola("");
        setSiklusStr("7");
        
        const defaultDetail = Array.from({ length: 7 }).map((_, i) => ({
          hariKe: i + 1,
          isLibur: true,
          shiftID: undefined, // State awal disiplin tanpa string kosong
        }));
        setDetailSiklus(defaultDetail);
      }
      setErrorMsg("");
    }
  }, [open, editTarget]);

  const handleSiklusChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    setSiklusStr(cleanVal);
    const num = parseInt(cleanVal) || 0;
    
    if (num > 31) {
      setSiklusStr("31");
      adjustDetailArray(31);
    } else {
      adjustDetailArray(num);
    }
  };

  const adjustDetailArray = (newLength: number) => {
    setDetailSiklus((prev) => {
      if (newLength === prev.length) return prev;
      if (newLength > prev.length) {
        const added = Array.from({ length: newLength - prev.length }).map((_, i) => ({
          hariKe: prev.length + i + 1,
          isLibur: true,
          shiftID: undefined, // Selalu inisiasi form libur tanpa property id
        }));
        return [...prev, ...added];
      } else {
        return prev.slice(0, newLength);
      }
    });
  };

  const handleRowChange = (index: number, selectedValue: string) => {
    setDetailSiklus((prev) => {
      const updated = [...prev];
      if (selectedValue === "libur") {
        updated[index] = { ...updated[index], isLibur: true, shiftID: undefined }; // Hapus ID saat pindah ke libur
      } else {
        updated[index] = { ...updated[index], isLibur: false, shiftID: selectedValue };
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const finalSiklus = parseInt(siklusStr) || 0;
    if (!namaPola.trim()) return setErrorMsg("Nama Pola wajib diisi.");
    if (finalSiklus < 1) return setErrorMsg("Jumlah siklus minimal adalah 1 hari.");
    if (finalSiklus > 31) return setErrorMsg("Jumlah siklus maksimal adalah 31 hari.");
    
    // Validasi ketat: Cegah submit jika di set hari kerja tapi belum pilih shift
    const hasInvalidRow = detailSiklus.some(d => !d.isLibur && !d.shiftID);
    if (hasInvalidRow) return setErrorMsg("Ada baris hari kerja yang belum dipilih master shift-nya.");

    // STRICT DATA SANITIZATION (Best Practice NoSQL)
    const sanitizedDetailSiklus = detailSiklus.map(d => {
      if (d.isLibur) {
        // Jika libur, hanya kirim hariKe dan isLibur. JANGAN kirim shiftID sama sekali.
        return {
          hariKe: d.hariKe,
          isLibur: true
        };
      }
      // Jika kerja, kirim ketiganya.
      return {
        hariKe: d.hariKe,
        isLibur: false,
        shiftID: d.shiftID
      };
    });

    onSubmit({
      namaPola,
      siklusHari: finalSiklus,
      detailSiklus: sanitizedDetailSiklus, // Payload yang sudah bebas dari string kosong
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5 border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-start justify-between mb-2 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                {editTarget ? "Edit Pola Roster" : "Buat Pola Roster"}
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                Rancang template siklus hari kerja karyawan.
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-4 shrink-0">
            <Info className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form id="pola-form" onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">Nama Pola Roster</label>
              <Input
                value={namaPola}
                onChange={(e) => setNamaPola(e.target.value)}
                placeholder="Misal: Reguler 5-2"
                className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl px-4"
                required
              />
            </div>
            <div className="sm:col-span-4 space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">Siklus (Hari)</label>
              <Input
                type="text"
                value={siklusStr}
                onChange={(e) => handleSiklusChange(e.target.value)}
                className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#041E3F]/10">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#041E3F]">Rincian Siklus</label>
              <span className="text-xs font-bold text-[#041E3F]/50 bg-[#041E3F]/5 px-2 py-1 rounded-md">
                {detailSiklus.length} Hari Terdeteksi
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {detailSiklus.map((row, index) => (
                <div key={index} className="flex items-center gap-3 bg-[#FFFAF3] p-2 rounded-xl border border-[#041E3F]/10 shadow-sm transition-all hover:border-[#041E3F]/30">
                  
                  <div className="flex h-10 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-[#041E3F]/5 border border-[#041E3F]/5 text-[#041E3F]">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none">Hari</span>
                    <span className="text-sm font-black leading-tight">{row.hariKe}</span>
                  </div>

                  <Select 
                    value={row.isLibur ? "libur" : (row.shiftID || "")} 
                    onValueChange={(val) => handleRowChange(index, val)}
                  >
                    <SelectTrigger className="flex-1 bg-transparent border-none shadow-none focus:ring-0 text-[#041E3F] font-bold px-2 h-10 cursor-pointer">
                      <SelectValue placeholder="Pilih shift..." />
                    </SelectTrigger>
                    
                    <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-bold rounded-xl max-h-56">
                      <SelectItem value="libur" className="cursor-pointer text-red-600 focus:text-red-700">
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4" /> Libur / Off
                        </div>
                      </SelectItem>
                      
                      {masterShiftList.length > 0 && <div className="h-px bg-[#041E3F]/10 my-1 mx-2" />}
                      
                      {masterShiftList.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 opacity-50" />
                            {shift.nama} <span className="font-medium opacity-50 ml-1">({shift.jam})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="pt-4 mt-2 border-t border-[#041E3F]/10 shrink-0">
          <Button
            type="submit"
            form="pola-form"
            disabled={isPending || detailSiklus.length === 0}
            className="w-full h-14 rounded-xl cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Menyimpan..." : "Simpan Pola Roster"}
          </Button>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}