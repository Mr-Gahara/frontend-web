"use client";

import { useSession } from "@/lib/auth/useSession";
import { IZIN } from "@/lib/auth/permissions";
import { useDaftarLokasi } from "./hooks";
import { tentukanAksesGudang } from "./akses-gudang";

/**
 * Keputusan penjaga ruang gudang untuk halaman saat ini (keputusan GD4a).
 * Dipakai layout ruang gudang dan tur dashboard gudang, sehingga tur tidak
 * mulai sebelum penjaga mengizinkan ruang dibuka (TG2a). Lokasi dibaca dari
 * cache yang sama dengan sidebar (GD5a); `aktif` false mematikan
 * permintaannya bagi pemakai di luar ruang gudang.
 */
export function useAksesGudang(pathname: string, aktif = true) {
  const { status, permissions, sudahMasuk } = useSession();
  const lokasi = useDaftarLokasi({
    aktif: aktif && sudahMasuk && permissions.includes(IZIN.location),
  });
  const akses = tentukanAksesGudang({
    sesiMemuat: status === "memuat",
    sudahMasuk,
    permissions,
    diSetup: pathname.includes("/gudang/setup"),
    lokasi: { memuat: lokasi.isLoading, gagal: lokasi.isError, daftar: lokasi.data },
  });
  return { akses, lokasi };
}
