"use client";

import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onEdit: () => void;
  onHapus: () => void;
}

/**
 * Menu titik tiga Edit dan Hapus untuk baris tabel daftar (TB7a), bergaya
 * menu shift dan pola roster: ikon, pemisah, dan Hapus merah (TB19a, TB21a).
 */
export default function MenuEditHapus({ onEdit, onHapus }: Props) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Buka menu"
            className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-gading border-navy/10 rounded-xl shadow-lg">
          <DropdownMenuItem
            onClick={onEdit}
            className="cursor-pointer font-bold text-navy hover:bg-navy/5 rounded-lg m-1"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-navy/5" />
          <DropdownMenuItem
            onClick={onHapus}
            className="cursor-pointer font-bold text-red-600 focus:text-red-700 focus:bg-red-500/10 rounded-lg m-1"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}