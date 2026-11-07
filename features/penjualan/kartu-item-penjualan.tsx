"use client";

import { Check, ChevronsUpDown, Tag, Trash2 } from "lucide-react";
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
import type { Produk } from "@/types/produk";
import type { HasilSimulasi, ItemState } from "./simulasi";

/**
 * Satu kartu item di layar buat penjualan: produk, jumlah, harga satuan,
 * diskon item, dan subtotal. Dipindah apa adanya dari
 * halaman-buat-penjualan.tsx; state tetap di halaman.
 */
export function KartuItemPenjualan({
  item,
  index,
  jumlahItem,
  selectedProduk,
  itemCalc,
  namaProduk,
  produkList,
  activeDiskonItem,
  produkTerbuka,
  diskonTerbuka,
  onProdukTerbuka,
  onDiskonTerbuka,
  onHapus,
  onPilihProduk,
  onJumlahChange,
  onJumlahBlur,
  onToggleDiskon,
}: {
  item: ItemState;
  index: number;
  jumlahItem: number;
  selectedProduk: Produk | undefined;
  itemCalc: HasilSimulasi["itemsCalc"][number];
  namaProduk: string;
  produkList: readonly Produk[];
  activeDiskonItem: readonly Diskon[];
  produkTerbuka: boolean;
  diskonTerbuka: boolean;
  onProdukTerbuka: (buka: boolean) => void;
  onDiskonTerbuka: (buka: boolean) => void;
  onHapus: () => void;
  onPilihProduk: (produkID: string) => void;
  onJumlahChange: (raw: string) => void;
  onJumlahBlur: () => void;
  onToggleDiskon: (diskonId: string) => void;
}) {
  return (
      <div
        className="rounded-xl border border-navy/10 p-5 space-y-4 bg-gading shadow-inner"
      >
        <div className="flex items-center justify-between border-b border-navy/5 pb-3">
          <span className="text-xs font-bold text-navy/50 uppercase tracking-widest">
            Item #{index + 1}
          </span>
          {jumlahItem > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
              onClick={onHapus}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy">
            Produk
          </label>
          <Popover
            open={produkTerbuka}
            onOpenChange={(open) =>
              onProdukTerbuka(open)
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-bold cursor-pointer bg-white border-navy/20 text-navy"
              >
                <span
                  className={
                    item.produkID
                      ? ""
                      : "text-navy/40 font-medium"
                  }
                >
                  {item.produkID
                    ? namaProduk
                    : "Pilih produk..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0 border-navy/10"
              align="start"
            >
              <Command className="bg-gading">
                <CommandInput
                  placeholder="Cari produk..."
                  className="text-navy"
                />
                <CommandList>
                  <CommandEmpty className="py-6 text-center text-sm font-medium text-navy/60">
                    Produk tidak ditemukan.
                  </CommandEmpty>
                  <CommandGroup>
                    {produkList.map((p) => (
                      <CommandItem
                        key={p.id}
                        onSelect={() =>
                          onPilihProduk(p.id)
                        }
                        className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-sage",
                            item.produkID === p.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span className="flex-1">
                          {p.namaProduk}
                        </span>
                        <span className="ml-2 text-xs font-bold text-navy/50">
                          {formatRupiah(p.hargaJual)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy" htmlFor={`jumlah-${index}`}>
              Jumlah
            </label>
            <Input
              id={`jumlah-${index}`}
              type="number"
              min={1}
              value={item.jumlahStr}
              onChange={(e) =>
                onJumlahChange(e.target.value)
              }
              onBlur={onJumlahBlur}
              className="bg-white border-navy/20 text-navy font-bold no-spinner"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy">
              Harga Satuan
            </label>
            <div className="flex h-10 items-center rounded-md border border-navy/10 bg-navy/5 px-3 text-sm font-bold text-navy/70 font-mono">
              {selectedProduk
                ? formatRupiah(selectedProduk.hargaJual)
                : "-"}
            </div>
          </div>
        </div>

        {/* Diskon Item */}
        {selectedProduk && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold flex items-center gap-1.5 text-navy">
                <Tag className="h-3.5 w-3.5 text-karamel" />{" "}
                Diskon Produk
              </label>
              <Popover
                open={diskonTerbuka}
                onOpenChange={(o) =>
                  onDiskonTerbuka(o)
                }
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
                      placeholder="Cari diskon item..."
                      className="text-navy"
                    />
                    <CommandList>
                      <CommandEmpty className="py-4 text-center text-xs font-medium text-navy/60">
                        Belum ada diskon aktif.
                      </CommandEmpty>
                      <CommandGroup>
                        {activeDiskonItem.map((d, idx) => {
                          const targetId = d.id;
                          const isSelected =
                            item.diskonItemIDs.includes(targetId);
                          const safeKey =
                            targetId || `item-diskon-${idx}`;

                          return (
                            <CommandItem
                              key={safeKey}
                              onSelect={() =>
                                onToggleDiskon(targetId)
                              }
                              className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                            >
                              <div className="flex flex-1 items-center gap-2">
                                {/* Checkbox Custom untuk CommandItem */}
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
                                {d.tipe === "persen"
                                  ? `${d.nilai}%`
                                  : "Rp"}
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

            {item.diskonItemIDs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {item.diskonItemIDs.map((id, idx) => {
                  const d = activeDiskonItem.find(
                    (x) => (x.id) === id,
                  );
                  if (!d) return null;
                  return (
                    <Badge
                      key={d.id || `badge-item-${idx}`}
                      className="bg-karamel text-navy border-none hover:bg-karamel text-[10px] font-bold shadow-sm"
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
        )}

        {selectedProduk && (
          <div className="flex flex-col items-end gap-1 pt-3 border-t border-navy/5 mt-2">
            {itemCalc.totalDiskonItem > 0 && (
              <span className="text-xs text-rose-500 line-through font-mono">
                {formatRupiah(itemCalc.subTotal)}
              </span>
            )}
            <span className="text-sm font-bold text-navy font-mono">
              {formatRupiah(itemCalc.totalHarga)}
            </span>
          </div>
        )}
      </div>
  );
}
