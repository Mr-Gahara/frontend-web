"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { decodeJWT } from "@/lib/decodeToken";
import { Penjualan, StatusBayar, StatusPenjualan } from "@/types/penjualan";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Receipt,
  User,
  Calculator,
  History,
  ShoppingCart,
  CheckCircle2,
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

// --- BADGE MAPPING ---
const badgeStatusBayar = (status: StatusBayar) => {
  const map: Record<StatusBayar, { label: string; className: string }> = {
    PAID: {
      label: "Lunas",
      className: "bg-[#718355] text-[#FFFAF3] border-none shadow-sm",
    },
    UNPAID: {
      label: "Belum Bayar",
      className: "bg-[#D4A373] text-[#0A2947] border-none shadow-sm",
    },
    PARTIAL: {
      label: "Sebagian",
      className: "bg-[#0A2947]/10 text-[#0A2947] border-none shadow-sm",
    },
  };
  const config = map[status] ?? {
    label: status,
    className: "bg-[#0A2947]/5 text-[#0A2947]/60",
  };
  return (
    <Badge
      variant="outline"
      className={`${config.className} px-2.5 py-0.5 font-bold`}
    >
      {config.label}
    </Badge>
  );
};

const badgeStatusPenjualan = (status: StatusPenjualan) => {
  const map: Record<StatusPenjualan, { label: string; className: string }> = {
    FINAL: {
      label: "Final",
      className: "bg-[#718355] text-[#FFFAF3] border-none shadow-sm",
    },
    DRAFT: {
      label: "Draft",
      className: "bg-[#D4A373] text-[#0A2947] border-none shadow-sm",
    },
    VOID: {
      label: "Void",
      className: "bg-[#0A2947]/10 text-[#0A2947]/60 border-none shadow-sm",
    },
  };
  const config = map[status] ?? { label: status, className: "" };
  return (
    <Badge
      variant="outline"
      className={`${config.className} px-2.5 py-0.5 font-bold`}
    >
      {config.label}
    </Badge>
  );
};

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
  const queryClient = useQueryClient();
  const idPenjualan = params.id as string;

  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("penggunaToken")
      : null;
  const payloadToken = token ? decodeJWT(token) : null;
  const currentLocationId =
    payloadToken?.locationID || payloadToken?.lokasiID || "";

  // 1. QUERY DETAIL PENJUALAN
  const {
    data: penjualan,
    isLoading: loadingPenjualan,
    error: errorPenjualan,
  } = useQuery({
    queryKey: [...queryKeys.penjualan, idPenjualan],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/penjualan/${idPenjualan}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as Penjualan;
    },
    enabled: !!idPenjualan,
  });

  // 2. QUERY DAFTAR PEMBAYARAN
  const { data: allPembayaran = [], isLoading: loadingPembayaran } = useQuery({
    queryKey: ["pembayaran"],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        "/pembayaran",
        undefined,
        "pengguna",
      );
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!penjualan,
  });

  const pembayaranTerkait = useMemo(() => {
    return allPembayaran.filter((p: Pembayaran) => {
      const pId =
        typeof p.penjualanID === "object" ? p.penjualanID?._id : p.penjualanID;
      return pId === idPenjualan;
    });
  }, [allPembayaran, idPenjualan]);

  // 3. MUTASI FINALISASI PENJUALAN
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      // Jika kedua sumber lokasi kosong, jadikan undefined agar JSON mengabaikannya
      const targetLocationId =
        penjualan?.locationID || currentLocationId || undefined;

      return await apiClient.put(
        `/penjualan/${idPenjualan}`,
        { finalize: true, locationID: targetLocationId }, // Jika undefined, Axios/JSON.stringify tidak akan mengirimkan key ini
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil Difinalisasi", {
        description: "Status penjualan menjadi FINAL dan stok telah dipotong.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
      setShowFinalizeConfirm(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Finalisasi", {
        description:
          err.message || "Terjadi kesalahan saat memfinalisasi penjualan.",
      });
      setShowFinalizeConfirm(false);
    },
  });

  // ERROR HANDLER
  useEffect(() => {
    if (errorPenjualan) {
      toast.error("Gagal Memuat", {
        description:
          errorPenjualan instanceof Error
            ? errorPenjualan.message
            : "Data penjualan tidak ditemukan.",
      });
      router.push("/dashboard/outlet/penjualan");
    }
  }, [errorPenjualan, router]);

  if (loadingPenjualan) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2947] border-t-transparent"></div>
        <p className="text-sm font-bold text-[#0A2947]/60">
          Memuat detail transaksi...
        </p>
      </div>
    );
  }

  if (!penjualan) return null;

  const isDraft = penjualan.statusPenjualan === "DRAFT";
  const canPay =
    penjualan.statusPenjualan !== "VOID" && penjualan.sisaTagihan > 0;
  const isInvoiceDraft = penjualan.jenisTransaksi === "INVOICE" && isDraft;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
            onClick={() => router.push("/dashboard/outlet/penjualan")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Detail Transaksi
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              No. Ref:{" "}
              <span className="font-bold font-mono text-[#0A2947]">
                {penjualan.noReferensi}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex gap-2">
            {badgeStatusPenjualan(penjualan.statusPenjualan)}
            {badgeStatusBayar(penjualan.statusBayar)}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Tombol Finalisasi Khusus Invoice Draft */}
            {isInvoiceDraft && (
              <Button
                variant="outline"
                className="border-[#718355] text-[#718355] hover:bg-[#718355]/10 cursor-pointer shadow-sm font-bold w-full sm:w-auto"
                onClick={() => setShowFinalizeConfirm(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalisasi Invoice
              </Button>
            )}

            {canPay && (
              <Button
                className="bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 cursor-pointer shadow-sm font-bold w-full sm:w-auto"
                onClick={() =>
                  router.push(
                    `/dashboard/outlet/penjualan/${idPenjualan}/pembayaran`,
                  )
                }
              >
                <CreditCard className="mr-2 h-4 w-4" /> Terima Pembayaran
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* INFORMASI UMUM (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <Receipt className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Informasi Transaksi</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1">
                Tanggal & Waktu
              </p>
              <p className="font-semibold text-[#0A2947]">
                {formatTanggal(penjualan.tanggalTransaksi)}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1">
                Jenis Transaksi
              </p>
              <p className="font-semibold text-[#0A2947] uppercase">
                {penjualan.jenisTransaksi}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1">
                Tipe Pesanan
              </p>
              <p className="font-semibold text-[#0A2947] capitalize">
                {penjualan.jenisPenjualan}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1">
                Kasir / Operator
              </p>
              <p className="font-semibold text-[#0A2947]">
                {penjualan.dataPengguna?.nama || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <User className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Informasi Pelanggan</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-[#0A2947]">
                  {penjualan.dataPelanggan?.namaPelanggan || "Umum"}
                </p>
                {penjualan.dataPelanggan && (
                  <Badge
                    variant="secondary"
                    className="mt-2 capitalize text-[10px] bg-[#D4A373] text-[#0A2947] border-none font-bold shadow-sm"
                  >
                    {(penjualan.dataPelanggan as any).tipePelanggan || "Umum"}
                  </Badge>
                )}
              </div>
            </div>
            {(penjualan.dataPelanggan as any)?.nomorHp && (
              <div className="flex items-center gap-2 text-[#0A2947]/70 font-medium">
                <Phone className="h-4 w-4" />
                <span>{(penjualan.dataPelanggan as any).nomorHp}</span>
              </div>
            )}
            {(penjualan.dataPelanggan as any)?.alamat && (
              <div className="flex items-start gap-2 text-[#0A2947]/70 font-medium">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  {(penjualan.dataPelanggan as any).alamat}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DAFTAR ITEM PRODUK */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#0A2947]/5 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-[#D4A373]" />
          <h2 className="font-bold text-[#0A2947]">Rincian Item</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FFFAF3] text-[#0A2947]/60 border-b border-[#0A2947]/5">
              <tr>
                <th className="px-6 py-4 font-bold">Produk</th>
                <th className="px-6 py-4 font-bold text-right">Harga</th>
                <th className="px-6 py-4 font-bold text-center">Qty</th>
                <th className="px-6 py-4 font-bold text-right">Diskon Item</th>
                <th className="px-6 py-4 font-bold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5 bg-[#FFFAF3]">
              {penjualan.itemPenjualan?.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#0A2947]/5 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-[#0A2947]">
                    {item.namaProduk}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[#0A2947]">
                    {formatRupiah(item.hargaJual)}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-[#0A2947]">
                    {item.jumlah}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-rose-500 font-mono">
                    {item.jumlahDiskon > 0
                      ? `-${formatRupiah(item.jumlahDiskon)}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#0A2947] font-mono">
                    {formatRupiah(item.totalharga)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RINGKASAN BIAYA & PEMBAYARAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm h-full">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3 mb-4">
            <FileText className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Catatan Transaksi</h2>
          </div>
          <p className="text-sm font-medium text-[#0A2947]/70 whitespace-pre-wrap leading-relaxed">
            {penjualan.keterangan || "Tidak ada catatan."}
          </p>
        </div>

        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#0A2947] text-[#FFFAF3] p-6 sm:p-8 shadow-md space-y-4">
          <h2 className="text-sm font-bold border-b border-[#FFFAF3]/20 pb-3 flex items-center gap-2 uppercase tracking-widest text-[#D4A373]">
            <Calculator className="w-4 h-4" /> Ringkasan Tagihan
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#FFFAF3]/80 font-medium">
              <span>Subtotal Produk</span>
              <span className="font-mono text-[#FFFAF3]">
                {formatRupiah(penjualan.totalHargaProduk)}
              </span>
            </div>
            {penjualan.jumlahDiskonTransaksi > 0 && (
              <div className="flex justify-between text-rose-300 font-bold">
                <span>Diskon Global</span>
                <span className="font-mono">
                  -{formatRupiah(penjualan.jumlahDiskonTransaksi)}
                </span>
              </div>
            )}
            {penjualan.jumlahPajakTransaksi > 0 && (
              <div className="flex justify-between text-[#FFFAF3]/80 font-bold border-t border-[#FFFAF3]/20 border-dashed pt-2 mt-1">
                <span>Total Pajak</span>
                <span className="font-mono">
                  {formatRupiah(penjualan.jumlahPajakTransaksi)}
                </span>
              </div>
            )}
            <div className="border-t border-[#FFFAF3]/20 pt-4 mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-[#FFFAF3]">
                Total Tagihan
              </span>
              <span className="text-2xl font-black text-[#718355] leading-none font-mono">
                {formatRupiah(penjualan.totalTagihan)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#D4A373] mt-2 pt-2 border-t border-[#FFFAF3]/10">
              <span className="font-bold">Telah Dibayar</span>
              <span className="font-bold font-mono">
                {formatRupiah(penjualan.totalDibayar)}
              </span>
            </div>
            {penjualan.sisaTagihan > 0 && (
              <div className="flex justify-between items-center text-rose-300 mt-2 bg-rose-500/20 p-3 rounded-xl border border-rose-500/30">
                <span className="font-bold">Sisa Tagihan</span>
                <span className="font-black font-mono text-lg">
                  {formatRupiah(penjualan.sisaTagihan)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIWAYAT PEMBAYARAN */}
      {!loadingPembayaran && pembayaranTerkait.length > 0 && (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden mt-2">
          <div className="p-6 border-b border-[#0A2947]/5 flex items-center gap-2">
            <History className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Riwayat Pembayaran</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FFFAF3] text-[#0A2947]/60 border-b border-[#0A2947]/5">
                <tr>
                  <th className="px-6 py-4 font-bold">Tanggal Bayar</th>
                  <th className="px-6 py-4 font-bold">Metode</th>
                  <th className="px-6 py-4 font-bold">Catatan</th>
                  <th className="px-6 py-4 font-bold text-right">Jumlah</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A2947]/5 bg-[#FFFAF3]">
                {pembayaranTerkait.map((pay: Pembayaran, index: number) => {
                  const validId =
                    pay._id || (pay as any).id || `pay-fallback-${index}`;
                  return (
                    <tr
                      key={validId}
                      className="hover:bg-[#0A2947]/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-[#0A2947]">
                        {pay.tanggalBayar
                          ? format(
                              new Date(pay.tanggalBayar),
                              "dd MMM yyyy, HH:mm",
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#0A2947]">
                        {pay.metodePembayaranID?.namaMetode || "Kasir"}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#0A2947]/60 text-xs line-clamp-1">
                        {pay.catatan || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#0A2947] font-mono">
                        {formatRupiah(pay.jumlahBayar)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant="outline"
                          className={`font-bold border-none shadow-sm px-2.5 py-0.5 ${pay.status === "PAID" ? "bg-[#718355] text-[#FFFAF3]" : pay.status === "VOID" ? "bg-[#0A2947]/10 text-[#0A2947]/60" : "bg-[#D4A373] text-[#0A2947]"}`}
                        >
                          {pay.status === "PAID" ? "Sukses" : pay.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI FINALISASI */}
      <AlertDialog
        open={showFinalizeConfirm}
        onOpenChange={setShowFinalizeConfirm}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Finalisasi Invoice?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini akan mengunci transaksi menjadi{" "}
              <strong className="text-[#0A2947]">FINAL</strong> dan memotong
              persediaan stok barang secara permanen. Apakah Anda yakin ingin
              melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={finalizeMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
              className="cursor-pointer bg-[#718355] hover:bg-[#718355]/90 text-[#FFFAF3] font-bold"
            >
              {finalizeMutation.isPending
                ? "Memproses..."
                : "Ya, Finalisasi Transaksi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
