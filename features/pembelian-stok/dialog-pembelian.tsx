"use client";

import { useState } from "react";
import { useHariIni } from "@/hooks/use-hari-ini";
import { toast } from "sonner";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PilihTanggal } from "@/components/pilih-tanggal";
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
import { formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";
import type { PembelianStok } from "@/types/pembelianStok";
import { useHapusPembelianStok, usePerbaruiPembelianStok } from "./hooks";
import { isianAwalUbah, payloadUbahPembelian } from "./payload";
import { buatSkemaUbahPembelian, type IsianUbahPembelian } from "./schema";
import { namaBahanItem, teksJumlahItem } from "./tampilan";

const KELAS_LABEL = "text-sm font-bold text-navy";
const KELAS_ISIAN =
  "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";
const KELAS_GALAT = "text-xs font-bold text-rose-500";

function PesanGalat({ pesan }: { pesan: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
    >
      {pesan}
    </p>
  );
}

/**
 * Ubah info pembelian (B76): supplier, nomor faktur, tanggal, dan
 * keterangan. Barang, lokasi penerima, dan akun kas terkunci di backend.
 * Tanggal hanya dapat diubah Owner, sama dengan catat. Hanya field yang
 * berubah yang dikirim (keputusan rancangan butir 15), dan simpan mati
 * selama tidak ada perubahan. Penolakan backend, misalnya nomor faktur
 * bentrok, tampil di dalam dialog. Dipasang saat dibuka dan hanya tertutup
 * saat berhasil, seperti DialogUbahBeban.
 */
export function DialogUbahPembelian({
  pembelian,
  owner,
  onTutup,
}: {
  pembelian: PembelianStok;
  owner: boolean;
  onTutup: () => void;
}) {
  const hariIni = useHariIni();
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IsianUbahPembelian>({
    resolver: zodResolver(buatSkemaUbahPembelian(hariIni)),
    defaultValues: isianAwalUbah(pembelian),
  });
  const isian = useWatch({ control });
  const tidakBerubah =
    Object.keys(
      payloadUbahPembelian(
        pembelian,
        {
          supplier: isian.supplier ?? "",
          nomorFaktur: isian.nomorFaktur ?? "",
          tanggal: isian.tanggal ?? "",
          keterangan: isian.keterangan ?? "",
        },
        owner,
      ),
    ).length === 0;

  const ubah = usePerbaruiPembelianStok({
    onSuccess: () => {
      toast.success("Info pembelian diperbarui");
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal memperbarui pembelian.")),
  });
  const memuat = ubah.isPending;

  const kirim = (nilai: IsianUbahPembelian) => {
    setGalat("");
    const payload = payloadUbahPembelian(pembelian, nilai, owner);
    if (Object.keys(payload).length === 0) return;
    ubah.mutate({ id: pembelian.id, payload });
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10">
        <form noValidate onSubmit={handleSubmit(kirim)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-navy">Ubah Info Pembelian</DialogTitle>
            <DialogDescription className="text-navy/70 font-medium">
              Barang, lokasi penerima, dan akun kas tidak dapat diubah. Bila salah, hapus pembelian ini lalu catat
              ulang yang benar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="ubah-supplier-pembelian" className={KELAS_LABEL}>
              Supplier
            </label>
            <Input
              id="ubah-supplier-pembelian"
              {...register("supplier")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, errors.supplier && "border-rose-500")}
            />
            {errors.supplier && <span className={KELAS_GALAT}>{errors.supplier.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ubah-faktur-pembelian" className={KELAS_LABEL}>
              Nomor faktur
            </label>
            <Input
              id="ubah-faktur-pembelian"
              {...register("nomorFaktur")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, "font-mono", errors.nomorFaktur && "border-rose-500")}
            />
            {errors.nomorFaktur && <span className={KELAS_GALAT}>{errors.nomorFaktur.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <span className={KELAS_LABEL}>Tanggal pembelian</span>
            {owner ? (
              <Controller
                name="tanggal"
                control={control}
                render={({ field }) => (
                  <PilihTanggal
                    label="Tanggal pembelian"
                    value={dariTanggalLokal(field.value)}
                    onChange={(tanggal) => field.onChange(keTanggalLokal(tanggal))}
                    tanggalNonaktif={{ after: new Date() }}
                    disabled={memuat}
                    invalid={!!errors.tanggal}
                  />
                )}
              />
            ) : (
              <p className="rounded-md border border-navy/20 bg-white px-3 py-2 text-sm font-medium text-navy">
                {formatTanggal(pembelian.tanggal)}
              </p>
            )}
            {owner ? (
              errors.tanggal && <span className={KELAS_GALAT}>{errors.tanggal.message}</span>
            ) : (
              <p className="text-xs font-medium text-navy/60">Hanya Owner yang dapat mengubah tanggal pembelian.</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ubah-keterangan-pembelian" className={KELAS_LABEL}>
              Keterangan
            </label>
            <Input
              id="ubah-keterangan-pembelian"
              {...register("keterangan")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, errors.keterangan && "border-rose-500")}
            />
            {errors.keterangan && <span className={KELAS_GALAT}>{errors.keterangan.message}</span>}
          </div>
          {galat && <PesanGalat pesan={galat} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={memuat || tidakBerubah}
              className="bg-navy text-gading hover:bg-navy/90 font-bold"
            >
              {memuat ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hapus pembelian (B77). Pembelian yang menambah stok mengurangi kembali
 * stoknya dari lokasi penerima dan menulis jurnal Keluar; backend menolak
 * 409 bila stok itu sudah terpakai, dan tidak ada yang berubah. Pembelian
 * sebelum P17 dihapus tanpa menyentuh stok. Penolakan tampil di dalam
 * dialog dengan pesan dari backend, dan dialog hanya tertutup saat berhasil
 * (keputusan Fase 0), seperti DialogHapusPelanggan.
 */
export function DialogHapusPembelian({
  pembelian,
  namaLokasi,
  onTutup,
  onTerhapus,
}: {
  pembelian: PembelianStok;
  namaLokasi: string;
  onTutup: () => void;
  onTerhapus: () => void;
}) {
  const [galat, setGalat] = useState("");
  const hapus = useHapusPembelianStok({
    onSuccess: () => {
      toast.success("Pembelian dihapus", {
        description: pembelian.stokDitambahkan ? `Stok ${namaLokasi} dikurangi kembali.` : undefined,
      });
      onTerhapus();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal menghapus pembelian.")),
  });

  return (
    <AlertDialog
      open
      onOpenChange={(buka) => {
        if (!buka && !hapus.isPending) onTutup();
      }}
    >
      <AlertDialogContent className="border-navy/10 bg-krem">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy">Hapus pembelian ini?</AlertDialogTitle>
          <AlertDialogDescription className="text-navy/70">
            {pembelian.stokDitambahkan
              ? `Stok yang ditambahkan pembelian ini akan dikurangi kembali dari ${namaLokasi}, dan jurnal stok mencatatnya sebagai Keluar. Tindakan ini tidak dapat dibatalkan.`
              : "Pembelian ini tidak pernah menambah stok, sehingga menghapusnya tidak mengubah stok mana pun. Tindakan ini tidak dapat dibatalkan."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pembelian.stokDitambahkan && (
          <ul className="flex flex-col gap-2 rounded-xl bg-gading px-4 py-3">
            {pembelian.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 text-sm">
                <span className="font-semibold text-navy">{namaBahanItem(item)}</span>
                <span className="font-mono font-bold text-navy">{teksJumlahItem(item)}</span>
              </li>
            ))}
          </ul>
        )}
        {galat && <PesanGalat pesan={galat} />}
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
              setGalat("");
              hapus.mutate(pembelian.id);
            }}
            disabled={hapus.isPending}
            className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
          >
            {hapus.isPending ? "Menghapus..." : "Hapus Pembelian"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}