"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onUbahMinimum: () => void;
  onSesuaikanStok: () => void;
}

/**
 * Aksi baris tabel stok di menu titik tiga (TB7a), dipakai stok outlet dan
 * inventaris gudang dengan label yang sama (TB16a).
 */
export default function MenuAksiStok({ onUbahMinimum, onSesuaikanStok }: Props) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gading border-navy/10">
          <DropdownMenuItem className="cursor-pointer font-bold text-navy/80" onClick={onUbahMinimum}>
            Ubah batas minimum
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer font-bold text-navy/80" onClick={onSesuaikanStok}>
            Sesuaikan stok
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}