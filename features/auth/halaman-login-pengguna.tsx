"use client";

import { useEffect, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { pesanError } from "@/lib/api/error";
import { akhiriSesi, setTokenPengguna } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { hanyaAngka } from "@/features/pengguna/schema-profil";
import { hasilLoginPengguna } from "./hasil";
import { useLoginPengguna, useLogoutAkun } from "./hooks";
import { skemaLoginPengguna, type NilaiLoginPengguna } from "./schema";
import { TandaTachyon } from "./tanda-tachyon";

const KELAS_ISIAN =
  "flex w-full rounded-lg border border-input bg-permukaan px-3.5 text-navy placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const KELAS_TAUTAN =
  "cursor-pointer rounded-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:cursor-not-allowed disabled:opacity-50";

/** Berdetak tiap detik; snapshot jam hanya berganti saat menit berganti. */
function langgananDetak(beritahu: () => void) {
  const t = setInterval(beritahu, 1000);
  return () => clearInterval(t);
}
const menitSekarang = () => Math.floor(Date.now() / 60_000);
const menitServer = () => null;

/**
 * Jam layar kunci. Server merender tanpa jam (snapshot null) supaya tidak ada
 * selisih hidrasi; jam muncul setelah klien terpasang.
 */
function JamKunci() {
  const menit = useSyncExternalStore<number | null>(langgananDetak, menitSekarang, menitServer);
  if (menit === null) return <div className="min-h-[clamp(6.5rem,15vw,10.5rem)]" aria-hidden="true" />;
  const kini = new Date(menit * 60_000);
  return (
    <div className="flex min-h-[clamp(6.5rem,15vw,10.5rem)] flex-col gap-2">
      <time
        dateTime={kini.toISOString()}
        className="text-[clamp(4.5rem,12vw,8rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums"
      >
        {kini.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </time>
      <p className="text-xl text-gading/75">
        {kini.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-destructive">{pesan}</p>;
}

export function HalamanLoginPengguna() {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const [lupaPin, setLupaPin] = useState(false);
  const { status, sudahMasuk, adaTokenAkun, adalahAdmin } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiLoginPengguna>({
    resolver: zodResolver(skemaLoginPengguna),
    defaultValues: { nama: "", pin: "" },
  });
  const masuk = useLoginPengguna();
  const keluarAkun = useLogoutAkun();
  const memuat = masuk.isPending;

  useEffect(() => {
    // Sesi dipulihkan lewat cookie refresh oleh SessionProvider, jadi
    // halaman ini hanya bereaksi terhadap hasilnya.
    if (status === "memuat") return;

    // Sudah punya sesi pengguna: langsung ke dashboard.
    if (sudahMasuk) {
      router.replace("/dashboard");
      return;
    }

    // Akun admin tidak punya pengguna (keputusan PA1a).
    if (adalahAdmin) {
      router.replace("/admin");
      return;
    }

    // Tanpa token akun, login pengguna tidak dapat dikirim (endpoint-nya
    // memerlukan token akun), sehingga pengguna dikembalikan ke login akun.
    if (!adaTokenAkun) router.replace("/login");
  }, [status, sudahMasuk, adaTokenAkun, adalahAdmin, router]);

  const kirim = (nilai: NilaiLoginPengguna) => {
    setGalat("");
    masuk.mutate(nilai, {
      onSuccess: (res) => {
        const hasil = hasilLoginPengguna(res);
        if ("galat" in hasil) {
          setGalat(hasil.galat);
          return;
        }
        setTokenPengguna(hasil.token);
        router.push("/dashboard");
      },
      onError: (err) => setGalat(pesanError(err, "Nama atau PIN tidak valid.")),
    });
  };

  // Logout ke backend wajib dipanggil: tanpa itu cookie refresh akun tetap
  // berlaku dan sesi dapat dipulihkan kembali oleh siapa pun yang membuka
  // aplikasi di perangkat ini. Sesi lokal tetap diakhiri walau permintaan
  // logout gagal.
  const gantiAkun = () => {
    keluarAkun.mutate(undefined, {
      onSettled: () => {
        akhiriSesi();
        router.push("/login");
      },
    });
  };

  const isianPin = register("pin");

  return (
    <div className="flex min-h-screen flex-wrap gap-5 bg-gading p-4 text-navy sm:p-5">
      <aside className="flex min-w-0 flex-[1_1_560px] flex-col justify-between gap-10 rounded-[28px] bg-navy p-8 text-gading sm:p-10">
        <div className="flex items-center gap-3">
          <TandaTachyon ukuran={34} />
          <span className="text-lg font-bold">Tachyon POS</span>
        </div>
        <JamKunci />
        <p className="max-w-[420px] text-base leading-relaxed text-gading/75">
          Kasir terkunci. Masukkan nama dan PIN Anda untuk membuka shift.
        </p>
      </aside>

      <main className="flex min-w-0 flex-[1_1_400px] items-center justify-center px-2 py-10">
        <form
          onSubmit={handleSubmit(kirim)}
          method="POST"
          action="#"
          noValidate
          className="flex w-full max-w-[380px] flex-col gap-6"
          suppressHydrationWarning
        >
          <h1 className="text-3xl font-bold tracking-tight">Siapa yang bertugas?</h1>

          <div className="flex flex-col gap-2">
            <label htmlFor="nama" className="text-sm font-semibold">
              Nama pengguna
            </label>
            <input
              id="nama"
              type="text"
              autoComplete="username"
              suppressHydrationWarning
              {...register("nama")}
              placeholder="Contoh: Ridho"
              className={KELAS_ISIAN + " h-12 text-base"}
              aria-invalid={errors.nama ? true : undefined}
              disabled={memuat}
            />
            <PesanIsian pesan={errors.nama?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="pin" className="text-sm font-semibold">
                PIN
              </label>
              <button
                type="button"
                onClick={() => setLupaPin((v) => !v)}
                aria-expanded={lupaPin}
                aria-controls="bantuan-lupa-pin"
                className={KELAS_TAUTAN + " text-sm"}
              >
                Lupa PIN?
              </button>
            </div>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              suppressHydrationWarning
              {...isianPin}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                e.target.value = hanyaAngka(e.target.value);
                return isianPin.onChange(e);
              }}
              maxLength={6}
              aria-describedby="pin-bantu"
              className={KELAS_ISIAN + " h-16 text-center text-[28px] tracking-[0.6em]"}
              aria-invalid={errors.pin ? true : undefined}
              disabled={memuat}
            />
            <p id="pin-bantu" className="text-[13px] text-muted-foreground">
              6 digit angka.
            </p>
            <PesanIsian pesan={errors.pin?.message} />
            <div id="bantuan-lupa-pin" hidden={!lupaPin} className="rounded-lg bg-krem p-4 text-sm leading-relaxed">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-semibold">Karyawan:</span> minta Owner mengatur ulang PIN Anda.
                </li>
                <li>
                  <span className="font-semibold">Owner:</span> pengaturan ulang PIN Owner lewat kode di
                  email akun toko belum tersedia di web.
                </li>
              </ul>
            </div>
          </div>

          {galat && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{galat}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={memuat}
            className="inline-flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy text-base font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2 focus-visible:ring-offset-gading disabled:pointer-events-none disabled:opacity-60"
          >
            {memuat ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Membuka kasir...
              </>
            ) : (
              "Masuk ke kasir"
            )}
          </button>

          <button
            type="button"
            onClick={gantiAkun}
            disabled={keluarAkun.isPending}
            className={KELAS_TAUTAN + " h-11 self-start text-[15px]"}
          >
            Keluar dari akun toko
          </button>
        </form>
      </main>
    </div>
  );
}
