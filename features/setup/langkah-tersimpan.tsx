import { JudulLangkah, NavigasiLangkah } from "./bagian";

/**
 * Langkah satu data yang sudah tersimpan di server (nama toko, Owner,
 * lokasi, pajak, sesi booking, gudang): ringkasannya ditampilkan alih-alih
 * form, agar wizard yang dibuka ulang tidak membuat data kedua (keputusan
 * pemilik proyek, 5 November 2026). Tempat mengubahnya hanya disebut di
 * catatan, tanpa tautan: tautan ke halaman modul membawa pengguna keluar
 * dari wizard sebelum setup selesai (WS6a, kontrak/temuan.md butir 175).
 */
export function LangkahTersimpan({
  nomor,
  total,
  judul,
  baris,
  catatan,
  onLanjut,
  onKembali,
}: {
  nomor: number;
  total: number;
  judul: string;
  baris: { label: string; nilai: string }[];
  catatan: string;
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
      <NavigasiLangkah
        onKembali={onKembali}
        onLanjut={onLanjut}
        teksLanjut={nomor === total ? "Selesaikan" : "Lanjut"}
      />
    </div>
  );
}
