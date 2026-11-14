"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { pesanError } from "@/lib/api/error";
import { titipPesanLogin } from "@/lib/auth/pesan-login";
import { denganKembali } from "@/lib/auth/tujuan";
import { useSession } from "@/lib/auth/useSession";
import { useAkunSaya } from "@/features/setup/hooks";
import { hanyaAngka } from "@/features/pengguna/schema-profil";
import type { KirimanOtp } from "./api";
import { useHitungMundur } from "./hitung-mundur";
import { useKirimOtpResetPinOwner, useResetPinOwner } from "./hooks";
import { identitasPanel, type IdentitasPanel } from "./identitas";
import { IsianKode, KirimUlangKode } from "./isian-kode";
import { JamKunci, jamMenit, useMenitBerjalan } from "./jam-kunci";
import { kodeKosong, skemaResetPinOwner, type NilaiResetPinOwner } from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

const KELAS_ISIAN =
  "flex h-12 w-full rounded-lg border border-input bg-permukaan px-3.5 text-besar text-navy placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const KELAS_TOMBOL =
  "inline-flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy text-besar font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:pointer-events-none disabled:opacity-60";

const KELAS_TAUTAN =
  "inline-flex min-h-11 cursor-pointer items-center self-start rounded-sm text-besar font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading";

/** Jeda kirim ulang OTP bawaan backend (OTP_JEDA_KIRIM_DETIK, B178). */
const JEDA_KIRIM_ULANG = 60;

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-kecil font-medium text-destructive">{pesan}</p>;
}

function PesanGalat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-isi font-medium text-destructive"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{pesan}</span>
    </div>
  );
}

function Identitas({ identitas, tambahan }: { identitas: IdentitasPanel; tambahan?: string }) {
  const baris = [identitas.email, tambahan].filter(Boolean).join(" · ");
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TandaTachyon ukuran={34} />
      <div className="min-w-0">
        <p className="truncate text-subjudul font-bold">{identitas.judul}</p>
        {baris && <p className="truncate text-isi text-gading/75">{baris}</p>}
      </div>
    </div>
  );
}

/**
 * Panel navy layar kunci (desain E, TP2a). Di tahap kode, layar HP memakai
 * panel ringkas satu baris agar isian langsung terlihat (OA6a).
 */
function PanelKunci({ identitas, keterangan, ringkas }: { identitas: IdentitasPanel; keterangan: string; ringkas: boolean }) {
  const kini = useMenitBerjalan();
  return (
    <>
      <aside
        className={`${ringkas ? "hidden sm:flex" : "flex"} min-w-0 flex-[1_1_560px] flex-col justify-between gap-10 rounded-[28px] bg-navy p-8 text-gading sm:p-10`}
      >
        <Identitas identitas={identitas} />
        <JamKunci />
        <p className="max-w-[420px] text-besar leading-relaxed text-gading/75">{keterangan}</p>
      </aside>
      {ringkas && (
        <aside className="flex w-full min-w-0 rounded-[28px] bg-navy px-8 py-6 text-gading sm:hidden">
          <Identitas identitas={identitas} tambahan={kini ? jamMenit(kini) : undefined} />
        </aside>
      )}
    </>
  );
}

/** Tahap 1: penjelasan dan kirim kode ke email akun toko (B178 langkah pertama). */
function TahapKirim({
  email,
  urlLogin,
  onTerkirim,
}: {
  email: string | null;
  urlLogin: string;
  onTerkirim: (k: KirimanOtp) => void;
}) {
  const kirim = useKirimOtpResetPinOwner();
  const [galat, setGalat] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <p className="text-kecil font-semibold text-muted-foreground">Tahap 1 dari 2</p>
      <h1 className="text-judul font-bold tracking-tight">Atur ulang PIN Owner</h1>
      <p className="text-isi leading-relaxed text-muted-foreground">
        Kami kirim kode 6 digit ke email akun toko. Jalur ini hanya untuk Owner; karyawan meminta Owner
        mengatur ulang PIN-nya.
      </p>
      <p className="rounded-xl bg-krem px-4 py-3.5 text-besar leading-normal [overflow-wrap:anywhere]">
        Kode dikirim ke <strong>{email ?? "email akun toko"}</strong>
      </p>
      <PesanGalat pesan={galat} />
      <button
        type="button"
        disabled={kirim.isPending}
        onClick={() => {
          setGalat("");
          kirim.mutate(undefined, {
            onSuccess: onTerkirim,
            onError: (err) => setGalat(pesanError(err, "Kode gagal dikirim. Coba lagi.")),
          });
        }}
        className={KELAS_TOMBOL}
      >
        {kirim.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Kirim kode
      </button>
      <Link href={urlLogin} className={KELAS_TAUTAN}>
        Kembali ke masuk kasir
      </Link>
    </div>
  );
}

