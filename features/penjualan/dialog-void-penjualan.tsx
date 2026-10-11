"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
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
import { PESAN_VOID_PENJUALAN } from "./tampilan";

interface PropsDialogVoid {
  noReferensi: string | undefined;
  terbuka: boolean;
  memproses: boolean;
  onTutup: () => void;
  onKonfirmasi: (alasan: string) => void;
}

/**
 * Dialog void penjualan, dipakai detail dan daftar (keputusan PB2a). Alasan
 * opsional dikirim sebagai alasanVoid (backend yoga 8fad4c0). Dialog hanya
 * tertutup saat berhasil (keputusan Fase 0): pemakai menutupnya di callback
 * sukses mutation. Isian alasan tinggal di dalam AlertDialogContent, yang
 * dilepas Radix saat dialog tertutup, sehingga selalu kosong saat dibuka.
 */
export function DialogVoidPenjualan({ noReferensi, terbuka, memproses, onTutup, onKonfirmasi }: PropsDialogVoid) {
  return (
    <AlertDialog
      open={terbuka}
      onOpenChange={(open) => {
        if (!open) onTutup();
      }}
    >
      <AlertDialogContent className="bg-gading border-navy/10 max-w-[90vw] sm:max-w-md">
        <IsiDialogVoid noReferensi={noReferensi} memproses={memproses} onKonfirmasi={onKonfirmasi} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IsiDialogVoid({
  noReferensi,
  memproses,
  onKonfirmasi,
}: Pick<PropsDialogVoid, "noReferensi" | "memproses" | "onKonfirmasi">) {
  const [alasan, setAlasan] = useState("");
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-navy">Void Penjualan {noReferensi}?</AlertDialogTitle>
        <AlertDialogDescription className="text-navy/70 font-medium">
          {PESAN_VOID_PENJUALAN}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-2">
        <label htmlFor="alasanVoidPenjualan" className="text-sm font-bold text-navy">
          Alasan <span className="text-navy/50 font-medium">(Opsional)</span>
        </label>
        <Input
          id="alasanVoidPenjualan"
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Misal: pesanan dibatalkan pelanggan"
          maxLength={500}
          className="bg-white border-navy/20 text-navy"
        />
      </div>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <AlertDialogCancel
          disabled={memproses}
          className="cursor-pointer w-full sm:w-auto border-navy/20 text-navy hover:bg-navy/5 font-bold"
        >
          Batal
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            onKonfirmasi(alasan);
          }}
          disabled={memproses}
          className="cursor-pointer bg-karamel text-navy hover:bg-karamel/90 font-bold w-full sm:w-auto"
        >
          {memproses ? "Memproses..." : "Ya, Void Penjualan"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}