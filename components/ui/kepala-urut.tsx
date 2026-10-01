"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Judul kolom yang dapat diurutkan. Klik pertama mengurutkan naik, lalu
 * bergantian turun dan naik. Pada tabel berurutan server, pergantiannya
 * diteruskan DataTable ke pemakai lewat urutanServer.
 */
export function KepalaUrut<TData, TValue>({
  column,
  judul,
  className,
}: {
  column: Column<TData, TValue>;
  judul: string;
  className?: string;
}) {
  const arah = column.getIsSorted();
  const Ikon = arah === "asc" ? ArrowUp : arah === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(arah === "asc")}
      className={cn(
        "-ml-3 h-8 cursor-pointer gap-1 text-xs font-bold text-[#0A2947]/60 hover:bg-[#0A2947]/5",
        className,
      )}
    >
      {judul}
      <Ikon className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  );
}