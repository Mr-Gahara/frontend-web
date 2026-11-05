import Link from "next/link";
import { Check, Smartphone } from "lucide-react";
import { namaPlan } from "@/features/langganan/data";
import type { KunciPlan } from "@/types/langganan";
import { KELAS_TOMBOL_UTAMA } from "./gaya";

/** Ringkasan data tersimpan di server untuk layar selesai. */
export interface RingkasanSetup {
  outlet: string | null;
  kategori: number;
  produk: number;
  bahan: number;
  pajak: string | null;
  booking: string | null;
  gudang: string | null;
  /** Setup fitur yang dilewati, misalnya "sesi booking"; dilengkapi nanti dari /setup. */
  dilewati: string[];
}

/**
 * Halaman setup selesai. Tombol "Buka aplikasi" menyusul saat aplikasi
 * kasir rilis (modul/setup-akun.md, Utang terbuka).
 */
export function LangkahSelesai({ ringkasan, plan }: { ringkasan: RingkasanSetup; plan: KunciPlan }) {
  const baris: [string, string | null][] = [
    ["Outlet", ringkasan.outlet && `${ringkasan.outlet}, titik absen terpasang`],
    ["Menu", `${ringkasan.kategori} kategori, ${ringkasan.produk} produk, ${ringkasan.bahan} bahan baku`],
    ["Pajak", ringkasan.pajak],
    ["Booking", ringkasan.booking],
    ["Gudang", ringkasan.gudang && `${ringkasan.gudang}, titik absen terpasang`],
  ];
  const lengkap = ringkasan.dilewati.length === 0;
  return (
    <section aria-labelledby="setup-selesai-judul" className="flex flex-col gap-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/15">
        <Check className="h-8 w-8 text-sage" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 id="setup-selesai-judul" className="text-[32px] font-bold tracking-tight">
          Toko siap dipakai
        </h1>
        <p className="text-[15px] leading-normal text-muted-foreground">
          {lengkap
            ? `Semua langkah setup plan ${namaPlan(plan)} sudah selesai. Web dan aplikasi kasir sudah siap dipakai.`
            : `Setup inti selesai, sehingga web dan aplikasi kasir sudah siap dipakai. Setup ${ringkasan.dilewati.join(
                " dan ",
              )} dilewati; fiturnya terkunci sampai dilengkapi dari halaman setup.`}
        </p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 rounded-2xl border border-input px-5 py-4 text-[15px]">
        {baris
          .filter((b): b is [string, string] => Boolean(b[1]))
          .map(([label, nilai]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold">{nilai}</dd>
            </div>
          ))}
      </dl>
      <div className="flex items-start gap-3.5 rounded-2xl bg-sage/15 px-5 py-4 text-sm leading-normal">
        <Smartphone className="mt-0.5 h-5 w-5 flex-none text-sage" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-semibold">Aplikasi kasir juga sudah siap dipakai</p>
          <p>
            Masuk di aplikasi dengan email akun toko, lalu nama dan PIN. Perangkat terikat ke pengguna yang masuk
            di perangkat itu, jadi tambahkan karyawan dari menu Pengguna sebelum mereka memakai aplikasi.
          </p>
        </div>
      </div>
      <Link href="/dashboard" className={KELAS_TOMBOL_UTAMA + " self-start"}>
        Masuk ke dashboard
      </Link>
    </section>
  );
}