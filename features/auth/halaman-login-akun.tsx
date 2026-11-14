"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { isApiError, isRateLimited, pesanError } from "@/lib/api/error";
import { setTokenAkun, setTokenPengguna } from "@/lib/auth/session";
import { authApi } from "./api";
import { useLoginAkun } from "./hooks";
import { titipKredensial } from "./kredensial-daftar";
import { skemaLoginAkun, type NilaiLoginAkun } from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

const KELAS_ISIAN =
  "flex h-12 w-full rounded-lg border border-input bg-permukaan px-3.5 text-isi text-navy placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-kecil font-medium text-destructive">{pesan}</p>;
}

export function HalamanLoginAkun() {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const [sandiTampil, setSandiTampil] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiLoginAkun>({
    resolver: zodResolver(skemaLoginAkun),
    defaultValues: { email: "", password: "" },
  });
  const masuk = useLoginAkun();
  const memuat = masuk.isPending;

  const kirim = (nilai: NilaiLoginAkun) => {
    setGalat("");
    setTokenPengguna(null);
    masuk.mutate(nilai, {
      onSuccess: (res) => {
        // Akun admin platform tidak punya toko maupun pengguna: ruang
        // kerjanya panel admin, tanpa login pengguna (keputusan PA1a).
        if (res.data.role === "admin") {
          setTokenAkun(res.accessToken);
          router.push("/admin");
          return;
        }
        // requireSetup berarti setup inti belum selesai, termasuk toko yang
        // sudah ada (B223); setup dikerjakan di web (SA1a), lewat wizard
        // yang memakai token akun ini.
        setTokenAkun(res.accessToken);
        router.push(res.requireSetup ? "/setup" : "/login/pengguna");
      },
      onError: (err) => {
        // Pendaftar mandiri yang belum memasukkan OTP (B232): kode baru
        // dikirim, lalu isian kode ditampilkan. Password dititipkan agar
        // setelah verifikasi langsung masuk tanpa mengetik ulang.
        if (isApiError(err) && err.code === "EMAIL_BELUM_TERVERIFIKASI") {
          titipKredensial(nilai);
          authApi
            .kirimVerifikasiEmail(nilai.email)
            .catch(() => undefined)
            .finally(() => router.push(`/daftar/verifikasi?email=${encodeURIComponent(nilai.email)}`));
          return;
        }
        // 429: percobaan login dibatasi backend. Pesan dibedakan agar
        // pengguna tahu ini sementara, bukan kesalahan kredensial.
        setGalat(
          isRateLimited(err)
            ? pesanError(err, "Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.")
            : pesanError(err, "Autentikasi gagal. Mohon periksa kembali email dan sandi Anda."),
        );
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-wrap bg-gading text-navy">
      <section className="flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-12 bg-navy px-6 py-10 text-gading sm:px-12 sm:py-14">
        <div className="flex items-center gap-3">
          <TandaTachyon />
          <span className="text-subjudul font-bold">Tachyon POS</span>
        </div>
        <div className="flex max-w-[460px] flex-col gap-4">
          <p className="text-kecil font-semibold uppercase tracking-[0.14em] text-karamel">
            Akun toko
          </p>
          {/* eslint-disable-next-line no-restricted-syntax -- teks hero di luar skala tipografi (CV25a) */}
          <h1 className="text-4xl font-extrabold leading-[1.05] text-balance sm:text-[52px]">
            Buka toko, mulai shift.
          </h1>
          <p className="text-subjudul leading-relaxed text-gading/80">
            Masuk dengan email toko Anda. Sesudah itu, setiap karyawan masuk dengan nama dan PIN
            masing-masing.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-7 gap-y-3 text-isi text-gading/80">
          <li>Kasir dan pembayaran</li>
          <li>Stok dan bahan baku</li>
          <li>Jadwal shift</li>
        </ul>
      </section>

      <main className="flex min-w-0 flex-[1_1_420px] items-center justify-center px-6 py-14">
        <form
          onSubmit={handleSubmit(kirim)}
          method="POST"
          action="#"
          noValidate
          className="flex w-full max-w-[400px] flex-col gap-6"
          suppressHydrationWarning
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-subjudul font-bold">Masuk ke akun toko</h2>
            <p className="text-isi leading-normal text-muted-foreground">
              Gunakan email yang didaftarkan untuk toko ini.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-isi font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              suppressHydrationWarning
              {...register("email")}
              placeholder="nama@tokoanda.com"
              className={KELAS_ISIAN}
              aria-invalid={errors.email ? true : undefined}
              disabled={memuat}
            />
            <PesanIsian pesan={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-isi font-semibold">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={sandiTampil ? "text" : "password"}
                suppressHydrationWarning
                {...register("password")}
                className={`${KELAS_ISIAN} pr-32`}
                aria-invalid={errors.password ? true : undefined}
                disabled={memuat}
              />
              <button
                type="button"
                onClick={() => setSandiTampil((v) => !v)}
                aria-pressed={sandiTampil}
                aria-controls="password"
                disabled={memuat}
                className="absolute right-1.5 top-1.5 h-9 cursor-pointer rounded-md bg-krem px-3 text-isi font-semibold text-navy transition-colors hover:bg-krem/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel disabled:opacity-50"
              >
                {sandiTampil ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <PesanIsian pesan={errors.password?.message} />
            {/* Sesudah isian, agar Tab dari email langsung ke password. */}
            <Link
              href="/lupa-password"
              className="self-end rounded-sm text-isi font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
              Lupa password?
            </Link>
          </div>

          {galat && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{galat}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={memuat}
            className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy text-besar font-bold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:pointer-events-none disabled:opacity-60"
          >
            {memuat ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memeriksa akun...
              </>
            ) : (
              "Masuk"
            )}
          </button>
          {/* Ditautkan setelah wizard setup tersambung (TP4a). */}
          <p className="text-center text-isi text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/daftar"
              className="rounded-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
              Daftar
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
