"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { pesanError } from "@/lib/api/error";
import type { KirimanOtp } from "@/features/auth/api";
import { useHitungMundur } from "@/features/auth/hitung-mundur";
import { IsianKode, KirimUlangKode } from "@/features/auth/isian-kode";
import { kodeKosong } from "@/features/auth/schema";
import { kodeLengkap } from "./schema";

/** Jeda kirim ulang OTP bawaan backend (OTP_JEDA_KIRIM_DETIK). */
const JEDA_KIRIM_ULANG = 60;

export function PesanGalat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{pesan}</span>
    </div>
  );
}

/** "Tahap n dari 2" di atas judul dialog. */
export function LabelTahap({ ke }: { ke: 1 | 2 }) {
  return <p className="text-xs font-semibold text-muted-foreground">Tahap {ke} dari 2</p>;
}

/**
 * Isian kode tahap 2 dialog OTP aksi Owner (OA3a, OA5a): kode 6 kotak,
 * kirim ulang berhitung mundur, dan pesan backend tampil di sini (OA11a).
 * Kode disimpan pemanggil agar tetap terisi saat kembali ke tahap 1.
 */
export function TahapKode({
  kiriman,
  keterangan,
  catatan,
  kode,
  onUbahKode,
  galat,
  menyimpan,
  labelSimpan,
  varianSimpan = "default",
  onKirimUlang,
  onKembali,
  onSimpan,
}: {
  kiriman: KirimanOtp;
  keterangan?: ReactNode;
  catatan?: ReactNode;
  kode: string[];
  onUbahKode: (kode: string[]) => void;
  galat: string;
  menyimpan: boolean;
  labelSimpan: string;
  varianSimpan?: "default" | "destructive";
  onKirimUlang: (selesai: (k: KirimanOtp) => void, gagal: (err: unknown) => void) => void;
  onKembali: () => void;
  onSimpan: (otp: string) => void;
}) {
  const { sisa, ulang } = useHitungMundur(JEDA_KIRIM_ULANG);
  const [terkirim, setTerkirim] = useState(kiriman);
  const [status, setStatus] = useState("");
  const [kurang, setKurang] = useState(false);
  const menit = Math.max(1, Math.round(terkirim.berlakuDetik / 60));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!kodeLengkap(kode)) {
          setKurang(true);
          return;
        }
        setKurang(false);
        onSimpan(kode.join(""));
      }}
      className="flex min-w-0 flex-col gap-3"
    >
      <p className="text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
        {keterangan}
        Kode dikirim ke <strong className="text-foreground">{terkirim.email}</strong>, berlaku {menit} menit.
      </p>
      <div className="flex flex-col gap-1.5">
        <IsianKode nilai={kode} onUbah={onUbahKode} invalid={kurang} />
        {kurang && <p className="text-xs font-medium text-destructive">Masukkan 6 digit kode verifikasi.</p>}
        <KirimUlangKode
          sisa={sisa}
          onKirim={() => {
            setStatus("");
            onKirimUlang(
              (k) => {
                setTerkirim(k);
                ulang();
                setStatus("Kode baru dikirim. Periksa email Anda.");
              },
              (err) => setStatus(pesanError(err, "Kode baru gagal dikirim. Coba lagi.")),
            );
          }}
        />
        {status && (
          <p role="status" className="text-sm">
            {status}
          </p>
        )}
      </div>
      {catatan && <p className="text-xs leading-relaxed text-muted-foreground">{catatan}</p>}
      <PesanGalat pesan={galat} />
      <DialogFooter className="sm:justify-between">
        <Button type="button" variant="outline" className="min-h-11 sm:min-h-9" onClick={onKembali} disabled={menyimpan}>
          Kembali
        </Button>
        <Button type="submit" variant={varianSimpan} className="min-h-11 sm:min-h-9" disabled={menyimpan}>
          {menyimpan && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {labelSimpan}
        </Button>
      </DialogFooter>
    </form>
  );
}

export { kodeKosong };
