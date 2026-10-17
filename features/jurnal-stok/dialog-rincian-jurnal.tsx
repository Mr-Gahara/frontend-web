"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { JurnalStok } from "@/types/jurnalStok";
import { formatWaktuJurnal, teksJumlahJurnal } from "./tampilan";

const KELAS_LABEL = "text-xs font-semibold text-navy/60";

function BarisRincian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className={`${KELAS_LABEL} shrink-0`}>{label}</dt>
      <dd className="text-sm font-medium text-navy text-right break-words min-w-0">{nilai}</dd>
    </div>
  );
}

function IsiRincian({ jurnal }: { jurnal: JurnalStok }) {
  const masuk = jurnal.tipeKoreksi === "Masuk";
  const Ikon = masuk ? ArrowDownLeft : ArrowUpRight;
  const waktu = formatWaktuJurnal(jurnal.tanggal);
  const lokasi = jurnal.locationID?.nama || "Lokasi Tidak Diketahui";
  return (
    <>
      <DialogHeader className="flex-row items-center gap-3 pr-8 text-left">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            masuk ? "bg-emerald-600/10 text-emerald-700" : "bg-red-500/10 text-red-800"
          }`}
        >
          <Ikon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <DialogTitle className="text-navy">
            {masuk ? "Barang masuk" : "Barang keluar"} · {jurnal.alasan}
          </DialogTitle>
          <DialogDescription className="text-navy/70 font-medium">
            {lokasi} · {waktu.tanggal}, {waktu.jam}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div>
        <p className={KELAS_LABEL}>Jumlah</p>
        <p
          className={`font-mono text-2xl sm:text-3xl font-bold ${
            masuk ? "text-emerald-700" : "text-red-800"
          }`}
        >
          {teksJumlahJurnal(jurnal)}
        </p>
      </div>

      <dl className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-permukaan">
        <BarisRincian label="Barang" nilai={jurnal.bahanBakuID?.namaBahan || "Master Data Terhapus"} />
        <BarisRincian label="Lokasi" nilai={lokasi} />
        <BarisRincian label="Waktu" nilai={`${waktu.tanggal}, pukul ${waktu.jam}`} />
        <BarisRincian label="Dicatat oleh" nilai={jurnal.dicatatOleh?.nama || "Sistem Otomatis"} />
      </dl>

      <div className="flex flex-col gap-1.5">
        <p className={KELAS_LABEL}>Keterangan</p>
        <p className="rounded-xl border border-navy/10 bg-permukaan px-4 py-3 text-sm font-medium text-navy break-words">
          {jurnal.keterangan || "-"}
        </p>
      </div>
    </>
  );
}

/**
 * Rincian satu baris jurnal stok, dibuka dari menu titik tiga di tabel
 * (keputusan TB6a dan J-A). Pencatat dan keterangan utuh pindah ke sini agar
 * tabel tidak digeser ke samping. jurnal null berarti dialog tertutup.
 */
export function DialogRincianJurnal({
  jurnal,
  onTutup,
}: {
  jurnal: JurnalStok | null;
  onTutup: () => void;
}) {
  return (
    <Dialog
      open={jurnal !== null}
      onOpenChange={(open) => {
        if (!open) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10 max-w-[92vw] sm:max-w-md">
        {jurnal && <IsiRincian jurnal={jurnal} />}
      </DialogContent>
    </Dialog>
  );
}
