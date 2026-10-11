"use client";

import { useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useBuatPelanggan, usePerbaruiPelanggan } from "./hooks";
import {
  NILAI_AWAL_PELANGGAN,
  nilaiAwalPelanggan,
  payloadBuatPelanggan,
  payloadPerbaruiPelanggan,
} from "./payload";
import { skemaPelanggan, type NilaiFormPelanggan } from "./schema";

const KELAS_INPUT =
  "bg-gading text-navy border-navy/15 focus-visible:ring-navy/50";

/** Tampilan isian yang berbeda antara panel tambah dan dialog ubah. */
const RAGAM = {
  tambah: { bungkus: "space-y-1.5", label: "text-xs font-medium text-navy" },
  ubah: { bungkus: "space-y-2", label: "text-sm font-medium text-navy" },
} as const;

type Ragam = keyof typeof RAGAM;

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-red-600">{pesan}</p>;
}

function Opsional() {
  return <span className="text-navy/50 font-normal">(opsional)</span>;
}

interface IsianProps {
  register: UseFormRegister<NilaiFormPelanggan>;
  control: Control<NilaiFormPelanggan>;
  errors: FieldErrors<NilaiFormPelanggan>;
  /** Awalan id isian, agar setiap label terhubung ke isiannya dan id unik per form. */
  idAwalan: string;
  ragam: Ragam;
}

/** Isian form pelanggan, dipakai panel tambah dan dialog ubah. */
function IsianPelanggan({ register, control, errors, idAwalan, ragam }: IsianProps) {
  const kelas = RAGAM[ragam];
  const id = (nama: string) => `${idAwalan}-${nama}`;
  return (
    <>
      <div className={kelas.bungkus}>
        <label htmlFor={id("nama")} className={kelas.label}>
          Nama Pelanggan <span className="text-red-500">*</span>
        </label>
        <Input
          id={id("nama")}
          {...register("namaPelanggan")}
          placeholder="Misal: Budi Santoso"
          className={KELAS_INPUT}
        />
        <PesanIsian pesan={errors.namaPelanggan?.message} />
      </div>

      <div className={kelas.bungkus}>
        <label htmlFor={id("tipe")} className={kelas.label}>
          Tipe Pelanggan
        </label>
        <Controller
          control={control}
          name="tipePelanggan"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={id("tipe")}
                className="w-full cursor-pointer bg-gading text-navy border-navy/15 focus:ring-navy/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-krem border-navy/10 text-navy">
                <SelectItem value="umum" className="cursor-pointer hover:bg-navy/5">Umum</SelectItem>
                <SelectItem value="member" className="cursor-pointer hover:bg-navy/5">Member</SelectItem>
                <SelectItem value="korporat" className="cursor-pointer hover:bg-navy/5">Korporat</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className={kelas.bungkus}>
        <label htmlFor={id("nomorHp")} className={kelas.label}>
          Nomor WhatsApp / HP {ragam === "ubah" && <Opsional />}
        </label>
        <Input
          id={id("nomorHp")}
          {...register("nomorHp")}
          placeholder="Misal: 08123456789"
          className={KELAS_INPUT}
          type="tel"
        />
        <PesanIsian pesan={errors.nomorHp?.message} />
      </div>

      <div className={kelas.bungkus}>
        <label htmlFor={id("email")} className={kelas.label}>
          {ragam === "ubah" ? (
            <>
              Email <Opsional />
            </>
          ) : (
            "Email (Opsional)"
          )}
        </label>
        <Input
          id={id("email")}
          {...register("email")}
          placeholder="Misal: budi@email.com"
          className={KELAS_INPUT}
          type="email"
        />
        <PesanIsian pesan={errors.email?.message} />
      </div>

      <div className={kelas.bungkus}>
        <label htmlFor={id("alamat")} className={kelas.label}>
          {ragam === "ubah" ? (
            <>
              Alamat <Opsional />
            </>
          ) : (
            "Alamat (Opsional)"
          )}
        </label>
        <Input
          id={id("alamat")}
          {...register("alamat")}
          placeholder="Misal: Jl. Sudirman No. 123"
          className={KELAS_INPUT}
        />
        <PesanIsian pesan={errors.alamat?.message} />
      </div>
    </>
  );
}

/**
 * Panel tambah pelanggan: form, lalu dialog konfirmasi. Dialog hanya
 * tertutup saat simpan berhasil (keputusan Fase 0); saat gagal dialog
 * bertahan dan pesan backend tampil.
 */
