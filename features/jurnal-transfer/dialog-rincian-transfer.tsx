"use client";

import { ArrowLeftRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { pesanError } from "@/lib/api/error";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JurnalTransfer } from "@/types/jurnalTransfer";
import { useDetailTransfer } from "./hooks";
import { LABEL_STATUS_TRANSFER, namaAkunTransfer } from "./payload";

const KELAS_LABEL = "text-kecil font-semibold text-navy/60";

function BarisRincian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className={`${KELAS_LABEL} shrink-0`}>{label}</dt>
      <dd className="text-isi font-medium text-navy text-right break-words min-w-0">{nilai}</dd>
    </div>
  );
}

function IsiRincian({ transfer }: { transfer: JurnalTransfer }) {
  const aktif = transfer.status === "AKTIF";
  return (
    <>
      <div>
        <p className={KELAS_LABEL}>Jumlah</p>
        <p className="font-mono text-judul sm:text-tampilan font-bold text-navy">
          {formatRupiah(transfer.jumlah)}
        </p>
      </div>

      <dl className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-permukaan">
        <BarisRincian label="Dari" nilai={namaAkunTransfer(transfer.kasSumber)} />
        <BarisRincian label="Ke" nilai={namaAkunTransfer(transfer.kasTujuan)} />
        <BarisRincian label="Tanggal" nilai={formatTanggal(transfer.tanggal)} />
        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
          <dt className={`${KELAS_LABEL} shrink-0`}>Status</dt>
          <dd className={cn("text-isi font-bold text-right", aktif ? "text-emerald-700" : "text-red-600")}>
            {LABEL_STATUS_TRANSFER[transfer.status]}
          </dd>
        </div>
        <BarisRincian label="Pencatat" nilai={transfer.dicatatOleh?.nama || "-"} />
      </dl>

      <div className="flex flex-col gap-1.5">
        <p className={KELAS_LABEL}>Keterangan</p>
        <p className="rounded-xl border border-navy/10 bg-permukaan px-4 py-3 text-isi font-medium text-navy break-words">
          {transfer.keterangan || "-"}
        </p>
      </div>

      {!aktif && transfer.catatan && (
        <div className="flex flex-col gap-1.5">
          <p className={KELAS_LABEL}>Alasan batal</p>
          <p className="rounded-xl border border-navy/10 bg-permukaan px-4 py-3 text-isi font-medium text-navy break-words">
            {transfer.catatan}
          </p>
        </div>
      )}
    </>
  );
}

/**
 * Rincian satu transfer, dibuka lewat ?transfer=<id> dari tautan di rincian
 * mutasi kas, karena riwayat Pindah Dana tidak punya halaman per transfer
 * (pemilik proyek, 20 November 2026). Datanya dari GET /jurnaltransfer/:id,
 * sehingga transfer di luar halaman riwayat yang tampil tetap terbaca. id
 * null berarti dialog tertutup.
 */
export function DialogRincianTransfer({ id, onTutup }: { id: string | null; onTutup: () => void }) {
  const detail = useDetailTransfer(id);
  return (
    <Dialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onTutup();
      }}
    >
      <DialogContent className="bg-gading border-navy/10 max-w-[92vw] sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 pr-8 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
            <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-navy">Rincian Transfer</DialogTitle>
            <DialogDescription className="text-navy/70 font-medium">
              Pindah dana antar akun kas
            </DialogDescription>
          </div>
        </DialogHeader>
        {detail.isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl bg-navy/10" />
        ) : detail.isError ? (
          <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-6 text-center text-isi font-medium text-red-600">
            {pesanError(detail.error, "Gagal memuat rincian transfer.")}
          </p>
        ) : detail.data ? (
          <IsiRincian transfer={detail.data} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
