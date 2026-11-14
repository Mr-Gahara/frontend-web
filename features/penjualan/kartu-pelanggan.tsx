"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cocokCariPelanggan, labelPelangganTerpilih } from "@/features/pelanggan/tampilan";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Pelanggan } from "@/types/pelanggan";

/**
 * Kartu Pelanggan di buat penjualan: pemilih pelanggan dengan pencarian
 * (debounce 300 ms). Dipisah dari halaman-buat-penjualan.tsx tanpa
 * perubahan markup (14 November 2026).
 */
export function KartuPelanggan({
  pelangganList,
  pelangganID,
  onPilih,
}: {
  pelangganList: Pelanggan[];
  pelangganID: string;
  onPilih: (id: string) => void;
}) {
  const [openPelanggan, setOpenPelanggan] = useState(false);
  const [pelangganSearch, setPelangganSearch] = useState("");
  const debouncedPelangganSearch = useDebounce(pelangganSearch, 300);
  const filteredPelanggan = useMemo(() => {
    if (!debouncedPelangganSearch) return pelangganList;
    return pelangganList.filter((p) => cocokCariPelanggan(p, debouncedPelangganSearch));
  }, [pelangganList, debouncedPelangganSearch]);

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-navy flex items-center gap-2">
        <Users className="w-5 h-5 text-karamel" /> Pelanggan
      </h2>
      <div className="space-y-2">
        <Popover open={openPelanggan} onOpenChange={setOpenPelanggan}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPelanggan}
              className="w-full justify-between font-bold cursor-pointer bg-gading border-navy/20 text-navy"
            >
              <span
                className={
                  pelangganID ? "" : "text-navy/50 font-medium"
                }
              >
                {pelangganID
                  ? (labelPelangganTerpilih(pelangganList, pelangganID) ??
                    "Pelanggan tidak ditemukan")
                  : "Pilih pelanggan..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0 border-navy/10"
            align="start"
          >
            <Command shouldFilter={false} className="bg-gading">
              <CommandInput
                placeholder="Cari pelanggan..."
                value={pelangganSearch}
                onValueChange={setPelangganSearch}
                className="text-navy"
              />
              <CommandList>
                <CommandEmpty className="py-4 text-center text-xs font-medium text-navy/60">
                  Pelanggan tidak ditemukan.
                </CommandEmpty>
                <CommandGroup>
                  {filteredPelanggan.map((p) => {
                    const idPelanggan = p.id;
                    return (
                      <CommandItem
                        key={idPelanggan}
                        onSelect={() => {
                          onPilih(idPelanggan);
                          setOpenPelanggan(false);
                          setPelangganSearch("");
                        }}
                        className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-sage",
                            pelangganID === idPelanggan
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span>{p.namaPelanggan}</span>
                        {p.nomorHp ? (
                          <span className="ml-2 text-xs font-medium text-navy/60">
                            {p.nomorHp}
                          </span>
                        ) : null}
                        <span className="ml-auto text-xs font-bold text-navy/50 capitalize">
                          {p.tipePelanggan}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
