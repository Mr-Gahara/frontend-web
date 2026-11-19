"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import { tujuanBukaDashboard } from "@/lib/auth/tujuan";
import { cn } from "@/lib/utils";

const DASAR =
  "inline-flex h-11 items-center justify-center rounded-lg px-5 text-isi font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Tombol akun laman utama (LU3a): tamu melihat Masuk dan Coba gratis,
 * pengunjung yang sudah masuk hanya melihat Buka dashboard. Selama sesi
 * dipulihkan, tombol tamu yang tampil agar tidak ada lompatan tata letak
 * bagi kebanyakan pengunjung.
 */
export function TombolAkun({
  varian,
  className,
}: {
  /** navbar: Masuk polos lalu Coba gratis; banner: Coba gratis lalu Masuk bergaris. */
  varian: "navbar" | "banner";
  className?: string;
}) {
  const { status, adaTokenAkun, adalahAdmin } = useSession();
  const tujuan = tujuanBukaDashboard({ status, adaTokenAkun, adalahAdmin });
  const utama = cn(DASAR, "bg-gading text-navy outline-gading hover:bg-krem");

  if (tujuan) {
    return (
      <div className={className}>
        <Link href={tujuan} className={utama}>
          Buka dashboard
        </Link>
      </div>
    );
  }

  const cobaGratis = (
    <Link href="/daftar" className={utama}>
      Coba gratis
    </Link>
  );
  if (varian === "navbar") {
    return (
      <div className={className}>
        <Link href="/login" className={cn(DASAR, "h-8 bg-gading px-3 text-navy outline-gading sm:h-11 sm:bg-transparent sm:px-5 sm:text-gading sm:hover:text-karamel")}>
          Masuk
        </Link>
        <span className="hidden sm:contents">{cobaGratis}</span>
      </div>
    );
  }
  return (
    <div className={className}>
      {cobaGratis}
      <Link href="/login" className={cn(DASAR, "border border-gading/60 text-gading outline-gading hover:bg-gading/10")}>
        Masuk
      </Link>
    </div>
  );
}
