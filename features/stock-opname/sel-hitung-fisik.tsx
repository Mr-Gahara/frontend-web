"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PilihSatuan } from "@/features/bahan-baku/pilih-satuan";
import { faktorKeDasar, pilihanSatuan, type BahanBersatuan } from "@/features/bahan-baku/satuan";
import { formatAngka } from "@/lib/format";
import type { StockOpnameItem } from "@/types/stockOpname";
import { pakaiRincian, totalIsianDasar, type IsianItem, type RincianIsian } from "./payload";

/** Batas baris rincian hitung fisik di backend (B366). */
const BATAS_RINCIAN = 10;

/**
 * Sel Stok Fisik detail stock opname. Bahan tanpa kemasan memakai satu
 * isian satuan dasar seperti sebelumnya; bahan berkemasan memakai baris
 * jumlah + satuan, misalnya 21 kaleng + 170 ml, yang dijumlah server ke
 * satuan dasar (P87, B366; pemilik proyek, 23 November 2026).
 */
export function SelHitungFisik({
  item,
  isian,
  dapatDiubah,
  bahan,
  onUbahQty,
  onUbahRincian,
}: {
  item: StockOpnameItem;
  isian: IsianItem | undefined;
  dapatDiubah: boolean;
  bahan: BahanBersatuan;
  onUbahQty: (nilai: string) => void;
  onUbahRincian: (rincian: RincianIsian[]) => void;
}) {
  if (!dapatDiubah) {
    return (
      <div className="flex flex-col sm:items-center">
        <span className="font-bold text-navy font-mono">{item.qtyPhysical ?? "-"}</span>
        {item.rincianFisik && item.rincianFisik.length > 0 && (
          <span className="text-kecil font-medium text-navy/60">
            {item.rincianFisik.map((r) => `${formatAngka(r.jumlah)} ${r.satuan}`).join(" + ")}
          </span>
        )}
      </div>
    );
  }

  if (pilihanSatuan(bahan).length <= 1) {
    return (
      <Input
        type="text"
        inputMode="numeric"
        placeholder="0"
        aria-label={`Stok fisik ${item.namaSnapshot}`}
        value={isian?.qtyPhysical ?? ""}
        onChange={(e) => onUbahQty(e.target.value)}
        className="w-full sm:text-center font-bold font-mono bg-white border-navy/20 focus-visible:ring-navy"
      />
    );
  }

  const rincian: RincianIsian[] = isian?.rincian ?? [{ satuan: item.satuanSnapshot, jumlah: isian?.qtyPhysical ?? "" }];
  const total = totalIsianDasar(isian, item.satuanSnapshot, (satuan) => faktorKeDasar(bahan, satuan));
  const ubahBaris = (i: number, ubah: Partial<RincianIsian>) =>
    onUbahRincian(rincian.map((r, j) => (j === i ? { ...r, ...ubah } : r)));

  return (
    <div className="flex min-w-[230px] flex-col gap-2">
      {rincian.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0"
            aria-label={`Jumlah ${i + 1} stok fisik ${item.namaSnapshot}`}
            value={r.jumlah}
            onChange={(e) => ubahBaris(i, { jumlah: e.target.value.replace(/[^0-9.]/g, "") })}
            className="w-20 shrink-0 text-center font-bold font-mono bg-white border-navy/20 focus-visible:ring-navy"
          />
          <PilihSatuan
            id={`opname-satuan-${item.itemId}-${i}`}
            label={`Satuan ${i + 1} stok fisik ${item.namaSnapshot}`}
            bahan={bahan}
            value={r.satuan}
            onChange={(satuan) => ubahBaris(i, { satuan })}
            className="min-w-0 flex-1 bg-white"
          />
          {rincian.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Hapus baris ${i + 1} stok fisik ${item.namaSnapshot}`}
              onClick={() => onUbahRincian(rincian.filter((_, j) => j !== i))}
              className="h-9 w-9 shrink-0 cursor-pointer text-rose-500 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {rincian.length < BATAS_RINCIAN && (
          <button
            type="button"
            onClick={() => onUbahRincian([...rincian, { satuan: item.satuanSnapshot, jumlah: "" }])}
            className="cursor-pointer text-kecil font-bold text-navy underline-offset-2 hover:underline"
          >
            + Tambah satuan
          </button>
        )}
        {isian && pakaiRincian(isian, item.satuanSnapshot) && total !== null && (
          <span className="text-kecil font-semibold text-navy/70">
            = {formatAngka(total)} {item.satuanSnapshot}
          </span>
        )}
      </div>
    </div>
  );
}
