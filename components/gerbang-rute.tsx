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
import { fiturRute, planMencakup } from "@/lib/auth/fitur-plan";
import { AjakanNaikPlan } from "@/features/langganan/ajakan-fitur";
import { useRuangLokasiKerja } from "@/features/pengguna/hooks-profil";
import { ruangDitolak } from "@/features/pengguna/lokasi-kerja";

export function GerbangRute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, permissions, plan } = useSession();
  const lokasiKerja = useRuangLokasiKerja();
  // Fitur di luar plan didahulukan dari izin: isinya tidak dipasang, sehingga
  // tidak ada permintaan yang pasti ditolak 403 PLAN_TIDAK_MENCAKUP (butir 5).
  const fitur = fiturRute(pathname);
  if (status === "masuk" && fitur && !planMencakup(plan, fitur)) return <AjakanNaikPlan fitur={fitur} />;

  // Ruang di luar lokasi kerja ditolak seluruhnya (LK3a), setelah lokasi
  // kerja diketahui; selama dimuat isinya ditahan agar tidak ada permintaan
  // yang pasti dijawab 403 lokasi kerja.
  if (status === "masuk" && !lokasiKerja.siap) return null;
  if (status === "masuk" && ruangDitolak(pathname, lokasiKerja.ruang)) return <PesanLuarLokasiKerja />;

  if (status !== "masuk" || bolehBukaRute(pathname, permissions)) {
    return <>{children}</>;
  }

  return <PesanTanpaIzin />;
}

/** Pesan di tempat untuk ruang di luar lokasi kerja pengguna (LK3a). */
export function PesanLuarLokasiKerja() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2 text-center text-navy">
      <p className="font-bold">Ruang ini di luar lokasi kerja Anda.</p>
      <p className="text-sm font-medium text-navy/60">
        Hubungi pemilik toko bila Anda perlu bekerja di lokasi lain.
      </p>
    </div>
  );
}

/** Pesan di tempat untuk halaman yang tidak boleh dibuka; dipakai juga halaman berpengecualian role (Langganan). */
export function PesanTanpaIzin() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2 text-center text-navy">
      <p className="font-bold">Anda tidak memiliki izin membuka halaman ini.</p>
      <p className="text-sm font-medium text-navy/60">
        Hubungi pemilik toko bila Anda memerlukannya.
      </p>
    </div>
  );
}