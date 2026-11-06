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

/** Konfirmasi berhenti jadi mesin kasir (DELETE /sesikasir/perangkat/:id; Revisi 2). */
export function DialogBerhenti({
  namaMesin,
  laci,
  buka,
  onBukaChange,
  memproses,
  onBerhenti,
}: {
  namaMesin: string;
  laci: string;
  buka: boolean;
  onBukaChange: (buka: boolean) => void;
  memproses: boolean;
  onBerhenti: () => void;
}) {
  return (
    <AlertDialog open={buka} onOpenChange={onBukaChange}>
      <AlertDialogContent className="border-navy/10 bg-gading text-navy">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[22px] font-bold text-navy">
            {namaMesin} berhenti jadi mesin kasir?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] text-navy/70">
            Perangkat ini tidak bisa membuka kasir lagi sampai ditambahkan kembali. Laci {laci} jadi bebas dipakai
            mesin lain. Riwayat buka-tutup kasirnya tetap tersimpan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-2.5">
          <AlertDialogCancel className="h-12 border-navy/20 text-base font-bold text-navy">Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={memproses}
            onClick={(e) => {
              e.preventDefault();
              onBerhenti();
            }}
            className="h-12 bg-navy text-base font-bold text-gading hover:bg-navy/90"
          >
            {memproses ? "Memproses..." : "Berhenti"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}