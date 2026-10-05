"use client";

/**
 * Gerbang rute dashboard (keputusan GR1a dan GR2a).
 *
 * Dipasang sekali di app/dashboard/layout.tsx. Rute yang syaratnya di
 * IZIN_HALAMAN tidak dipenuhi pengguna tidak dipasang isinya, sehingga
 * tidak ada permintaan yang pasti dijawab 403; yang tampil pesan di tempat,
 * tanpa pengalihan. Selama sesi belum pulih, children diteruskan apa adanya:
 * guard sesi yang menentukan pengalihan, dan pesan tanpa izin tidak boleh
 * tampil sebelum daftar izin diketahui.
 */

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { bolehBukaRute } from "@/lib/auth/permissions";

export function GerbangRute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, permissions } = useSession();

  if (status !== "masuk" || bolehBukaRute(pathname, permissions)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2 text-center text-[#0A2947]">
      <p className="font-bold">Anda tidak memiliki izin membuka halaman ini.</p>
      <p className="text-sm font-medium text-[#0A2947]/60">
        Hubungi pemilik toko bila Anda memerlukannya.
      </p>
    </div>
  );
}