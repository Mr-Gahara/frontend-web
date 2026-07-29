"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { decodeJWT } from "@/lib/decodeToken";

const DashboardPage = () => {
  const router = useRouter();
  
  useAuthGuard();

  useEffect(() => {
    // Ambil token untuk membedah izin (permissions)
    const token = sessionStorage.getItem("penggunaToken");
    if (!token) return; // Jika kosong, biarkan useAuthGuard yang bekerja melempar ke /login

    const payload = decodeJWT(token);
    const permissions = payload?.permissions || [];
    const role = payload?.role;
    
    // Prioritas 1 & 2: Owner bebas masuk ke Outlet sebagai default, atau Staf dengan izin Outlet
    if (role === "Owner" || permissions.includes("read-dashboard-outlet")) {
      router.replace("/dashboard/outlet");
    } 
    // Prioritas 3: Staf murni Gudang (Tidak punya akses Outlet, tapi punya akses Gudang)
    else if (permissions.includes("read-dashboard-gudang")) {
      router.replace("/dashboard/gudang");
    } 
    // Prioritas 4: Staf tanpa akses ke dasbor mana pun (Hanya bisa akses global)
    else {
      router.replace("/dashboard/profil");
    }
  }, [router]);

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