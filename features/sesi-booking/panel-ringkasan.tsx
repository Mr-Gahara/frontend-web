"use client";

import { SyaratDiskon } from "@/features/diskon/syarat-diskon";
import { useState } from "react";
import { Check, Receipt, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { keTeksWaktu } from "@/lib/waktu";
import type { Diskon } from "@/types/diskon";
import type { WaktuItem } from "./waktu-booking";

interface PropsPanelRingkasan {
  namaPelanggan: string;
  jumlahFasilitas: number;
  diskonGlobalAktif: Diskon[];
  diskonGlobalTerpilih: string[];
  onPilihDiskonGlobal: (id: string) => void;
  waktuItems: WaktuItem[];
  menyimpan: boolean;
  adaBentrok: boolean;
  onBatal: () => void;
}

/** Panel ringkasan dan tombol simpan form buat reservasi (keputusan R9b). */
export function PanelRingkasan({
  namaPelanggan,
  jumlahFasilitas,
  diskonGlobalAktif,
  diskonGlobalTerpilih,
  onPilihDiskonGlobal,
  waktuItems,
  menyimpan,
  adaBentrok,
  onBatal,
}: PropsPanelRingkasan) {
  const [bukaDiskon, setBukaDiskon] = useState(false);

  return (
    <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#0A2947] text-[#FFFAF3] p-6 sm:p-8 shadow-md flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-[#FFFAF3]/20 pb-4">
          <Receipt className="h-5 w-5 text-[#D4A373]" />
          <h2 className="font-bold text-lg tracking-wide uppercase">Ringkasan Reservasi</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5 bg-[#FFFAF3]/5 p-3 rounded-xl border border-[#FFFAF3]/10">
            <p className="text-xs font-bold text-[#FFFAF3]/60 uppercase tracking-wider">Penyewa</p>
            <p className="font-bold text-[#D4A373] text-base truncate">{namaPelanggan}</p>
          </div>
          <div className="space-y-1.5 bg-[#FFFAF3]/5 p-3 rounded-xl border border-[#FFFAF3]/10">
            <p className="text-xs font-bold text-[#FFFAF3]/60 uppercase tracking-wider">Total Fasilitas</p>
            <p className="font-bold text-[#FFFAF3] text-base">{jumlahFasilitas} Aset</p>
          </div>

          {/* DISKON GLOBAL PANEL KANAN */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#FFFAF3]/60 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#D4A373]" /> Diskon Global Transaksi
              </p>
              <Popover open={bukaDiskon} onOpenChange={setBukaDiskon}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] cursor-pointer font-bold bg-[#FFFAF3]/10 text-[#FFFAF3] hover:bg-[#FFFAF3]/20 hover:text-[#FFFAF3]"
                  >
                    Pilih Diskon
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-0 border-[#0A2947]/10">
                  <Command className="bg-[#FFFAF3]">
                    <CommandInput placeholder="Cari diskon transaksi..." className="text-[#0A2947]" />
                    <CommandList>
                      <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">
                        Belum ada diskon aktif.
                      </CommandEmpty>
                      <CommandGroup>
                        {diskonGlobalAktif.map((d) => {
                          const terpilih = diskonGlobalTerpilih.includes(d.id);
                          return (
                            <CommandItem
                              key={d.id}
                              onSelect={() => onPilihDiskonGlobal(d.id)}
                              className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                            >
                              <div className="flex flex-1 items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-sm border",
                                    terpilih ? "bg-[#0A2947] border-[#0A2947]" : "border-[#0A2947]/30",
                                  )}
                                >
                                  {terpilih && <Check className="h-3 w-3 text-[#FFFAF3]" />}
                                </div>
                                <span className="flex flex-col"><span>{d.namaDiskon}</span><SyaratDiskon diskon={d} /></span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {diskonGlobalTerpilih.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1.5">
                {diskonGlobalTerpilih.map((id) => {
                  const d = diskonGlobalAktif.find((x) => x.id === id);
                  if (!d) return null;
                  return (
                    <div
                      key={d.id}
                      className="px-2 py-1 rounded-md bg-[#D4A373] text-[#0A2947] text-[10px] font-bold shadow-sm"
                    >
                      {d.namaDiskon} ({d.tipe === "persen" ? `${d.nilai}%` : `Rp ${d.nilai.toLocaleString("id-ID")}`})
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {waktuItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#FFFAF3]/10">
              {waktuItems.map((s, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-xs text-[#FFFAF3]/70 font-medium px-1"
                >
                  <span>Fasilitas #{i + 1}</span>
                  <span className="font-mono font-bold text-[#FFFAF3]/90">
                    {keTeksWaktu(s.waktu) || "--:--"} · {s.durasi} jam
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-[#718355]/20 border border-[#718355]/30 p-4 rounded-xl flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-[#718355] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#FFFAF3]">Sistem Otomatis (Smart Calc)</p>
            <p className="text-[11px] font-medium text-[#FFFAF3]/70 leading-relaxed">
              Total tagihan (setelah diskon), tarif terbaik, dan pajak akan di-generate otomatis oleh server setelah
              data disimpan.
            </p>
          </div>
        </div>
        <div className="pt-4 border-t border-[#FFFAF3]/20 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={menyimpan || adaBentrok}
            className={cn(
              "w-full text-[#FFFAF3] shadow-lg font-bold h-14 text-base transition-colors",
              adaBentrok
                ? "bg-rose-500/50 cursor-not-allowed opacity-80"
                : "bg-[#718355] hover:bg-[#718355]/90 cursor-pointer",
            )}
          >
            {menyimpan ? "Memproses Data..." : adaBentrok ? "Waktu Terpakai" : "Proses & Buat Tagihan"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBatal}
            className="w-full text-[#FFFAF3]/60 hover:text-[#FFFAF3] hover:bg-[#FFFAF3]/10 font-bold h-12 cursor-pointer"
          >
            Batalkan
          </Button>
        </div>
      </div>
    </div>
  );
}