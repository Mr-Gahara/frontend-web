"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { isRateLimited, pesanError } from "@/lib/api/error";
import { useHitungMundur } from "./hitung-mundur";
import { useLupaPassword, useResetPassword } from "./hooks";
import { IsianKode, KirimUlangKode } from "./isian-kode";
import {
  kodeKosong,
  skemaLupaPassword,
  skemaPasswordBaru,
  type NilaiLupaPassword,
  type NilaiPasswordBaru,
} from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

const KELAS_ISIAN =
  "flex h-12 w-full rounded-lg border border-input bg-permukaan px-3.5 text-[15px] text-navy placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const KELAS_TOMBOL =
  "disabled:cursor-not-allowed disabled:opacity-60 inline-flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-navy text-base font-bold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading";

const KELAS_TAUTAN =
  "cursor-pointer rounded-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel";

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-destructive">{pesan}</p>;
}

function PesanGalat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{pesan}</span>
    </div>
  );
}

const pesanGagal = (err: unknown, fallback: string) =>
  isRateLimited(err) ? pesanError(err, "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.") : pesanError(err, fallback);

/**
 * Langkah 1: POST /akun/auth/lupa-password selalu dijawab 200 dengan pesan
 * yang sama, terdaftar atau tidak (B217), jadi isian kode selalu menyusul.
 */
function FormEmail({ awal, onKirim }: { awal: string; onKirim: (email: string) => void }) {
  const minta = useLupaPassword();
  const [galat, setGalat] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiLupaPassword>({ resolver: zodResolver(skemaLupaPassword), defaultValues: { email: awal } });

  return (
    <form
      onSubmit={handleSubmit((n) => {
        setGalat("");
        minta.mutate(n.email, {
          onSuccess: () => onKirim(n.email),
          onError: (err) => setGalat(pesanGagal(err, "Kode gagal dikirim. Coba lagi.")),
        });
      })}
      noValidate
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] font-bold">Lupa password</h2>
        <p className="text-[15px] leading-normal text-muted-foreground">
          Masukkan email akun toko. Kami kirim kode 6 digit untuk membuat password baru.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="lupa-email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="lupa-email"
          type="email"
          autoComplete="email"
          placeholder="nama@tokoanda.com"
          {...register("email")}
          aria-invalid={errors.email ? true : undefined}
          className={KELAS_ISIAN}
        />
        <PesanIsian pesan={errors.email?.message} />
      </div>
      <PesanGalat pesan={galat} />
      <button type="submit" disabled={minta.isPending} className={KELAS_TOMBOL}>
        {minta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Kirim kode
      </button>
      <p className="text-center text-[15px]">
        <Link href="/login" className={KELAS_TAUTAN}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </form>
  );
}

