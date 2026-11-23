"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PemilihBulan } from "./pemilih-bulan";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { pesanError } from "@/lib/api/error";
import { cn } from "@/lib/utils";
import { PILIHAN_FORMAT_DAFTAR, geserBulan, keBulan, simpanBerkas, type FormatDaftar } from "@/lib/unduh";

export type PermintaanUnduh = { format: FormatDaftar; bulan?: string };

type PropsDialogUnduh = {
  /** Nama data, misalnya "daftar penjualan", untuk judul dan pesan. */
  namaData: string;
  /** Label filter yang sedang aktif dan ikut diterapkan pada berkas. */
  filterAktif?: string[];
  /** Stok saat ini: potret hari ini tanpa pilihan bulan (P85 butir 4). */
  tanpaBulan?: boolean;
  unduh: (permintaan: PermintaanUnduh) => Promise<{ berkas: Blob; nama: string }>;
  className?: string;
};

/**
 * Tombol "Unduh" di kepala laman daftar yang membuka dialog kecil: pilih
 * bulan (bawaan bulan berjalan) dan format CSV atau Excel; filter lain yang
 * aktif ikut diterapkan dan disebut di dialog (pemilik proyek, 23 November
 * 2026; backend P85, ekspor wajib ?bulan=YYYY-MM dan paling banyak 10.000
 * baris).
 */
export function DialogUnduhBulan({ namaData, filterAktif = [], tanpaBulan = false, unduh, className }: PropsDialogUnduh) {
  const [buka, setBuka] = useState(false);
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="aksi"
          variant="outline"
          className={cn("cursor-pointer border-navy/20 bg-permukaan text-navy hover:bg-navy/5 w-full sm:w-auto", className)}
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Unduh
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-navy/10 bg-gading text-navy sm:max-w-[440px] sm:rounded-[20px]">
        {buka && (
          <IsiDialogUnduh
            namaData={namaData}
            filterAktif={filterAktif}
            tanpaBulan={tanpaBulan}
            unduh={unduh}
            selesai={() => setBuka(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function IsiDialogUnduh({
  namaData,
  filterAktif,
  tanpaBulan,
  unduh,
  selesai,
}: Omit<PropsDialogUnduh, "className"> & { filterAktif: string[]; tanpaBulan: boolean; selesai: () => void }) {
  const hariIni = useTanggalHariIni();
  const [bulan, setBulan] = useState(() => geserBulan(hariIni, 0));
  const [format, setFormat] = useState<FormatDaftar>("xlsx");
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const kirim = async () => {
    setMemuat(true);
    setGalat("");
    try {
      const { berkas, nama } = await unduh(tanpaBulan ? { format } : { format, bulan: keBulan(bulan) });
      simpanBerkas(berkas, nama);
      selesai();
    } catch (e) {
      setGalat(pesanError(e, "Berkas gagal diunduh."));
    } finally {
      setMemuat(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-judul font-bold text-navy">Unduh {namaData}</DialogTitle>
        <DialogDescription className="text-isi text-navy/70">
          {tanpaBulan
            ? "Stok tercatat saat ini, paling banyak 10.000 baris."
            : "Satu bulan kalender, paling banyak 10.000 baris."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-[18px]">
        {!tanpaBulan && (
          <div className="flex flex-col gap-1.5">
            <span id="unduh-bulan-label" className="text-isi font-bold">
              Bulan
            </span>
            <PemilihBulan bulan={bulan} onUbah={setBulan} hariIni={hariIni} idLabel="unduh-bulan-label" />
          </div>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-isi font-bold">Format</legend>
          <div className="grid grid-cols-2 gap-2">
            {PILIHAN_FORMAT_DAFTAR.map((p) => (
              <label
                key={p.format}
                className={cn(
                  "flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border text-isi font-bold",
                  format === p.format ? "border-navy bg-navy text-gading" : "border-navy/20 bg-permukaan text-navy",
                )}
              >
                <input
                  type="radio"
                  name="format-unduh"
                  value={p.format}
                  checked={format === p.format}
                  onChange={() => setFormat(p.format)}
                  className="sr-only"
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="rounded-[10px] bg-krem px-3.5 py-3 text-kecil font-medium text-navy/80">
          {filterAktif.length > 0 ? (
            <>
              <p className="font-bold text-navy">Filter yang ikut diterapkan</p>
              <ul className="mt-1 list-disc pl-4">
                {filterAktif.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>Tanpa filter lain: seluruh data {tanpaBulan ? "stok" : "bulan itu"} ikut diunduh.</p>
          )}
        </div>

        {galat && (
          <p role="alert" className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-isi font-bold text-red-600">
            {galat}
          </p>
        )}
      </div>

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={selesai}
          disabled={memuat}
          className="cursor-pointer w-full sm:w-auto border-navy/20 text-navy hover:bg-navy/5 font-bold"
        >
          Batal
        </Button>
        <Button
          type="button"
          onClick={kirim}
          disabled={memuat}
          className="cursor-pointer w-full sm:w-auto bg-navy text-gading hover:bg-navy/90 font-bold"
        >
          {memuat ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {memuat ? "Mengunduh..." : "Unduh"}
        </Button>
      </DialogFooter>
    </>
  );
}
