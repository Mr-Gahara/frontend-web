"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";
import { isNotFound, pesanError } from "@/lib/api/error";
import type { PembayaranPenjualan, StatusPenjualan } from "@/types/penjualan";
import { useLokasiAktif } from "@/features/inventaris/hooks";
import { useBatalkanPembayaran } from "@/features/pembayaran/hooks";
import { useFinalisasiPenjualan, usePenjualan, useVoidPenjualan } from "./hooks";
import { lokasiFinalisasi } from "./payload";
import { aksiPenjualan, bolehBatalkanPembayaran, bolehCakupanPenjualan } from "./izin";
import { DialogVoidPenjualan } from "./dialog-void-penjualan";
import { KartuStokKeluar } from "./kartu-stok-keluar";
import { KOLOM_ITEM_PENJUALAN, kolomRiwayatPembayaran } from "./kolom-detail";
import { DataTable } from "@/components/ui/data-table";
import { BookingPenjualan } from "@/features/sesi-booking/booking-penjualan";
import { planMencakup } from "@/lib/auth/fitur-plan";
import { PESAN_BATAL_PEMBAYARAN, TAMPILAN_STATUS_PENJUALAN } from "./tampilan";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Ban,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

// --- HELPERS ---
const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

// --- BADGE STATUS (satu status sejak backend 465b438) ---
const badgeStatus = (status: StatusPenjualan) => {
  const tampilan = TAMPILAN_STATUS_PENJUALAN[status];
  return (
    <Badge
      variant="outline"
      className={`${tampilan?.kelas ?? "bg-navy/5 text-navy/60"} px-2.5 py-0.5 font-bold shadow-sm`}
    >
      {tampilan?.label ?? status}
    </Badge>
  );
};

interface PropsHalamanDetailPenjualan {
  id: string;
}