function FormPasswordBaru({
  email,
  onSelesai,
  onGantiEmail,
}: {
  email: string;
  onSelesai: () => void;
  onGantiEmail: () => void;
}) {
  const { sisa, ulang } = useHitungMundur(60);
  const [status, setStatus] = useState("");
  const [galat, setGalat] = useState("");
  const atur = useResetPassword();
  const minta = useLupaPassword();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiPasswordBaru>({
    resolver: zodResolver(skemaPasswordBaru),
    defaultValues: { kode: kodeKosong(), password: "", ulangiPassword: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((n) => {
        setGalat("");
        atur.mutate(
          { email, otp: n.kode.join(""), passwordBaru: n.password },
          {
            onSuccess: onSelesai,
            onError: (err) => setGalat(pesanGagal(err, "Kode OTP salah atau sudah kedaluwarsa.")),
          },
        );
      })}
      noValidate
      className="flex flex-col gap-[22px]"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] font-bold">Buat password baru</h2>
        <p className="text-[15px] leading-normal text-muted-foreground">
          Kode dikirim ke <strong className="text-navy">{email}</strong>.{" "}
          <button type="button" onClick={onGantiEmail} className={KELAS_TAUTAN}>
            Ganti email
          </button>
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
        <PesanIsian pesan={errors.kode?.message ?? errors.kode?.root?.message} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="lupa-password-baru" className="text-sm font-semibold">
          Password baru
        </label>
        <input
          id="lupa-password-baru"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          aria-describedby="lupa-password-aturan"
          aria-invalid={errors.password ? true : undefined}
          className={KELAS_ISIAN}
        />
        <p id="lupa-password-aturan" className="text-[13px] text-muted-foreground">
          Minimal 8 karakter, dengan huruf kapital dan angka.
        </p>
        <PesanIsian pesan={errors.password?.message} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="lupa-password-ulang" className="text-sm font-semibold">
          Ulangi password baru
        </label>
        <input
          id="lupa-password-ulang"
          type="password"
          autoComplete="new-password"
          {...register("ulangiPassword")}
          aria-invalid={errors.ulangiPassword ? true : undefined}
          className={KELAS_ISIAN}
        />
        <PesanIsian pesan={errors.ulangiPassword?.message} />
      </div>
      <PesanGalat pesan={galat} />
      <button type="submit" disabled={atur.isPending} className={KELAS_TOMBOL}>
        {atur.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Simpan password baru
      </button>
      <div className="flex flex-col gap-1">
        <KirimUlangKode
          sisa={sisa}
          onKirim={() => {
            setStatus("");
            minta.mutate(email, {
              onSuccess: () => {
                ulang();
                setStatus("Kode baru dikirim. Periksa email Anda.");
              },
              onError: (err) => setStatus(pesanGagal(err, "Kode baru gagal dikirim. Coba lagi.")),
            });
          }}
        />
        {status && (
          <p role="status" className="text-sm">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}

/**
 * Lupa password akun toko (desain F, gaya A; B217), ditautkan dari login
 * akun. OTP salah, kedaluwarsa, dan email tak terdaftar dijawab 400 yang
 * sama. Password baru memutus seluruh sesi akun, sehingga tahap selesai
 * selalu mengarah ke login.
 */
export function HalamanLupaPassword() {
  const [tahap, setTahap] = useState<"email" | "kode" | "selesai">("email");
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen flex-wrap bg-gading text-navy">
      <section className="flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-12 bg-navy px-6 py-10 text-gading sm:px-12 sm:py-14">
        <div className="flex items-center gap-3">
          <TandaTachyon />
          <span className="text-lg font-bold">Tachyon POS</span>
        </div>
        <div className="flex max-w-[460px] flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-karamel">Akun toko</p>
          <h1 className="text-4xl font-extrabold leading-[1.08] text-balance sm:text-[46px]">
            Atur ulang password akun toko.
          </h1>
          <p className="text-[17px] leading-relaxed text-gading/80">
            Kode dikirim ke email akun. PIN karyawan tidak berubah.
          </p>
        </div>
        <p className="text-sm text-gading/80">
          Lupa PIN, bukan password? Gunakan &quot;Lupa PIN?&quot; di layar masuk kasir.
        </p>
      </section>

      <main className="flex min-w-0 flex-[1_1_420px] items-center justify-center px-6 py-14">
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          {tahap === "email" && (
            <FormEmail
              awal={email}
              onKirim={(e) => {
                setEmail(e);
                setTahap("kode");
              }}
            />
          )}
          {tahap === "kode" && (
            <FormPasswordBaru
              email={email}
              onSelesai={() => setTahap("selesai")}
              onGantiEmail={() => setTahap("email")}
            />
          )}
          {tahap === "selesai" && (
            <section aria-labelledby="lupa-selesai" className="flex flex-col gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/15">
                <Check className="h-7 w-7 text-sage" aria-hidden="true" />
              </span>
              <h2 id="lupa-selesai" className="text-[28px] font-bold">
                Password diganti
              </h2>
              <p role="status" className="text-[15px] leading-normal text-muted-foreground">
                Masuk lagi dengan password baru.
              </p>
              <Link href="/login" className={KELAS_TOMBOL}>
                Masuk
              </Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}