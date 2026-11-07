"use client";

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

/**
 * Konfirmasi buat penjualan. Tertutup hanya saat berhasil; saat gagal tetap
 * terbuka (keputusan Fase 0). Dipindah apa adanya dari halaman-buat-penjualan.tsx.
 */
export function DialogKonfirmasiPenjualan({
  buka,
  onBukaChange,
  memproses,
  onLanjutkan,
}: {
  buka: boolean;
  onBukaChange: (buka: boolean) => void;
  memproses: boolean;
  onLanjutkan: () => void;
}) {
  return (
    <AlertDialog open={buka} onOpenChange={onBukaChange}>
      <AlertDialogContent className="bg-gading border-navy/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy">
            Buat Transaksi Penjualan?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-navy/70 font-medium">
            Apakah Anda yakin detail transaksi sudah benar? Data akan disimpan
            sebagai transaksi baru yang belum dibayar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={memproses}
            className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onLanjutkan();
            }}
            disabled={memproses}
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold"
          >
            {memproses ? "Memproses..." : "Ya, Lanjutkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
