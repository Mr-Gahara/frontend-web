"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { namaPlan } from "@/features/langganan/data";
import { useBuatAkunKlien } from "./hooks";
import { NILAI_AWAL_AKUN_KLIEN, payloadBuatAkunKlien } from "./payload";
import {
  LABEL_DURASI,
  PILIHAN_DURASI,
  PLAN_AKUN,
  skemaBuatAkunKlien,
  type NilaiBuatAkunKlien,
} from "./schema";
import { URL_DAFTAR_AKUN } from "./tampilan";

const KELAS_LABEL = "text-isi font-medium";
const KELAS_GALAT = "text-kecil font-medium text-destructive";
const KELAS_KETERANGAN = "text-kecil text-muted-foreground";

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
    setValue,
    getValues,
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
  const plan = useWatch({ control, name: "plan" });
  // Masa percobaan hanya untuk Basic (B213): pilihan itu tidak ditawarkan
  // untuk Advanced dan Pro, dan durasi dikosongkan agar admin memilihnya.
  const pilihanDurasi = PILIHAN_DURASI.filter((p) => plan === "basic" || p !== "percobaan");
  const gantiPlan = (baru: NilaiBuatAkunKlien["plan"]) => {
    setValue("plan", baru);
    if (baru !== "basic" && getValues("durasi") === "percobaan") setValue("durasi", "");
  };

  const kirim = (nilai: NilaiBuatAkunKlien) => {
    setGalat("");
    buat.mutate(payloadBuatAkunKlien(nilai));
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href={URL_DAFTAR_AKUN}
          className="inline-flex w-fit items-center text-isi font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Akun
        </Link>
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight">Buat Akun Klien</h1>
          <p className="text-isi text-muted-foreground">
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
          <label htmlFor="plan" className={KELAS_LABEL}>
            Plan
          </label>
          <Select value={plan} onValueChange={(v) => gantiPlan(v as NilaiBuatAkunKlien["plan"])} disabled={memuat}>
            <SelectTrigger id="plan" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_AKUN.map((p) => (
                <SelectItem key={p} value={p}>
                  {namaPlan(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <SelectTrigger
                  id="durasi"
                  className="w-full"
                  aria-invalid={errors.durasi ? true : undefined}
                >
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  {pilihanDurasi.map((pilihan) => (
                    <SelectItem key={pilihan} value={pilihan}>
                      {LABEL_DURASI[pilihan]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className={KELAS_KETERANGAN}>
            {plan === "basic"
              ? "Masa percobaan mengikuti pengaturan backend; pilih durasi untuk langsung berlangganan."
              : "Masa percobaan hanya untuk plan Basic; Advanced dan Pro wajib memilih durasi."}
          </p>
          {errors.durasi && <p className={KELAS_GALAT}>{errors.durasi.message}</p>}
        </div>

        {galat && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive">
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