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
import { fiturSetupPengguna } from "@/features/setup/status";
import { keTanggalLokal } from "@/lib/waktu";
import { dashboardGudangApi } from "@/features/dashboard-gudang/api";
import { lokasiApi } from "@/features/inventaris/api";
import { useLokasiRuang } from "@/features/inventaris/hooks";
import { useRuangLokasiKerja } from "@/features/pengguna/hooks-profil";
import { aksesRuang } from "@/features/pengguna/lokasi-kerja";
import { absensiApi } from "@/features/absensi/api";
import { izinCutiApi } from "@/features/izin-cuti/api";
import { jadwalApi } from "@/features/jadwal/api";
import { penggunaApi } from "@/features/pengguna/api";
import { polaRosterApi } from "@/features/pola-roster/api";
import { shiftApi } from "@/features/shift/api";
import { bolehTinjauOpname } from "@/features/stock-opname/izin";
import { fiturAktif, type AksesTautan } from "./akses";
import { notifikasiApi } from "./api";
import { muatRuang, ringkasanDimuat, saringKartuRuang, type AksesRuangSesi, type RuangSumber } from "./ruang";
import { urutkanPemberitahuan, type Pemberitahuan } from "./jenis";
import { keadaanKesiapan, langkahKesiapan, pemberitahuanKesiapan } from "./kesiapan";
import { IZIN_MUAT, pemberitahuanInventaris, type DataInventaris } from "./sumber-inventaris";
import { pemberitahuanLangganan } from "./sumber-langganan";
import { pemberitahuanDiskonBerakhir, pemberitahuanMembershipBerakhir, pemberitahuanPenjualanBelumLunas } from "./sumber-penjualan";
import {
  URL_GENERATE_JADWAL,
  pemberitahuanHasilPengajuan,
  pemberitahuanIzinCuti,
  pemberitahuanPerangkatMenunggu,
  pemberitahuanJadwalMingguDepan,
  pemberitahuanKehadiran,
  rentangMingguDepan,
  tahanPengingatAbsensi,
  waktunyaCekJadwal,
} from "./sumber-staf";
import { pemberitahuanBookingBelumLunas, pemberitahuanKasirLupa } from "./sumber-operasional";
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
 * Ruang yang dapat dimasuki pengguna sesi (LN20a, LN21a): izin dashboard
 * ruang dan lokasi kerja (useRuangLokasiKerja, sama dengan gerbang LK3a dan
 * pemilih ruang sidebar).
 */
function useAksesRuangLonceng(): AksesRuangSesi {
  const { permissions } = useSession();
  const { ruang, siap } = useRuangLokasiKerja();
  return useMemo(() => ({ ...aksesRuang(permissions, ruang), siap }), [permissions, ruang, siap]);
}

