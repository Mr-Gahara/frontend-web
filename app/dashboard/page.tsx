"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { IZIN } from "@/lib/auth/permissions";
import { useRuangLokasiKerja } from "@/features/pengguna/hooks-profil";

const DashboardPage = () => {
  const router = useRouter();
  
  const { permissions, sudahMasuk } = useSession();
  const { ruang, siap } = useRuangLokasiKerja();

  useEffect(() => {
    // Tunggu pemulihan sesi dan lokasi kerja selesai sebelum memutuskan tujuan.
    if (!sudahMasuk || !siap) return;

    // Owner memegang seluruh permission di backend, sehingga pemeriksaan
    // berbasis permission sudah mencakupnya tanpa perlu cek nama role.
    // Ruang di luar lokasi kerja dilewati (LK3a).
    if (permissions.includes(IZIN.dashboardOutlet) && ruang !== "gudang") {
      router.replace("/dashboard/outlet");
    } else if (permissions.includes(IZIN.dashboardGudang) && ruang !== "outlet") {
      router.replace("/dashboard/gudang");
    } else {
      router.replace("/dashboard/profil");
    }
  }, [sudahMasuk, siap, ruang, permissions, router]);

  // Kembalikan UI kosong dengan indikator loading yang elegan
  // karena user hanya akan melihat halaman ini selama beberapa milidetik
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <span className="animate-pulse text-isi font-medium text-slate-500">
          Memuat ruang kerja Anda...
        </span>
      </div>
    </div>
  );
};

export default DashboardPage;