"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, X } from "lucide-react";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PERIODE_CEPAT, periodeCepatTerpilih, rentangPeriodeCepat, type RentangTanggal } from "@/lib/filter";
import { cn } from "@/lib/utils";

/**
 * Panel filter samping (FL1a, desain B kanvas "Popup Filter"): dari kanan
 * selebar 420 px, layar penuh di HP, berkelompok, dengan Atur ulang dan
 * Terapkan di kaki. Isian di dalamnya adalah draf; halaman menerapkannya
 * lewat onTerapkan (FL3a, hooks/use-panel-filter.ts). Dibangun langsung dari
 * Dialog Radix, bukan Sheet, karena latar dan durasi animasinya diputuskan
 * sendiri (FL5a).
 */

interface PropsPanelFilter {
  terbuka: boolean;
  onTerbukaBerubah: (terbuka: boolean) => void;
  judul?: string;
  /** Jumlah filter aktif pada draf, untuk keterangan di kepala panel. */
  jumlahAktif: number;
  onTerapkan: () => void;
  onAturUlang: () => void;
  children: ReactNode;
}

export function PanelFilter({
  terbuka,
  onTerbukaBerubah,
  judul = "Filter lainnya",
  jumlahAktif,
  onTerapkan,
  onAturUlang,
  children,
}: PropsPanelFilter) {
  return (
    <DialogPrimitive.Root open={terbuka} onOpenChange={onTerbukaBerubah}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="latar-filter-gerak fixed inset-0 z-50 bg-navy/35" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="panel-filter-gerak fixed inset-0 z-50 flex flex-col bg-gading text-navy shadow-[-16px_0_40px_rgb(10_41_71/0.2)] outline-none sm:left-auto sm:w-[420px]"
        >
          <div className="flex items-start gap-3 border-b border-navy/10 px-4 pt-4 pb-3 sm:justify-between sm:px-6 sm:pt-6 sm:pb-4">
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Tutup"
                className="cursor-pointer rounded-lg border-navy/20 bg-transparent text-navy hover:bg-navy/5 sm:order-last"
              >
                <ChevronLeft className="h-5 w-5 sm:hidden" aria-hidden="true" />
                <X className="hidden h-5 w-5 sm:block" aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
            <div className="flex flex-col gap-0.5">
              <DialogPrimitive.Title className="text-subjudul font-bold">{judul}</DialogPrimitive.Title>
              <p className="text-kecil font-semibold text-navy/60">
                {jumlahAktif > 0 ? `${jumlahAktif} filter aktif` : "Belum ada filter aktif"}
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>

          <div className="grid grid-cols-2 gap-3 border-t border-navy/10 px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={onAturUlang}
              className="h-11 cursor-pointer rounded-lg border-navy/20 bg-transparent font-bold text-navy hover:bg-navy/5"
            >
              Atur ulang
            </Button>
            <Button
              type="button"
              onClick={onTerapkan}
              className="h-11 cursor-pointer rounded-lg bg-navy font-bold text-gading hover:bg-navy/90"
            >
              Terapkan
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const KELAS_JUDUL_KELOMPOK = "text-mikro font-bold tracking-wider text-navy/60 uppercase";

/** Satu kelompok di panel; htmlFor bila isinya satu isian berlabel (Select). */
export function KelompokFilter({ judul, htmlFor, children }: { judul: string; htmlFor?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={KELAS_JUDUL_KELOMPOK}>
          {judul}
        </label>
      ) : (
        <h3 className={KELAS_JUDUL_KELOMPOK}>{judul}</h3>
      )}
      {children}
    </section>
  );
}

export interface OpsiFilter<T extends string> {
  nilai: T;
  label: string;
}

interface PropsPilihan<T extends string> {
  /** Nama aksesibel grup, sama dengan judul kelompoknya. */
  label: string;
  /** undefined berarti Semua. */
  nilai: T | undefined;
  opsi: OpsiFilter<T>[];
  onUbah: (nilai: T | undefined) => void;
  /** Teks pilihan kosong; null bila kelompok ini tidak punya pilihan Semua. */
  labelSemua?: string | null;
}

