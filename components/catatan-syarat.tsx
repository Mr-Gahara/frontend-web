"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bolehBukaHalaman } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { cn } from "@/lib/utils";

/**
 * Catatan syarat yang belum ada di halaman atau dialog (PW18, KS12a):
 * kalimat apa yang perlu dibuat lebih dulu beserta tautan ke halamannya.
 * Tautan hanya bagi yang boleh membuka halaman itu (IZIN_HALAMAN), sama
 * dengan sidebar dan gerbang halaman.
 */
export function CatatanSyarat({
  isi,
  tautan,
  className,
}: {
  isi: string;
  tautan?: { href: string; label: string };
  className?: string;
}) {
  const { permissions } = useSession();
  const boleh = tautan && bolehBukaHalaman(tautan.href.split("?")[0], [...permissions]);
  return (
    <div
      role="note"
      aria-label="Syarat belum ada"
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-karamel/30 bg-krem p-3.5 text-isi text-navy sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="flex items-start gap-2 font-semibold">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-karamel-tua" aria-hidden="true" />
        {isi}
      </p>
      {boleh && (
        <Button asChild size="sm" variant="outline" className="shrink-0 border-navy/20 bg-gading text-navy">
          <Link href={tautan.href}>{tautan.label}</Link>
        </Button>
      )}
    </div>
  );
}
