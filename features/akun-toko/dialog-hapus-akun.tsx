"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import { titipPesanLogin } from "@/lib/auth/pesan-login";
import { akhiriSesi } from "@/lib/auth/session";
import type { KirimanOtp } from "@/features/auth/api";
import { useHapusAkun, useKirimOtpAkun } from "./hooks";
import { namaTokoCocok, skemaBuktiOwner } from "./schema";
import { PesanGalat, TahapKode, kodeKosong } from "./tahap-kode";

function LabelLangkah({ ke, teks }: { ke: 1 | 2; teks: string }) {
  return (
    <p className="text-kecil font-semibold text-destructive">
      Langkah {ke} dari 2 · {teks}
    </p>
  );
}

/**
 * Hapus akun beserta seluruh data toko, dialog dua langkah (OA5a, B181).
 * Langkah 1: akibat dan ketik nama toko; kode baru dikirim setelah nama
 * cocok (OA10a). Langkah 2: kode, PIN Owner, dan password akun. Penolakan
 * tampil di langkah 2 tanpa menghanguskan kode (OA11a). Sesudah terhapus,
 * seluruh sesi toko ditolak backend, sehingga sesi lokal diakhiri dan pesan
 * dititipkan ke login akun (OA12a).
 */
export function DialogHapusAkun({
  open,
  onOpenChange,
  namaToko,
}: {
  open: boolean;
  onOpenChange: (buka: boolean) => void;
  namaToko: string;
}) {
  const router = useRouter();
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [diketik, setDiketik] = useState("");
  const [kiriman, setKiriman] = useState<KirimanOtp | null>(null);
  const [kode, setKode] = useState(kodeKosong);
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [galatIsian, setGalatIsian] = useState<{ pin?: string; password?: string }>({});
  const [galatKirim, setGalatKirim] = useState("");
  const [galatHapus, setGalatHapus] = useState("");
  const kirim = useKirimOtpAkun("hapus-akun");
  const hapus = useHapusAkun();
  const cocok = namaTokoCocok(diketik, namaToko);

  const tutup = (buka: boolean) => {
    if (buka) return onOpenChange(true);
    setLangkah(1);
    setDiketik("");
    setKiriman(null);
    setKode(kodeKosong());
    setPin("");
    setPassword("");
    setGalatIsian({});
    setGalatKirim("");
    setGalatHapus("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={tutup}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {langkah === 1 ? (
            <LabelLangkah ke={1} teks="Pahami akibatnya" />
          ) : (
            <LabelLangkah ke={2} teks="Buktikan Anda Owner" />
          )}
          <DialogTitle className={langkah === 1 ? "text-destructive" : undefined}>
            {langkah === 1 ? "Hapus akun dan seluruh data toko?" : `Hapus "${namaToko}"`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Akun toko beserta seluruh datanya dihapus permanen dan tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {langkah === 1 ? (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!cocok) return;
              setGalatKirim("");
              kirim.mutate(undefined, {
                onSuccess: (k) => {
                  setKiriman(k);
                  setKode(kodeKosong());
                  setGalatHapus("");
                  setLangkah(2);
                },
                onError: (err) => setGalatKirim(pesanError(err, "Kode gagal dikirim. Coba lagi.")),
              });
            }}
            className="flex min-w-0 flex-col gap-3"
          >
            <ul className="list-disc space-y-1 pl-5 text-kecil leading-relaxed text-muted-foreground">
              <li>Produk, stok, penjualan, keuangan, pengguna, dan riwayat toko ikut terhapus.</li>
              <li>Semua pengguna toko langsung keluar dari web dan aplikasi.</li>
              <li>Tidak dapat dibatalkan.</li>
            </ul>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hapus-nama-toko" className="text-isi font-medium">
                Ketik nama toko: <span className="text-destructive [overflow-wrap:anywhere]">{namaToko}</span>
              </label>
              <Input
                id="hapus-nama-toko"
                autoComplete="off"
                value={diketik}
                onChange={(e) => setDiketik(e.target.value)}
                className="h-11 text-besar sm:text-isi"
              />
            </div>
            <p className="text-kecil text-muted-foreground">Lanjut mengirim kode ke email akun toko.</p>
            <PesanGalat pesan={galatKirim} />
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-11 sm:min-h-9" onClick={() => tutup(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="min-h-11 border border-destructive/30 sm:min-h-9"
                disabled={!cocok || kirim.isPending}
              >
                {kirim.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Kirim kode dan lanjut
              </Button>
            </DialogFooter>
          </form>
        ) : (
          kiriman && (
            <TahapKode
              kiriman={kiriman}
              kode={kode}
              onUbahKode={setKode}
              galat={galatHapus}
              menyimpan={hapus.isPending}
              labelSimpan="Hapus permanen"
              varianSimpan="destructive"
              catatan="PIN atau password yang salah tidak menghanguskan kode."
              isianTambahan={
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="hapus-pin" className="text-isi font-medium">
                      PIN Owner
                    </label>
                    <Input
                      id="hapus-pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      aria-invalid={galatIsian.pin ? true : undefined}
                      className="h-11 text-besar tracking-[0.3em] sm:text-isi"
                    />
                    {galatIsian.pin && <p className="text-kecil font-medium text-destructive">{galatIsian.pin}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="hapus-password" className="text-isi font-medium">
                      Password akun
                    </label>
                    <Input
                      id="hapus-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={galatIsian.password ? true : undefined}
                      className="h-11 text-besar sm:text-isi"
                    />
                    {galatIsian.password && (
                      <p className="text-kecil font-medium text-destructive">{galatIsian.password}</p>
                    )}
                  </div>
                </>
              }
              onKirimUlang={(selesai, gagal) => kirim.mutate(undefined, { onSuccess: selesai, onError: gagal })}
              onKembali={() => setLangkah(1)}
              onSimpan={(otp) => {
                const bukti = skemaBuktiOwner.safeParse({ pin, password });
                if (!bukti.success) {
                  const galat: { pin?: string; password?: string } = {};
                  for (const i of bukti.error.issues) galat[i.path[0] as "pin" | "password"] ??= i.message;
                  setGalatIsian(galat);
                  return;
                }
                setGalatIsian({});
                setGalatHapus("");
                hapus.mutate(
                  { pin, password, namaToko: diketik.trim(), otp },
                  {
                    onSuccess: () => {
                      titipPesanLogin({
                        judul: "Akun dihapus",
                        deskripsi: "Akun beserta seluruh data toko telah dihapus.",
                      });
                      akhiriSesi();
                      router.replace("/login");
                    },
                    onError: (err) => setGalatHapus(pesanError(err, "Akun gagal dihapus. Coba lagi.")),
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
