"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import type { KirimanOtp } from "@/features/auth/api";
import { useKirimOtpAkun, useUbahEmailAkun } from "./hooks";
import { skemaEmailBaru, type NilaiEmailBaru } from "./schema";
import { LabelTahap, PesanGalat, TahapKode, kodeKosong } from "./tahap-kode";

/**
 * Ubah email akun dua tahap (OA3a, B179): email baru lalu Kirim kode, lalu
 * kode dan Simpan. Kode dikirim ke email lama. Penolakan simpan tampil di
 * tahap 2; Kembali mempertahankan isian dan menawarkan kode yang sama
 * (OA11a), karena backend tidak menghanguskan kode untuk email terpakai.
 */
export function DialogUbahEmail({
  open,
  onOpenChange,
  idAkun,
  emailSaatIni,
}: {
  open: boolean;
  onOpenChange: (buka: boolean) => void;
  idAkun: string;
  emailSaatIni: string;
}) {
  const [tahap, setTahap] = useState<1 | 2>(1);
  const [kiriman, setKiriman] = useState<KirimanOtp | null>(null);
  const [kode, setKode] = useState(kodeKosong);
  const [galatKirim, setGalatKirim] = useState("");
  const [galatSimpan, setGalatSimpan] = useState("");
  const kirim = useKirimOtpAkun("ubah-profil");
  const ubah = useUbahEmailAkun();
  const form = useForm<NilaiEmailBaru>({
    resolver: zodResolver(skemaEmailBaru(emailSaatIni)),
    defaultValues: { email: "" },
  });
  const emailBaru = (useWatch({ control: form.control, name: "email" }) ?? "").trim();

  const tutup = (buka: boolean) => {
    if (buka) return onOpenChange(true);
    setTahap(1);
    setKiriman(null);
    setKode(kodeKosong());
    setGalatKirim("");
    setGalatSimpan("");
    form.reset({ email: "" });
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
          <DialogTitle>{tahap === 1 ? "Ubah email akun" : "Masukkan kode"}</DialogTitle>
          <DialogDescription className="sr-only">
            Kode dikirim ke email akun saat ini untuk membuktikan Anda pemilik akun.
          </DialogDescription>
        </DialogHeader>

        {tahap === 1 ? (
          <form noValidate onSubmit={form.handleSubmit(kirimKode)} className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-saat-ini" className="text-isi font-medium">Email saat ini</label>
              <Input id="email-saat-ini" value={emailSaatIni} readOnly className="h-11 bg-muted text-besar text-muted-foreground sm:text-isi" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-baru" className="text-isi font-medium">Email baru</label>
              <Input
                id="email-baru"
                type="email"
                autoComplete="email"
                {...form.register("email")}
                aria-invalid={form.formState.errors.email ? true : undefined}
                className="h-11 text-besar sm:text-isi"
              />
              {form.formState.errors.email && (
                <p className="text-kecil font-medium text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <p className="text-kecil leading-relaxed text-muted-foreground">
              Kode dikirim ke email saat ini, bukan ke email baru, untuk membuktikan Anda pemilik akun.
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
              keterangan={
                <>
                  Email baru: <strong className="text-foreground">{emailBaru}</strong>.{" "}
                </>
              }
              kode={kode}
              onUbahKode={setKode}
              galat={galatSimpan}
              menyimpan={ubah.isPending}
              labelSimpan="Simpan email"
              onKirimUlang={(selesai, gagal) => kirim.mutate(undefined, { onSuccess: selesai, onError: gagal })}
              onKembali={() => setTahap(1)}
              onSimpan={(otp) => {
                setGalatSimpan("");
                ubah.mutate(
                  { id: idAkun, email: emailBaru, otp },
                  {
                    onSuccess: () => {
                      toast.success("Berhasil", { description: `Email akun diubah menjadi ${emailBaru}.` });
                      tutup(false);
                    },
                    onError: (err) => setGalatSimpan(pesanError(err, "Email gagal diubah. Coba lagi.")),
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
