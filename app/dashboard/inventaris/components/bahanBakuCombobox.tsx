"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BahanBakuComboboxProps } from "@/types/bahanBaku";

export function BahanBakuCombobox({
  value,
  onChange,
  onSatuanChange,
  bahanBakuList,
  isLoading,
  hasError,
}: BahanBakuComboboxProps) {
  const [open, setOpen] = useState(false);

  // FIX: Defensively check for both _id and id, and explicitly cast to String
  // to prevent type mismatches (e.g., ObjectIDs returned as raw objects).
  const selected = (bahanBakuList as any[]).find((b) => {
    const currentId = b?._id || b?.id;
    return currentId && String(currentId) === String(value);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white border-[#0A2947]/20 text-[#0A2947] h-10 focus:ring-1 focus:ring-[#0A2947]",
            hasError && "border-rose-500",
            selected ? "font-bold" : "font-normal",
          )}
        >
          <span className={cn("truncate", !selected && "text-[#0A2947]/50")}>
            {isLoading
              ? "Memuat bahan..."
              : selected
                ? `${selected.namaBahan} (${selected.satuan})`
                : "Pilih bahan..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10"
        align="start"
      >
        <Command className="bg-white">
          <CommandInput
            placeholder="Cari bahan baku..."
            className="text-[#0A2947]"
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm text-[#0A2947]/60 font-medium">
              Bahan tidak ditemukan.
            </CommandEmpty>
            <CommandGroup>
              {(bahanBakuList as any[]).map((bb) => {
                // FIX: Safely extract ID for the render loop as well
                const itemId = String(bb?._id || bb?.id || "");

                return (
                  <CommandItem
                    key={itemId}
                    value={bb.namaBahan}
                    onSelect={() => {
                      onChange(itemId);
                      onSatuanChange(bb.satuan);
                      setOpen(false);
                    }}
                    className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-medium"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-[#718355]",
                        String(value) === itemId ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {bb.namaBahan}
                    <span className="ml-1 text-xs text-[#0A2947]/50 font-normal">
                      ({bb.satuan})
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}