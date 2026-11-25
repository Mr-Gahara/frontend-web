"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { queryKeys } from "@/lib/queryKeys";
import { ringkasLangganan } from "@/features/langganan/data";
import { useLanggananToko } from "@/features/langganan/hooks";
import { pengingatLangganan } from "@/features/langganan/pengingat";
import { useStatusSetup } from "@/features/setup/hooks";
import type { AksesTautan } from "./akses";
import { notifikasiApi } from "./api";
import { urutkanPemberitahuan, type Pemberitahuan } from "./jenis";
import { pemberitahuanLangganan } from "./sumber-langganan";
import { pemberitahuanProdukMinimum, pemberitahuanStokProduk, pemicuStokProduk } from "./sumber-stok-produk";

/** Berkala tiap 5 menit selama tab aktif (LN6a). */
export const SELANG_SEGAR_MS = 5 * 60_000;

/**
 * Opsi penyegaran LN6a untuk setiap sumber lonceng: dimuat saat lonceng
 * dipasang (halaman dibuka atau dimuat ulang), saat tab kembali terlihat,
 * dan berkala selama tab aktif. Pembukaan panel menyegarkan lewat segarkan().
 */
const OPSI_SEGAR = {
  refetchOnMount: "always",
  refetchOnWindowFocus: "always",
  refetchInterval: SELANG_SEGAR_MS,
  refetchIntervalInBackground: false,
} as const;

/** Akses tautan dari sesi dan status setup fitur. */
export function useAksesTautan(): AksesTautan & { siap: boolean } {
  const { adaTokenAkun, sudahMasuk, permissions, plan } = useSession();
  const status = useStatusSetup(adaTokenAkun && sudahMasuk);
  return useMemo(
    () => ({
      permissions,
      plan,
      fiturSiap: {
        wms: status.data?.fitur.wms.selesai ?? false,
        "sesi-booking": status.data?.fitur["sesi-booking"].selesai ?? false,
      },
      siap: sudahMasuk,
    }),
    [permissions, plan, status.data, sudahMasuk],
  );
}

/** Seluruh produk untuk pemicu LN1a; hanya bagi pembaca produk (read-produk atau akses-pos). */
export function useProdukLonceng() {
  const { sudahMasuk, permissions } = useSession();
  const boleh = sudahMasuk && (permissions.includes(IZIN.produk) || permissions.includes(IZIN.aksesPos));
  return useQuery({ queryKey: queryKeys.notifikasi.produk(), queryFn: notifikasiApi.produk, enabled: boleh, ...OPSI_SEGAR });
}

/** Pemicu dan kartu LN1a, dipakai lonceng dan pesan halaman (LN3a). */
export function useStokProdukLonceng() {
  const akses = useAksesTautan();
  const produk = useProdukLonceng();
  return useMemo(() => {
    const pemicu = produk.data ? pemicuStokProduk(produk.data) : null;
    return { pemicu, pemberitahuan: pemberitahuanStokProduk(pemicu, akses) };
  }, [produk.data, akses]);
}

function useRingkasanOutletLonceng() {
  const { sudahMasuk, permissions } = useSession();
  return useQuery({
    queryKey: queryKeys.notifikasi.ringkasanOutlet(),
    queryFn: notifikasiApi.ringkasanOutlet,
    enabled: sudahMasuk && permissions.includes(IZIN.dashboardOutlet),
    ...OPSI_SEGAR,
  });
}

function useLanggananLonceng() {
  const { sudahMasuk, permissions } = useSession();
  const kini = useJamBerjalan(60_000);
  const langganan = useLanggananToko(sudahMasuk && permissions.includes(IZIN.langganan));
  const pengingat = useMemo(() => {
    if (!langganan.data) return null;
    // Bilah masa berlaku memakai aksesMulaiPada (B333), tanpa memuat riwayat.
    const mulai = ringkasLangganan(langganan.data, kini).mulai;
    return pengingatLangganan(langganan.data, kini, mulai);
  }, [langganan.data, kini]);
  return { query: langganan, pengingat };
}

/**
 * Seluruh pemberitahuan lonceng, diurutkan per tingkat (LN11a), beserta
 * segarkan() untuk saat panel dibuka (LN6a).
 */
export function usePemberitahuan() {
  const akses = useAksesTautan();
  const produk = useProdukLonceng();
  const ringkasanOutlet = useRingkasanOutletLonceng();
  const langganan = useLanggananLonceng();

  const daftar = useMemo<Pemberitahuan[]>(() => {
    const semua = [
      pemberitahuanStokProduk(produk.data ? pemicuStokProduk(produk.data) : null, akses),
      pemberitahuanLangganan(langganan.pengingat, akses),
      pemberitahuanProdukMinimum(ringkasanOutlet.data?.produk.stokKritis, akses),
    ];
    return urutkanPemberitahuan(semua.filter((p): p is Pemberitahuan => p !== null));
  }, [produk.data, langganan.pengingat, ringkasanOutlet.data, akses]);

  // Hanya sumber yang aktif (pernah dimuat) yang disegarkan.
  const sumber: UseQueryResult<unknown>[] = [produk, ringkasanOutlet, langganan.query];
  const segarkan = () => {
    for (const q of sumber) if (q.isFetched) void q.refetch();
  };

  return { daftar, segarkan };
}
