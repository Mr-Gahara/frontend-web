"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { formatTanggal } from "@/lib/format";
import type { SesiBookingPenjualan } from "@/types/penjualan";
import { useTandaiSelesaiBooking } from "./hooks";
import { bolehTandaiSelesai } from "./izin";

const LABEL_STATUS: Record<string, string> = { Aktif: "Aktif", Selesai: "Selesai", VOID: "Dibatalkan" };

const KELAS_STATUS: Record<string, string> = {
  Aktif: "bg-sage/15 text-navy",
  VOID: "bg-red-500/10 text-red-800",
};

/**
 * Kolom desktop Aset, Waktu, Status, Aksi seperti kartu Stok Keluar (VD4a);
 * di bawah sm baris bertumpuk (pemilik proyek, 20 November 2026, opsi B).
 */
const GRID = "sm:grid sm:grid-cols-[minmax(0,1fr)_220px_120px_150px] sm:gap-4";

/** Satu booking milik penjualan: aset, waktu, status, dan Tandai Selesai (keputusan NZ7a). */
function BarisBooking({
  booking: b,
  permissions,
  bolehUbah,
}: {
  booking: SesiBookingPenjualan;
  permissions: readonly string[];
  bolehUbah: boolean;
}) {
  const tandai = useTandaiSelesaiBooking();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState("");
  const id = b.id;
  const nama = b.dataAset?.namaAset ?? "Aset tidak dikenal";
  const sampai = b.waktuSelesai ? ` – ${format(new Date(b.waktuSelesai), "HH:mm")}` : "";

  return (
    <li className={`flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-4 py-3 sm:px-6 ${GRID}`}>
      <p className="font-semibold text-navy">{nama}</p>
      <p className="text-isi font-medium text-navy/80">
        {formatTanggal(b.waktuMulai)}
        {sampai}
      </p>
      <span className={`inline-block justify-self-start rounded-full px-2.5 py-0.5 text-kecil font-semibold ${KELAS_STATUS[b.status] ?? "bg-navy/8 text-navy"}`}>
        {LABEL_STATUS[b.status] ?? b.status}
      </span>
      <div className="sm:justify-self-end">
      {bolehUbah && bolehTandaiSelesai(b, permissions) && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setGalat("");
            setKonfirmasi(true);
          }}
          className="cursor-pointer border-navy/20 text-navy font-bold"
        >
          Tandai Selesai
        </Button>
      )}
      <AlertDialog
        open={konfirmasi}
        onOpenChange={(buka) => {
          if (!buka && !tandai.isPending) setKonfirmasi(false);
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Tandai booking {nama} selesai?</AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Pembayaran tetap tercatat, dan sisa jam aset ini terbuka untuk booking lain. Booking yang sudah
              selesai tidak dapat diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {galat && (
            <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-isi font-bold text-red-600">
              {galat}
            </p>
          )}
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={tandai.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={tandai.isPending}
              onClick={(e) => {
                e.preventDefault();
                tandai.mutate(id, {
                  onSuccess: () => {
                    toast.success("Berhasil", { description: "Booking ditandai selesai." });
                    setKonfirmasi(false);
                  },
                  onError: (err) => setGalat(pesanError(err, "Booking gagal ditandai selesai.")),
                });
              }}
              className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold"
            >
              {tandai.isPending ? "Menyimpan..." : "Tandai Selesai"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </li>
  );
}

/**
 * Booking milik satu penjualan, dipasang halaman detail penjualan berjenis
 * booking (keputusan NZ7a). Daftarnya dari sesiBooking[] detail penjualan
 * (backend B347), sehingga cukup read-penjualan. Toko yang turun dari plan
 * bersesi booking tetap melihatnya sebagai riwayat tanpa Tandai Selesai
 * (pemilik proyek, 23 November 2026).
 */
export function BookingPenjualan({ sesiBooking, bolehUbah }: { sesiBooking: SesiBookingPenjualan[]; bolehUbah: boolean }) {
  const { permissions } = useSession();
  if (sesiBooking.length === 0) return null;
  return (
    <section
      aria-label="Sesi booking"
      className="overflow-hidden rounded-2xl border border-navy/10 bg-krem shadow-sm"
    >
      <div className="flex items-center gap-2 px-4 pt-5 pb-4 sm:px-6">
        <CalendarClock className="h-5 w-5 text-karamel" />
        <h2 className="text-subjudul font-bold text-navy">Sesi Booking</h2>
      </div>
      <div aria-hidden="true" className={`hidden border-y border-navy/10 bg-gading px-6 py-3 text-kecil font-semibold text-navy/60 ${GRID}`}>
        <span>Aset</span>
        <span>Waktu</span>
        <span>Status</span>
        <span className="text-right">Aksi</span>
      </div>
      <ul className="bg-gading text-isi">
        {sesiBooking.map((b) => (
          <BarisBooking key={b.id} booking={b} permissions={permissions} bolehUbah={bolehUbah} />
        ))}
      </ul>
    </section>
  );
}
