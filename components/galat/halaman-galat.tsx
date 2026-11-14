"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TandaTachyon } from "@/features/auth/tanda-tachyon";
import { cn } from "@/lib/utils";

export type KodeGalat = 400 | 403 | 404 | 500;

/** Teks tiap kode galat (desain A, pemilik proyek 12 November 2026). */
export const ISI_GALAT: Record<KodeGalat, { judul: string; isi: string }> = {
  400: {
    judul: "Permintaan tidak valid",
    isi: "Tautan yang Anda buka rusak atau tidak lengkap.",
  },
  403: {
    judul: "Akses ditolak",
    isi: "Anda tidak memiliki izin membuka halaman ini. Minta Owner menambahkan izinnya.",
  },
  404: {
    judul: "Halaman tidak ditemukan",
    isi: "Alamat yang Anda buka tidak ada atau sudah dipindah. Periksa lagi alamatnya, atau kembali ke dashboard.",
  },
  500: {
    judul: "Terjadi kesalahan",
    isi: "Halaman ini gagal dimuat. Coba lagi; bila masih gagal, hubungi admin Tachyon dengan kode galat di bawah.",
  },
};

const KELAS_TOMBOL =
  "inline-flex h-[54px] w-full cursor-pointer items-center justify-center rounded-xl bg-navy text-base font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2";
const KELAS_TAUTAN =
  "cursor-pointer rounded-sm font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel";

/** Kembali ke halaman sebelumnya, atau ke dashboard bila halaman dibuka langsung. */
function TautanKembali() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/dashboard"))}
      className={cn(KELAS_TAUTAN, "self-start text-[15px]")}
    >
      Kembali ke halaman sebelumnya
    </button>
  );
}

/**
 * Halaman galat desain A (pemilik proyek, 12 November 2026), bergaya halaman
 * daftar dan verifikasi: panel krem berisi tanda Tachyon, label "Kode
 * galat", angka kode besar navy, dan kalimat bahwa data toko aman; di
 * sampingnya judul, penjelasan, tombol navy, dan tautan karamel. Halaman
 * penuh untuk 404 dan 500; `tertanam` untuk area isi dashboard (403), agar
 * sidebar dan topbar tetap ada. Di layar sempit panel krem di atas.
 */
export function HalamanGalat({
  kode,
  tertanam = false,
  onCobaLagi,
  kodeGalat,
}: {
  kode: KodeGalat;
  tertanam?: boolean;
  /** 500: tombol utama menjadi "Coba lagi". */
  onCobaLagi?: () => void;
  /** 500: identitas galat server (digest) untuk dilaporkan ke admin. */
  kodeGalat?: string;
}) {
  const { judul, isi } = ISI_GALAT[kode];
  // Di dalam dashboard sudah ada <main>; landmark kedua tidak dipasang.
  const Isi = tertanam ? "div" : "main";
  return (
    <div
      className={cn(
        "flex flex-wrap gap-4 sm:gap-5 bg-permukaan text-navy",
        tertanam ? "w-full rounded-[28px] p-0" : "min-h-screen p-4 sm:p-5",
      )}
    >
      <aside
        className={cn(
          "flex min-w-0 flex-[1_1_100%] sm:flex-[1_1_420px] flex-col justify-between gap-5 sm:gap-7 rounded-[28px] bg-krem p-6 sm:p-10",
          tertanam && "sm:flex-[1_1_320px]",
        )}
      >
        <div className="flex items-center gap-3">
          <TandaTachyon ukuran={34} />
          <span className="text-lg font-bold">Tachyon POS</span>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/75">Kode galat</p>
          <p aria-hidden="true" className="text-[88px] sm:text-[120px] font-black leading-none tracking-tighter">
            {kode}
          </p>
        </div>
        <p className="max-w-100 text-[15px] text-abu-teks">
          Data toko Anda aman. Halaman ini hanya tidak dapat ditampilkan.
        </p>
      </aside>

      <Isi className="flex min-w-0 flex-[1_1_100%] sm:flex-[1_1_380px] items-center justify-center px-2 py-4 sm:py-10">
        <div className="flex w-full max-w-100 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">{judul}</h1>
            <p className="text-[15px] text-muted-foreground">{isi}</p>
          </div>
          {onCobaLagi ? (
            <button type="button" onClick={onCobaLagi} className={KELAS_TOMBOL}>
              Coba lagi
            </button>
          ) : (
            <Link href="/dashboard" className={KELAS_TOMBOL}>
              Ke dashboard
            </Link>
          )}
          {onCobaLagi ? (
            <Link href="/dashboard" className={cn(KELAS_TAUTAN, "self-start text-[15px]")}>
              Ke dashboard
            </Link>
          ) : (
            kode !== 403 && <TautanKembali />
          )}
          {kodeGalat && (
            <p className="text-xs text-navy/60">
              Kode galat: <span className="font-mono">{kodeGalat}</span>
            </p>
          )}
        </div>
      </Isi>
    </div>
  );
}
