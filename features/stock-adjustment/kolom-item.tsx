"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatKoreksi, type BarisItemAdjustment } from "./tampilan";

/** Kolom tabel rincian item di detail stock adjustment (DataTable rincian, CV22a). */
export const KOLOM_ITEM_ADJUSTMENT: ColumnDef<BarisItemAdjustment>[] = [
  {
    id: "nama",
    header: "Nama Item",
    cell: ({ row }) => (
      <div>
        <p className="font-bold text-navy">{row.original.nama}</p>
        <p className="text-xs text-navy/50 font-medium">Satuan: {row.original.satuan}</p>
      </div>
    ),
  },
  {
    id: "sistem",
    header: () => <div className="text-center">Saldo Sistem (Saat Disetujui)</div>,
    meta: { label: "Saldo Sistem (Saat Disetujui)" },
    cell: ({ row }) => (
      <div className="sm:text-center font-bold text-navy/60 font-mono">
        {row.original.qtySistem}
        {row.original.qtySaatDraf !== null && (
          <p className="text-[10px] font-medium text-navy/50 font-sans">Saat draf: {row.original.qtySaatDraf}</p>
        )}
      </div>
    ),
  },
  {
    id: "fisik",
    header: () => <div className="text-center">Fisik Riil</div>,
    meta: { label: "Fisik Riil" },
    cell: ({ row }) => <div className="sm:text-center font-bold text-navy font-mono">{row.original.qtyFisik}</div>,
  },
  {
    id: "koreksi",
    header: () => <div className="text-center">Koreksi (Delta)</div>,
    meta: { label: "Koreksi (Delta)" },
    cell: ({ row }) => {
      const warna =
        row.original.arah === "tambah"
          ? "bg-emerald-100 text-emerald-700"
          : row.original.arah === "kurang"
            ? "bg-rose-100 text-rose-700"
            : "bg-navy/10 text-navy";
      return (
        <div className="sm:text-center">
          <Badge variant="outline" className={`border-none font-bold font-mono px-2 py-0.5 ${warna}`}>
            {formatKoreksi(row.original.qtyKoreksi)}
          </Badge>
        </div>
      );
    },
  },
];
