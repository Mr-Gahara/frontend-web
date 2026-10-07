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
import { useSesiBooking, useTandaiSelesaiBooking } from "./hooks";
import { bolehBacaBooking, bolehTandaiSelesai } from "./izin";

const LABEL_STATUS: Record<string, string> = { Aktif: "Aktif", Selesai: "Selesai", VOID: "Dibatalkan" };

/** Satu booking milik penjualan: aset, waktu, status, dan Tandai Selesai (keputusan NZ7a). */
function BarisBooking({ id, permissions }: { id: string; permissions: readonly string[] }) {
  const booking = useSesiBooking(id);
  const tandai = useTandaiSelesaiBooking();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState("");

  if (booking.isError) {
    return (
      <li role="alert" className="text-sm font-medium text-red-600">
        {pesanError(booking.error, "Gagal memuat sesi booking.")}
      </li>
    );
  }
  if (!booking.data) return <li className="text-sm font-medium text-[#0A2947]/60">Memuat sesi booking...</li>;

  const b = booking.data;
  const nama = b.dataAset?.namaAset ?? "Aset tidak dikenal";
  const sampai = b.waktuSelesai ? ` – ${format(new Date(b.waktuSelesai), "HH:mm")}` : "";

  return (
    <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-[#0A2947]">{nama}</p>
        <p className="text-xs font-medium text-[#0A2947]/60">
          {formatTanggal(b.waktuMulai)}
          {sampai} · {LABEL_STATUS[b.status] ?? b.status}
        </p>
      </div>
      {bolehTandaiSelesai(b, permissions) && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setGalat("");
            setKonfirmasi(true);
          }}
          className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] font-bold"
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
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Tandai booking {nama} selesai?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Pembayaran tetap tercatat, dan sisa jam aset ini terbuka untuk booking lain. Booking yang sudah
              selesai tidak dapat diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {galat && (
            <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-600">
              {galat}
            </p>
          )}
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={tandai.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
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
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
            >
              {tandai.isPending ? "Menyimpan..." : "Tandai Selesai"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

/**
 * Booking milik satu penjualan, dipasang halaman detail penjualan berjenis
 * booking (keputusan NZ7a). Id booking berasal dari itemPenjualan[].sesiBookingID.
 * Tidak dipasang tanpa read-booking, karena GET /sesibooking/:id memeriksanya,
 * sedangkan rute detail penjualan hanya menuntut read-penjualan.
 */
export function BookingPenjualan({ idBooking }: { idBooking: string[] }) {
  const { permissions } = useSession();
  if (idBooking.length === 0 || !bolehBacaBooking(permissions)) return null;
  return (
    <section
      aria-label="Sesi booking"
      className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
        <CalendarClock className="h-5 w-5 text-[#D4A373]" />
        <h2 className="font-bold text-[#0A2947]">Sesi Booking</h2>
      </div>
      <ul className="flex flex-col gap-4">
        {idBooking.map((id) => (
          <BarisBooking key={id} id={id} permissions={permissions} />
        ))}
      </ul>
    </section>
  );
}