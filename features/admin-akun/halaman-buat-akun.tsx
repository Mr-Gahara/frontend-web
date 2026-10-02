"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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
import { pesanError } from "@/lib/api/error";
import { useBuatAkunKlien } from "./hooks";
import { NILAI_AWAL_AKUN_KLIEN, payloadBuatAkunKlien } from "./payload";
import {
  LABEL_DURASI,
  PILIHAN_DURASI,
  skemaBuatAkunKlien,
  type NilaiBuatAkunKlien,
} from "./schema";
import { URL_DAFTAR_AKUN } from "./tampilan";

const KELAS_LABEL = "text-sm font-medium";
const KELAS_GALAT = "text-xs font-medium text-destructive";
const KELAS_KETERANGAN = "text-xs text-muted-foreground";

/**
 * Halaman buat akun klien (keputusan PA8b). Form berskema dengan
 * noValidate; mutation memakai mutate dengan callback, sehingga penolakan
 * backend (email terdaftar, domain disposable) tampil di form.
 */
export function HalamanBuatAkun() {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiBuatAkunKlien>({
    resolver: zodResolver(skemaBuatAkunKlien),
    defaultValues: NILAI_AWAL_AKUN_KLIEN,
  });
  const buat = useBuatAkunKlien({
    onSuccess: (akun) => {
      toast.success("Akun klien dibuat", { description: akun.email });
      router.push(URL_DAFTAR_AKUN);
    },
    onError: (err) => setGalat(pesanError(err, "Gagal membuat akun klien.")),
  });
  const memuat = buat.isPending;

  const kirim = (nilai: NilaiBuatAkunKlien) => {
    setGalat("");
    buat.mutate(payloadBuatAkunKlien(nilai));
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href={URL_DAFTAR_AKUN}
          className="inline-flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Buat Akun Klien</h1>
          <p className="text-sm text-muted-foreground">
            Akun baru belum punya toko; klien men-setup tokonya sendiri lewat aplikasi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(kirim)} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className={KELAS_LABEL}>
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            placeholder="nama@perusahaan.com"
            aria-invalid={errors.email ? true : undefined}
            disabled={memuat}
            {...register("email")}
          />
          {errors.email && <p className={KELAS_GALAT}>{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className={KELAS_LABEL}>
            Username
          </label>
          <Input
            id="username"
            autoComplete="off"
            placeholder="Opsional"
            aria-invalid={errors.username ? true : undefined}
            disabled={memuat}
            {...register("username")}
          />
          {errors.username && <p className={KELAS_GALAT}>{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className={KELAS_LABEL}>
            Password awal
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            disabled={memuat}
            {...register("password")}
          />
          <p className={KELAS_KETERANGAN}>
            Minimal 8 karakter, dengan huruf kapital dan angka. Sampaikan password ini kepada klien.
          </p>
          {errors.password && <p className={KELAS_GALAT}>{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="durasi" className={KELAS_LABEL}>
            Langganan
          </label>
          <Controller
            control={control}
            name="durasi"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={memuat}>
                <SelectTrigger id="durasi" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILIHAN_DURASI.map((pilihan) => (
                    <SelectItem key={pilihan} value={pilihan}>
                      {LABEL_DURASI[pilihan]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className={KELAS_KETERANGAN}>
            Masa percobaan mengikuti pengaturan backend; pilih durasi untuk langsung berlangganan.
          </p>
        </div>

        {galat && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {galat}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Link href={URL_DAFTAR_AKUN}>
            <Button type="button" variant="outline" disabled={memuat}>
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={memuat}>
            {memuat ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Akun
          </Button>
        </div>
      </form>
    </div>
  );
}