/** Tahap 2: kode, password akun toko, dan PIN baru (B178 langkah kedua). */
function TahapKode({
  kiriman,
  onKembali,
  onSelesai,
}: {
  kiriman: KirimanOtp;
  onKembali: () => void;
  onSelesai: () => void;
}) {
  const [terkirim, setTerkirim] = useState(kiriman);
  const { sisa, ulang } = useHitungMundur(JEDA_KIRIM_ULANG);
  const [galat, setGalat] = useState("");
  const [status, setStatus] = useState("");
  const atur = useResetPinOwner();
  const kirim = useKirimOtpResetPinOwner();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiResetPinOwner>({
    resolver: zodResolver(skemaResetPinOwner),
    defaultValues: { kode: kodeKosong(), password: "", pinBaru: "", ulangiPin: "" },
  });
  const isianPin = (nama: "pinBaru" | "ulangiPin") => {
    const isian = register(nama);
    return {
      ...isian,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = hanyaAngka(e.target.value);
        return isian.onChange(e);
      },
    };
  };
  const menit = Math.max(1, Math.round(terkirim.berlakuDetik / 60));

  return (
    <form
      onSubmit={handleSubmit((n) => {
        setGalat("");
        atur.mutate(
          { password: n.password, pinBaru: n.pinBaru, otp: n.kode.join("") },
          {
            onSuccess: onSelesai,
            onError: (err) => setGalat(pesanError(err, "PIN gagal diatur ulang. Coba lagi.")),
          },
        );
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <p className="text-kecil font-semibold text-muted-foreground">Tahap 2 dari 2</p>
      <h1 className="text-judul font-bold tracking-tight">Kode dan PIN baru</h1>
      <p className="text-isi leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
        Kode dikirim ke <strong className="text-navy">{terkirim.email}</strong>, berlaku {menit} menit.
      </p>
      <div className="flex flex-col gap-2">
        <Controller
          name="kode"
          control={control}
          render={({ field }) => (
            <IsianKode nilai={field.value} onUbah={field.onChange} invalid={Boolean(errors.kode)} />
          )}
        />
        <PesanIsian pesan={errors.kode?.message ?? errors.kode?.root?.message} />
        <KirimUlangKode
          sisa={sisa}
          onKirim={() => {
            setStatus("");
            kirim.mutate(undefined, {
              onSuccess: (k) => {
                setTerkirim(k);
                ulang();
                setStatus("Kode baru dikirim. Periksa email Anda.");
              },
              onError: (err) => setStatus(pesanError(err, "Kode baru gagal dikirim. Coba lagi.")),
            });
          }}
        />
        {status && (
          <p role="status" className="text-isi">
            {status}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="reset-pin-password" className="text-isi font-semibold">
          Password akun toko
        </label>
        <input
          id="reset-pin-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={errors.password ? true : undefined}
          className={KELAS_ISIAN}
        />
        <PesanIsian pesan={errors.password?.message} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="reset-pin-baru" className="text-isi font-semibold">
          PIN baru
        </label>
        <input
          id="reset-pin-baru"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          {...isianPin("pinBaru")}
          aria-describedby="reset-pin-aturan"
          aria-invalid={errors.pinBaru ? true : undefined}
          className={KELAS_ISIAN + " tracking-[0.4em]"}
        />
        <PesanIsian pesan={errors.pinBaru?.message} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="reset-pin-ulang" className="text-isi font-semibold">
          Ulangi PIN baru
        </label>
        <input
          id="reset-pin-ulang"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          {...isianPin("ulangiPin")}
          aria-invalid={errors.ulangiPin ? true : undefined}
          className={KELAS_ISIAN + " tracking-[0.4em]"}
        />
        <PesanIsian pesan={errors.ulangiPin?.message} />
        <p id="reset-pin-aturan" className="text-kecil text-muted-foreground">
          PIN 6 digit angka.
        </p>
      </div>
      <PesanGalat pesan={galat} />
      <button type="submit" disabled={atur.isPending} className={KELAS_TOMBOL}>
        {atur.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Simpan PIN baru
      </button>
      <button type="button" onClick={onKembali} className={KELAS_TAUTAN}>
        Kembali
      </button>
    </form>
  );
}

/**
 * Reset PIN Owner dari panel Lupa PIN? login pengguna (OA1a, B178). Butuh
 * token akun: tanpa itu pengguna dikembalikan ke login akun. Sesudah
 * tersimpan, pesan dititipkan ke halaman login (OA12a) dan Owner masuk lagi
 * dengan PIN baru. Rute di luar /login agar layout login terpasang ulang dan
 * mengambil pesan titipannya.
 */
export function HalamanResetPinOwner() {
  const router = useRouter();
  const { status, adaTokenAkun, adalahAdmin } = useSession();
  const identitas = identitasPanel(useAkunSaya(adaTokenAkun && !adalahAdmin).data);
  const [kiriman, setKiriman] = useState<KirimanOtp | null>(null);
  // Owner yang dialihkan wizard (?kembali=/setup) kembali ke wizard setelah masuk lagi.
  const urlLogin = denganKembali("/login/pengguna", useSearchParams().get("kembali"));

  useEffect(() => {
    if (status === "memuat") return;
    if (adalahAdmin) router.replace("/admin");
    else if (!adaTokenAkun) router.replace("/login");
  }, [status, adaTokenAkun, adalahAdmin, router]);

  return (
    <div className="flex min-h-screen flex-wrap gap-5 bg-gading p-4 text-navy sm:p-5">
      <PanelKunci
        identitas={identitas}
        ringkas={kiriman !== null}
        keterangan={
          kiriman
            ? "Setelah PIN tersimpan, masuk lagi dengan nama dan PIN baru."
            : "Atur ulang PIN Owner. Kode dikirim ke email akun toko, bukan ke nomor HP."
        }
      />
      <main className="flex min-w-0 flex-[1_1_400px] items-center justify-center px-2 py-10">
        <div className="w-full max-w-[380px]">
          {kiriman ? (
            <TahapKode
              kiriman={kiriman}
              onKembali={() => setKiriman(null)}
              onSelesai={() => {
                titipPesanLogin({ judul: "PIN Owner diubah", deskripsi: "Masuk dengan PIN baru." });
                router.replace(urlLogin);
              }}
            />
          ) : (
            <TahapKirim email={identitas.email} urlLogin={urlLogin} onTerkirim={setKiriman} />
          )}
        </div>
      </main>
    </div>
  );
}