export function FormTambahPelanggan() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NilaiFormPelanggan>({
    resolver: zodResolver(skemaPelanggan),
    defaultValues: NILAI_AWAL_PELANGGAN,
  });
  const [menunggu, setMenunggu] = useState<NilaiFormPelanggan | null>(null);

  const buat = useBuatPelanggan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pelanggan baru berhasil ditambahkan." });
      reset(NILAI_AWAL_PELANGGAN);
      setMenunggu(null);
    },
    onError: (err) => {
      toast.error("Gagal", { description: pesanError(err, "Gagal menambahkan pelanggan.") });
    },
  });

  return (
    <>
      <form onSubmit={handleSubmit((nilai) => setMenunggu(nilai))} noValidate className="space-y-4">
        <IsianPelanggan
          register={register}
          control={control}
          errors={errors}
          idAwalan="tambah-pelanggan"
          ragam="tambah"
        />
        <Button
          type="submit"
          className="w-full cursor-pointer mt-2 bg-navy text-gading hover:bg-navy/90"
          disabled={buat.isPending}
        >
          Simpan Pelanggan
        </Button>
      </form>

      <AlertDialog
        open={menunggu !== null}
        onOpenChange={(buka) => {
          if (!buka && !buat.isPending) setMenunggu(null);
        }}
      >
        <AlertDialogContent className="border-navy/10 bg-krem">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Simpan Pelanggan Baru?</AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70">
              Apakah Anda yakin ingin menambahkan <strong>{menunggu?.namaPelanggan}</strong> ke dalam daftar pelanggan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={buat.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 bg-transparent"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (menunggu) buat.mutate(payloadBuatPelanggan(menunggu));
              }}
              disabled={buat.isPending}
              className="cursor-pointer bg-navy text-gading hover:bg-navy/90"
            >
              {buat.isPending ? "Menyimpan..." : "Ya, Simpan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Isi dialog ubah. Dipasang setelah pelanggan dipilih, dengan nilai awal
 * lewat defaultValues (keputusan rancangan butir 8). Hanya field yang
 * berubah yang dikirim (butir 15). Isian yang dikosongkan dikirim sebagai
 * teks kosong, lalu hasil simpan dibandingkan: bila nilainya masih ada,
 * pengguna diperingatkan (keputusan PD5a, kontrak/temuan.md butir 104).
 */
function IsiFormUbah({ pelanggan, onTutup }: { pelanggan: Pelanggan; onTutup: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiFormPelanggan>({
    resolver: zodResolver(skemaPelanggan),
    defaultValues: nilaiAwalPelanggan(pelanggan),
  });
  const [galat, setGalat] = useState("");

  const perbarui = usePerbaruiPelanggan({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Data pelanggan berhasil diperbarui." });
      onTutup();
    },
    onError: (err) => {
      setGalat(pesanError(err, "Gagal memperbarui data pelanggan."));
    },
  });

  const kirim = (nilai: NilaiFormPelanggan) => {
    setGalat("");
    const payload = payloadPerbaruiPelanggan(nilai, pelanggan);
    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }
    perbarui.mutate({ id: pelanggan.id, payload });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate className="mt-4 flex flex-col gap-4">
      <IsianPelanggan
        register={register}
        control={control}
        errors={errors}
        idAwalan="ubah-pelanggan"
        ragam="ubah"
      />

      {galat && (
        <p className="text-sm text-red-600 font-medium bg-red-500/10 px-3 py-2 rounded-md border border-red-500/20">
          {galat}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onTutup}
          disabled={perbarui.isPending}
          className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 bg-transparent"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={perbarui.isPending}
          className="cursor-pointer bg-navy text-gading hover:bg-navy/90"
        >
          {perbarui.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

export function DialogUbahPelanggan({
  pelanggan,
  onTutup,
}: {
  pelanggan: Pelanggan | null;
  onTutup: () => void;
}) {
  return (
    <Dialog
      open={pelanggan !== null}
      onOpenChange={(buka) => {
        if (!buka) onTutup();
      }}
    >
      <DialogContent className="sm:max-w-md border-navy/10 bg-krem">
        <DialogHeader>
          <DialogTitle className="text-navy">Edit Pelanggan</DialogTitle>
          <DialogDescription className="text-navy/70">
            Perbarui informasi data pelanggan di bawah ini.
          </DialogDescription>
        </DialogHeader>
        {pelanggan && <IsiFormUbah key={pelanggan.id} pelanggan={pelanggan} onTutup={onTutup} />}
      </DialogContent>
    </Dialog>
  );
}