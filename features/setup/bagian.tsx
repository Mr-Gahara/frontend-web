import type { ReactNode } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { KELAS_TOMBOL_KEDUA, KELAS_TOMBOL_UTAMA } from "./gaya";

export function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-destructive">{pesan}</p>;
}

export function JudulLangkah({
  nomor,
  total,
  judul,
  keterangan,
  catatan,
}: {
  nomor: number;
  total: number;
  judul: string;
  keterangan: string;
  catatan?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-navy/70">
        Langkah {nomor} dari {total}
        {catatan ? ", " + catatan : ""}
      </p>
      <h1 className="text-3xl font-bold tracking-tight">{judul}</h1>
      <p className="text-[15px] leading-normal text-muted-foreground">
        {keterangan}
      </p>
    </div>
  );
}

export function KotakInfo({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-input bg-gading px-4 py-3.5 text-sm leading-normal">
      <Info className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function KotakPeringatan({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-karamel/60 bg-karamel/15 px-4 py-3.5 text-sm leading-normal"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/**
 * Tombol Kembali, Lewati (setup fitur yang boleh dilengkapi nanti), dan
 * lanjut. sibuk menahan tombol selama penyimpanan ke server berjalan.
 */
export function NavigasiLangkah({
  onKembali,
  onLanjut,
  onLewati,
  teksLanjut,
  sibuk = false,
}: {
  onKembali?: () => void;
  onLanjut?: () => void;
  onLewati?: () => void;
  teksLanjut: string;
  sibuk?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {onKembali ? (
        <button
          type="button"
          onClick={onKembali}
          disabled={sibuk}
          className={KELAS_TOMBOL_KEDUA}
        >
          Kembali
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        {onLewati && (
          <button
            type="button"
            onClick={onLewati}
            disabled={sibuk}
            className={KELAS_TOMBOL_KEDUA}
          >
            Lewati, lengkapi nanti
          </button>
        )}
        <button
          type={onLanjut ? "button" : "submit"}
          onClick={onLanjut}
          disabled={sibuk}
          className={KELAS_TOMBOL_UTAMA}
        >
          {sibuk ? "Menyimpan..." : teksLanjut}
        </button>
      </div>
    </div>
  );
}

/** Penolakan server atau syarat langkah yang belum terpenuhi. */
export function PesanGalat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {pesan}
    </p>
  );
}

export interface OpsiPilihan<T extends string> {
  nilai: T;
  label: string;
  keterangan?: string;
}

/** Kelompok tombol pilihan tunggal (aria-pressed), seperti di desain E. */
export function PilihanTombol<T extends string>({
  id,
  pertanyaan,
  opsi,
  nilai,
  onUbah,
}: {
  id: string;
  pertanyaan: string;
  opsi: readonly OpsiPilihan<T>[];
  nilai: T;
  onUbah: (nilai: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p id={id} className="text-[15px] font-semibold">
        {pertanyaan}
      </p>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2.5">
        {opsi.map((o) => {
          const aktif = o.nilai === nilai;
          return (
            <button
              key={o.nilai}
              type="button"
              aria-pressed={aktif}
              onClick={() => onUbah(o.nilai)}
              className={
                "flex min-h-12 flex-[1_1_11rem] cursor-pointer flex-col items-start justify-center gap-0.5 rounded-xl px-4 py-2.5 text-left text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel " +
                (aktif
                  ? "border-2 border-navy bg-gading"
                  : "border border-input bg-permukaan")
              }
            >
              <span className="text-[15px] font-semibold">{o.label}</span>
              {o.keterangan && (
                <span className="text-[13px] text-muted-foreground">
                  {o.keterangan}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Daftar butir yang sudah ditambahkan, dengan tombol hapus per butir. */
export function DaftarTambahan({
  judul,
  butir,
  onHapus,
}: {
  judul: string;
  butir: { id: string; label: string; keterangan?: string }[];
  /** Tanpa onHapus, butir hanya ditampilkan. */
  onHapus?: (id: string) => void;
}) {
  if (butir.length === 0) return null;
  return (
    <section aria-label={judul} className="flex flex-col gap-2.5">
      <h2 className="text-sm font-semibold">
        {judul} ({butir.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {butir.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-input bg-gading py-2 pl-4 pr-2"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-semibold">{b.label}</span>
              {b.keterangan && (
                <span className="text-[13px] text-muted-foreground">
                  {b.keterangan}
                </span>
              )}
            </span>
            {onHapus && (
              <button
                type="button"
                aria-label={"Hapus " + b.label}
                onClick={() => onHapus(b.id)}
                className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full hover:bg-krem focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
