"use client";

import { useState, useEffect } from "react";
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
      status: "PAID",
    };

    await createPembayaranMutation.mutateAsync(payload);
  };

  // Kalkulasi Otomatis (Kembalian, dll)
  const nominalInput = parseInt(jumlahBayarStr.replace(/\D/g, ""), 10) || 0;
  const sisaTagihan = penjualan?.sisaTagihan || 0;
  const sisaSetelahBayar = Math.max(0, sisaTagihan - nominalInput);

  if (loadingPenjualan)
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2947] border-t-transparent"></div>
        <p className="text-sm font-bold text-[#0A2947]/60">
          Memuat data tagihan...
        </p>
      </div>
    );
  if (!penjualan) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Terima Pembayaran
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Catat penerimaan pembayaran untuk No. Referensi:{" "}
              <span className="font-bold font-mono text-[#0A2947]">
                {penjualan.noReferensi}
              </span>
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#0A2947]/60">Tanggal Transaksi</p>
            <p className="font-bold text-sm text-[#0A2947]">
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
            className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3 mb-2">
              <Wallet className="h-5 w-5 text-[#D4A373]" />
              <h2 className="font-bold text-[#0A2947]">
                Detail Penerimaan Pembayaran
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Pilihan Akun Kas */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Akun Kas Tujuan <span className="text-red-500">*</span>
                </label>
                <Select value={akunKasID} onValueChange={setAkunKasID}>
                  <SelectTrigger className="w-full cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-medium">
                    <SelectValue placeholder="Pilih akun kas..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    {akunKasList.map((kas: any) => {
                      const validId = kas._id || kas.id;
                      return (
                        <SelectItem
                          key={validId}
                          value={validId}
                          className="cursor-pointer hover:bg-[#0A2947]/5 font-medium"
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
                <label className="text-sm font-bold text-[#0A2947]">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <Select
                  value={metodePembayaranID}
                  onValueChange={setMetodePembayaranID}
                >
                  <SelectTrigger className="w-full cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-medium">
                    <SelectValue placeholder="Pilih metode..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    {metodeList.map((metode: any) => {
                      const validId = metode._id || metode.id;
                      return (
                        <SelectItem
                          key={validId}
                          value={validId}
                          className="cursor-pointer hover:bg-[#0A2947]/5 font-medium"
                        >
                          {metode.namaPembayaran || metode.namaMetode}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px w-full bg-[#0A2947]/10" />

            {/* Input Nominal */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Jumlah Diterima (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  className="text-lg font-bold h-12 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]"
                  placeholder="0"
                  value={jumlahBayarStr}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setJumlahBayarStr(
                      raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw, 10)) : "",
                    );
                  }}
                />
                <Button
                  type="button"
                  className="h-12 px-6 cursor-pointer bg-[#718355]/10 text-[#718355] hover:bg-[#718355]/20 font-bold border-none shadow-none shrink-0"
                  onClick={() =>
                    setJumlahBayarStr(
                      new Intl.NumberFormat("id-ID").format(sisaTagihan),
                    )
                  }
                >
                  Bayar Uang Pas
                </Button>
              </div>
              <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                Masukkan nominal angka. Maksimal setara dengan total sisa
                tagihan.
              </p>
            </div>

            {/* Catatan */}
            <div className="space-y-2 pt-2 border-t border-[#0A2947]/10 mt-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Catatan Pembayaran <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
              </label>
              <Input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Pembayaran DP 50% via Transfer"
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-medium"
              />
            </div>

            {formError && (
              <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                {formError}
              </p>
            )}

            <div className="pt-6 border-t border-[#0A2947]/10">
              <Button
                type="submit"
                className="w-full h-14 text-base cursor-pointer bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 font-bold shadow-sm"
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
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#0A2947] text-[#FFFAF3] p-6 sm:p-8 shadow-md space-y-5">
            <div className="flex items-center gap-2 border-b border-[#FFFAF3]/20 pb-3 uppercase tracking-widest text-[#D4A373]">
              <ReceiptText className="h-4 w-4" />
              <h2 className="font-bold text-sm">
                Ringkasan Tagihan
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#FFFAF3]/80 font-medium">
                <span>Total Tagihan Awal</span>
                <span className="font-mono text-[#FFFAF3]">
                  {formatRupiah(penjualan.totalTagihan)}
                </span>
              </div>
              <div className="flex justify-between text-[#718355] font-bold">
                <span>Telah Dibayar</span>
                <span className="font-mono">{formatRupiah(penjualan.totalDibayar)}</span>
              </div>

              <div className="border-t border-[#FFFAF3]/20 pt-4 flex justify-between items-center">
                <span className="text-base font-bold text-rose-300">
                  Sisa Tagihan
                </span>
                <span className="text-xl font-black text-rose-300 font-mono">
                  {formatRupiah(penjualan.sisaTagihan)}
                </span>
              </div>
            </div>

            {/* Simulasi Setelah Pembayaran Ini */}
            {nominalInput > 0 && (
              <div className="bg-[#FFFAF3]/10 p-5 rounded-xl space-y-3 mt-6 border border-[#FFFAF3]/5">
                <p className="text-[10px] font-bold text-[#FFFAF3]/50 uppercase tracking-widest mb-2">
                  Simulasi Setelah Pembayaran
                </p>
                <div className="flex justify-between text-sm font-medium text-[#FFFAF3]/80">
                  <span>Akan Dibayar</span>
                  <span className="font-mono text-[#FFFAF3]">
                    {formatRupiah(nominalInput)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-[#FFFAF3]/20 pt-3">
                  <span>Sisa Hutang Baru</span>
                  <span
                    className={`font-mono text-lg ${
                      sisaSetelahBayar === 0
                        ? "text-[#718355]" // Sage Green
                        : "text-rose-300"
                    }`}
                  >
                    {formatRupiah(sisaSetelahBayar)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#D4A373]/30 bg-[#FFFAF3] p-5 shadow-sm flex items-start gap-4">
            <div className="p-2 bg-[#D4A373]/10 rounded-lg shrink-0">
              <Banknote className="h-5 w-5 text-[#D4A373]" />
            </div>
            <div className="text-sm text-[#0A2947]/70">
              <p className="font-bold text-[#0A2947] mb-1">Peringatan Audit Kasir</p>
              <p className="font-medium leading-relaxed">
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
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Konfirmasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Anda akan mencatat pembayaran sebesar{" "}
              <strong className="text-[#0A2947] font-mono text-base">
                {formatRupiah(nominalInput)}
              </strong>{" "}
              ke dalam sistem. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={createPembayaranMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executePayment}
              disabled={createPembayaranMutation.isPending}
              className="cursor-pointer bg-[#718355] hover:bg-[#718355]/90 text-[#FFFAF3] font-bold"
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