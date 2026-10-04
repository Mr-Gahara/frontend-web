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
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import { formatRupiah } from "@/lib/format";
import type { JurnalTransfer } from "@/types/jurnalTransfer";
import { useBatalkanTransfer } from "./hooks";
import { namaAkunTransfer, payloadBatalTransfer } from "./payload";

/**
 * Konfirmasi pembatalan transfer (keputusan DN2a) lewat PUT berstatus VOID,
 * dengan alasan opsional yang dikirim sebagai catatan. Backend membalik saldo
 * kedua akun; penolakannya (saldo akun tujuan tidak cukup, atau salah satu
 * akun sudah nonaktif) ditampilkan apa adanya di dalam dialog. Dipasang
 * pemanggil hanya saat dibuka, dan hanya tertutup saat berhasil.
 */
export function DialogBatalTransfer({
  transfer,
  onTutup,
}: {
  transfer: JurnalTransfer;
  onTutup: () => void;
}) {
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState("");
  const batal = useBatalkanTransfer({
    onSuccess: () => {
      toast.success("Transfer dibatalkan", {
        description: "Saldo kedua akun kas telah dikembalikan.",
      });
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal membatalkan transfer.")),
  });
  const memuat = batal.isPending;

  const kirim = () => {
    setGalat("");
    batal.mutate({ id: transfer.id, payload: payloadBatalTransfer(alasan) });
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
          <DialogTitle>Batalkan transfer ini?</DialogTitle>
          <DialogDescription>
            {formatRupiah(transfer.jumlah)} dari {namaAkunTransfer(transfer.kasSumber)} ke{" "}
            {namaAkunTransfer(transfer.kasTujuan)} akan dikembalikan ke akun sumber. Riwayat
            transfer tetap tersimpan dengan status Dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label htmlFor="alasan-batal-transfer" className="text-sm font-bold text-[#0A2947]">
            Alasan pembatalan{" "}
            <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
          </label>
          <Input
            id="alasan-batal-transfer"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            maxLength={500}
            readOnly={memuat}
          />
        </div>
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
            Tutup
          </Button>
          <Button type="button" variant="destructive" onClick={kirim} disabled={memuat}>
            {memuat ? "Memproses..." : "Batalkan Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}