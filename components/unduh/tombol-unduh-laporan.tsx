"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pesanError } from "@/lib/api/error";
import { cn } from "@/lib/utils";
import { PILIHAN_FORMAT_LAPORAN, simpanBerkas, type FormatLaporan } from "@/lib/unduh";

/**
 * Tombol "Unduh laporan" laporan ringkasan (Arus Kas, Ringkasan Laba/Rugi,
 * Pembayaran per Metode): menu PDF, Excel, CSV dengan periode dan filter
 * laman yang sedang tampil (backend P85).
 */
export function TombolUnduhLaporan<F extends FormatLaporan = FormatLaporan>({
  unduh,
  disabled = false,
  pilihan = PILIHAN_FORMAT_LAPORAN as { format: F; label: string }[],
  label = "Unduh laporan",
  className,
}: {
  unduh: (format: F) => Promise<{ berkas: Blob; nama: string }>;
  disabled?: boolean;
  /** Format yang ditawarkan; bawaan PDF, Excel, CSV. Rekap absensi hanya Excel dan CSV. */
  pilihan?: { format: F; label: string }[];
  label?: string;
  className?: string;
}) {
  const [mengunduh, setMengunduh] = useState<F | null>(null);

  const jalankan = async (format: F) => {
    setMengunduh(format);
    try {
      const { berkas, nama } = await unduh(format);
      simpanBerkas(berkas, nama);
    } catch (e) {
      toast.error(pesanError(e, "Laporan gagal diunduh."));
    } finally {
      setMengunduh(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          disabled={disabled || mengunduh !== null}
          className={cn("h-10 bg-navy text-gading hover:bg-navy/90 font-bold cursor-pointer", className)}
        >
          {mengunduh ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" aria-hidden="true" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gading border-navy/10">
        {pilihan.map((p) => (
          <DropdownMenuItem key={p.format} className="cursor-pointer font-bold text-navy/80" onClick={() => jalankan(p.format)}>
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
