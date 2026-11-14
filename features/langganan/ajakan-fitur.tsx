"use client";

import Link from "next/link";
import { Lock, Wrench } from "lucide-react";
import { isApiError } from "@/lib/api/error";
import { IZIN } from "@/lib/auth/permissions";
import { NAMA_FITUR, PLAN_MINIMAL, type FiturPlan } from "@/lib/auth/fitur-plan";
import { useSession } from "@/lib/auth/useSession";
import { namaPlan } from "./data";

/**
 * Ajakan untuk fitur yang terkunci plan atau setup (butir 5, keputusan
 * pemilik proyek 5 November 2026), menggantikan pesan izin atau "Gagal
 * memuat data" untuk 403 PLAN_TIDAK_MENCAKUP dan SETUP_FITUR_BELUM_SELESAI
 * (B216, B224, B234).
 */

export const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";

const KELAS_TOMBOL =
  "inline-flex h-11 items-center justify-center rounded-lg bg-navy px-5 text-isi font-semibold text-gading transition-colors hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2";

function Bingkai({ ikon, judul, children }: { ikon: React.ReactNode; judul: string; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 px-4 py-10 text-center text-navy"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-krem">{ikon}</span>
      <p className="text-subjudul font-bold">{judul}</p>
      {children}
    </div>
  );
}

/**
 * Fitur di luar plan toko. Pemegang read-langganan diarahkan ke halaman
 * Langganan, yang memuat perbandingan plan dan kontak admin; pengguna lain
 * diminta menghubungi pemilik toko.
 */
export function AjakanNaikPlan({ fitur }: { fitur: FiturPlan }) {
  const { plan, permissions } = useSession();
  const bolehLangganan = permissions.includes(IZIN.langganan);
  return (
    <Bingkai ikon={<Lock className="h-5 w-5" aria-hidden="true" />} judul={`${NAMA_FITUR[fitur]} belum termasuk plan Anda`}>
      <p className="max-w-md text-isi text-navy/70">
        Fitur {NAMA_FITUR[fitur]} tersedia mulai plan {namaPlan(PLAN_MINIMAL[fitur])}. Toko Anda memakai plan{" "}
        {namaPlan(plan)}.
      </p>
      {bolehLangganan ? (
        <Link href={URL_LANGGANAN} className={KELAS_TOMBOL}>
          Lihat Langganan
        </Link>
      ) : (
        <p className="text-isi font-medium text-navy/60">Hubungi pemilik toko untuk naik plan.</p>
      )}
    </Bingkai>
  );
}

/** Plan mencakup fitur, tetapi setup-nya belum selesai (misalnya dilewati di wizard). */
export function AjakanLengkapiSetup({ fitur }: { fitur: FiturPlan }) {
  return (
    <Bingkai ikon={<Wrench className="h-5 w-5" aria-hidden="true" />} judul={`Setup ${NAMA_FITUR[fitur]} belum selesai`}>
      <p className="max-w-md text-isi text-navy/70">
        {fitur === "sesi-booking"
          ? "Tambahkan tipe aset, aset, dan tarif lebih dulu agar sesi booking dapat dipakai."
          : "Tambahkan gudang lebih dulu agar alur gudang dapat dipakai."}
      </p>
      <Link href="/setup" className={KELAS_TOMBOL}>
        Lengkapi setup
      </Link>
    </Bingkai>
  );
}

/**
 * Ajakan untuk galat fitur dari backend, atau null bila galatnya bukan
 * galat plan atau setup. Dipakai sebagai cabang pertama tampilan galat
 * halaman fitur, sebelum pesan galat umum.
 */
export function ajakanGalatFitur(err: unknown, fitur: FiturPlan): React.ReactNode | null {
  if (!isApiError(err) || err.status !== 403) return null;
  if (err.code === "PLAN_TIDAK_MENCAKUP") return <AjakanNaikPlan fitur={fitur} />;
  if (err.code === "SETUP_FITUR_BELUM_SELESAI") return <AjakanLengkapiSetup fitur={fitur} />;
  return null;
}
