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
import { pesanError } from "@/lib/api/error";
import { namaPlan } from "@/features/langganan/data";
import { useBuatAkunKlien } from "./hooks";
import { NILAI_AWAL_AKUN_KLIEN, payloadBuatAkunKlien } from "./payload";
import { PilihanTombol } from "./pilihan-tombol";
import {
  LABEL_DURASI,
  PILIHAN_DURASI,
  PLAN_AKUN,
  skemaBuatAkunKlien,
  type NilaiBuatAkunKlien,
} from "./schema";
import { KELAS_TINGGI_TOMBOL, KELAS_TOMBOL_UTAMA, URL_DAFTAR_AKUN } from "./tampilan";

const KELAS_LABEL = "text-isi font-medium";
const KELAS_GALAT = "text-kecil font-medium text-destructive";
const KELAS_KETERANGAN = "text-kecil text-muted-foreground";
const KELAS_KARTU = "flex flex-col gap-5 rounded-2xl border border-navy/10 bg-permukaan p-4 sm:p-6";

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:px-4 sm:py-8">
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

      <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-6">
        <section aria-labelledby="judul-data-masuk" className={KELAS_KARTU}>
          <h2 id="judul-data-masuk" className="text-besar font-bold">
            Data masuk
          </h2>
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
        </section>

        <section aria-labelledby="judul-langganan" className={KELAS_KARTU}>
          <h2 id="judul-langganan" className="text-besar font-bold">
            Langganan
          </h2>
          <PilihanTombol
            label="Plan"
            bentuk="grid"
            nilai={plan}
            onUbah={gantiPlan}
            disabled={memuat}
            opsi={PLAN_AKUN.map((p) => ({ nilai: p, label: namaPlan(p) }))}
          />
          <div className="space-y-2">
            <Controller
              control={control}
              name="durasi"
              render={({ field }) => (
                <PilihanTombol
                  label="Durasi"
                  bentuk="chip"
                  nilai={field.value}
                  onUbah={field.onChange}
                  disabled={memuat}
                  invalid={Boolean(errors.durasi)}
                  opsi={pilihanDurasi.map((p) => ({ nilai: p, label: LABEL_DURASI[p] }))}
                  keterangan={
                    plan === "basic"
                      ? "Masa percobaan mengikuti pengaturan backend; pilih durasi untuk langsung berlangganan."
                      : "Masa percobaan hanya untuk plan Basic; Advanced dan Pro wajib memilih durasi."
                  }
                />
              )}
            />
            {errors.durasi && <p className={KELAS_GALAT}>{errors.durasi.message}</p>}
          </div>
        </section>

        {galat && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive">
            {galat}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {/* Tautan terkunci selama menyimpan: `disabled` tidak berlaku pada <a>. */}
          <Button
            asChild
            variant="outline"
            className={`w-full sm:w-auto ${KELAS_TINGGI_TOMBOL} sm:px-6 aria-disabled:pointer-events-none aria-disabled:opacity-50`}
          >
            <Link href={URL_DAFTAR_AKUN} aria-disabled={memuat} tabIndex={memuat ? -1 : undefined}>
              Batal
            </Link>
          </Button>
          <Button
          type="submit"
          className={`w-full sm:w-auto sm:px-6 ${KELAS_TINGGI_TOMBOL} ${KELAS_TOMBOL_UTAMA}`}
          disabled={memuat}
        >
            {memuat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Akun
          </Button>
        </div>
      </form>
    </div>
  );
}
