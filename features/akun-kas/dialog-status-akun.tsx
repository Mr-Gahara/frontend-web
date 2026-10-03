"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pesanError } from "@/lib/api/error";
import type { AkunKas } from "@/types/akunKas";
import { useUbahAkunKas } from "./hooks";

/**
 * Konfirmasi ganti status akun kas (keputusan UA2a dan UA3a). Mengirim hanya
 * { status }, sehingga penjaga backend yang berlaku tepat satu: batas akun
 * aktif saat mengaktifkan; saldo 0 dan tidak dipakai metode pembayaran saat
 * menonaktifkan. Penolakan ditampilkan apa adanya di dalam dialog, karena
 * pesannya memuat jumlah saldo atau nama metode. Dipasang pemanggil hanya
 * saat dibuka, sehingga pesan galat tidak terbawa ke pembukaan berikutnya.
 */
export function DialogStatusAkun({
  akun,
  tujuan,
  onTutup,
  onBerhasil,
}: {
  akun: AkunKas;
  tujuan: AkunKas["status"];
  onTutup: () => void;
  onBerhasil?: () => void;
}) {
  const [galat, setGalat] = useState("");
  const menutup = tujuan === "non-aktif";
  const ubah = useUbahAkunKas({
    onSuccess: () => {
      toast.success(menutup ? "Akun kas dinonaktifkan" : "Akun kas diaktifkan kembali", {
        description: akun.namaAkun,
      });
      onTutup();
      onBerhasil?.();
    },
    onError: (err) =>
      setGalat(
        pesanError(
          err,
          menutup ? "Gagal menonaktifkan akun kas." : "Gagal mengaktifkan akun kas.",
        ),
      ),
  });
  const memuat = ubah.isPending;

  const kirim = () => {
    setGalat("");
    ubah.mutate({ id: akun.id, payload: { status: tujuan } });
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {menutup ? `Nonaktifkan ${akun.namaAkun}?` : `Aktifkan kembali ${akun.namaAkun}?`}
          </DialogTitle>
          <DialogDescription>
            {menutup
              ? "Akun hanya dapat dinonaktifkan bila saldonya 0 dan tidak dipakai metode pembayaran mana pun. Akun non-aktif dipindahkan ke bagian Akun non-aktif dan dapat diaktifkan kembali."
              : "Akun kembali tampil sebagai akun aktif. Satu toko paling banyak memiliki 10 akun kas aktif."}
          </DialogDescription>
        </DialogHeader>
        {galat && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            {galat}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
            Batal
          </Button>
          <Button
            type="button"
            variant={menutup ? "destructive" : "default"}
            onClick={kirim}
            disabled={memuat}
          >
            {memuat ? "Memproses..." : menutup ? "Nonaktifkan" : "Aktifkan Kembali"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}