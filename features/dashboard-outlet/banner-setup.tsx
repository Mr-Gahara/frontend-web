"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { NAMA_FITUR } from "@/lib/auth/fitur-plan";
import { useSession } from "@/lib/auth/useSession";
import { useStatusSetup } from "@/features/setup/hooks";
import { fiturPerluSetup } from "@/features/setup/status";

/**
 * Banner jalan kembali ke /setup bagi setup fitur yang dilewati di wizard
 * (keputusan pemilik proyek, 5 November 2026): hanya untuk pemegang izin
 * buat data setup fitur itu. Tidak tampil selama status belum termuat atau
 * gagal dimuat, karena halaman fiturnya tetap menampilkan ajakan sendiri.
 */
export function BannerSetupFitur() {
  const { adaTokenAkun, sudahMasuk, permissions } = useSession();
  const status = useStatusSetup(adaTokenAkun && sudahMasuk);
  if (!status.data) return null;
  const fitur = fiturPerluSetup(status.data, permissions);
  if (fitur.length === 0) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-karamel/30 bg-krem px-4 py-3 text-navy sm:px-5"
    >
      <p className="flex items-center gap-2.5 text-isi">
        <Wrench className="h-4 w-4 flex-none" aria-hidden="true" />
        Setup {fitur.map((f) => NAMA_FITUR[f]).join(" dan ")} belum selesai, sehingga fiturnya masih terkunci.
      </p>
      <Link
        href="/setup"
        className="inline-flex h-10 items-center rounded-lg bg-navy px-4 text-isi font-semibold text-gading hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
      >
        Lengkapi setup
      </Link>
    </div>
  );
}
