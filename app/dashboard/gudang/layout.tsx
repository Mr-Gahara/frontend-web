"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { decodeJWT } from "@/lib/decodeToken";
import { apiClient } from "@/lib/apiClient";
import { LokasiListResponse } from "@/types/location";

export default function GudangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGudangAccess = async () => {
      const token = sessionStorage.getItem("penggunaToken");
      
      if (!token) {
        router.push("/login");
        return;
      }

      const payload = decodeJWT(token);
      const permissions = payload?.permissions || [];
      const role = payload?.role;

      const isOwner = role === "Owner";
      const hasGudangAccess = isOwner || permissions.includes("read-dashboard-gudang");

      // BLOKIR JIKA TIDAK ADA IZIN DASBOR GUDANG
      if (!hasGudangAccess) {
        router.replace("/dashboard");
        return;
      }

      // cek gudang udah ada atau belum
      try {
        const res = await apiClient.get<LokasiListResponse>(
          "/location", 
          undefined, 
          "pengguna"
        );
        
        // Asumsi data berada di res.data sesuai interface LokasiListResponse
        const gudangList = res.data?.filter((loc) => loc.tipe === "Gudang") || [];
        const isSetupPage = pathname.includes("/gudang/setup");

        if (gudangList.length === 0) {
          // kalau gudang belum ada: Lempar ke halaman setup (jika belum di sana)
          if (!isSetupPage) {
            const canCreateLocation = isOwner || permissions.includes("create-location");
            
            if (canCreateLocation) {
              router.replace("/dashboard/gudang/setup");
            } else {
              // Kasus langka: Staf gudang login, tapi owner belum bikin entitas Gudang-nya.
              // Tendang ke profil karena staf tidak punya izin membuat lokasi.
              router.replace("/dashboard/profil");
            }
            return;
          }
        } else {
          // kalau gudang sudah ada: Jika user iseng mau akses /setup lagi, kembalikan ke dasbor utama Gudang
          if (isSetupPage) {
            router.replace("/dashboard/gudang");
            return;
          }
        }

        // Jika lolos semua testing, izinkan rendering
        setIsAuthorized(true);
      } catch (error) {
        console.error("Gagal memverifikasi lokasi gudang:", error);
        // Jika API error (misal koneksi putus), lebih aman kembalikan ke root
        router.replace("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkGudangAccess();
  }, [router, pathname]);

  // Layar loading khusus saat melakukan fetch API ke /lokasi
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="animate-pulse text-sm font-medium text-slate-500">
            Memverifikasi data Gudang...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}