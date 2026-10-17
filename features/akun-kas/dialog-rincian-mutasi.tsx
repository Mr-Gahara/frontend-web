"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah, formatTanggal, formatTanggalPendek } from "@/lib/format";
import type { MutasiKas } from "@/types/akunKas";
import {
  LABEL_JENIS,
  namaPencatat,
  tanggalTransaksiBerbeda,
  tautanPenjualanMutasi,
  teksJumlahMutasi,
} from "./mutasi";

const KELAS_LABEL = "text-xs font-semibold text-navy/60";

function BarisRincian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className={`${KELAS_LABEL} shrink-0`}>{label}</dt>
      <dd className="text-sm font-medium text-navy text-right break-words min-w-0">{nilai}</dd>
    </div>
  );
}

function IsiRincian({ mutasi, namaAkun }: { mutasi: MutasiKas; namaAkun: string }) {
  const masuk = mutasi.arah === "MASUK";
  const Ikon = masuk ? ArrowDownLeft : ArrowUpRight;
  const tautan = tautanPenjualanMutasi(mutasi);
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
          <DialogTitle className="text-navy">{LABEL_JENIS[mutasi.jenis]}</DialogTitle>
          <DialogDescription className="text-navy/70 font-medium">
            {namaAkun} · {formatTanggal(mutasi.createdAt)}
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
          {teksJumlahMutasi(mutasi)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-krem px-4 py-3">
        <div className="min-w-0">
          <p className={KELAS_LABEL}>Saldo sebelum</p>
          <p className="font-mono text-sm font-bold text-navy">{formatRupiah(mutasi.saldoSebelum)}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-karamel" aria-hidden="true" />
        <div className="min-w-0 text-right">
          <p className={KELAS_LABEL}>Saldo sesudah</p>
          <p className="font-mono text-sm font-bold text-navy">{formatRupiah(mutasi.saldoSesudah)}</p>
        </div>
      </div>

      <dl className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-permukaan">
        <BarisRincian label="Dicatat" nilai={formatTanggal(mutasi.createdAt)} />
        {tanggalTransaksiBerbeda(mutasi) && (
          <BarisRincian label="Tanggal transaksi" nilai={formatTanggalPendek(mutasi.tanggal)} />
        )}
        <BarisRincian label="Akun kas" nilai={namaAkun} />
        <BarisRincian label="Pencatat" nilai={namaPencatat(mutasi)} />
      </dl>

      <div className="flex flex-col gap-1.5">
        <p className={KELAS_LABEL}>Keterangan</p>
        <p className="rounded-xl border border-navy/10 bg-permukaan px-4 py-3 text-sm font-medium text-navy break-words">
          {mutasi.keterangan || "-"}
        </p>
      </div>

      {tautan && (
        <div className="flex flex-col gap-1.5">
          <p className={KELAS_LABEL}>Penjualan terkait</p>
          <Link
            href={tautan.url}
            className="flex items-center justify-between gap-3 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-gading hover:bg-navy/90"
          >
            <span className="min-w-0 truncate">{tautan.teks}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      )}
    </>
  );
}

/**
 * Rincian satu baris mutasi, dibuka dari menu titik tiga di tabel. Kolom
 * yang tidak muat di tabel (saldo, pencatat, keterangan utuh, dan tautan
 * penjualan, keputusan NZ2a) ditampilkan di sini, agar tabel tidak digeser
 * ke samping. mutasi null berarti dialog tertutup.
 */
export function DialogRincianMutasi({
  mutasi,
  namaAkun,
  onTutup,
}: {
  mutasi: MutasiKas | null;
  namaAkun: string;
  onTutup: () => void;
}) {
  return (
    <Dialog
      open={mutasi !== null}
      onOpenChange={(open) => {
        if (!open) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10 max-w-[92vw] sm:max-w-md">
        {mutasi && <IsiRincian mutasi={mutasi} namaAkun={namaAkun} />}
      </DialogContent>
    </Dialog>
  );
}