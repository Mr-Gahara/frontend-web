"use client";

import { usePathname } from "next/navigation";
import { useKesiapanToko } from "./hooks";
import { KartuPemberitahuan } from "./kartu-pemberitahuan";
import type { KunciLangkahKesiapan } from "./kesiapan";

/**
 * Kotak langkah kesiapan toko di halaman tujuan kartu "Siapkan toko"
 * (PW19, KS3a dan KS9a): isinya sama dengan kartu lonceng, seperti pesan
 * halaman LN15a, dan tampil hanya selama langkah yang sedang berjalan adalah
 * salah satu `langkah` halaman ini. Hilang sendiri begitu langkahnya selesai.
 * Tautan yang menuju halaman ini sendiri tidak ditampilkan.
 */
export function KotakKesiapan({ langkah, className }: { langkah: readonly KunciLangkahKesiapan[]; className?: string }) {
  const pathname = usePathname();
  const { keadaan, pemberitahuan, nyatakanHanyaOwner } = useKesiapanToko();
  if (!keadaan || !pemberitahuan || !langkah.includes(keadaan.langkah.kunci)) return null;
  const isi = { ...pemberitahuan, tautan: pemberitahuan.tautan.filter((t) => t.href !== pathname) };
  return (
    <div role="status" className={className}>
      <KartuPemberitahuan
        pemberitahuan={isi}
        onTombol={() => nyatakanHanyaOwner()}
        className="border border-navy/10 sm:px-5"
      />
    </div>
  );
}
