"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHitungMundur } from "./hitung-mundur";
import { IsianKode, KirimUlangKode } from "./isian-kode";
import { LangkahDaftar } from "./langkah-daftar";
import { kodeKosong, skemaKode, type NilaiKode } from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

/**
 * Verifikasi email sesudah daftar (desain F, langkah 2). Pratinjau tampilan:
 * pengiriman dan pemeriksaan kode menyusul setelah OTP daftar tersedia (N3).
 * Kode lengkap meneruskan ke /setup, langkah berikutnya dalam alur pratinjau.
 */
export function HalamanVerifikasiEmail() {
  const router = useRouter();
  const email = useSearchParams().get("email");
  const { sisa, ulang } = useHitungMundur(60);
  const [status, setStatus] = useState("");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiKode>({ resolver: zodResolver(skemaKode), defaultValues: { kode: kodeKosong() } });

  return (
    <div className="flex min-h-screen flex-wrap gap-5 bg-permukaan p-4 text-navy sm:p-5">
      <aside className="flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-8 rounded-[28px] bg-krem p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <TandaTachyon ukuran={34} />
          <span className="text-lg font-bold">Tachyon POS</span>
        </div>
        <div className="flex max-w-[440px] flex-col gap-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/70">Akun dibuat</p>
          <h2 className="text-3xl font-bold leading-tight sm:text-[34px]">Satu langkah lagi sebelum menyiapkan toko.</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Verifikasi memastikan kode lupa password dan pemberitahuan langganan sampai ke email yang benar.
          </p>
        </div>
        <LangkahDaftar aktif={2} />
      </aside>

      <main className="flex min-w-0 flex-[1_1_420px] items-center justify-center px-2 py-10">
        <form
          onSubmit={handleSubmit(() => router.push("/setup"))}
          noValidate
          className="flex w-full max-w-[400px] flex-col gap-6"
        >
          <p role="note" className="rounded-lg bg-krem px-4 py-3 text-sm">
            Pratinjau tampilan: kode belum benar-benar dikirim. Verifikasi email menyusul setelah backend siap.
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Cek email Anda</h1>
            <p className="text-[15px] leading-normal text-muted-foreground">
              Kode 6 digit dikirim ke <strong className="text-navy">{email || "email yang Anda daftarkan"}</strong>.
              Periksa juga folder spam.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Controller
              name="kode"
              control={control}
              render={({ field }) => (
                <IsianKode nilai={field.value} onUbah={field.onChange} invalid={Boolean(errors.kode)} />
              )}
            />
            {(errors.kode?.message ?? errors.kode?.root?.message) && (
              <p className="text-xs font-medium text-destructive">
                {errors.kode?.message ?? errors.kode?.root?.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex h-[54px] w-full cursor-pointer items-center justify-center rounded-xl bg-navy text-base font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
          >
            Verifikasi email
          </button>
          <div className="flex flex-col gap-1">
            <KirimUlangKode
              sisa={sisa}
              onKirim={() => {
                ulang();
                setStatus("Pratinjau: pengiriman ulang belum tersambung ke server.");
              }}
            />
            {status && (
              <p role="status" className="text-sm">
                {status}
              </p>
            )}
            <p className="text-[15px]">
              <Link
                href="/login"
                className="rounded-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
              >
                Kembali ke halaman masuk
              </Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}