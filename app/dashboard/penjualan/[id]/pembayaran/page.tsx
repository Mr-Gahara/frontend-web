"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { Penjualan } from "@/types/penjualan";
import { PembayaranRequest } from "@/types/pembayaran";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Wallet,
  CreditCard,
  Banknote,
  ReceiptText,
} from "lucide-react";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

export default function BuatPembayaranPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const penjualanID = params.id as string;

  // --- STATE FORM ---
  const [jumlahBayarStr, setJumlahBayarStr] = useState("");
  const [akunKasID, setAkunKasID] = useState("");
  const [metodePembayaranID, setMetodePembayaranID] = useState("");
  const [catatan, setCatatan] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");

  // --- 1. FETCH DATA PENJUALAN ---
  const {
    data: penjualan,
    isLoading: loadingPenjualan,
    error: errorPenjualan,
  } = useQuery({
    queryKey: [...queryKeys.penjualan, penjualanID],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/penjualan/${penjualanID}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as Penjualan;
    },
    enabled: !!penjualanID,
  });

  // --- 2. FETCH AKUN KAS ASLI ---
  const { data: akunKasList = [] } = useQuery({
    queryKey: queryKeys.akunKas,
    queryFn: async () => {
      // Perhatikan penulisan endpoint yang sudah kita perbaiki: "/akunkas" (tanpa tanda hubung)
      const res = await apiClient.get<{ data: any[] } | any[]>(
        "/akunkas",
        undefined,
        "pengguna",
      );

      let rawData: any[] = [];
      if (Array.isArray(res)) rawData = res;
      else if (res && "data" in res && Array.isArray(res.data))
        rawData = res.data;

      return rawData.filter((a) => a.status === "aktif");
    },
  });

  // --- 3. FETCH METODE PEMBAYARAN ASLI ---
  const { data: metodeList = [] } = useQuery({
    queryKey: queryKeys.metodePembayaran || ["metode-pembayaran"],
    queryFn: async () => {
      // Perhatikan penulisan endpoint yang sudah kita perbaiki: "/metodepembayaran" (tanpa tanda hubung)
      const res = await apiClient.get<{ data: any[] } | any[]>(
        "/metodepembayaran",
        undefined,
        "pengguna",
      );

      let rawData: any[] = [];
      if (Array.isArray(res)) rawData = res;
      else if (res && "data" in res && Array.isArray(res.data))
        rawData = res.data;

      return rawData.filter((m) => m.isActive !== false);
    },
  });

  // ERROR HANDLER
  useEffect(() => {
    if (errorPenjualan) {
      toast.error("Gagal Memuat", {
        description: "Data penjualan tidak ditemukan.",
      });
      router.push("/dashboard/penjualan");
    }
  }, [errorPenjualan, router]);

  // MUTASI CREATE PEMBAYARAN
  const createPembayaranMutation = useMutation({
    mutationFn: async (payload: PembayaranRequest) => {
      return await apiClient.post(
        "/pembayaran",
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pembayaran sukses dicatat." });
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan });
      queryClient.invalidateQueries({ queryKey: ["pembayaran"] });
      // Redirect kembali ke halaman detail penjualan
      router.push(`/dashboard/penjualan/${penjualanID}`);
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Transaksi pembayaran ditolak sistem.",
      });
      setShowConfirm(false);
    },
  });

  const handleValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const nominal = parseInt(jumlahBayarStr.replace(/\D/g, ""), 10);

    if (!akunKasID)
      return setFormError(
        "Silakan pilih Akun Kas tujuan penerimaan pembayaran.",
      );
    if (!metodePembayaranID)
      return setFormError("Silakan pilih Metode Pembayaran.");
    if (isNaN(nominal) || nominal <= 0)
      return setFormError("Jumlah pembayaran tidak valid.");
    if (penjualan && nominal > penjualan.sisaTagihan) {
      return setFormError(
        `Jumlah bayar tidak boleh melebihi sisa tagihan (${formatRupiah(penjualan.sisaTagihan)}).`,
      );
    }

    setShowConfirm(true);
  };

  const executePayment = async () => {
    const nominal = parseInt(jumlahBayarStr.replace(/\D/g, ""), 10);
    const payload: PembayaranRequest = {
      penjualanID,
      akunKasID,
      metodePembayaranID,
      jumlahBayar: nominal,
      tanggalBayar: new Date().toISOString(),
      catatan: catatan.trim() || undefined,
      status: "PAID", // Secara default kita asumsikan kasir menerima pembayaran tuntas
    };

    await createPembayaranMutation.mutateAsync(payload);
  };

  // Kalkulasi Otomatis (Kembalian, dll)
  const nominalInput = parseInt(jumlahBayarStr.replace(/\D/g, ""), 10) || 0;
  const sisaTagihan = penjualan?.sisaTagihan || 0;
  const sisaSetelahBayar = Math.max(0, sisaTagihan - nominalInput);

  if (loadingPenjualan)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat data tagihan...
      </div>
    );
  if (!penjualan) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Terima Pembayaran
            </h1>
            <p className="text-sm text-muted-foreground">
              Catat penerimaan pembayaran untuk No. Referensi:{" "}
              <span className="font-mono text-foreground">
                {penjualan.noReferensi}
              </span>
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Tanggal Transaksi</p>
            <p className="font-medium text-sm">
              {format(new Date(penjualan.tanggalTransaksi), "dd MMM yyyy", {
                locale: localeID,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI: FORM INPUT PEMBAYARAN */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form
            onSubmit={handleValidation}
            className="rounded-xl border bg-card p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2 border-b pb-3 mb-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                Detail Penerimaan Pembayaran
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilihan Akun Kas */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Akun Kas Tujuan <span className="text-red-500">*</span>
                </label>
                <Select value={akunKasID} onValueChange={setAkunKasID}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Pilih akun kas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {akunKasList.map((kas: any) => {
                      const validId = kas._id || kas.id;
                      return (
                        <SelectItem
                          key={validId}
                          value={validId}
                          className="cursor-pointer"
                        >
                          {kas.namaAkun}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <Select
                  value={metodePembayaranID}
                  onValueChange={setMetodePembayaranID}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Pilih metode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {metodeList.map((metode: any) => {
                      const validId = metode._id || metode.id;
                      return (
                        <SelectItem
                          key={validId}
                          value={validId}
                          className="cursor-pointer"
                        >
                          {metode.namaPembayaran || metode.namaMetode}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Input Nominal */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">
                Jumlah Diterima (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  className="text-lg font-bold h-12"
                  placeholder="0"
                  value={jumlahBayarStr}
                  onChange={(e) => {
                    // Hanya izinkan angka, diformat rapi saat diketik
                    const raw = e.target.value.replace(/\D/g, "");
                    setJumlahBayarStr(
                      raw
                        ? new Intl.NumberFormat("id-ID").format(
                            parseInt(raw, 10),
                          )
                        : "",
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 px-6 cursor-pointer bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  onClick={() =>
                    setJumlahBayarStr(
                      new Intl.NumberFormat("id-ID").format(sisaTagihan),
                    )
                  }
                >
                  Bayar Uang Pas
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Masukkan nominal angka. Maksimal setara dengan total sisa
                tagihan.
              </p>
            </div>

            {/* Catatan */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">
                Catatan Pembayaran (Opsional)
              </label>
              <Input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Pembayaran DP 50% via Transfer"
              />
            </div>

            {formError && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
                {formError}
              </p>
            )}

            <div className="pt-4 border-t">
              <Button
                type="submit"
                className="w-full h-12 text-base cursor-pointer bg-primary hover:bg-primary/90"
                disabled={penjualan.sisaTagihan <= 0}
              >
                {penjualan.sisaTagihan <= 0
                  ? "Tagihan Sudah Lunas"
                  : "Proses Pembayaran"}
              </Button>
            </div>
          </form>
        </div>

        {/* PANEL KANAN: RINGKASAN TAGIHAN (Sticky) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                Ringkasan Tagihan
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Tagihan Awal</span>
                <span className="font-medium text-foreground">
                  {formatRupiah(penjualan.totalTagihan)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Telah Dibayar Sebelumnya</span>
                <span>{formatRupiah(penjualan.totalDibayar)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-base font-bold text-rose-600">
                  Sisa Tagihan
                </span>
                <span className="text-xl font-bold text-rose-600">
                  {formatRupiah(penjualan.sisaTagihan)}
                </span>
              </div>
            </div>

            {/* Simulasi Setelah Pembayaran Ini */}
            {nominalInput > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Simulasi Setelah Pembayaran
                </p>
                <div className="flex justify-between text-sm">
                  <span>Akan Dibayar</span>
                  <span className="font-medium">
                    {formatRupiah(nominalInput)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-muted-foreground/20 pt-2">
                  <span>Sisa Hutang Baru</span>
                  <span
                    className={
                      sisaSetelahBayar === 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  >
                    {formatRupiah(sisaSetelahBayar)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 shadow-sm flex items-start gap-3">
            <Banknote className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Peringatan Audit Kasir</p>
              <p>
                Pastikan nominal yang diketik sesuai dengan uang fisik atau
                saldo mutasi bank yang Anda terima. Aksi ini akan mempengaruhi
                laporan neraca tutup kas Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG KONFIRMASI */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mencatat pembayaran sebesar{" "}
              <strong className="text-foreground">
                {formatRupiah(nominalInput)}
              </strong>{" "}
              ke dalam sistem. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={createPembayaranMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executePayment}
              disabled={createPembayaranMutation.isPending}
              className="cursor-pointer bg-primary"
            >
              {createPembayaranMutation.isPending
                ? "Memproses..."
                : "Ya, Catat Pembayaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
