"use client";

/**
 * Pemulihan sesi saat aplikasi dimuat.
 *
 * Access token hanya hidup di memori, sehingga hilang setiap reload dan
 * tidak ada di tab baru. Sumber kebenarannya adalah cookie refresh
 * httpOnly milik backend. Komponen ini memulihkan sesi dengan memanggil
 * endpoint refresh: token akun dulu, lalu token pengguna.
 *
 * Refresh dikoordinasikan antar tab (lihat lib/auth/sessionChannel.ts)
 * karena backend memutar tokenVersion setiap refresh web, sehingga dua
 * refresh bersamaan akan membuat salah satunya membawa cookie basi.
 */

import { useEffect } from "react";
import { setTokenAkun, setTokenPengguna, tandaiKeluar } from "@/lib/auth/session";
import { refreshTerkoordinasi } from "@/lib/auth/sessionChannel";

const BASE_URL = "/api";
const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

async function pulihkanAkun(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/akun/auth/refreshtoken`, {
      method: "POST",
      credentials: "include",
      headers: HEADERS,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

async function pulihkanPengguna(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/pengguna/pin-refresh`, {
      method: "POST",
      credentials: "include",
      headers: HEADERS,
      // Body kosong wajib dikirim: controller backend melakukan
      // destructuring req.body dan menjawab 500 bila body tidak ada.
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      const akun = await refreshTerkoordinasi("akun", pulihkanAkun);
      if (dibatalkan) return;
      if (akun) setTokenAkun(akun);

      const pengguna = await refreshTerkoordinasi("pengguna", pulihkanPengguna);
      if (dibatalkan) return;

      if (pengguna) setTokenPengguna(pengguna);
      else tandaiKeluar();
    })();

    return () => {
      dibatalkan = true;
    };
  }, []);

  return <>{children}</>;
}