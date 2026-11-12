"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RuangPembelian } from "./izin";
import { urlCatatPembelian } from "./ruang";

const KELAS_TOMBOL = "cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto font-bold";

const LABEL_RUANG: Record<RuangPembelian, string> = { outlet: "Ke outlet", gudang: "Ke gudang" };

/**
 * Tombol "Catat pembelian" di Belanja Stok (pemilik proyek, 12 November
 * 2026). Satu ruang yang boleh langsung membuka form catat ruang itu; outlet
 * dan gudang membuka menu pilihan. Tidak tampil bila tidak ada ruang
 * (ruangCatatBelanja di features/pembelian-stok/ruang.ts).
 */
export function TombolCatatBelanja({ ruang }: { ruang: RuangPembelian[] }) {
  if (ruang.length === 0) return null;

  if (ruang.length === 1) {
    return (
      <Button asChild className={KELAS_TOMBOL}>
        <Link href={urlCatatPembelian(ruang[0])}>
          <Plus className="mr-2 h-4 w-4" /> Catat pembelian
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={KELAS_TOMBOL}>
          <Plus className="mr-2 h-4 w-4" /> Catat pembelian
          <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gading border-navy/10">
        {ruang.map((r) => (
          <DropdownMenuItem key={r} asChild className="cursor-pointer font-bold text-navy/80">
            <Link href={urlCatatPembelian(r)}>{LABEL_RUANG[r]}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
