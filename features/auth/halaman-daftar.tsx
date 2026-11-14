"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2, Minus } from "lucide-react";
import { isRateLimited, pesanError } from "@/lib/api/error";
import { useDaftarAkun } from "./hooks";
import { titipKredensial } from "./kredensial-daftar";
import { LangkahDaftar } from "./langkah-daftar";
import { skemaDaftarAkun, type NilaiDaftarAkun } from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

const KELAS_ISIAN =
  "flex h-12 w-full rounded-xl border border-input bg-permukaan px-4 text-besar text-navy placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-permukaan disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const KELAS_TAUTAN =
  "cursor-pointer rounded-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-permukaan";

const KELAS_PANAH =
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-permukaan text-navy hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-krem";

const FITUR_DASAR = [
  "Kasir, pembayaran, dan pelanggan",
  "Stok, bahan baku, dan pembelian",
  "Keuangan dan jadwal shift",
];
const FITUR_BOOKING = "Sesi booking: aset, tipe aset, dan tarif";
const FITUR_GUDANG = "Gudang dan WMS: pengajuan dan transfer stok";
const DURASI = " Durasi 1, 3, 6, 12, atau 24 bulan.";

/**
 * Isi plan mengikuti keputusan PL1a sampai PL6a (modul/setup-akun.md).
 * Diganti data dari backend setelah plan tersedia di sana (N1).
 */
const PLAN = [
  {
    nama: "Basic",
    lencana: "Gratis 14 hari",
    gratis: true,
    booking: false,
    gudang: false,
    catatan: "Akun baru selalu mulai di plan ini." + DURASI,
  },
  {
    nama: "Advanced",
    lencana: "Aktifkan lewat admin",
    gratis: false,
    booking: true,
    gudang: false,
    catatan: "Naik plan lewat admin Tachyon." + DURASI,
  },
  {
    nama: "Pro",
    lencana: "Aktifkan lewat admin",
    gratis: false,
    booking: true,
    gudang: true,
    catatan: "Naik plan lewat admin Tachyon." + DURASI,
  },
] as const;

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-kecil font-medium text-destructive">{pesan}</p>;
}

