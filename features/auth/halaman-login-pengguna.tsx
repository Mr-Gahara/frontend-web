"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Lock, User } from "lucide-react";
import { pesanError } from "@/lib/api/error";
import { akhiriSesi, setTokenPengguna } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { hanyaAngka } from "@/features/pengguna/schema-profil";
import { hasilLoginPengguna } from "./hasil";
import { useLoginPengguna, useLogoutAkun } from "./hooks";
import { skemaLoginPengguna, type NilaiLoginPengguna } from "./schema";

const KELAS_ISIAN =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-destructive">{pesan}</p>;
}

export function HalamanLoginPengguna() {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const { status, sudahMasuk, adaTokenAkun } = useSession();
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

    // Tanpa token akun, login pengguna tidak dapat dikirim (endpoint-nya
    // memerlukan token akun), sehingga pengguna dikembalikan ke login akun.
    if (!adaTokenAkun) router.replace("/login");
  }, [status, sudahMasuk, adaTokenAkun, router]);

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Login Karyawan / Owner
          </h1>
          <p className="text-sm text-muted-foreground">
            Masukkan Nama Akun dan PIN Otentikasi Anda untuk mengakses terminal
            outlet.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(kirim)}
          method="POST"
          action="#"
          noValidate
          className="space-y-4"
          suppressHydrationWarning
        >
          <div className="space-y-2">
            <label
              htmlFor="nama"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Nama
              Pengguna
            </label>
            <input
              id="nama"
              type="text"
              suppressHydrationWarning
              {...register("nama")}
              placeholder="Contoh: Ridho"
              className={KELAS_ISIAN}
              aria-invalid={errors.nama ? true : undefined}
              disabled={memuat}
            />
            <PesanIsian pesan={errors.nama?.message} />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pin"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> PIN
              Keamanan
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              suppressHydrationWarning
              {...isianPin}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                e.target.value = hanyaAngka(e.target.value);
                return isianPin.onChange(e);
              }}
              placeholder="6 Digit PIN"
              maxLength={6}
              className={`${KELAS_ISIAN} tracking-widest font-mono`}
              aria-invalid={errors.pin ? true : undefined}
              disabled={memuat}
            />
            <PesanIsian pesan={errors.pin?.message} />
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
            className="inline-flex items-center font-bold justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 w-full cursor-pointer gap-2 mt-2"
          >
            {memuat ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menerbitkan Token C...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Bukan bagian dari toko ini?{" "}
          <button
            type="button"
            onClick={gantiAkun}
            disabled={keluarAkun.isPending}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Ganti Akun Bisnis
          </button>
        </div>
      </div>
    </div>
  );
}