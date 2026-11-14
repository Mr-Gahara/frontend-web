"use client";

import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { ItemPenjualan, PembayaranPenjualan } from "@/types/penjualan";

/**
 * Kolom tabel rincian detail penjualan (DataTable rincian, CV22a): kartu
 * baris seperti tabel daftar, dan kartu berlabel di HP. Isi sel sama dengan
 * tabel lama yang ditulis sendiri.
 */
export const KOLOM_ITEM_PENJUALAN: ColumnDef<ItemPenjualan>[] = [
  {
    id: "produk",
    header: "Produk",
    cell: ({ row }) => <span className="font-bold text-navy">{row.original.namaProduk}</span>,
  },
  {
    id: "harga",
    header: () => <div className="text-right">Harga</div>,
    meta: { label: "Harga" },
    cell: ({ row }) => (
      <div className="sm:text-right font-semibold text-navy">{formatRupiah(row.original.hargaJual)}</div>
    ),
  },
  {
    id: "qty",
    header: () => <div className="text-center">Qty</div>,
    meta: { label: "Qty" },
    cell: ({ row }) => <div className="sm:text-center font-bold text-navy">{row.original.jumlah}</div>,
  },
  {
    id: "diskon",
    header: () => <div className="text-right">Diskon Item</div>,
    meta: { label: "Diskon Item" },
    cell: ({ row }) => (
      <div className="sm:text-right font-semibold text-rose-500 font-mono">
        {row.original.jumlahDiskon > 0 ? `-${formatRupiah(row.original.jumlahDiskon)}` : "-"}
      </div>
    ),
  },
  {
    id: "subtotal",
    header: () => <div className="text-right">Subtotal</div>,
    meta: { label: "Subtotal" },
    cell: ({ row }) => (
      <div className="sm:text-right font-bold text-navy font-mono">{formatRupiah(row.original.totalharga)}</div>
    ),
  },
];

/** Kolom riwayat pembayaran; tombol Batalkan hanya bila boleh membatalkan. */
export function kolomRiwayatPembayaran(
  bolehBatalkan: (pembayaran: PembayaranPenjualan) => boolean,
  onBatalkan: (pembayaran: PembayaranPenjualan) => void,
): ColumnDef<PembayaranPenjualan>[] {
  return [
    {
      id: "tanggal",
      header: "Tanggal Bayar",
      cell: ({ row }) => (
        <span className="font-semibold text-navy">
          {row.original.tanggalBayar ? format(new Date(row.original.tanggalBayar), "dd MMM yyyy, HH:mm") : "-"}
        </span>
      ),
    },
    {
      id: "metode",
      header: "Metode",
      cell: ({ row }) => <span className="font-bold text-navy">{row.original.namaMetodePembayaran || "-"}</span>,
    },
    {
      id: "catatan",
      header: "Catatan",
      cell: ({ row }) => (
        <div className="font-medium text-navy/60 text-xs">
          <span className="line-clamp-1">{row.original.catatan || "-"}</span>
          {row.original.status === "VOID" && row.original.alasanVoid && (
            <span className="block line-clamp-1 text-red-700">Alasan batal: {row.original.alasanVoid}</span>
          )}
        </div>
      ),
    },
    {
      id: "jumlah",
      header: () => <div className="text-right">Jumlah</div>,
      meta: { label: "Jumlah" },
      cell: ({ row }) => (
        <div className="sm:text-right font-bold text-navy font-mono">{formatRupiah(row.original.jumlahBayar)}</div>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      meta: { label: "Status" },
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="sm:text-center">
            <Badge
              variant="outline"
              className={`font-bold border-none shadow-sm px-2.5 py-0.5 ${status === "PAID" ? "bg-sage text-gading" : status === "VOID" ? "bg-navy/10 text-navy/60" : "bg-karamel text-navy"}`}
            >
              {status === "PAID" ? "Sukses" : status === "VOID" ? "Batal" : status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "aksi",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) =>
        bolehBatalkan(row.original) ? (
          <div className="sm:text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBatalkan(row.original)}
              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-500/10 font-bold"
            >
              Batalkan
            </Button>
          </div>
        ) : null,
    },
  ];
}
