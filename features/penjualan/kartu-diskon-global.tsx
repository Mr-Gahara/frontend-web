"use client";

import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SyaratDiskon } from "@/features/diskon/syarat-diskon";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Diskon } from "@/types/diskon";
import { toggleDiskonSelection } from "./pilihan-diskon";

/**
 * Kartu Diskon Global dan Keterangan di buat penjualan. Dipisah dari
 * halaman-buat-penjualan.tsx tanpa perubahan markup (14 November 2026).
 */
export function KartuDiskonGlobal({
  diskonList,
  terpilih,
  onUbah,
  keterangan,
  onKeterangan,
}: {
  diskonList: Diskon[];
  terpilih: string[];
  onUbah: (ids: string[]) => void;
  keterangan: string;
  onKeterangan: (teks: string) => void;
}) {
  const [openDiskonGlobal, setOpenDiskonGlobal] = useState(false);

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <Tag className="h-4 w-4 text-karamel" /> Diskon Global
          </h2>
          <Popover
            open={openDiskonGlobal}
            onOpenChange={setOpenDiskonGlobal}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs cursor-pointer font-bold border-navy/20 text-navy hover:bg-navy/5"
              >
                Pilih Diskon
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-0 border-navy/10"
            >
              <Command className="bg-gading">
                <CommandInput
                  placeholder="Cari diskon transaksi..."
                  className="text-navy"
                />
                <CommandList>
                  <CommandEmpty className="py-4 text-center text-xs font-medium text-navy/60">
                    Belum ada diskon aktif.
                  </CommandEmpty>
                  <CommandGroup>
                    {diskonList.map((d, index) => {
                      const targetId = d.id;
                      const isSelected =
                        terpilih.includes(targetId);
                      const safeKey =
                        targetId || `global-diskon-${index}`;
                      return (
                        <CommandItem
                          key={safeKey}
                          onSelect={() =>
                            onUbah(toggleDiskonSelection(terpilih, targetId, diskonList))
                          }
                          className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                        >
                          <div className="flex flex-1 items-center gap-2">
                            {/* Checkbox Custom */}
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border",
                                isSelected
                                  ? "bg-navy border-navy"
                                  : "border-navy/30",
                              )}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-gading" />
                              )}
                            </div>
                            <span className="flex flex-col"><span>{d.namaDiskon}</span><SyaratDiskon diskon={d} /></span>
                          </div>
                          <Badge className="text-[10px] bg-karamel text-navy hover:bg-karamel border-none font-bold">
                            {d.tipe === "persen" ? `${d.nilai}%` : "Rp"}
                          </Badge>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {terpilih.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {terpilih.map((id, idx) => {
              const d = diskonList.find(
                (x) => (x.id) === id,
              );
              if (!d) return null;
              return (
                <Badge
                  key={d.id || `badge-global-${idx}`}
                  className="bg-karamel text-navy border-none hover:bg-karamel text-[11px] px-2.5 py-1 font-bold shadow-sm"
                >
                  {d.namaDiskon} (
                  {d.tipe === "persen"
                    ? `${d.nilai}%`
                    : formatRupiah(d.nilai)}
                  )
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-navy/10 pt-4">
        <label className="text-sm font-bold text-navy" htmlFor="keterangan">
          Keterangan{" "}
          <span className="font-medium text-navy/50">
            (Opsional)
          </span>
        </label>
        <Input
          id="keterangan"
          value={keterangan}
          onChange={(e) => onKeterangan(e.target.value)}
          placeholder="Catatan transaksi..."
          className="text-sm bg-gading border-navy/20 text-navy placeholder:text-navy/30"
        />
      </div>
    </div>
  );
}
