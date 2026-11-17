"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pesanError } from "@/lib/api/error";
import { cn } from "@/lib/utils";
import type { Membership, PaketMembership } from "@/types/membership";
import { useBuatPaket, useHapusMembership, useHapusPaket, useUbahPaket } from "./hooks";
import { nilaiAwalPaket, payloadBuatPaket, payloadUbahPaket, skemaPaket, type IsianPaket } from "./schema";
import { teksMasa } from "./tampilan";

const KELAS_ISIAN = "bg-white border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";

function PesanGalat({ pesan }: { pesan: string }) {
  return (
    <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive">
      {pesan}
    </p>
  );
}

function Isian({ id, label, galat, children }: { id: string; label: string; galat?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-kecil font-bold text-navy">
        {label}
      </label>
      {children}
      {galat && <span className="text-kecil font-bold text-rose-500">{galat}</span>}
    </div>
  );
}

/**
 * Dialog Tambah (paket null) atau Ubah Paket (desain B). Ubah hanya mengirim
 * field yang berubah (keputusan rancangan butir 15). Saklar Aktif mengatur
 * apakah paket dapat dipilih saat mendaftarkan member.
 */
export function DialogPaket({ paket, onTutup }: { paket: PaketMembership | null; onTutup: () => void }) {
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IsianPaket>({ resolver: zodResolver(skemaPaket), defaultValues: nilaiAwalPaket(paket) });
  const opsi = {
    onSuccess: () => {
      toast.success(paket ? "Paket diperbarui" : "Paket ditambahkan");
      onTutup();
    },
    onError: (err: unknown) => setGalat(pesanError(err, "Gagal menyimpan paket.")),
  };
  const buat = useBuatPaket(opsi);
  const ubah = useUbahPaket(opsi);
  const memuat = buat.isPending || ubah.isPending;

  const kirim = (isian: IsianPaket) => {
    setGalat("");
    if (!paket) return buat.mutate(payloadBuatPaket(isian));
    const payload = payloadUbahPaket(isian, paket);
    if (Object.keys(payload).length === 0) return onTutup();
    ubah.mutate({ id: paket.id, payload });
  };

  return (
    <Dialog open onOpenChange={(buka) => !buka && !memuat && onTutup()}>
      <DialogContent className="bg-gading border-navy/10 sm:max-w-md">
        <form noValidate onSubmit={handleSubmit(kirim)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-navy text-subjudul font-bold">{paket ? "Ubah Paket" : "Tambah Paket"}</DialogTitle>
            <DialogDescription className="text-navy/70 font-medium">
              {paket
                ? "Perubahan harga dan durasi berlaku untuk pendaftaran berikutnya."
                : "Paket langganan yang dibeli pelanggan di kasir, misalnya Member Bulanan 30 hari."}
            </DialogDescription>
          </DialogHeader>
          <Isian id="paket-nama" label="Nama paket *" galat={errors.namaPaket?.message}>
            <Input id="paket-nama" {...register("namaPaket")} placeholder="Misal: Member Bulanan" className={cn(KELAS_ISIAN, errors.namaPaket && "border-rose-500")} />
          </Isian>
          <div className="grid grid-cols-2 gap-3">
            <Isian id="paket-harga" label="Harga (Rp) *" galat={errors.harga?.message}>
              <Input id="paket-harga" inputMode="numeric" {...register("harga")} placeholder="0" className={cn(KELAS_ISIAN, errors.harga && "border-rose-500")} />
            </Isian>
            <Isian id="paket-durasi" label="Durasi (hari) *" galat={errors.durasiHari?.message}>
              <Input id="paket-durasi" inputMode="numeric" {...register("durasiHari")} placeholder="30" className={cn(KELAS_ISIAN, errors.durasiHari && "border-rose-500")} />
            </Isian>
          </div>
          <Isian id="paket-deskripsi" label="Deskripsi (opsional)" galat={errors.deskripsi?.message}>
            <Textarea id="paket-deskripsi" rows={2} {...register("deskripsi")} className={KELAS_ISIAN} />
          </Isian>
          <Controller
            control={control}
            name="aktif"
            render={({ field }) => (
              <div className="flex items-start gap-2">
                <Checkbox id="paket-aktif" checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                <label htmlFor="paket-aktif" className="text-isi font-medium text-navy cursor-pointer">
                  Aktif, dapat dipilih saat mendaftarkan member
                </label>
              </div>
            )}
          />
          {galat && <PesanGalat pesan={galat} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
              Batal
            </Button>
            <Button type="submit" disabled={memuat} className="bg-navy text-gading hover:bg-navy/90 font-bold">
              {memuat ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KonfirmasiHapus({
  judul,
  isi,
  galat,
  memuat,
  onHapus,
  onTutup,
}: {
  judul: string;
  isi: string;
  galat: string;
  memuat: boolean;
  onHapus: () => void;
  onTutup: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(buka) => !buka && !memuat && onTutup()}>
      <AlertDialogContent className="bg-gading border-navy/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy">{judul}</AlertDialogTitle>
          <AlertDialogDescription className="text-navy/70 font-medium">{isi}</AlertDialogDescription>
        </AlertDialogHeader>
        {galat && <PesanGalat pesan={galat} />}
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel disabled={memuat} className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={memuat}
            onClick={(e) => {
              e.preventDefault();
              onHapus();
            }}
            className="cursor-pointer font-bold bg-red-600 hover:bg-red-700 text-white"
          >
            {memuat ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Hapus membership: penjualannya tetap tercatat, diskon khusus member tidak berlaku lagi. */
export function DialogHapusMember({ membership, onTutup }: { membership: Membership; onTutup: () => void }) {
  const [galat, setGalat] = useState("");
  const hapus = useHapusMembership({
    onSuccess: () => {
      toast.success("Membership dihapus");
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal menghapus membership.")),
  });
  const nama = membership.pelanggan?.namaPelanggan ?? "pelanggan";
  return (
    <KonfirmasiHapus
      judul={`Hapus membership ${nama}?`}
      isi={`${membership.paketMembership?.namaPaket ?? "Paket terhapus"}, ${teksMasa(membership)}. Penjualan ${
        membership.penjualan?.noReferensi ?? ""
      } tetap tercatat; diskon khusus member tidak lagi berlaku untuk ${nama}.`}
      galat={galat}
      memuat={hapus.isPending}
      onHapus={() => {
        setGalat("");
        hapus.mutate(membership.id);
      }}
      onTutup={onTutup}
    />
  );
}

/** Hapus paket: backend menolak 409 paket yang dirujuk membership, pesannya ditampilkan apa adanya. */
export function DialogHapusPaket({ paket, onTutup }: { paket: PaketMembership; onTutup: () => void }) {
  const [galat, setGalat] = useState("");
  const hapus = useHapusPaket({
    onSuccess: () => {
      toast.success("Paket dihapus");
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal menghapus paket.")),
  });
  return (
    <KonfirmasiHapus
      judul={`Hapus paket ${paket.namaPaket}?`}
      isi="Paket yang sudah dipakai member tidak dapat dihapus; nonaktifkan agar tidak dipakai pendaftaran baru."
      galat={galat}
      memuat={hapus.isPending}
      onHapus={() => {
        setGalat("");
        hapus.mutate(paket.id);
      }}
      onTutup={onTutup}
    />
  );
}
