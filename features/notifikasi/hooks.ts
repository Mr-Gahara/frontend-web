"use client";

import { useCallback, useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";
import { IZIN, bolehBukaHalaman } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { queryKeys } from "@/lib/queryKeys";
import { ringkasLangganan } from "@/features/langganan/data";
import { useLanggananToko } from "@/features/langganan/hooks";
import { pengingatLangganan } from "@/features/langganan/pengingat";
import { useStatusSetup } from "@/features/setup/hooks";
import { fiturPerluSetup } from "@/features/setup/status";
import { keTanggalLokal } from "@/lib/waktu";
import { dashboardGudangApi } from "@/features/dashboard-gudang/api";
import { lokasiApi } from "@/features/inventaris/api";
import { useLokasiRuang } from "@/features/inventaris/hooks";
import { useRuangLokasiKerja } from "@/features/pengguna/hooks-profil";
import { absensiApi } from "@/features/absensi/api";
import { izinCutiApi } from "@/features/izin-cuti/api";
import { jadwalApi } from "@/features/jadwal/api";
import { bolehTinjauOpname } from "@/features/stock-opname/izin";
import { fiturAktif, type AksesTautan } from "./akses";
import { notifikasiApi } from "./api";
import { muatRuang, ringkasanDimuat, type RuangSumber } from "./ruang";
import { urutkanPemberitahuan, type Pemberitahuan } from "./jenis";
import { IZIN_MUAT, pemberitahuanInventaris, type DataInventaris } from "./sumber-inventaris";
import { pemberitahuanLangganan } from "./sumber-langganan";
import { pemberitahuanDiskonBerakhir, pemberitahuanMembershipBerakhir, pemberitahuanPenjualanBelumLunas } from "./sumber-penjualan";
import {
  URL_GENERATE_JADWAL,
  pemberitahuanHasilPengajuan,
  pemberitahuanIzinCuti,
  pemberitahuanJadwalMingguDepan,
  pemberitahuanKehadiran,
  rentangMingguDepan,
  waktunyaCekJadwal,
} from "./sumber-staf";
import { pemberitahuanBookingBelumLunas, pemberitahuanKasirLupa, pemberitahuanSetupFitur } from "./sumber-operasional";
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

/**
 * Penyaring ruang LN20a: sumber outlet dan gudang hanya dimuat bila ruangnya
 * terbuka bagi lokasi kerja pengguna (useRuangLokasiKerja, sama dengan
 * gerbang ruang LK3a).
 */
function useMuatRuang(): (sumber: RuangSumber) => boolean {
  const { ruang, siap } = useRuangLokasiKerja();
  return useCallback((sumber: RuangSumber) => muatRuang({ ruang, siap }, sumber), [ruang, siap]);
}

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
  const muat = useMuatRuang();
  const boleh =
    sudahMasuk && muat("outlet") && (permissions.includes(IZIN.produk) || permissions.includes(IZIN.aksesPos));
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

function useRingkasanOutletLonceng(aktif: boolean) {
  return useQuery({
    queryKey: queryKeys.notifikasi.ringkasanOutlet(),
    queryFn: notifikasiApi.ringkasanOutlet,
    enabled: aktif,
    ...OPSI_SEGAR,
  });
}

/**
 * Sumber inventaris dan gudang (LN4a). Ringkasan outlet bagi pemegang izin
 * dashboard outlet; ringkasan gudang hanya bagi yang tidak memegangnya
 * (LN17a), atau bagi staf gudang yang ruang outletnya tertutup (LN20a).
 * Backend menolak ringkasan gudang selama fitur gudang belum aktif
 * (butuhFitur WMS wajibSetup), sehingga ikut menunggu setupnya.
 */
function useInventarisLonceng(akses: AksesTautan) {
  const { sudahMasuk, permissions } = useSession();
  const muat = useMuatRuang();
  const punya = (i: string) => permissions.includes(i);
  const gudangAktif = sudahMasuk && fiturAktif(akses, "wms") && muat("gudang");
  const ringkasan = ringkasanDimuat(
    { dashboardOutlet: sudahMasuk && punya(IZIN.dashboardOutlet), dashboardGudang: punya(IZIN.dashboardGudang) },
    muat,
  );
  const ringkasanOutlet = useRingkasanOutletLonceng(ringkasan.outlet);
  const ringkasanGudang = useQuery({
    // Kunci dashboard gudang, agar aksi pengajuan dan surat jalan ikut memperbaruinya.
    queryKey: queryKeys.transferStok.ringkasanGudang(),
    queryFn: dashboardGudangApi.ringkasan,
    enabled: gudangAktif && ringkasan.gudang,
    ...OPSI_SEGAR,
  });
  const lokasiGudang = useQuery({
    // Kunci yang sama dengan useLokasiBertipe; tidak ada spec yang menunggu /location.
    queryKey: queryKeys.lokasi.daftar(),
    queryFn: lokasiApi.daftar,
    enabled: gudangAktif && punya(IZIN.location),
    select: (daftar) => daftar.find((l) => l.tipe === "Gudang")?.id ?? null,
  });
  const idGudang = lokasiGudang.data ?? null;
  const stokGudang = useQuery({
    queryKey: queryKeys.notifikasi.stokKritisGudang(idGudang ?? ""),
    queryFn: () => notifikasiApi.stokKritisLokasi(idGudang!),
    enabled: gudangAktif && !!idGudang && IZIN_MUAT.inventory.some(punya),
    ...OPSI_SEGAR,
  });
  const bolehOpname = sudahMasuk && punya(IZIN_MUAT.opname) && bolehTinjauOpname(permissions);
  const opnameOutlet = useQuery({
    queryKey: queryKeys.notifikasi.opnameMenunggu("Outlet"),
    queryFn: () => notifikasiApi.opnameMenunggu("Outlet"),
    enabled: bolehOpname && muat("outlet"),
    ...OPSI_SEGAR,
  });
  const opnameGudang = useQuery({
    queryKey: queryKeys.notifikasi.opnameMenunggu("Gudang"),
    queryFn: () => notifikasiApi.opnameMenunggu("Gudang"),
    enabled: bolehOpname && gudangAktif,
    ...OPSI_SEGAR,
  });

  const data = useMemo<DataInventaris>(
    () => ({
      ringkasanOutlet: ringkasanOutlet.data ?? null,
      ringkasanGudang: ringkasanGudang.data ?? null,
      stokKritisGudang: stokGudang.data ?? null,
      opnameMenunggu: { outlet: opnameOutlet.data ?? null, gudang: opnameGudang.data ?? null },
    }),
    [ringkasanOutlet.data, ringkasanGudang.data, stokGudang.data, opnameOutlet.data, opnameGudang.data],
  );
  const sumber: UseQueryResult<unknown>[] = [ringkasanOutlet, ringkasanGudang, stokGudang, opnameOutlet, opnameGudang];
  return { data, sumber };
}

/** Sumber operasional (LN4a): kasir lupa ditutup, setup fitur, dan booking lewat jam belum lunas. */
function useOperasionalLonceng(akses: AksesTautan) {
  const { adaTokenAkun, sudahMasuk, permissions } = useSession();
  const kini = useJamBerjalan(60_000);
  const tanggal = keTanggalLokal(kini);
  const status = useStatusSetup(adaTokenAkun && sudahMasuk);
  const muat = useMuatRuang();
  const sesiKasir = useQuery({
    queryKey: queryKeys.notifikasi.sesiKasirBuka(),
    queryFn: notifikasiApi.sesiKasirBuka,
    enabled: sudahMasuk && muat("outlet") && permissions.includes(IZIN.sesiKasir),
    ...OPSI_SEGAR,
  });
  const booking = useQuery({
    queryKey: queryKeys.notifikasi.booking(tanggal),
    queryFn: () => notifikasiApi.bookingHari(tanggal),
    enabled: sudahMasuk && muat("outlet") && permissions.includes(IZIN.booking) && fiturAktif(akses, "sesi-booking"),
    ...OPSI_SEGAR,
  });
  const daftar = useMemo(
    () => [
      pemberitahuanKasirLupa(sesiKasir.data ?? null, kini, akses),
      pemberitahuanSetupFitur(status.data ? fiturPerluSetup(status.data, permissions) : []),
      pemberitahuanBookingBelumLunas(booking.data ?? null, kini, akses),
    ],
    [sesiKasir.data, booking.data, status.data, permissions, kini, akses],
  );
  const sumber: UseQueryResult<unknown>[] = [sesiKasir, booking, status];
  return { daftar, sumber };
}

/** Sumber staf (LN4a): izin dan cuti diajukan, kehadiran hari ini, jadwal minggu depan, hasil pengajuan saya. */
function useStafLonceng(akses: AksesTautan) {
  const { sudahMasuk, permissions, pengguna } = useSession();
  const muat = useMuatRuang();
  const punya = (i: string) => permissions.includes(i);
  const kini = useJamBerjalan(60_000);
  const hariIni = keTanggalLokal(kini);
  const mingguDepan = rentangMingguDepan(kini);
  // Kehadiran dan jadwal per outlet adalah sumber ruang outlet (LN20a).
  const ruangOutlet = sudahMasuk && muat("outlet");
  const bolehKehadiran = ruangOutlet && punya(IZIN.absensi) && punya(IZIN.jadwalShift);
  const bolehJadwalDepan = ruangOutlet && waktunyaCekJadwal(kini) && bolehBukaHalaman(URL_GENERATE_JADWAL, [...permissions]);
  // Lokasi outlet (/location/current) menuntut read-location; tanpa izin itu
  // kedua sumber yang menyaring per outlet tidak dimuat.
  const outlet = useLokasiRuang("outlet", { aktif: (bolehKehadiran || bolehJadwalDepan) && punya(IZIN.location) });
  const idOutlet = outlet.lokasiId ?? "";

  const izinCuti = useQuery({
    queryKey: queryKeys.notifikasi.izinCuti(),
    queryFn: () => izinCutiApi.daftar({ status: "diajukan" }),
    enabled: sudahMasuk && punya(IZIN.izinCuti),
    ...OPSI_SEGAR,
  });
  const monitoring = useQuery({
    queryKey: queryKeys.notifikasi.monitoring(hariIni, idOutlet),
    queryFn: () => absensiApi.monitoring(hariIni, idOutlet),
    enabled: bolehKehadiran && !!idOutlet,
    ...OPSI_SEGAR,
  });
  const jadwalHariIni = useQuery({
    queryKey: queryKeys.notifikasi.jadwal(hariIni, hariIni, idOutlet),
    queryFn: () => jadwalApi.daftar({ startDate: hariIni, endDate: hariIni, locationID: idOutlet }),
    enabled: bolehKehadiran && !!idOutlet,
    ...OPSI_SEGAR,
  });
  const jadwalDepan = useQuery({
    queryKey: queryKeys.notifikasi.jadwal(mingguDepan.startDate, mingguDepan.endDate, idOutlet),
    queryFn: () => jadwalApi.daftar({ ...mingguDepan, locationID: idOutlet }),
    enabled: bolehJadwalDepan && !!idOutlet,
    ...OPSI_SEGAR,
  });
  const pengajuan = useQuery({
    queryKey: queryKeys.notifikasi.pengajuanDiputuskan(),
    queryFn: notifikasiApi.pengajuanDiputuskan,
    enabled: sudahMasuk && punya(IZIN.pengajuanStok) && fiturAktif(akses, "wms"),
    ...OPSI_SEGAR,
  });

  const idSaya = pengguna?.id ?? null;
  const daftar = useMemo(
    () => [
      pemberitahuanIzinCuti(izinCuti.data ?? null),
      pemberitahuanKehadiran(monitoring.data?.daftar ?? null, jadwalHariIni.data ?? null, kini, akses),
      pemberitahuanJadwalMingguDepan(jadwalDepan.data ?? null, kini, akses),
      pemberitahuanHasilPengajuan(pengajuan.data ?? null, idSaya, kini, akses),
    ],
    [izinCuti.data, monitoring.data, jadwalHariIni.data, jadwalDepan.data, pengajuan.data, idSaya, kini, akses],
  );
  const sumber: UseQueryResult<unknown>[] = [izinCuti, monitoring, jadwalHariIni, jadwalDepan, pengajuan];
  return { daftar, sumber };
}

/** Sumber penjualan dan pelanggan (LN4a): penjualan belum lunas, membership dan diskon berakhir. */
function usePenjualanLonceng(akses: AksesTautan) {
  const { sudahMasuk, permissions } = useSession();
  const kini = useJamBerjalan(60_000);
  // Seluruh sumber penjualan dan pelanggan adalah ruang outlet (LN20a).
  const muat = useMuatRuang();
  const ruangOutlet = sudahMasuk && muat("outlet");
  const bolehPenjualan = ruangOutlet && permissions.includes(IZIN.penjualan);
  const belumBayar = useQuery({
    queryKey: queryKeys.notifikasi.penjualan("UNPAID"),
    queryFn: () => notifikasiApi.penjualanBerstatus("UNPAID"),
    enabled: bolehPenjualan,
    ...OPSI_SEGAR,
  });
  const sebagian = useQuery({
    queryKey: queryKeys.notifikasi.penjualan("PARTIAL"),
    queryFn: () => notifikasiApi.penjualanBerstatus("PARTIAL"),
    enabled: bolehPenjualan,
    ...OPSI_SEGAR,
  });
  const membership = useQuery({
    queryKey: queryKeys.notifikasi.membership(),
    queryFn: notifikasiApi.membershipAktif,
    enabled: ruangOutlet && permissions.includes(IZIN.membership),
    ...OPSI_SEGAR,
  });
  // GET /diskon tidak memeriksa izin (diskonRoute.js), sehingga dimuat bagi semua pengguna ruang outlet.
  const diskon = useQuery({
    queryKey: queryKeys.notifikasi.diskon(),
    queryFn: notifikasiApi.diskonAktif,
    enabled: ruangOutlet,
    ...OPSI_SEGAR,
  });
  const daftar = useMemo(
    () => [
      pemberitahuanPenjualanBelumLunas({ belumBayar: belumBayar.data ?? null, sebagian: sebagian.data ?? null }, akses),
      pemberitahuanMembershipBerakhir(membership.data ?? null, kini, akses),
      pemberitahuanDiskonBerakhir(diskon.data ?? null, kini, akses),
    ],
    [belumBayar.data, sebagian.data, membership.data, diskon.data, kini, akses],
  );
  const sumber: UseQueryResult<unknown>[] = [belumBayar, sebagian, membership, diskon];
  return { daftar, sumber };
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
  const langganan = useLanggananLonceng();
  const inventaris = useInventarisLonceng(akses);
  const dataInventaris = inventaris.data;
  const operasional = useOperasionalLonceng(akses);
  const staf = useStafLonceng(akses);
  const penjualan = usePenjualanLonceng(akses);

  const daftar = useMemo<Pemberitahuan[]>(() => {
    const semua = [
      pemberitahuanStokProduk(produk.data ? pemicuStokProduk(produk.data) : null, akses),
      pemberitahuanLangganan(langganan.pengingat, akses),
      pemberitahuanProdukMinimum(dataInventaris.ringkasanOutlet?.produk.stokKritis, akses),
      ...pemberitahuanInventaris(dataInventaris, akses),
      ...operasional.daftar,
      ...staf.daftar,
      ...penjualan.daftar,
    ];
    return urutkanPemberitahuan(semua.filter((p): p is Pemberitahuan => p !== null));
  }, [produk.data, langganan.pengingat, akses, dataInventaris, operasional.daftar, staf.daftar, penjualan.daftar]);

  // Hanya sumber yang aktif (pernah dimuat) yang disegarkan.
  const sumber: UseQueryResult<unknown>[] = [produk, langganan.query, ...inventaris.sumber, ...operasional.sumber, ...staf.sumber, ...penjualan.sumber];
  const segarkan = () => {
    for (const q of sumber) if (q.isFetched) void q.refetch();
  };

  return { daftar, segarkan };
}
