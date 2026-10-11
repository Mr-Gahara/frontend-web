"use client";

import { Button } from "@/components/ui/button";

/**
 * Pesan pengganti isi saat data gagal dimuat. Halaman lama hanya
 * menampilkan toast, sehingga daftar tampak kosong.
 */
export function PesanPajak({ judul, pesan, onCobaLagi }: { judul: string; pesan: string; onCobaLagi?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <p className="text-sm font-bold text-red-600">{judul}</p>
      <p className="text-sm font-medium text-navy/70">{pesan}</p>
      {onCobaLagi && (
        <Button
          type="button"
          variant="outline"
          onClick={onCobaLagi}
          className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
        >
          Coba Lagi
        </Button>
      )}
    </div>
  );
}