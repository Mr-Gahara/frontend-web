"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { Penjualan, StatusBayar, StatusPenjualan } from "@/types/penjualan";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Receipt,
  User,
} from "lucide-react";

// --- HELPERS ---
const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const badgeStatusBayar = (status: StatusBayar) => {
  const map: Record<StatusBayar, { label: string; className: string }> = {
    PAID: { label: "Lunas", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
    UNPAID: { label: "Belum Bayar", className: "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200" },
    PARTIAL: { label: "Sebagian", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" },
  };
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

const badgeStatusPenjualan = (status: StatusPenjualan) => {
  const map: Record<StatusPenjualan, { label: string; className: string }> = {
    FINAL: { label: "Final", className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" },
    DRAFT: { label: "Draft", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200" },
    VOID: { label: "Void", className: "bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200" },
  };
  const config = map[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

// --- INTERFACE PEMBAYARAN (Sementara) ---
interface Pembayaran {
  _id: string;
  penjualanID: any;
  noReferensi: string;
  tanggalBayar: string;
  jumlahBayar: number;
  status: string;
  metodePembayaranID?: { _id: string; namaMetode?: string };
  catatan?: string;
}

export default function DetailPenjualanPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const idPenjualan = params.id as string;

  // 1. QUERY DETAIL PENJUALAN
  const { data: penjualan, isLoading: loadingPenjualan, error: errorPenjualan } = useQuery({
    queryKey: [...queryKeys.penjualan, idPenjualan],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/penjualan/${idPenjualan}`, undefined, "pengguna");
      return (res.data?.data || res.data) as Penjualan;
    },
    enabled: !!idPenjualan, // <-- Mencegah query berjalan sebelum ID tertangkap dari URL
  });

  // 2. QUERY DAFTAR PEMBAYARAN (Hanya dipanggil jika penjualan sudah ada)
  const { data: allPembayaran = [], isLoading: loadingPembayaran } = useQuery({
    queryKey: ["pembayaran"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/pembayaran", undefined, "pengguna");
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!penjualan,
  });

  // 3. FILTER PEMBAYARAN KHUSUS TRANSAKSI INI
  const pembayaranTerkait = useMemo(() => {
    return allPembayaran.filter((p: Pembayaran) => {
      const pId = typeof p.penjualanID === "object" ? p.penjualanID?._id : p.penjualanID;
      return pId === idPenjualan;
    });
  }, [allPembayaran, idPenjualan]);

  // ERROR HANDLER
  useEffect(() => {
    if (errorPenjualan) {
      toast.error("Gagal Memuat", {
        description: errorPenjualan instanceof Error ? errorPenjualan.message : "Data penjualan tidak ditemukan.",
      });
      router.push("/dashboard/penjualan");
    }
  }, [errorPenjualan, router]);

  if (loadingPenjualan) {
    return <div className="p-8 text-center text-muted-foreground">Memuat detail transaksi...</div>;
  }

  if (!penjualan) return null;

  const isDraft = penjualan.statusPenjualan === "DRAFT";
  const canPay = penjualan.statusPenjualan !== "VOID" && penjualan.sisaTagihan > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => router.push("/dashboard/penjualan")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Detail Transaksi</h1>
            <p className="text-sm text-muted-foreground">
              No. Ref: <span className="font-mono text-foreground">{penjualan.noReferensi}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Badge Status Besar di Kanan Atas */}
          <div className="mr-2 flex gap-2">
            {badgeStatusPenjualan(penjualan.statusPenjualan)}
            {badgeStatusBayar(penjualan.statusBayar)}
          </div>

          {/* Tombol Aksi Kontekstual */}
          {/* {isDraft && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/penjualan/${idPenjualan}/edit`)}
            >
              Edit Penjualan
            </Button>
          )} */}
          {canPay && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              onClick={() => router.push(`/dashboard/penjualan/${idPenjualan}/pembayaran`)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Terima Pembayaran
            </Button>
          )}
        </div>
      </div>

      {/* INFORMASI UMUM (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Transaksi */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Informasi Transaksi</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Tanggal & Waktu</p>
              <p className="font-medium">{formatTanggal(penjualan.tanggalTransaksi)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Jenis Transaksi</p>
              <p className="font-medium uppercase">{penjualan.jenisTransaksi}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Tipe Pesanan</p>
              <p className="font-medium capitalize">{penjualan.jenisPenjualan}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Kasir / Operator</p>
              <p className="font-medium">{penjualan.dataPengguna?.nama || "-"}</p>
            </div>
          </div>
        </div>

        {/* Info Pelanggan */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Informasi Pelanggan</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-base">{penjualan.dataPelanggan?.namaPelanggan || "Umum"}</p>
                {penjualan.dataPelanggan && (
                  <Badge variant="secondary" className="mt-1 capitalize text-xs">
                    {(penjualan.dataPelanggan as any).tipePelanggan || "Umum"}
                  </Badge>
                )}
              </div>
            </div>
            {(penjualan.dataPelanggan as any)?.nomorHp && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{(penjualan.dataPelanggan as any).nomorHp}</span>
              </div>
            )}
            {(penjualan.dataPelanggan as any)?.alamat && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span className="line-clamp-2">{(penjualan.dataPelanggan as any).alamat}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DAFTAR ITEM PRODUK */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="font-semibold text-foreground">Rincian Item</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Produk</th>
                <th className="px-6 py-3 font-medium text-right">Harga</th>
                <th className="px-6 py-3 font-medium text-center">Qty</th>
                <th className="px-6 py-3 font-medium text-right">Diskon Item</th>
                <th className="px-6 py-3 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {penjualan.itemPenjualan?.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{item.namaProduk}</td>
                  <td className="px-6 py-4 text-right">{formatRupiah(item.hargaJual)}</td>
                  <td className="px-6 py-4 text-center">{item.jumlah}</td>
                  <td className="px-6 py-4 text-right text-rose-500">
                    {item.jumlahDiskon > 0 ? `-${formatRupiah(item.jumlahDiskon)}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{formatRupiah(item.totalharga)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RINGKASAN BIAYA & PEMBAYARAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Catatan / Keterangan */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b pb-3 mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Catatan Transaksi</h2>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {penjualan.keterangan || "Tidak ada catatan."}
          </p>
        </div>

        {/* Ringkasan Biaya */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal Produk</span>
            <span className="font-medium text-foreground">{formatRupiah(penjualan.totalHargaProduk)}</span>
          </div>
          
          {penjualan.jumlahDiskonTransaksi > 0 && (
            <div className="flex justify-between text-rose-500">
              <span>Diskon Global</span>
              <span>-{formatRupiah(penjualan.jumlahDiskonTransaksi)}</span>
            </div>
          )}

          {penjualan.jumlahPajakTransaksi > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Total Pajak</span>
              <span className="font-medium text-foreground">{formatRupiah(penjualan.jumlahPajakTransaksi)}</span>
            </div>
          )}

          <div className="border-t pt-3 mt-3 flex justify-between items-center">
            <span className="text-base font-bold">Total Tagihan</span>
            <span className="text-lg font-bold text-primary">{formatRupiah(penjualan.totalTagihan)}</span>
          </div>

          <div className="flex justify-between items-center text-emerald-600 mt-1">
            <span>Telah Dibayar</span>
            <span className="font-semibold">{formatRupiah(penjualan.totalDibayar)}</span>
          </div>

          {penjualan.sisaTagihan > 0 && (
            <div className="flex justify-between items-center text-rose-600 mt-1 bg-rose-50 p-2 rounded-md">
              <span className="font-medium">Sisa Tagihan</span>
              <span className="font-bold">{formatRupiah(penjualan.sisaTagihan)}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIWAYAT PEMBAYARAN (Muncul jika ada data) */}
      {!loadingPembayaran && pembayaranTerkait.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden mt-2">
          <div className="p-6 border-b bg-muted/20">
            <h2 className="font-semibold text-foreground">Riwayat Pembayaran</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Tanggal Bayar</th>
                  <th className="px-6 py-3 font-medium">Metode</th>
                  <th className="px-6 py-3 font-medium">Catatan</th>
                  <th className="px-6 py-3 font-medium text-right">Jumlah</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pembayaranTerkait.map((pay: Pembayaran) => (
                  <tr key={pay._id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      {pay.tanggalBayar ? format(new Date(pay.tanggalBayar), "dd MMM yyyy, HH:mm") : "-"}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {pay.metodePembayaranID?.namaMetode || "Kasir"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs line-clamp-1">
                      {pay.catatan || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatRupiah(pay.jumlahBayar)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={
                          pay.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                          pay.status === "VOID" ? "bg-slate-100 text-slate-600" :
                          "bg-amber-100 text-amber-700"
                        }
                      >
                        {pay.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}