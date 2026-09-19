"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useSession } from "@/lib/auth/useSession";

const DashboardPage = () => {
  const router = useRouter();
  
  useAuthGuard();
  const { permissions, sudahMasuk } = useSession();

  useEffect(() => {
    // Tunggu pemulihan sesi selesai sebelum memutuskan tujuan.
    if (!sudahMasuk) return;

    // Owner memegang seluruh permission di backend, sehingga pemeriksaan
    // berbasis permission sudah mencakupnya tanpa perlu cek nama role.
    if (permissions.includes("read-dashboard-outlet")) {
      router.replace("/dashboard/outlet");
    } else if (permissions.includes("read-dashboard-gudang")) {
      router.replace("/dashboard/gudang");
    } else {
      router.replace("/dashboard/profil");
    }
  }, [sudahMasuk, permissions, router]);

  // Kembalikan UI kosong dengan indikator loading yang elegan
  // karena user hanya akan melihat halaman ini selama beberapa milidetik
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <span className="animate-pulse text-sm font-medium text-slate-500">
          Memuat ruang kerja Anda...
        </span>
      </div>
    </div>
  );
};

export default DashboardPage;