function PilihanPlan() {
  const [idx, setIdx] = useState(0);
  const ke = (i: number) => setIdx((i + PLAN.length) % PLAN.length);
  const plan = PLAN[idx];
  const fitur = [
    ...FITUR_DASAR.map((teks) => ({ teks, ada: true })),
    { teks: FITUR_BOOKING, ada: plan.booking },
    { teks: FITUR_GUDANG, ada: plan.gudang },
  ];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Pilihan plan"
      className="flex w-full max-w-[440px] flex-col gap-4 self-center"
    >
      <div aria-live="polite" className="flex min-h-[330px] flex-col gap-[18px] rounded-[18px] bg-permukaan p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-subjudul font-bold">Plan {plan.nama}</h2>
          <span
            className={
              "rounded-full px-3 py-1 text-isi font-semibold " +
              (plan.gratis ? "bg-sage/15 text-sage" : "bg-karamel/20 text-navy")
            }
          >
            {plan.lencana}
          </span>
        </div>
        <ul className="flex flex-col gap-3 text-besar">
          {fitur.map((f) => (
            <li
              key={f.teks}
              className={"flex items-start gap-2.5 " + (f.ada ? "text-navy" : "text-muted-foreground")}
            >
              {f.ada ? (
                <Check role="img" aria-label="Termasuk" className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
              ) : (
                <Minus role="img" aria-label="Tidak termasuk" className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <span>{f.teks}</span>
            </li>
          ))}
        </ul>
        <p className="mt-auto border-t border-input pt-4 text-isi leading-normal text-muted-foreground">
          {plan.catatan}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-label="Plan sebelumnya" onClick={() => ke(idx - 1)} className={KELAS_PANAH}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1">
          {PLAN.map((p, i) => (
            <button
              key={p.nama}
              type="button"
              aria-label={"Tampilkan plan " + p.nama}
              aria-pressed={i === idx}
              onClick={() => ke(i)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
            >
              <span
                className={
                  "block h-2 rounded-full transition-all " +
                  (i === idx ? "w-6 bg-navy" : "w-2 bg-muted-foreground/50")
                }
              />
            </button>
          ))}
        </div>
        <button type="button" aria-label="Plan berikutnya" onClick={() => ke(idx + 1)} className={KELAS_PANAH}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

/**
 * Halaman daftar akun toko (desain E, modul/setup-akun.md), langkah 1.
 * POST /akun/auth/register selalu menjawab 201 dengan email tersamar, baik
 * email baru maupun sudah terdaftar (B231), sehingga halaman tidak pernah
 * menyebut email sudah dipakai dan selalu lanjut ke isian kode. Password
 * dititipkan di memori agar langkah verifikasi dapat langsung login.
 */
export function HalamanDaftar() {
  const [galat, setGalat] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiDaftarAkun>({
    resolver: zodResolver(skemaDaftarAkun),
    defaultValues: { email: "", password: "", ulangiPassword: "" },
  });
  const daftar = useDaftarAkun();
  const memuat = daftar.isPending;

  const kirim = ({ email, password }: NilaiDaftarAkun) => {
    setGalat("");
    daftar.mutate(
      { email, password },
      {
        onSuccess: () => {
          titipKredensial({ email, password });
          router.push(`/daftar/verifikasi?email=${encodeURIComponent(email)}`);
        },
        onError: (err) =>
          setGalat(
            isRateLimited(err)
              ? pesanError(err, "Terlalu banyak pendaftaran. Coba lagi beberapa saat lagi.")
              : pesanError(err, "Pendaftaran gagal. Periksa kembali data Anda."),
          ),
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-wrap gap-5 bg-permukaan p-4 text-navy sm:p-5">
      <aside className="flex min-w-0 flex-[1_1_560px] flex-col justify-between gap-8 rounded-[28px] bg-krem p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <TandaTachyon ukuran={34} />
          <span className="text-subjudul font-bold">Tachyon POS</span>
        </div>
        <PilihanPlan />
        <LangkahDaftar aktif={1} />
      </aside>

      <main className="flex min-w-0 flex-[1_1_400px] items-center justify-center px-2 py-10">
        {
          <form
            onSubmit={handleSubmit(kirim)}
            method="POST"
            action="#"
            noValidate
            className="flex w-full max-w-[380px] flex-col gap-[22px]"
            suppressHydrationWarning
          >
            <div className="flex flex-col gap-2">
              <h1 className="text-judul font-bold tracking-tight">Buat akun toko</h1>
              <p className="text-isi leading-normal text-muted-foreground">
                Akun baru mulai di plan Basic, gratis 14 hari.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-isi font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
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
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                suppressHydrationWarning
                {...register("password")}
                aria-describedby="password-aturan"
                className={KELAS_ISIAN}
                aria-invalid={errors.password ? true : undefined}
                disabled={memuat}
              />
              <p id="password-aturan" className="text-kecil text-muted-foreground">
                Minimal 8 karakter, dengan huruf kapital dan angka.
              </p>
              <PesanIsian pesan={errors.password?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="ulangiPassword" className="text-isi font-semibold">
                Ulangi password
              </label>
              <input
                id="ulangiPassword"
                type="password"
                autoComplete="new-password"
                suppressHydrationWarning
                {...register("ulangiPassword")}
                className={KELAS_ISIAN}
                aria-invalid={errors.ulangiPassword ? true : undefined}
                disabled={memuat}
              />
              <PesanIsian pesan={errors.ulangiPassword?.message} />
            </div>

            {galat && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-kecil font-medium text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{galat}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={memuat}
              className="inline-flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy text-besar font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-permukaan disabled:pointer-events-none disabled:opacity-60"
            >
              {memuat ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mendaftarkan akun...
                </>
              ) : (
                "Daftar"
              )}
            </button>

            <p className="text-isi text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className={KELAS_TAUTAN}>
                Masuk
              </Link>
            </p>
          </form>
        }
      </main>
    </div>
  );
}