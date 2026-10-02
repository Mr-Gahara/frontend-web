"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { pesanError } from "@/lib/api/error";
import type { AkunAdmin, DurasiLangganan } from "@/types/adminAkun";
import { useAktifkanAkun, useBekukanAkun, usePerpanjangLangganan } from "./hooks";
import {
  BATAS_ALASAN,
  PILIHAN_DURASI_BULAN,
  akibatPerpanjang,
  durasiWajibSaatAktifkan,
  payloadAktifkan,
  payloadBekukan,
  payloadPerpanjang,
} from "./langganan";

export type JenisAksi = "bekukan" | "aktifkan" | "perpanjang";

const TANPA_DURASI = "tanpa";

const TEKS: Record<JenisAksi, { judul: string; tombol: string; berhasil: string; gagal: string }> = {
  bekukan: {
    judul: "Bekukan akun",
    tombol: "Bekukan",
    berhasil: "Akun dibekukan",
    gagal: "Gagal membekukan akun.",
  },
  aktifkan: {
    judul: "Aktifkan kembali akun",
    tombol: "Aktifkan",
    berhasil: "Akun diaktifkan kembali",
    gagal: "Gagal mengaktifkan akun.",
  },
  perpanjang: {
    judul: "Perpanjang langganan",
    tombol: "Perpanjang",
    berhasil: "Langganan diperpanjang",
    gagal: "Gagal memperpanjang langganan.",
  },
};

function keterangan(jenis: JenisAksi, akun: AkunAdmin, durasiWajib: boolean): string {
  if (jenis === "bekukan") {
    return "Akun tidak dapat login, dan seluruh pengguna tokonya langsung keluar. Akun dapat diaktifkan kembali.";
  }
  if (jenis === "perpanjang") return akibatPerpanjang(akun);
  return durasiWajib
    ? "Masa akses akun ini sudah berakhir atau belum diatur, sehingga durasi langganan wajib dipilih."
    : "Akun kembali dapat login dengan masa akses yang masih berjalan.";
}

/**
 * Dialog bekukan, aktifkan, dan perpanjang. Dipasang setiap kali dibuka
 * (key berisi jenis aksi), sehingga isiannya selalu mulai kosong, dan hanya
 * tertutup saat berhasil (keputusan Fase 0); penolakan backend tampil di
 * dalam dialog.
 */
export function DialogLangganan({
  akun,
  jenis,
  onTutup,
}: {
  akun: AkunAdmin;
  jenis: JenisAksi | null;
  onTutup: () => void;
}) {
  if (!jenis) return null;
  return <IsiDialog key={jenis} akun={akun} jenis={jenis} onTutup={onTutup} />;
}

function IsiDialog({
  akun,
  jenis,
  onTutup,
}: {
  akun: AkunAdmin;
  jenis: JenisAksi;
  onTutup: () => void;
}) {
  const durasiWajib = jenis === "perpanjang" || (jenis === "aktifkan" && durasiWajibSaatAktifkan(akun));
  const [durasi, setDurasi] = useState(durasiWajib ? "" : TANPA_DURASI);
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState("");

  const opsi = {
    onSuccess: () => {
      toast.success(TEKS[jenis].berhasil, { description: akun.email });
      onTutup();
    },
    onError: (err: Error) => setGalat(pesanError(err, TEKS[jenis].gagal)),
  };
  const bekukan = useBekukanAkun(opsi);
  const aktifkan = useAktifkanAkun(opsi);
  const perpanjang = usePerpanjangLangganan(opsi);
  const memuat = bekukan.isPending || aktifkan.isPending || perpanjang.isPending;

  const kirim = () => {
    setGalat("");
    const terpilih = durasi && durasi !== TANPA_DURASI ? (Number(durasi) as DurasiLangganan) : null;
    if (jenis === "bekukan") {
      bekukan.mutate({ id: akun.id, payload: payloadBekukan(alasan) });
      return;
    }
    if (durasiWajib && !terpilih) {
      setGalat("Pilih durasi langganan.");
      return;
    }
    if (jenis === "aktifkan") {
      aktifkan.mutate({ id: akun.id, payload: payloadAktifkan(terpilih, alasan) });
      return;
    }
    if (terpilih) perpanjang.mutate({ id: akun.id, payload: payloadPerpanjang(terpilih, alasan) });
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {TEKS[jenis].judul} {akun.email}
          </DialogTitle>
          <DialogDescription>{keterangan(jenis, akun, durasiWajib)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {jenis !== "bekukan" && (
            <div className="space-y-2">
              <label htmlFor="durasi-langganan" className="text-sm font-medium">
                Durasi
              </label>
              <Select value={durasi} onValueChange={setDurasi} disabled={memuat}>
                <SelectTrigger id="durasi-langganan" className="w-full">
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  {!durasiWajib && <SelectItem value={TANPA_DURASI}>Tanpa perpanjangan</SelectItem>}
                  {PILIHAN_DURASI_BULAN.map((bulan) => (
                    <SelectItem key={bulan} value={String(bulan)}>
                      {bulan} bulan
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="alasan-langganan" className="text-sm font-medium">
              Alasan (opsional)
            </label>
            <Textarea
              id="alasan-langganan"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={BATAS_ALASAN}
              disabled={memuat}
              placeholder="Tercatat di riwayat langganan"
            />
          </div>

          {galat && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {galat}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
            Batal
          </Button>
          <Button
            type="button"
            variant={jenis === "bekukan" ? "destructive" : "default"}
            onClick={kirim}
            disabled={memuat}
          >
            {memuat ? "Menyimpan..." : TEKS[jenis].tombol}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}