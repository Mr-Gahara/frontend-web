"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/decodeToken";

export default function OutletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("penggunaToken");
    
    // Jika tidak ada sesi, tendang ke halaman login
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = decodeJWT(token);
    const permissions = payload?.permissions || [];
    const role = payload?.role;

    // Owner memiliki hak absolut. Staf harus memiliki izin eksplisit.
    if (role === "Owner" || permissions.includes("read-dashboard-outlet")) {
      setIsAuthorized(true);
    } else {
      // Jika menyusup, kembalikan ke root dashboard agar Traffic Controller yang memutuskan ke mana pengguna harus dibuang (Gudang atau Profil).
      router.replace("/dashboard");
    }
  }, [router]);

  // Mencegah "Flicker" (kedipan UI). 
  // Layar akan kosong putih selama beberapa milidetik sebelum validasi selesai,
  // sehingga user tidak sempat melihat isi halaman terlarang.
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}