/** Pilihan tetap 5 ke atas berupa pil (FL10a). */
export function PilihanPil<T extends string>({ label, nilai, opsi, onUbah, labelSemua = "Semua" }: PropsPilihan<T>) {
  const semua = labelSemua === null ? [] : [{ nilai: undefined, label: labelSemua }];
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {[...semua, ...opsi].map((o) => {
        const terpilih = o.nilai === nilai;
        return (
          <button
            key={o.nilai ?? "__semua"}
            type="button"
            aria-pressed={terpilih}
            onClick={() => onUbah(o.nilai)}
            className={cn(
              "h-8 cursor-pointer rounded-full border px-3 text-isi font-semibold focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:outline-none",
              terpilih ? "border-navy bg-navy text-gading" : "border-navy/20 bg-permukaan text-navy hover:border-navy/40",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Pilihan tetap 2 sampai 4 berupa segmen (FL10a). */
export function PilihanSegmen<T extends string>({ label, nilai, opsi, onUbah, labelSemua = "Semua" }: PropsPilihan<T>) {
  const semua = labelSemua === null ? [] : [{ nilai: undefined, label: labelSemua }];
  const semuaOpsi = [...semua, ...opsi];
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-krem p-1"
      style={{ gridTemplateColumns: `repeat(${semuaOpsi.length}, minmax(0, 1fr))` }}
    >
      {semuaOpsi.map((o) => {
        const terpilih = o.nilai === nilai;
        return (
          <button
            key={o.nilai ?? "__semua"}
            type="button"
            aria-pressed={terpilih}
            onClick={() => onUbah(o.nilai)}
            className={cn(
              "h-9 min-w-0 cursor-pointer truncate rounded-lg px-1 text-kecil sm:px-2 sm:text-isi focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:outline-none",
              terpilih ? "bg-gading font-bold text-navy shadow-sm" : "font-semibold text-navy/70 hover:text-navy",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface PropsPilihanPeriode {
  idAwalan: string;
  rentang: RentangTanggal;
  onUbah: (rentang: RentangTanggal) => void;
  hariIni: Date;
  labelDari?: string;
  labelSampai?: string;
  /** Dari tidak boleh setelah Sampai, bagi halaman yang sudah membatasinya. */
  batasiUrutan?: boolean;
  /** Tanggal tidak boleh kosong (laporan); tombol Kosongkan tidak ditawarkan. */
  wajib?: boolean;
}

/** Periode: pil cepat di atas dua isian tanggal (FL2a, FL12a). */
export function PilihanPeriode({
  idAwalan,
  rentang,
  onUbah,
  hariIni,
  labelDari = "Dari tanggal",
  labelSampai = "Sampai tanggal",
  batasiUrutan = false,
  wajib = false,
}: PropsPilihanPeriode) {
  const cepat = periodeCepatTerpilih(rentang, hariIni);
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Periode cepat" className="flex flex-wrap gap-2">
        {PERIODE_CEPAT.map((p) => {
          const terpilih = p.jenis === cepat;
          return (
            <button
              key={p.jenis}
              type="button"
              aria-pressed={terpilih}
              onClick={() => onUbah(rentangPeriodeCepat(p.jenis, hariIni))}
              className={cn(
                "h-8 cursor-pointer rounded-full border px-3 text-isi font-semibold focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:outline-none",
                terpilih ? "border-navy bg-navy text-gading" : "border-navy/20 bg-permukaan text-navy hover:border-navy/40",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${idAwalan}-dari`} className="text-kecil font-bold text-navy/70">
            {labelDari}
          </label>
          <PilihTanggal
            id={`${idAwalan}-dari`}
            label={labelDari}
            placeholder="Semua tanggal"
            value={rentang.dari}
            onChange={(dari) => onUbah({ ...rentang, dari })}
            onKosongkan={wajib ? undefined : () => onUbah({ ...rentang, dari: undefined })}
            tanggalNonaktif={batasiUrutan && rentang.sampai ? { after: rentang.sampai } : undefined}
            className="h-10 w-full sm:h-11"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${idAwalan}-sampai`} className="text-kecil font-bold text-navy/70">
            {labelSampai}
          </label>
          <PilihTanggal
            id={`${idAwalan}-sampai`}
            label={labelSampai}
            placeholder="Semua tanggal"
            value={rentang.sampai}
            onChange={(sampai) => onUbah({ ...rentang, sampai })}
            onKosongkan={wajib ? undefined : () => onUbah({ ...rentang, sampai: undefined })}
            tanggalNonaktif={batasiUrutan && rentang.dari ? { before: rentang.dari } : undefined}
            className="h-10 w-full sm:h-11"
          />
        </div>
      </div>
    </div>
  );
}

/** Kelas pemicu Select di dalam panel, agar setinggi isian lain. */
export const KELAS_PEMICU_PANEL = "h-10 w-full cursor-pointer border-navy/20 bg-permukaan text-navy sm:h-11";

const SEMUA = "__semua";

/**
 * Daftar dari data (akun kas, kategori, bahan, mesin kasir) sebagai Select
 * di dalam panel (FL10a). Nilai kosong berarti Semua.
 */
export function PilihDaftar({
  id,
  nilai,
  onUbah,
  labelSemua,
  opsi,
  disabled,
}: {
  id: string;
  nilai: string;
  onUbah: (nilai: string) => void;
  labelSemua: string;
  opsi: { id: string; nama: string }[];
  disabled?: boolean;
}) {
  return (
    <Select value={nilai || SEMUA} onValueChange={(v) => onUbah(v === SEMUA ? "" : v)} disabled={disabled}>
      <SelectTrigger id={id} className={KELAS_PEMICU_PANEL}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SEMUA}>{labelSemua}</SelectItem>
        {opsi.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
