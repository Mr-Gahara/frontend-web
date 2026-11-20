"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PropsKakiPaginasi {
  total: number;
  halaman: number;
  jumlahHalaman: number;
  bisaSebelumnya: boolean;
  bisaBerikutnya: boolean;
  onSebelumnya: () => void;
  onBerikutnya: () => void;
  ukuran: number;
  pilihanUkuran?: readonly number[];
  onGantiUkuran?: (ukuran: number) => void;
}

/**
 * Kaki daftar: jumlah data, pilihan baris per halaman, dan tombol halaman,
 * berupa kontrol polos tanpa latar maupun kotak (TB3a). Dipakai DataTable dan
 * daftar kartu berhalaman server (Penerimaan dan Pengiriman, 20 November
 * 2026), sehingga keduanya sama persis.
 */
export function KakiPaginasi({
  total,
  halaman,
  jumlahHalaman,
  bisaSebelumnya,
  bisaBerikutnya,
  onSebelumnya,
  onBerikutnya,
  ukuran,
  pilihanUkuran,
  onGantiUkuran,
}: PropsKakiPaginasi) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
      <p className="text-kecil font-semibold text-navy/60">{total} total data</p>
      <div className="flex items-center gap-1 sm:gap-2">
        {pilihanUkuran && onGantiUkuran && (
          <div className="flex items-center gap-1">
            <span className="text-kecil font-semibold text-navy/60">Tampilkan</span>
            <Select value={String(ukuran)} onValueChange={(nilai) => onGantiUkuran(Number(nilai))}>
              <SelectTrigger
                aria-label="Jumlah baris per halaman"
                className="h-8 w-auto cursor-pointer gap-1 border-0 bg-transparent px-1 text-kecil font-bold text-navy shadow-none focus-visible:ring-1 focus-visible:ring-navy/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pilihanUkuran.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous"
          onClick={onSebelumnya}
          disabled={!bisaSebelumnya}
          className="h-8 w-8 cursor-pointer text-navy hover:bg-transparent hover:text-navy/60"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-kecil font-semibold text-navy/60">
          Halaman {halaman} dari {jumlahHalaman}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next"
          onClick={onBerikutnya}
          disabled={!bisaBerikutnya}
          className="h-8 w-8 cursor-pointer text-navy hover:bg-transparent hover:text-navy/60"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
