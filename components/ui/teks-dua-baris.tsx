import { cn } from "@/lib/utils";

/**
 * Teks sel tabel di kolom ber-meta.lebarBungkus (components/ui/data-table.tsx):
 * mulai lebar sm paling banyak dua baris, sisanya "…" dengan teks lengkap di
 * tooltip (pemilik proyek, 14 November 2026; modul/ui-ux.md CV1a dan CV12a).
 * Kartu HP tidak dibatasi.
 */
export function TeksDuaBaris({ teks, className }: { teks: string; className?: string }) {
  return (
    <span title={teks} className={cn("block sm:line-clamp-2", className)}>
      {teks}
    </span>
  );
}
