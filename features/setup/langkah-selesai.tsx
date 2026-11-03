import Link from "next/link";
import { Check, Smartphone } from "lucide-react";
import { LABEL_MODEL } from "@/features/pajak/tampilan";
import type { ModelPerhitungan } from "@/types/pajak";
import { KELAS_TOMBOL_UTAMA } from "./gaya";
import { NAMA_PLAN, type PlanSetup } from "./langkah";
import type { DataSetup } from "./schema";

/**
 * Halaman setup selesai. Tombol "Buka aplikasi" menyusul saat aplikasi
 * kasir rilis (modul/setup-akun.md, Utang terbuka).
 */
export function LangkahSelesai({ data, plan }: { data: DataSetup; plan: PlanSetup }) {
  const pajak = data.pajak;
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
          Semua langkah setup plan {NAMA_PLAN[plan]} sudah selesai. Web dan aplikasi kasir sudah siap dipakai.
        </p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 rounded-2xl border border-input px-5 py-4 text-[15px]">
        <dt className="text-muted-foreground">Owner</dt>
        <dd className="font-semibold">{data.owner.nama}</dd>
        <dt className="text-muted-foreground">Outlet</dt>
        <dd className="font-semibold">{data.lokasi.nama}, titik absen terpasang</dd>
        <dt className="text-muted-foreground">Menu</dt>
        <dd className="font-semibold">
          {data.kategori.length} kategori, {data.produk.length} produk, {data.bahan.length} bahan baku
        </dd>
        {pajak && (
          <>
            <dt className="text-muted-foreground">Pajak</dt>
            <dd className="font-semibold">
              {pajak.namaPajak} {pajak.tarifPajak}%, {LABEL_MODEL[Number(pajak.modelPerhitungan) as ModelPerhitungan]}
            </dd>
          </>
        )}
        {data.booking && (
          <>
            <dt className="text-muted-foreground">Booking</dt>
            <dd className="font-semibold">
              {data.booking.namaAset}, tarif {data.booking.namaTarif}
            </dd>
          </>
        )}
        {data.gudang.nama && (
          <>
            <dt className="text-muted-foreground">Gudang</dt>
            <dd className="font-semibold">{data.gudang.nama}, titik absen terpasang</dd>
          </>
        )}
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