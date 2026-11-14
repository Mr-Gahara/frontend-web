"use client";

import { AlertTriangle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import type { PengajuanItem } from "@/types/pengajuanStok";

const kolomNama: ColumnDef<PengajuanItem> = {
  id: "barang",
  header: "Nama Barang",
  cell: ({ row }) => <span className="font-bold text-navy">{row.original.bahanBaku?.namaBahan || "Item Tidak Dikenal"}</span>,
};

const jumlah = (judul: string): ColumnDef<PengajuanItem> => ({
  id: "jumlah",
  header: () => <div className="text-center">{judul}</div>,
  meta: { label: judul },
  cell: ({ row }) => (
    <div className="sm:text-center">
      <span className="font-mono font-bold text-navy bg-navy/5 px-3 py-1 rounded-md">
        {row.original.jumlah} <span className="text-kecil font-sans font-medium text-navy/60">{row.original.satuan}</span>
      </span>
    </div>
  ),
});

/**
 * Kolom tabel rincian barang di detail pengajuan stok (DataTable rincian,
 * CV22a). Ruang outlet: nama dan Jumlah Diajukan. Ruang gudang: nama,
 * Permintaan, dan stok sumber (gudang, atau outlet untuk pengembalian)
 * yang ditandai bila kurang.
 */
export const KOLOM_BARANG_PENGAJUAN_OUTLET: ColumnDef<PengajuanItem>[] = [kolomNama, jumlah("Jumlah Diajukan")];

export function kolomBarangPengajuanGudang(pengembalian: boolean): ColumnDef<PengajuanItem>[] {
  const judulStok = pengembalian ? "Stok Outlet" : "Stok Gudang";
  return [
    kolomNama,
    jumlah("Permintaan"),
    {
      id: "stok",
      header: () => <div className="text-center">{judulStok}</div>,
      meta: { label: judulStok },
      cell: ({ row }) => {
        const stokTersedia = row.original.stokGudangSaatIni || 0;
        const isKurang = row.original.jumlah > stokTersedia;
        return (
          <div className="sm:text-center">
            <span
              className={cn(
                "font-mono font-bold px-3 py-1 rounded-md flex items-center justify-center gap-1.5 w-fit mx-auto",
                isKurang ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700",
              )}
            >
              {isKurang && <AlertTriangle className="w-3.5 h-3.5" />}
              {stokTersedia}{" "}
              <span className={cn("text-kecil font-sans font-medium", isKurang ? "text-rose-600/70" : "text-emerald-700/70")}>
                {row.original.satuan}
              </span>
            </span>
          </div>
        );
      },
    },
  ];
}
