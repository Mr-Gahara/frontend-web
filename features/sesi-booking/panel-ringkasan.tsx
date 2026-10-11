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
      <div className="rounded-2xl border border-navy/10 bg-navy text-gading p-6 sm:p-8 shadow-md flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-gading/20 pb-4">
          <Receipt className="h-5 w-5 text-karamel" />
          <h2 className="font-bold text-lg tracking-wide uppercase">Ringkasan Reservasi</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5 bg-gading/5 p-3 rounded-xl border border-gading/10">
            <p className="text-xs font-bold text-gading/60 uppercase tracking-wider">Penyewa</p>
            <p className="font-bold text-karamel text-base truncate">{namaPelanggan}</p>
          </div>
          <div className="space-y-1.5 bg-gading/5 p-3 rounded-xl border border-gading/10">
            <p className="text-xs font-bold text-gading/60 uppercase tracking-wider">Total Fasilitas</p>
            <p className="font-bold text-gading text-base">{jumlahFasilitas} Aset</p>
          </div>

          {/* DISKON GLOBAL PANEL KANAN */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gading/60 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-karamel" /> Diskon Global Transaksi
              </p>
              <Popover open={bukaDiskon} onOpenChange={setBukaDiskon}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] cursor-pointer font-bold bg-gading/10 text-gading hover:bg-gading/20 hover:text-gading"
                  >
                    Pilih Diskon
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-0 border-navy/10">
                  <Command className="bg-gading">
                    <CommandInput placeholder="Cari diskon transaksi..." className="text-navy" />
                    <CommandList>
                      <CommandEmpty className="py-4 text-center text-xs font-medium text-navy/60">
                        Belum ada diskon aktif.
                      </CommandEmpty>
                      <CommandGroup>
                        {diskonGlobalAktif.map((d) => {
                          const terpilih = diskonGlobalTerpilih.includes(d.id);
                          return (
                            <CommandItem
                              key={d.id}
                              onSelect={() => onPilihDiskonGlobal(d.id)}
                              className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                            >
                              <div className="flex flex-1 items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-sm border",
                                    terpilih ? "bg-navy border-navy" : "border-navy/30",
                                  )}
                                >
                                  {terpilih && <Check className="h-3 w-3 text-gading" />}
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
                      className="px-2 py-1 rounded-md bg-karamel text-navy text-[10px] font-bold shadow-sm"
                    >
                      {d.namaDiskon} ({d.tipe === "persen" ? `${d.nilai}%` : `Rp ${d.nilai.toLocaleString("id-ID")}`})
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {waktuItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gading/10">
              {waktuItems.map((s, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-xs text-gading/70 font-medium px-1"
                >
                  <span>Fasilitas #{i + 1}</span>
                  <span className="font-mono font-bold text-gading/90">
                    {keTeksWaktu(s.waktu) || "--:--"} · {s.durasi} jam
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-sage/20 border border-sage/30 p-4 rounded-xl flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-sage shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-gading">Sistem Otomatis (Smart Calc)</p>
            <p className="text-[11px] font-medium text-gading/70 leading-relaxed">
              Total tagihan (setelah diskon), tarif terbaik, dan pajak akan di-generate otomatis oleh server setelah
              data disimpan.
            </p>
          </div>
        </div>
        <div className="pt-4 border-t border-gading/20 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={menyimpan || adaBentrok}
            className={cn(
              "w-full text-gading shadow-lg font-bold h-14 text-base transition-colors",
              adaBentrok
                ? "bg-rose-500/50 cursor-not-allowed opacity-80"
                : "bg-sage hover:bg-sage/90 cursor-pointer",
            )}
          >
            {menyimpan ? "Memproses Data..." : adaBentrok ? "Waktu Terpakai" : "Proses & Buat Tagihan"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBatal}
            className="w-full text-gading/60 hover:text-gading hover:bg-gading/10 font-bold h-12 cursor-pointer"
          >
            Batalkan
          </Button>
        </div>
      </div>
    </div>
  );
}