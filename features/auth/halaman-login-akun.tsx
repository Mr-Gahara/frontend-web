"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { isRateLimited, pesanError } from "@/lib/api/error";
import { setTokenAkun, setTokenPengguna } from "@/lib/auth/session";
import { useLoginAkun } from "./hooks";
import { skemaLoginAkun, type NilaiLoginAkun } from "./schema";

const KELAS_ISIAN =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-destructive">{pesan}</p>;
}

export function HalamanLoginAkun() {
  const router = useRouter();
  const [galat, setGalat] = useState("");
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
        // Onboarding toko hanya tersedia di aplikasi mobile. Sesi tidak disimpan
        // agar pengguna tanpa toko tidak tertahan di alur web.
        if (res.requireSetup) {
          setGalat(
            "Akun ini belum memiliki toko. Selesaikan pembuatan toko melalui aplikasi Tachyon POS, lalu login kembali di sini.",
          );
          return;
        }
        setTokenAkun(res.accessToken);
        router.push("/login/pengguna");
      },
      onError: (err) => {
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Login Akun SaaS
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk ke platform utama untuk mengelola unit usaha Anda.
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
              htmlFor="email"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </label>
            <input
              id="email"
              type="email"
              suppressHydrationWarning
              {...register("email")}
              placeholder="nama@perusahaan.com"
              className={KELAS_ISIAN}
              aria-invalid={errors.email ? true : undefined}
              disabled={memuat}
            />
            <PesanIsian pesan={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password
            </label>
            <input
              id="password"
              type="password"
              suppressHydrationWarning
              {...register("password")}
              placeholder="••••••••"
              className={KELAS_ISIAN}
              aria-invalid={errors.password ? true : undefined}
              disabled={memuat}
            />
            <PesanIsian pesan={errors.password?.message} />
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
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 w-full cursor-pointer gap-2 mt-2"
          >
            {memuat ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Membuka Akses Sesi...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}