/** Penyaring sumber: sumber outlet dan gudang hanya dimuat bila ruangnya dapat dimasuki. */
function useMuatRuang(): (sumber: RuangSumber) => boolean {
  const akses = useAksesRuangLonceng();
  return useCallback((sumber: RuangSumber) => muatRuang(akses, sumber), [akses]);
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

/**
 * Pemicu dan kartu LN1a, dipakai lonceng dan pesan halaman (LN3a), dari
 * hitungan produk ringkasan dashboard outlet (B380, PW07) dengan kunci yang
 * sama dengan sumber inventaris, sehingga tidak ada permintaan tambahan.
 * Laman pemakai pesan berada di ruang outlet, yang menuntut izin dashboard
 * outlet; ringkasan hanya dimuat bila ruang outlet dapat dimasuki (LN21a).
 */
export function useStokProdukLonceng() {
  const akses = useAksesTautan();
  const { sudahMasuk } = useSession();
  const muat = useMuatRuang();
  const ringkasan = useRingkasanOutletLonceng(ringkasanDimuat((r) => sudahMasuk && muat(r)).outlet);
  const hitungan = ringkasan.data?.produk;
  return useMemo(() => {
    const pemicu = pemicuStokProduk(hitungan);
    return { pemicu, pemberitahuan: pemberitahuanStokProduk(pemicu, akses) };
  }, [hitungan, akses]);
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
 * Kesiapan toko (PW19, KS1a sampai KS9a), dipakai lonceng dan kotak langkah
 * di halaman tujuan. Hitungan produk dari ringkasan dashboard outlet (kunci
 * yang sama dengan sumber inventaris, tanpa permintaan tambahan) dan fitur
 * plan dari status setup; keduanya dihitung ulang setiap penyegaran (KS4a).
 */
export function useKesiapanToko() {
  const akses = useAksesTautan();
  const { adaTokenAkun, sudahMasuk, permissions } = useSession();
  const status = useStatusSetup(adaTokenAkun && sudahMasuk);
  const muat = useMuatRuang();
  const ringkasan = useRingkasanOutletLonceng(ringkasanDimuat((r) => sudahMasuk && muat(r)).outlet);
  const produk = ringkasan.data?.produk;
  return useMemo(() => {
    const fitur = status.data ? fiturSetupPengguna(status.data, permissions) : [];
    const keadaan = keadaanKesiapan(langkahKesiapan({ produk, fitur }));
    return { keadaan, pemberitahuan: pemberitahuanKesiapan(keadaan, akses), sumber: status };
  }, [produk, status, permissions, akses]);
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
  const ringkasan = ringkasanDimuat((r) => sudahMasuk && muat(r));
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

/** Sumber operasional (LN4a): kasir lupa ditutup dan booking lewat jam belum lunas; setup fitur pindah ke kesiapan toko (KS6a). */
function useOperasionalLonceng(akses: AksesTautan) {
  const { sudahMasuk, permissions } = useSession();
  const kini = useJamBerjalan(60_000);
  const tanggal = keTanggalLokal(kini);
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
      pemberitahuanBookingBelumLunas(booking.data ?? null, kini, akses),
    ],
    [sesiKasir.data, booking.data, kini, akses],
  );
  const sumber: UseQueryResult<unknown>[] = [sesiKasir, booking];
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
  // Tingkat toko, seperti izin cuti: tidak menunggu ruang (PW08, B381).
  const perangkat = useQuery({
    queryKey: queryKeys.notifikasi.perangkatMenunggu(),
    queryFn: notifikasiApi.perangkatMenunggu,
    enabled: sudahMasuk && punya(IZIN.ubahPengguna),
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
  // Penahan pengingat absensi (KS8a): staf selain Owner, shift aktif, dan pola roster outlet.
  const bolehPenahan =
    (bolehKehadiran || bolehJadwalDepan) && punya(IZIN.pengguna) && punya(IZIN.shift) && punya(IZIN.polaRoster);
  const penggunaToko = useQuery({
    queryKey: queryKeys.notifikasi.pengguna(),
    queryFn: () => penggunaApi.daftarSemua(),
    enabled: bolehPenahan,
    ...OPSI_SEGAR,
  });
  const shiftOutlet = useQuery({
    queryKey: queryKeys.notifikasi.shift(idOutlet),
    queryFn: () => shiftApi.daftar({ locationID: idOutlet }),
    enabled: bolehPenahan && !!idOutlet,
    ...OPSI_SEGAR,
  });
  const polaOutlet = useQuery({
    queryKey: queryKeys.notifikasi.polaRoster(idOutlet),
    queryFn: () => polaRosterApi.daftar({ locationID: idOutlet }),
    enabled: bolehPenahan && !!idOutlet,
    ...OPSI_SEGAR,
  });
  const tahan = tahanPengingatAbsensi({
    berizin: bolehPenahan && punya(IZIN.location),
    gagal: penggunaToko.isError || shiftOutlet.isError || polaOutlet.isError,
    pengguna: penggunaToko.data ?? null,
    shift: shiftOutlet.data ?? null,
    pola: polaOutlet.data ?? null,
  });
  const pengajuan = useQuery({
    queryKey: queryKeys.notifikasi.pengajuanDiputuskan(),
    queryFn: notifikasiApi.pengajuanDiputuskan,
    // Hasil pengajuan saya dibuka di ruang outlet (LN21a).
    enabled: ruangOutlet && punya(IZIN.pengajuanStok) && fiturAktif(akses, "wms"),
    ...OPSI_SEGAR,
  });

  const idSaya = pengguna?.id ?? null;
  const daftar = useMemo(
    () => [
      pemberitahuanIzinCuti(izinCuti.data ?? null),
      pemberitahuanPerangkatMenunggu(perangkat.data ?? null),
      tahan ? null : pemberitahuanKehadiran(monitoring.data?.daftar ?? null, jadwalHariIni.data ?? null, kini, akses),
      tahan ? null : pemberitahuanJadwalMingguDepan(jadwalDepan.data ?? null, kini, akses),
      pemberitahuanHasilPengajuan(pengajuan.data ?? null, idSaya, kini, akses),
    ],
    [izinCuti.data, perangkat.data, monitoring.data, jadwalHariIni.data, jadwalDepan.data, pengajuan.data, idSaya, kini, akses, tahan],
  );
  const sumber: UseQueryResult<unknown>[] = [
    izinCuti,
    perangkat,
    monitoring,
    jadwalHariIni,
    jadwalDepan,
    penggunaToko,
    shiftOutlet,
    polaOutlet,
    pengajuan,
  ];
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
  // Halaman Langganan berada di ruang outlet (LN21a).
  const muat = useMuatRuang();
  const langganan = useLanggananToko(sudahMasuk && muat("outlet") && permissions.includes(IZIN.langganan));
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
  const aksesRuangSesi = useAksesRuangLonceng();
  const langganan = useLanggananLonceng();
  const inventaris = useInventarisLonceng(akses);
  const dataInventaris = inventaris.data;
  const operasional = useOperasionalLonceng(akses);
  const staf = useStafLonceng(akses);
  const penjualan = usePenjualanLonceng(akses);
  const kesiapan = useKesiapanToko();

  const daftar = useMemo<Pemberitahuan[]>(() => {
    const pemicu = pemicuStokProduk(dataInventaris.ringkasanOutlet?.produk);
    const semua = [
      kesiapan.pemberitahuan,
      // Toko belum punya produk menjadi langkah kesiapan (KS5a); kehabisan stok tetap kartu ini (LN22a).
      pemicu?.jenis === "tak-terjual" ? pemberitahuanStokProduk(pemicu, akses) : null,
      pemberitahuanLangganan(langganan.pengingat, akses),
      pemberitahuanProdukMinimum(dataInventaris.ringkasanOutlet?.produk.stokKritis, akses),
      ...pemberitahuanInventaris(dataInventaris, akses),
      ...operasional.daftar,
      ...staf.daftar,
      ...penjualan.daftar,
    ];
    const ada = semua.filter((p): p is Pemberitahuan => p !== null);
    return urutkanPemberitahuan(saringKartuRuang(ada, aksesRuangSesi));
  }, [kesiapan.pemberitahuan, langganan.pengingat, akses, aksesRuangSesi, dataInventaris, operasional.daftar, staf.daftar, penjualan.daftar]);

  // Hanya sumber yang aktif (pernah dimuat) yang disegarkan.
  const sumber: UseQueryResult<unknown>[] = [
    langganan.query,
    kesiapan.sumber,
    ...inventaris.sumber,
    ...operasional.sumber,
    ...staf.sumber,
    ...penjualan.sumber,
  ];
  const segarkan = () => {
    for (const q of sumber) if (q.isFetched) void q.refetch();
  };

  return { daftar, segarkan };
}
