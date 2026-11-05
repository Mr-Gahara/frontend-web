import Link from "next/link";
import { JudulLangkah, NavigasiLangkah } from "./bagian";

/**
 * Langkah satu data yang sudah tersimpan di server (nama toko, Owner,
 * lokasi, pajak, sesi booking, gudang): ringkasannya ditampilkan alih-alih
 * form, agar wizard yang dibuka ulang tidak membuat data kedua. Tautan
 * mengarah ke halaman modul untuk memperbaikinya (keputusan pemilik
 * proyek, 5 November 2026).
 */
export function LangkahTersimpan({
  nomor,
  total,
  judul,
  baris,
  catatan,
  tautan = [],
  onLanjut,
  onKembali,
}: {
  nomor: number;
  total: number;
  judul: string;
  baris: { label: string; nilai: string }[];
  catatan: string;
  tautan?: { href: string; teks: string }[];
  /** Diabaikan: tidak ada yang disimpan, jadi tombolnya Lanjut atau Selesaikan. */
  teksLanjut?: string;
  onLanjut: () => void;
  onKembali?: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah nomor={nomor} total={total} judul={judul} keterangan="Langkah ini sudah tersimpan." />
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 rounded-2xl border border-input px-5 py-4 text-[15px]">
        {baris.map((b) => (
          <div key={b.label} className="contents">
            <dt className="text-muted-foreground">{b.label}</dt>
            <dd className="font-semibold">{b.nilai}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-normal text-muted-foreground">{catatan}</p>
      {tautan.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {tautan.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="rounded-sm text-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                {t.teks}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NavigasiLangkah
        onKembali={onKembali}
        onLanjut={onLanjut}
        teksLanjut={nomor === total ? "Selesaikan" : "Lanjut"}
      />
    </div>
  );
}
