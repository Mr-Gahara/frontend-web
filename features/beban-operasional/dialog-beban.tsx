"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDaftarKategoriBeban } from "@/features/kategori-beban/hooks";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggal, formatTanggalPendek } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BebanOperasional } from "@/types/bebanOperasional";
import { useBatalkanBeban, useUbahBeban } from "./hooks";
import {
  LABEL_STATUS_BEBAN,
  isianAwalUbah,
  namaAkunBeban,
  namaKategoriBeban,
  payloadBatalBeban,
  payloadUbahBeban,
  pesanAlasanBatal,
} from "./payload";
import { skemaUbahBeban, type IsianUbahBeban } from "./schema";

const KELAS_LABEL = "text-xs font-semibold text-navy/60";
const KELAS_ISIAN =
  "bg-gading border-navy/20 text-navy placeholder:text-navy/30 focus-visible:ring-1 focus-visible:ring-navy";

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

function BarisRincian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className={`${KELAS_LABEL} shrink-0`}>{label}</dt>
      <dd className="text-sm font-medium text-navy text-right break-words min-w-0">{nilai}</dd>
    </div>
  );
}

/**
 * Rincian satu beban, dibuka dari menu titik tiga (TB6a): akun kas,
 * pencatat, waktu dicatat, dan, untuk beban yang dibatalkan, alasan,
 * pembatal, dan waktunya.
 */
