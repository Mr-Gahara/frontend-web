"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import { titipPesanLogin } from "@/lib/auth/pesan-login";
import { akhiriSesi } from "@/lib/auth/session";
import type { KirimanOtp } from "@/features/auth/api";
import { useKirimOtpAkun, useUbahPasswordAkun } from "./hooks";
import { skemaPasswordAkun, type NilaiPasswordAkun } from "./schema";
import { LabelTahap, PesanGalat, TahapKode, kodeKosong } from "./tahap-kode";

const ISIAN = [
  { nama: "passwordLama", label: "Password lama", autoComplete: "current-password" },
  { nama: "password", label: "Password baru", autoComplete: "new-password" },
  { nama: "ulangiPassword", label: "Ulangi password baru", autoComplete: "new-password" },
] as const;

/**
 * Ubah password akun dua tahap (OA3a, B179). Password lama diperiksa
 * backend saat simpan, sebelum kode, sehingga kode tidak hangus oleh salah
 * ketik; penolakannya tampil di tahap 2 dan Kembali mempertahankan isian
 * (OA11a). Password baru mencabut seluruh sesi akun, jadi sesi lokal
 * diakhiri tanpa permintaan yang pasti dijawab 401, lalu pesan dititipkan ke
 * login akun (OA12a, seperti PF7a).
 */
export function DialogUbahPassword({
  open,
  onOpenChange,
  idAkun,
}: {
  open: boolean;
  onOpenChange: (buka: boolean) => void;
  idAkun: string;
}) {
  const router = useRouter();
  const [tahap, setTahap] = useState<1 | 2>(1);
  const [kiriman, setKiriman] = useState<KirimanOtp | null>(null);
  const [kode, setKode] = useState(kodeKosong);
  const [galatKirim, setGalatKirim] = useState("");
  const [galatSimpan, setGalatSimpan] = useState("");
  const kirim = useKirimOtpAkun("ubah-profil");
  const ubah = useUbahPasswordAkun();
  const form = useForm<NilaiPasswordAkun>({
    resolver: zodResolver(skemaPasswordAkun),
    defaultValues: { passwordLama: "", password: "", ulangiPassword: "" },
  });
  const galatIsian = form.formState.errors;

  const tutup = (buka: boolean) => {
    if (buka) return onOpenChange(true);
    setTahap(1);
    setKiriman(null);
    setKode(kodeKosong());
    setGalatKirim("");
    setGalatSimpan("");
    form.reset();
    onOpenChange(false);
  };

  const kirimKode = () => {
    setGalatKirim("");
    kirim.mutate(undefined, {
      onSuccess: (k) => {
        setKiriman(k);
        setKode(kodeKosong());
        setGalatSimpan("");
        setTahap(2);
      },
      onError: (err) => setGalatKirim(pesanError(err, "Kode gagal dikirim. Coba lagi.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={tutup}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <LabelTahap ke={tahap} />
          <DialogTitle>{tahap === 1 ? "Ubah password akun" : "Masukkan kode"}</DialogTitle>
          <DialogDescription className="sr-only">
            Password akun toko diganti setelah kode dari email akun dimasukkan.
          </DialogDescription>
        </DialogHeader>

        {tahap === 1 ? (
          <form noValidate onSubmit={form.handleSubmit(kirimKode)} className="flex min-w-0 flex-col gap-3">
            {ISIAN.map((isian) => (
              <div key={isian.nama} className="flex flex-col gap-1.5">
                <label htmlFor={`akun-${isian.nama}`} className="text-sm font-medium">{isian.label}</label>
                <Input
                  id={`akun-${isian.nama}`}
                  type="password"
                  autoComplete={isian.autoComplete}
                  {...form.register(isian.nama)}
                  aria-invalid={galatIsian[isian.nama] ? true : undefined}
                  className="h-11 text-base sm:text-sm"
                />
                {galatIsian[isian.nama] && (
                  <p className="text-xs font-medium text-destructive">{galatIsian[isian.nama]?.message}</p>
                )}
              </div>
            ))}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Minimal 8 karakter, dengan huruf kapital dan angka. Lanjut mengirim kode ke email akun toko.
            </p>
            <PesanGalat pesan={galatKirim} />
            <DialogFooter>
              {kiriman && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 sm:min-h-9"
                  onClick={form.handleSubmit(() => setTahap(2))}
                >
                  Lanjut dengan kode yang sama
                </Button>
              )}
              <Button type="button" variant="outline" className="min-h-11 sm:min-h-9" onClick={() => tutup(false)}>
                Batal
              </Button>
              <Button type="submit" className="min-h-11 sm:min-h-9" disabled={kirim.isPending}>
                {kirim.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Kirim kode
              </Button>
            </DialogFooter>
          </form>
        ) : (
          kiriman && (
            <TahapKode
              kiriman={kiriman}
              catatan="Setelah tersimpan, seluruh perangkat keluar dari akun toko, dan Anda masuk lagi dengan password baru."
              kode={kode}
              onUbahKode={setKode}
              galat={galatSimpan}
              menyimpan={ubah.isPending}
              labelSimpan="Simpan password"
              onKirimUlang={(selesai, gagal) => kirim.mutate(undefined, { onSuccess: selesai, onError: gagal })}
              onKembali={() => setTahap(1)}
              onSimpan={(otp) => {
                setGalatSimpan("");
                const n = form.getValues();
                ubah.mutate(
                  { id: idAkun, oldPassword: n.passwordLama, password: n.password, otp },
                  {
                    onSuccess: () => {
                      titipPesanLogin({
                        judul: "Password akun diubah",
                        deskripsi: "Masuk lagi dengan password baru.",
                      });
                      akhiriSesi();
                      router.replace("/login");
                    },
                    onError: (err) => setGalatSimpan(pesanError(err, "Password gagal diubah. Coba lagi.")),
                  },
                );
              }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
