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
import type { Pelanggan } from "@/types/pelanggan";
import { useHapusPelanggan } from "./hooks";

/**
 * Konfirmasi hapus pelanggan. Dialog hanya tertutup saat hapus berhasil
 * (keputusan Fase 0); saat gagal dialog bertahan dan pesannya tampil. Hapus
 * di backend adalah hapus lunak.
 */
export function DialogHapusPelanggan({
  pelanggan,
  onTutup,
}: {
  pelanggan: Pelanggan | null;
  onTutup: () => void;
}) {
  const hapus = useHapusPelanggan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pelanggan berhasil dihapus." });
      onTutup();
    },
    onError: (err) => {
      toast.error("Gagal", { description: pesanError(err, "Gagal menghapus pelanggan.") });
    },
  });

  return (
    <AlertDialog
      open={pelanggan !== null}
      onOpenChange={(buka) => {
        if (!buka && !hapus.isPending) onTutup();
      }}
    >
      <AlertDialogContent className="border-navy/10 bg-krem">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy">Hapus pelanggan {pelanggan?.namaPelanggan}?</AlertDialogTitle>
          <AlertDialogDescription className="text-navy/70">
            Tindakan ini tidak dapat dibatalkan. Riwayat transaksi mungkin tetap tersimpan di sistem, namun data profil ini akan dihapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={hapus.isPending}
            className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 bg-transparent"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (pelanggan) hapus.mutate(pelanggan.id);
            }}
            disabled={hapus.isPending}
            className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
          >
            {hapus.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}