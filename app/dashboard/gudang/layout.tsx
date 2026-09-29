"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { IZIN } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { tentukanAksesGudang, tujuanAksesGudang } from "@/features/inventaris/akses-gudang";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

/**
 * Penjaga ruang gudang (keputusan GD4a). Keputusannya ada di
 * tentukanAksesGudang: pengalihan hanya ke tujuan yang tidak mengirim
 * balik ke ruang gudang, sedangkan galat memuat lokasi, gudang yang belum
 * ada bagi pengguna tanpa create-location, dan setup tanpa read-location
 * tampil sebagai pesan di tempat. Lokasi dimuat lewat useDaftarLokasi,
 * sehingga tidak diminta ulang di setiap perpindahan halaman dan berbagi
 * cache dengan sidebar (keputusan GD5a). Nama role tidak diperiksa:
 * Owner memegang seluruh permission (keputusan rancangan butir 2).
 */
export default function GudangLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, permissions, sudahMasuk } = useSession();
  const lokasi = useDaftarLokasi({
    aktif: sudahMasuk && permissions.includes(IZIN.location),
  });
  const akses = tentukanAksesGudang({
    sesiMemuat: status === "memuat",
    sudahMasuk,
    permissions,
    diSetup: pathname.includes("/gudang/setup"),
    lokasi: { memuat: lokasi.isLoading, gagal: lokasi.isError, daftar: lokasi.data },
  });
  const tujuan = tujuanAksesGudang(akses);

  useEffect(() => {
    if (tujuan) router.replace(tujuan);
  }, [tujuan, router]);

  if (akses === "izinkan") return <>{children}</>;

  if (akses === "gagal") {
    return (
      <div className="p-6">
        <PesanLokasi
          judul="Gagal Memuat Data Gudang"
          isi="Data lokasi tidak dapat dimuat. Periksa koneksi Anda, lalu coba lagi."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => lokasi.refetch()} disabled={lokasi.isFetching}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (akses === "belum-ada") {
    return (
      <div className="p-6">
        <PesanLokasi
          judul="Gudang Belum Didaftarkan"
          isi="Tenant ini belum memiliki Gudang. Hubungi pemilik toko untuk mendaftarkan Gudang sebelum memakai ruang gudang."
        />
      </div>
    );
  }

  if (akses === "tanpa-izin-lokasi") {
    return (
      <div className="p-6">
        <PesanLokasi
          judul="Izin Lokasi Dibutuhkan"
          isi="Setup Gudang membutuhkan izin melihat lokasi, agar Gudang tidak terdaftar ganda. Hubungi pemilik toko."
        />
      </div>
    );
  }

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
