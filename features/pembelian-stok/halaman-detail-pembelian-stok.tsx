"use client";

import { useMemo, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Ban, CheckCircle2, Info, Lock, ShoppingCart } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { isNotFound } from "@/lib/api/error";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { ItemPembelianStok } from "@/types/pembelianStok";
import { usePembelianStok } from "./hooks";
import type { RuangPembelian } from "./izin";
import { TIPE_LOKASI_PEMBELIAN, URL_PEMBELIAN } from "./ruang";
import {
  lokasiPembelian,
  namaAkunPembelian,
  namaBahanItem,
  namaPencatat,
  teksJumlahItem,
} from "./tampilan";

interface Props {
  ruang: RuangPembelian;
}

/**
 * Barang di DataTable tanpa paginasi server, agar tampil sebagai kartu di
 * HP seperti daftar lain (pemilik proyek, 25 Oktober 2026).
 */
const KOLOM_BARANG: ColumnDef<ItemPembelianStok>[] = [
  {
    id: "bahan",
    header: "Bahan baku",
    cell: ({ row }) => (
      <span className={row.original.bahanBakuID ? "font-bold text-navy" : "font-bold text-rose-500 line-through"}>
        {namaBahanItem(row.original)}
      </span>
    ),
  },
  {
    id: "jumlah",
    header: () => <div className="text-right">Jumlah</div>,
    meta: { label: "Jumlah" },
    cell: ({ row }) => <div className="text-right font-mono text-navy">{teksJumlahItem(row.original)}</div>,
  },
  {
    id: "harga",
    header: () => <div className="text-right">Harga satuan</div>,
    meta: { label: "Harga satuan" },
    cell: ({ row }) => <div className="text-right text-navy">{formatRupiah(row.original.hargaBeli)}</div>,
  },
  {
    id: "subtotal",
    header: () => <div className="text-right">Subtotal</div>,
    meta: { label: "Subtotal" },
    cell: ({ row }) => (
      <div className="text-right font-bold text-navy">{formatRupiah(row.original.subtotal)}</div>
    ),
  },
];

export default function HalamanDetailPembelianStok({ ruang }: Props) {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const urlDaftar = URL_PEMBELIAN[ruang];

  const { data: pembelian, isLoading, error } = usePembelianStok(id);
  const daftarLokasi = useDaftarLokasi();
  const barang = useMemo(() => pembelian?.items ?? [], [pembelian]);

  if (isLoading || daftarLokasi.isLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent"></div>
        <p className="text-sm font-bold text-navy/60">Memuat pembelian...</p>
      </div>
    );
  }

  if (error || !pembelian) {
    const tidakAda = !error || isNotFound(error);
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-navy">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          {tidakAda ? "Pembelian tidak ditemukan." : "Gagal memuat pembelian. Coba muat ulang halaman."}
        </p>
        <Button onClick={() => router.push(urlDaftar)} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Stok outlet dan gudang tidak dicampur di tampilan mana pun (Model bisnis
  // MVP). Detail diambil per id tanpa melihat lokasi, sehingga pembelian milik
  // ruang lain yang dibuka lewat URL ditolak di sini, seperti detail stock
  // adjustment. Ini penjaga tampilan, bukan pengaman akses: backend belum
  // membedakan pembelian per ruang (IZIN_PEMBELIAN_STOK_RUANG). Lokasi yang
  // tidak diketahui, karena terhapus atau daftar lokasi gagal dimuat, tetap
  // ditampilkan.
  const lokasi = lokasiPembelian(pembelian, daftarLokasi.data);
  if (lokasi && lokasi.tipe !== TIPE_LOKASI_PEMBELIAN[ruang]) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-navy">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          Pembelian ini diterima lokasi {lokasi.tipe} dan tidak ditampilkan di ruang ini.
        </p>
        <Button onClick={() => router.push(urlDaftar)} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const namaLokasi = lokasi?.nama ?? "lokasi penerima";
  const catatanKunci = pembelian.stokDitambahkan
    ? `Barang, lokasi penerima, dan akun kas terkunci. Menghapus pembelian ini mengurangi kembali stok yang ditambahkannya dari ${namaLokasi}.`
    : "Pembelian ini tidak pernah menambah stok, sehingga menghapusnya tidak mengubah stok mana pun.";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
          onClick={() => router.push(urlDaftar)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Pembelian Stok
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gading border border-navy/10 rounded-lg shrink-0 shadow-sm">
            <ShoppingCart className="w-6 h-6 text-karamel" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">Pembelian dari {pembelian.supplier}</h1>
            <p className="text-sm font-medium text-navy/60">
              No. Faktur:{" "}
              <span className="font-bold font-mono text-navy break-all">{pembelian.nomorFaktur || "-"}</span>
            </p>
          </div>
        </div>
        <div>
          {pembelian.stokDitambahkan ? (
            <Badge className="bg-sage text-gading px-3 py-1 font-bold border-none shadow-sm text-xs">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Stok masuk ke {namaLokasi}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-navy/20 text-navy/70 px-3 py-1 font-bold text-xs">
              Dicatat sebelum stok bertambah otomatis
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <BarisInfo label="Tanggal pembelian">{formatTanggal(pembelian.tanggal)}</BarisInfo>
          <BarisInfo label="Supplier">{pembelian.supplier}</BarisInfo>
          <BarisInfo label="Dibayar dari">
            {namaAkunPembelian(pembelian)}
            {pembelian.akunKasID?.nomorAkun && (
              <span className="block font-mono text-xs font-medium text-navy/60">
                {pembelian.akunKasID.nomorAkun}
              </span>
            )}
          </BarisInfo>
          <BarisInfo label="Lokasi penerima">{lokasi?.nama ?? "-"}</BarisInfo>
          <BarisInfo label="Dicatat oleh">{namaPencatat(pembelian)}</BarisInfo>
          <div className="sm:col-span-2 lg:col-span-3">
            <BarisInfo label="Keterangan">{pembelian.keterangan}</BarisInfo>
          </div>
        </div>
      </div>

      <Alert className="border-karamel/50 bg-karamel/15 text-navy">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">Saldo akun kas belum terpotong</AlertTitle>
        <AlertDescription className="text-navy/80">
          Pembelian ini belum mengurangi saldo {namaAkunPembelian(pembelian)} dan tidak tampil di buku mutasi kas.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-navy">Barang yang dibeli</h2>
        <DataTable columns={KOLOM_BARANG} data={barang} emptyMessage="Tidak ada barang." />
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-navy px-5 py-4 text-gading shadow-md">
          <span className="text-sm font-bold">Total pembelian</span>
          <span className="text-xl font-black tracking-tight">{formatRupiah(pembelian.totalBiaya)}</span>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs font-medium text-navy/60">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {catatanKunci}
      </p>
    </div>
  );
}

function BarisInfo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-navy/60">{label}</p>
      <div className="font-semibold text-navy">{children}</div>
    </div>
  );
}