"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TransferItem } from "@/types/transferStok";

/**
 * Kolom tabel rincian Muatan Pengiriman di detail surat jalan (DataTable
 * rincian, CV22a). Diterima dan Selisih hanya untuk surat jalan DITERIMA.
 */
export function kolomMuatan(diterima: boolean): ColumnDef<TransferItem>[] {
  const kolom: ColumnDef<TransferItem>[] = [
    {
      id: "barang",
      header: "Nama Barang",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-navy">{row.original.bahanBaku?.namaBahan || "Item Tidak Dikenal"}</span>
          {row.original.catatanItem && (
            <span className="text-kecil text-rose-600 font-medium italic mt-1">Catatan: {row.original.catatanItem}</span>
          )}
        </div>
      ),
    },
    {
      id: "dikirim",
      header: () => <div className="text-center">Dikirim</div>,
      meta: { label: "Dikirim" },
      cell: ({ row }) => (
        <div className="sm:text-center">
          <span className="font-mono font-bold text-navy bg-navy/5 px-3 py-1 rounded-md border border-navy/10">
            {row.original.qtyKirim}{" "}
            <span className="text-kecil font-sans font-medium text-navy/60">{row.original.bahanBaku?.satuan}</span>
          </span>
        </div>
      ),
    },
  ];
  if (!diterima) return kolom;
  return [
    ...kolom,
    {
      id: "diterima",
      header: () => <div className="text-center">Diterima</div>,
      meta: { label: "Diterima" },
      cell: ({ row }) => <div className="sm:text-center font-mono font-bold text-navy">{row.original.qtyTerima}</div>,
    },
    {
      id: "selisih",
      header: () => <div className="text-center">Selisih</div>,
      meta: { label: "Selisih" },
      cell: ({ row }) => (
        <div className="sm:text-center">
          <span
            className={`font-mono font-bold px-2 py-1 rounded-md ${
              row.original.selisih === 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
            }`}
          >
            {row.original.selisih === 0 ? "Pas" : row.original.selisih}
          </span>
        </div>
      ),
    },
  ];
}
