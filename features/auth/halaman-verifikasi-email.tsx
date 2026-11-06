"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { isRateLimited, pesanError } from "@/lib/api/error";
import { titipPesanLogin } from "@/lib/auth/pesan-login";
import { setTokenAkun } from "@/lib/auth/session";
import { useHitungMundur } from "./hitung-mundur";
import { useKirimVerifikasiEmail, useLoginAkun, useVerifikasiEmail } from "./hooks";
import { ambilKredensial, lihatKredensial } from "./kredensial-daftar";
import { IsianKode, KirimUlangKode } from "./isian-kode";
import { LangkahDaftar } from "./langkah-daftar";
import { kodeKosong, skemaKode, type NilaiKode } from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

const PESAN_MASUK_LAGI = {
  judul: "Email terverifikasi",
  deskripsi: "Masuk dengan email dan password akun Anda untuk menyiapkan toko.",
};

const PESAN_KODE_BARU = {
  judul: "Masuk lagi",
  deskripsi: "Masuk dengan email dan password akun Anda untuk menerima kode verifikasi baru.",
};

/**
 * Verifikasi email sesudah daftar (desain F, langkah 2; B231 dan B232).
 * Kode diperiksa lewat POST /akun/auth/verifikasi-email bersama password
 * titipan daftar atau login, karena sejak B248 password itu wajib dan
 * menjadi password akun (A-01). Backend tidak menerbitkan token di sana,
 * jadi halaman langsung login dengan kredensial yang sama, lalu ke wizard
 * bila setup inti belum selesai (requireSetup, B223). Titipan dibiarkan
 * saat kode salah dan baru dikosongkan setelah verifikasi berhasil. Tanpa
 * titipan, misalnya setelah dimuat ulang, kode tidak dikirim dan pendaftar
 * diarahkan ke login, yang mengirim kode baru dan menitipkan password lagi
 * (pemilik proyek, 6 November 2026; isian password di halaman ini menunggu
 * desain). Kirim ulang selalu dijawab 200 yang sama.
 */
export function HalamanVerifikasiEmail() {
  const router = useRouter();
  const email = (useSearchParams().get("email") ?? "").trim();
  const { sisa, ulang } = useHitungMundur(60);
  const [status, setStatus] = useState("");
  const [galat, setGalat] = useState("");
  const verifikasi = useVerifikasiEmail();
  const kirimUlang = useKirimVerifikasiEmail();
  const masuk = useLoginAkun();
  const memuat = verifikasi.isPending || masuk.isPending;

  const keLogin = (pesan = PESAN_MASUK_LAGI) => {
    titipPesanLogin(pesan);
    router.push("/login");
  };

  const lanjutMasuk = () => {
    const kredensial = ambilKredensial(email);
    if (!kredensial) return keLogin();
    masuk.mutate(kredensial, {
      onSuccess: (res) => {
        setTokenAkun(res.accessToken);
        router.push(res.requireSetup ? "/setup" : "/login/pengguna");
      },
      onError: () => keLogin(),
    });
  };

  const kirim = ({ kode }: NilaiKode) => {
    setGalat("");
    if (!email) {
      setGalat("Email pendaftaran tidak diketahui. Daftar ulang atau masuk dari halaman login.");
      return;
    }
    const kredensial = lihatKredensial(email);
    if (!kredensial) return keLogin(PESAN_KODE_BARU);
    verifikasi.mutate(
      { email, otp: kode.join(""), password: kredensial.password },
      {
        onSuccess: lanjutMasuk,
        onError: (err) =>
          setGalat(
            isRateLimited(err)
              ? pesanError(err, "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.")
              : pesanError(err, "Kode OTP salah atau sudah kedaluwarsa."),
          ),
      },
    );
  };

  const kirimKodeBaru = () => {
    setStatus("");
    if (!email) return;
    kirimUlang.mutate(email, {
      onSuccess: () => {
        ulang();
        setStatus("Kode baru dikirim. Periksa email Anda.");
      },
      onError: (err) => setStatus(pesanError(err, "Kode baru gagal dikirim. Coba lagi.")),
    });
  };
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
          onSubmit={handleSubmit(kirim)}
          noValidate
          className="flex w-full max-w-[400px] flex-col gap-6"
        >
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
          {galat && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {galat}
            </p>
          )}
          <button
            type="submit"
            disabled={memuat}
            className="disabled:cursor-not-allowed disabled:opacity-60 inline-flex h-[54px] w-full cursor-pointer items-center justify-center rounded-xl bg-navy text-base font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
          >
            {memuat && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />}
            Verifikasi email
          </button>
          <div className="flex flex-col gap-1">
            <KirimUlangKode
              sisa={sisa}
              onKirim={kirimKodeBaru}
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