export function DialogRincianBeban({
  beban,
  onTutup,
}: {
  beban: BebanOperasional;
  onTutup: () => void;
}) {
  const dibatalkan = beban.status === "VOID";
  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10 max-w-[92vw] sm:max-w-md">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-navy">Rincian Beban</DialogTitle>
          <DialogDescription className="text-navy/70 font-medium">
            {namaKategoriBeban(beban.kategori)} · {LABEL_STATUS_BEBAN[beban.status]}
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className={KELAS_LABEL}>Jumlah</p>
          <p
            className={cn(
              "font-mono text-2xl sm:text-3xl font-bold",
              dibatalkan ? "text-navy/50 line-through" : "text-red-800",
            )}
          >
            {formatRupiah(beban.jumlah)}
          </p>
        </div>

        <dl className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-permukaan">
          <BarisRincian label="Tanggal beban" nilai={formatTanggalPendek(beban.tanggal)} />
          <BarisRincian label="Akun kas" nilai={namaAkunBeban(beban.akunKas)} />
          <BarisRincian label="Kategori" nilai={namaKategoriBeban(beban.kategori)} />
          <BarisRincian label="Dicatat oleh" nilai={beban.dicatatOleh?.nama || "-"} />
          {beban.createdAt && <BarisRincian label="Dicatat" nilai={formatTanggal(beban.createdAt)} />}
          {dibatalkan && <BarisRincian label="Dibatalkan oleh" nilai={beban.divoidOleh?.nama || "-"} />}
          {dibatalkan && beban.tanggalVoid && (
            <BarisRincian label="Dibatalkan" nilai={formatTanggal(beban.tanggalVoid)} />
          )}
        </dl>

        <div className="flex flex-col gap-1.5">
          <p className={KELAS_LABEL}>Keterangan</p>
          <p className="rounded-xl border border-navy/10 bg-permukaan px-4 py-3 text-sm font-medium text-navy break-words">
            {beban.keterangan || "-"}
          </p>
        </div>

        {dibatalkan && (
          <div className="flex flex-col gap-1.5">
            <p className={KELAS_LABEL}>Alasan pembatalan</p>
            <p className="rounded-xl border border-navy/10 bg-permukaan px-4 py-3 text-sm font-medium text-navy break-words">
              {beban.alasanVoid || "-"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ubah keterangan dan kategori beban AKTIF (keputusan BO6a). Jumlah, akun
 * kas, dan tanggal terkunci di backend. Hanya field yang berubah yang
 * dikirim (keputusan rancangan butir 15), dan simpan mati selama tidak ada
 * perubahan. Tanpa read-kategori-beban, kategori tampil tanpa pilihan.
 * Dipasang saat dibuka dan hanya tertutup saat berhasil.
 */
export function DialogUbahBeban({
  beban,
  bolehKategori,
  onTutup,
}: {
  beban: BebanOperasional;
  bolehKategori: boolean;
  onTutup: () => void;
}) {
  const [galat, setGalat] = useState("");
  const kategori = useDaftarKategoriBeban(bolehKategori);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IsianUbahBeban>({
    resolver: zodResolver(skemaUbahBeban),
    defaultValues: isianAwalUbah(beban),
  });
  const isian = useWatch({ control });
  const tidakBerubah =
    Object.keys(
      payloadUbahBeban(beban, {
        kategoriBebanID: isian.kategoriBebanID ?? "",
        keterangan: isian.keterangan ?? "",
      }),
    ).length === 0;

  const pilihanKategori = (kategori.data ?? []).map((k) => ({ id: k.id, nama: k.namaKategori }));
  if (beban.kategori && !pilihanKategori.some((k) => k.id === beban.kategori?.id)) {
    pilihanKategori.unshift({ id: beban.kategori.id, nama: namaKategoriBeban(beban.kategori) });
  }

  const ubah = useUbahBeban({
    onSuccess: () => {
      toast.success("Beban diperbarui");
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal memperbarui beban.")),
  });
  const memuat = ubah.isPending;

  const kirim = (nilai: IsianUbahBeban) => {
    setGalat("");
    const payload = payloadUbahBeban(beban, nilai);
    if (Object.keys(payload).length === 0) return;
    ubah.mutate({ id: beban.id, payload });
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
            <DialogTitle className="text-navy">Ubah Beban</DialogTitle>
            <DialogDescription className="text-navy/70 font-medium">
              Jumlah, akun kas, dan tanggal tidak dapat diubah. Bila salah, batalkan beban ini lalu
              catat ulang yang benar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="ubah-kategori-beban" className="text-sm font-bold text-navy">
              Kategori
            </label>
            <Controller
              name="kategoriBebanID"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={memuat || !bolehKategori}
                >
                  <SelectTrigger
                    id="ubah-kategori-beban"
                    className={cn(KELAS_ISIAN, "w-full", errors.kategoriBebanID && "border-rose-500")}
                  >
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-gading border-navy/10 text-navy">
                    {pilihanKategori.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kategoriBebanID && (
              <span className="text-xs font-bold text-rose-500">{errors.kategoriBebanID.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ubah-keterangan-beban" className="text-sm font-bold text-navy">
              Keterangan
            </label>
            <Input
              id="ubah-keterangan-beban"
              {...register("keterangan")}
              readOnly={memuat}
              className={cn(KELAS_ISIAN, errors.keterangan && "border-rose-500")}
            />
            {errors.keterangan && (
              <span className="text-xs font-bold text-rose-500">{errors.keterangan.message}</span>
            )}
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
 * Membatalkan beban lewat PUT berstatus VOID dengan alasan wajib (P21
 * backend). Saldo dikembalikan ke akun kas; penolakan backend (sudah
 * dibatalkan, atau akun kas sudah nonaktif) tampil di dalam dialog. Dipasang
 * saat dibuka dan hanya tertutup saat berhasil.
 */
export function DialogBatalBeban({
  beban,
  onTutup,
}: {
  beban: BebanOperasional;
  onTutup: () => void;
}) {
  const [alasan, setAlasan] = useState("");
  const [galatAlasan, setGalatAlasan] = useState("");
  const [galat, setGalat] = useState("");
  const batal = useBatalkanBeban({
    onSuccess: () => {
      toast.success("Beban dibatalkan", { description: "Saldo akun kas telah dikembalikan." });
      onTutup();
    },
    onError: (err) => setGalat(pesanError(err, "Gagal membatalkan beban.")),
  });
  const memuat = batal.isPending;

  const kirim = () => {
    setGalat("");
    const pesan = pesanAlasanBatal(alasan);
    setGalatAlasan(pesan ?? "");
    if (pesan) return;
    batal.mutate({ id: beban.id, payload: payloadBatalBeban(alasan) });
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10">
        <DialogHeader>
          <DialogTitle className="text-navy">Batalkan beban ini?</DialogTitle>
          <DialogDescription className="text-navy/70 font-medium">
            {formatRupiah(beban.jumlah)} dikembalikan ke {namaAkunBeban(beban.akunKas)}. Beban tetap
            tercatat dengan status Dibatalkan. Bila uangnya memang keluar dengan jumlah atau akun lain,
            catat ulang beban yang benar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label htmlFor="alasan-batal-beban" className="text-sm font-bold text-navy">
            Alasan pembatalan
          </label>
          <Input
            id="alasan-batal-beban"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            readOnly={memuat}
            className={cn(KELAS_ISIAN, galatAlasan && "border-rose-500")}
          />
          {galatAlasan && <span className="text-xs font-bold text-rose-500">{galatAlasan}</span>}
        </div>
        {galat && <PesanGalat pesan={galat} />}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
            Tutup
          </Button>
          <Button type="button" variant="destructive" onClick={kirim} disabled={memuat}>
            {memuat ? "Memproses..." : "Batalkan Beban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}