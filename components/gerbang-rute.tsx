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
import { bolehBukaRute, syaratKurangRute } from "@/lib/auth/permissions";
import { labelSyarat } from "@/lib/auth/label-izin";
import { labelMenuRute } from "@/components/sidebar-menu";
import { useDaftarPermission } from "@/features/role/hooks";
import { fiturRute, planMencakup } from "@/lib/auth/fitur-plan";
import { AjakanNaikPlan } from "@/features/langganan/ajakan-fitur";
import { useRuangLokasiKerja } from "@/features/pengguna/hooks-profil";
import { ruangDitolak } from "@/features/pengguna/lokasi-kerja";
import { HalamanGalat } from "@/components/galat/halaman-galat";

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

  return <PesanTanpaIzin pathname={pathname} permissions={permissions} />;
}

/** Pesan di tempat untuk ruang di luar lokasi kerja pengguna (LK3a). */
export function PesanLuarLokasiKerja() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2 text-center text-navy">
      <p className="font-bold">Ruang ini di luar lokasi kerja Anda.</p>
      <p className="text-isi font-medium text-navy/60">
        Hubungi pemilik toko bila Anda perlu bekerja di lokasi lain.
      </p>
    </div>
  );
}

/**
 * 403 di area isi dashboard (desain A tertanam, pemilik proyek 12 November
 * 2026): sidebar dan topbar tetap ada. Dipakai juga halaman berpengecualian
 * role (Langganan), yang tidak menyebut izin. Dari gerbang rute pesannya
 * menyebut nama halaman dari menu dan izin yang dibutuhkan dengan deskripsi
 * backend yang mudah dipahami (pemilik proyek, 23 November 2026).
 */
export function PesanTanpaIzin({ pathname, permissions }: { pathname?: string; permissions?: readonly string[] }) {
  const kurang = pathname && permissions ? syaratKurangRute(pathname, permissions) : [];
  const halaman = pathname ? labelMenuRute(pathname) : null;
  // GET /permission terbuka bagi setiap pengguna yang masuk (authEither).
  const daftar = useDaftarPermission({ aktif: kurang.length > 0 });
  const deskripsi = new Map((daftar.data ?? []).map((p) => [p.nama, p.deskripsi ?? ""]));
  if (kurang.length === 0) return <HalamanGalat kode={403} tertanam />;
  return (
    <HalamanGalat
      kode={403}
      tertanam
      penjelasan={`Anda tidak memiliki izin membuka ${halaman ? `halaman ${halaman}` : "halaman ini"}. Minta Owner menambahkan izin berikut ke peran Anda.`}
      rincian={
        <section aria-label="Izin yang dibutuhkan" className="rounded-xl bg-krem px-4 py-3 text-navy">
          <p className="text-kecil font-bold text-navy/75">Izin yang dibutuhkan</p>
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-isi font-medium">
            {kurang.map((pilihan) => (
              <li key={pilihan.join("|")}>{labelSyarat(pilihan, deskripsi)}</li>
            ))}
          </ul>
        </section>
      }
    />
  );
}