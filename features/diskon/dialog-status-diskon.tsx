"use client";

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
import { pesanError } from "@/lib/api/error";
import type { Diskon } from "@/types/diskon";
import { usePerbaruiDiskon } from "./hooks";

/**
 * Konfirmasi aktifkan atau nonaktifkan diskon, pengganti hapus (keputusan
 * PD2a): backend tidak punya DELETE, karena diskon dirujuk riwayat
 * penjualan. Dialog hanya tertutup saat berhasil (keputusan Fase 0).
 */
export function DialogStatusDiskon({
  diskon,
  onTutup,
}: {
  diskon: Diskon | null;
  onTutup: () => void;
}) {
  const mengaktifkan = diskon?.status === "Non-Aktif";

  const perbarui = usePerbaruiDiskon({
    onSuccess: () => {
      toast.success("Berhasil", {
        description: mengaktifkan ? "Diskon berhasil diaktifkan." : "Diskon berhasil dinonaktifkan.",
      });
      onTutup();
    },
    onError: (err) => {
      toast.error("Gagal", { description: pesanError(err, "Gagal mengubah status diskon.") });
    },
  });

  return (
    <AlertDialog
      open={diskon !== null}
      onOpenChange={(buka) => {
        if (!buka && !perbarui.isPending) onTutup();
      }}
    >
      <AlertDialogContent className="border-[#041E3F]/10 bg-[#F2EAE1]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#041E3F]">
            {mengaktifkan ? "Aktifkan" : "Nonaktifkan"} diskon {diskon?.namaDiskon}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#041E3F]/70">
            {mengaktifkan
              ? "Diskon akan kembali dapat dipilih kasir, sesuai aturan berlakunya."
              : "Diskon tidak lagi dapat dipilih kasir. Riwayat penjualan yang memakainya tetap tersimpan, dan diskon dapat diaktifkan kembali."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={perbarui.isPending}
            className="cursor-pointer border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (diskon) {
                perbarui.mutate({
                  id: diskon.id,
                  payload: { status: mengaktifkan ? "Aktif" : "Non-Aktif" },
                });
              }
            }}
            disabled={perbarui.isPending}
            className={
              mengaktifkan
                ? "cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90"
                : "cursor-pointer bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            }
          >
            {perbarui.isPending ? "Menyimpan..." : mengaktifkan ? "Aktifkan" : "Nonaktifkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}