export default function HalamanDetailPenjualan({ id: idPenjualan }: PropsHalamanDetailPenjualan) {
  const router = useRouter();

  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  const { permissions, plan } = useSession();
  // Outlet tenant hanya dapat dibaca pemegang read-location (keputusan K11b);
  // tanpa izin itu locationID finalisasi tidak dikirim dan backend memakai
  // lokasi Outlet pertama tenant.
  const outletTenant = useLokasiAktif({ aktif: bolehCakupanPenjualan(permissions) });

  const {
    data: penjualan,
    isLoading: loadingPenjualan,
    error: errorPenjualan,
  } = usePenjualan(idPenjualan);

  // Riwayat pembayaran dibaca dari pembayaran[] respons detail (backend
  // 465b438), beserta nama metode saat pembayaran dicatat (keputusan K12a).
  const [batalTarget, setBatalTarget] = useState<PembayaranPenjualan | null>(null);
  const [alasanBatal, setAlasanBatal] = useState("");

  // Dialog finalisasi hanya tertutup saat berhasil; saat gagal tetap terbuka
  // beserta pesannya (keputusan Fase 0).
  const finalizeMutation = useFinalisasiPenjualan(idPenjualan, {
    onSuccess: () => {
      toast.success("Berhasil Difinalisasi", {
        description: "Penjualan disimpan sebagai Belum Bayar dan stok telah dipotong.",
      });
      setShowFinalizeConfirm(false);
    },
    onError: (err) => {
      toast.error("Gagal Finalisasi", {
        description: pesanError(err, "Terjadi kesalahan saat memfinalisasi penjualan."),
      });
    },
  });

  // Dialog batalkan pembayaran hanya tertutup saat berhasil (keputusan Fase 0).
  const batalMutation = useBatalkanPembayaran({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pembayaran berhasil dibatalkan." });
      setBatalTarget(null);
      setAlasanBatal("");
    },
    onError: (err) => {
      toast.error("Gagal Membatalkan", {
        description: pesanError(err, "Gagal membatalkan pembayaran."),
      });
    },
  });

  // Dialog void hanya tertutup saat berhasil (keputusan Fase 0).
  const voidMutation = useVoidPenjualan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Penjualan berhasil di-void." });
      setShowVoidConfirm(false);
    },
    onError: (err) => {
      toast.error("Gagal Memproses", {
        description: pesanError(err, "Gagal melakukan void penjualan."),
      });
    },
  });

  if (loadingPenjualan) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent"></div>
        <p className="text-isi font-bold text-navy/60">
          Memuat detail transaksi...
        </p>
      </div>
    );
  }

  if (!penjualan) {
    // Tidak ditemukan dibedakan dari gagal memuat, tanpa pengalihan otomatis
    // (sejalan dengan detail stock opname).
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p role="alert" className="text-isi font-bold text-navy/70">
          {!errorPenjualan || isNotFound(errorPenjualan)
            ? "Penjualan tidak ditemukan."
            : pesanError(errorPenjualan, "Gagal memuat detail penjualan.")}
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/outlet/penjualan")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const aksi = aksiPenjualan(penjualan, permissions);
  const riwayatPembayaran = penjualan.pembayaran ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
            onClick={() => router.push("/dashboard/outlet/penjualan")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
          <div className="space-y-1">
            <h1 className="text-judul font-bold tracking-tight text-navy">
              Detail Transaksi
            </h1>
            <p className="text-isi font-medium text-navy/60">
              No. Ref:{" "}
              <span className="font-bold font-mono text-navy">
                {penjualan.noReferensi}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              {badgeStatus(penjualan.statusPenjualan)}
            </div>
            {penjualan.statusPenjualan === "VOID" && penjualan.alasanVoid && (
              <p className="text-kecil font-medium text-navy/60">Alasan void: {penjualan.alasanVoid}</p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Tombol Finalisasi Khusus Invoice Draft */}
            {aksi.finalisasi && (
              <Button
                variant="outline"
                className="border-sage text-sage hover:bg-sage/10 cursor-pointer shadow-sm font-bold w-full sm:w-auto"
                onClick={() => setShowFinalizeConfirm(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalisasi Invoice
              </Button>
            )}

            {aksi.bayar && (
              <Button
                className="bg-sage text-gading hover:bg-sage/90 cursor-pointer shadow-sm font-bold w-full sm:w-auto"
                onClick={() =>
                  router.push(
                    `/dashboard/outlet/penjualan/${idPenjualan}/pembayaran`,
                  )
                }
              >
                <CreditCard className="mr-2 h-4 w-4" /> Terima Pembayaran
              </Button>
            )}

            {aksi.void && (
              <Button
                variant="outline"
                className="border-karamel text-navy hover:bg-karamel/10 cursor-pointer shadow-sm font-bold w-full sm:w-auto"
                onClick={() => setShowVoidConfirm(true)}
              >
                <Ban className="mr-2 h-4 w-4" /> Void Penjualan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toko yang turun dari plan bersesi booking tidak dapat membaca sesinya (403, butir 5). */}
      {penjualan.jenisPenjualan === "booking" && planMencakup(plan, "sesi-booking") && (
        <BookingPenjualan
          idBooking={(penjualan.itemPenjualan ?? []).flatMap((i) => (i.sesiBookingID ? [i.sesiBookingID] : []))}
        />
      )}

      {/* INFORMASI UMUM (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-navy/10 bg-krem p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <Receipt className="h-5 w-5 text-karamel" />
            <h2 className="text-subjudul font-bold text-navy">Informasi Transaksi</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-5 text-isi">
            <div>
              <p className="text-navy/60 font-bold text-kecil mb-1">
                Tanggal & Waktu
              </p>
              <p className="font-semibold text-navy">
                {formatTanggal(penjualan.tanggalTransaksi)}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-kecil mb-1">
                Jenis Transaksi
              </p>
              <p className="font-semibold text-navy uppercase">
                {penjualan.jenisTransaksi}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-kecil mb-1">
                Tipe Pesanan
              </p>
              <p className="font-semibold text-navy capitalize">
                {penjualan.jenisPenjualan}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-kecil mb-1">
                Kasir / Operator
              </p>
              <p className="font-semibold text-navy">
                {penjualan.dataPengguna?.nama || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-krem p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <User className="h-5 w-5 text-karamel" />
            <h2 className="text-subjudul font-bold text-navy">Informasi Pelanggan</h2>
          </div>
          <div className="space-y-4 text-isi">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-subjudul text-navy">
                  {penjualan.dataPelanggan?.namaPelanggan || "Umum"}
                </p>
                {penjualan.dataPelanggan && (
                  <Badge
                    variant="secondary"
                    className="mt-2 capitalize text-mikro bg-karamel text-navy border-none font-bold shadow-sm"
                  >
                    {penjualan.dataPelanggan?.tipePelanggan || "Umum"}
                  </Badge>
                )}
              </div>
            </div>
            {penjualan.dataPelanggan?.nomorHp && (
              <div className="flex items-center gap-2 text-navy/70 font-medium">
                <Phone className="h-4 w-4" />
                <span>{penjualan.dataPelanggan?.nomorHp}</span>
              </div>
            )}
            {penjualan.dataPelanggan?.alamat && (
              <div className="flex items-start gap-2 text-navy/70 font-medium">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  {penjualan.dataPelanggan?.alamat}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DAFTAR ITEM PRODUK: tabel rincian berkartu baris (CV22a). */}
      <section aria-label="Rincian Item" className="flex flex-col gap-3">
        <h2 className="text-subjudul font-bold text-navy flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-karamel" /> Rincian Item
        </h2>
        <DataTable rincian columns={KOLOM_ITEM_PENJUALAN} data={penjualan.itemPenjualan ?? []} emptyMessage="Tidak ada item." />
      </section>

      {/* Nama outlet hanya terbaca pemegang read-location (outletTenant di atas). */}
      <KartuStokKeluar penjualan={penjualan} outlet={outletTenant.lokasi} />

      {/* RINGKASAN BIAYA & PEMBAYARAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-navy/10 bg-krem p-6 sm:p-8 shadow-sm h-full">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3 mb-4">
            <FileText className="h-5 w-5 text-karamel" />
            <h2 className="text-subjudul font-bold text-navy">Catatan Transaksi</h2>
          </div>
          <p className="text-isi font-medium text-navy/70 whitespace-pre-wrap leading-relaxed">
            {penjualan.keterangan || "Tidak ada catatan."}
          </p>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-navy text-gading p-6 sm:p-8 shadow-md space-y-4">
          <h2 className="text-subjudul font-bold border-b border-gading/20 pb-3 flex items-center gap-2 uppercase tracking-widest text-karamel">
            <Calculator className="w-4 h-4" /> Ringkasan Tagihan
          </h2>
          <div className="space-y-3 text-isi">
            <div className="flex justify-between text-gading/80 font-medium">
              <span>Subtotal Produk</span>
              <span className="font-mono text-gading">
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
              <div className="flex justify-between text-gading/80 font-bold border-t border-gading/20 border-dashed pt-2 mt-1">
                <span>Total Pajak</span>
                <span className="font-mono">
                  {formatRupiah(penjualan.jumlahPajakTransaksi)}
                </span>
              </div>
            )}
            <div className="border-t border-gading/20 pt-4 mt-2 flex justify-between items-center">
              <span className="text-isi font-bold text-gading">
                Total Tagihan
              </span>
              <span className="text-judul font-black text-sage leading-none font-mono">
                {formatRupiah(penjualan.totalTagihan)}
              </span>
            </div>
            <div className="flex justify-between items-center text-karamel mt-2 pt-2 border-t border-gading/10">
              <span className="font-bold">Telah Dibayar</span>
              <span className="font-bold font-mono">
                {formatRupiah(penjualan.totalDibayar)}
              </span>
            </div>
            {penjualan.sisaTagihan > 0 && (
              <div className="flex justify-between items-center text-rose-300 mt-2 bg-rose-500/20 p-3 rounded-xl border border-rose-500/30">
                <span className="font-bold">Sisa Tagihan</span>
                <span className="font-black font-mono text-subjudul">
                  {formatRupiah(penjualan.sisaTagihan)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIWAYAT PEMBAYARAN: tabel rincian berkartu baris (CV22a). */}
      {riwayatPembayaran.length > 0 && (
        <section aria-label="Riwayat Pembayaran" className="flex flex-col gap-3 mt-2">
          <h2 className="text-subjudul font-bold text-navy flex items-center gap-2">
            <History className="h-5 w-5 text-karamel" /> Riwayat Pembayaran
          </h2>
          <DataTable
            rincian
            columns={kolomRiwayatPembayaran((pay) => bolehBatalkanPembayaran(pay, permissions), setBatalTarget)}
            data={riwayatPembayaran}
          />
        </section>
      )}

      {/* DIALOG BATALKAN PEMBAYARAN */}
      <AlertDialog
        open={!!batalTarget}
        onOpenChange={(open) => {
          if (!open) {
            setBatalTarget(null);
            setAlasanBatal("");
          }
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">
              Batalkan pembayaran {formatRupiah(batalTarget?.jumlahBayar ?? 0)}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              {PESAN_BATAL_PEMBAYARAN}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="alasanBatal" className="text-isi font-bold text-navy">
              Alasan <span className="text-navy/50 font-medium">(Opsional)</span>
            </label>
            <Input
              id="alasanBatal"
              value={alasanBatal}
              onChange={(e) => setAlasanBatal(e.target.value)}
              placeholder="Misal: salah pilih metode"
              className="bg-white border-navy/20 text-navy"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={batalMutation.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
            >
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (batalTarget) batalMutation.mutate({ id: batalTarget.id, alasan: alasanBatal });
              }}
              disabled={batalMutation.isPending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {batalMutation.isPending ? "Membatalkan..." : "Ya, Batalkan Pembayaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG KONFIRMASI VOID */}
      <DialogVoidPenjualan
        noReferensi={penjualan.noReferensi}
        terbuka={showVoidConfirm}
        memproses={voidMutation.isPending}
        onTutup={() => setShowVoidConfirm(false)}
        onKonfirmasi={(alasan) => voidMutation.mutate({ id: idPenjualan, alasan })}
      />

      {/* DIALOG KONFIRMASI FINALISASI */}
      <AlertDialog
        open={showFinalizeConfirm}
        onOpenChange={setShowFinalizeConfirm}
      >
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">
              Finalisasi Invoice?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Tindakan ini akan menyimpan transaksi sebagai{" "}
              <strong className="text-navy">Belum Bayar</strong> dan memotong
              persediaan stok barang secara permanen. Setelah disimpan, isi
              transaksi tidak dapat diubah. Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={finalizeMutation.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                finalizeMutation.mutate(
                  lokasiFinalisasi(penjualan.locationID, outletTenant.lokasiId),
                );
              }}
              disabled={finalizeMutation.isPending}
              className="cursor-pointer bg-sage hover:bg-sage/90 text-gading font-bold"
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
