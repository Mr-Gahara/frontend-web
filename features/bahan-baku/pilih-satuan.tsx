"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { pilihanSatuan, type BahanBersatuan } from "./satuan";

/**
 * Pilihan satuan per baris masukan (pembelian, pengajuan, surat jalan, hitung
 * opname). Nilai kosong berarti satuan dasar bahan. Tanpa bahan terpilih
 * dinonaktifkan.
 */
export function PilihSatuan({
  id,
  bahan,
  value,
  onChange,
  disabled = false,
  invalid = false,
  className,
  label,
}: {
  id: string;
  bahan: BahanBersatuan | null | undefined;
  value: string;
  onChange: (satuan: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Nama aksesibel bila tidak ada label terlihat yang menunjuk id. */
  label?: string;
}) {
  const pilihan = pilihanSatuan(bahan);
  const nilai = value || bahan?.satuan || "";
  return (
    <Select value={nilai} onValueChange={onChange} disabled={disabled || pilihan.length === 0}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn("w-full bg-transparent border-navy/20 font-bold text-navy focus:ring-navy", invalid && "border-rose-500", className)}
      >
        <SelectValue placeholder="Satuan" />
      </SelectTrigger>
      <SelectContent className="bg-white border-navy/10 text-navy">
        {pilihan.map((p) => (
          <SelectItem key={p.nilai} value={p.nilai} className="cursor-pointer font-bold">
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
