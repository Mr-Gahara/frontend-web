import { expect, type Page } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";

/*
 * Fixture izin dan cuti untuk dashboard outlet (B160, pemilik proyek 31
 * Oktober 2026: fixture positif dan negatif). Web tidak punya halaman izin
 * cuti dan backend tidak punya DELETE /izincuti, sehingga fixture dibuat
 * lewat API oleh Ridho (data milik modul lain, keputusan rancangan butir
 * 23) dan menetap. Setiap fixture dicari menurut keterangannya lebih dulu,
 * sehingga run berulang di hari yang sama tidak menambah data.
 *
 * Izinnya milik pengguna uji tersendiri, bukan Ridho: izin disetujui pada
 * hari generate menjadikan pemiliknya libur (B167), dan spec jadwal memakai
 * Ridho.
 */
export const NAMA_STAF_IZIN = "E2E Izin Cuti";
const PIN_STAF_IZIN = "135792";

type Mentah = { id?: string; _id?: string };
type PenggunaMentah = Mentah & { nama?: string };
type PeranMentah = Mentah & { namaRole?: string; permissions?: unknown[] };
export type IzinMentah = Mentah & {
  status: string;
  keterangan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
};

const idMilik = (x: Mentah | undefined) => String(x?.id ?? x?._id ?? "");
const namaIzin = (x: unknown) => (typeof x === "string" ? x : (x as { nama?: string } | null)?.nama);

/** Pengguna uji ruang outlet: peran selain Owner yang memegang read-dashboard-outlet. */
async function siapkanStafIzin(page: Page, auth: Auth): Promise<string> {
  const cari = async () => {
    const daftar = await api<PenggunaMentah[]>(page, auth, "GET", "/pengguna");
    expect(daftar.status, `GET /pengguna: ${daftar.pesan}`).toBe(200);
    return (daftar.data ?? []).find((p) => p.nama === NAMA_STAF_IZIN);
  };
  const ada = await cari();
  if (ada) return idMilik(ada);

  const peran = await api<PeranMentah[]>(page, auth, "GET", "/role");
  expect(peran.status, `GET /role: ${peran.pesan}`).toBe(200);
  const cocok = (peran.data ?? []).find(
    (r) =>
      !/owner/i.test(r.namaRole ?? "") &&
      (r.permissions ?? []).map(namaIzin).includes("read-dashboard-outlet"),
  );
  expect(cocok, "perlu peran selain Owner yang memegang read-dashboard-outlet").toBeTruthy();
  const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
    nama: NAMA_STAF_IZIN,
    pin: PIN_STAF_IZIN,
    roleID: idMilik(cocok),
    aksesType: ["app"],
  });
  expect(buat.status, `buat pengguna uji izin cuti: ${buat.pesan}`).toBeLessThan(300);
  const baru = await cari();
  expect(baru, "pengguna uji izin cuti terbaca setelah dibuat").toBeTruthy();
  return idMilik(baru);
}

export interface FixtureIzinHari {
  idStaf: string;
  /** Disetujui dan berlaku hari ini: harus termuat. */
  berlaku: string;
  /** Ditolak hari ini, dan disetujui di 2020: tidak boleh termuat. */
  ditolak: string;
  lampau: string;
}

/** Memastikan ketiga izin uji ada untuk hari `hari` (YYYY-MM-DD, WIB). */
export async function siapkanIzinHari(page: Page, auth: Auth, hari: string): Promise<FixtureIzinHari> {
  const idStaf = await siapkanStafIzin(page, auth);
  const semua = await api<IzinMentah[]>(page, auth, "GET", "/izincuti");
  expect(semua.status, `GET /izincuti: ${semua.pesan}`).toBe(200);

  const pastikan = async (keterangan: string, status: string, mulai: string, selesai: string) => {
    const ada = (semua.data ?? []).find((i) => i.keterangan === keterangan);
    if (ada) return idMilik(ada);
    const buat = await api<IzinMentah>(page, auth, "POST", "/izincuti", {
      penggunaID: idStaf,
      tipe: "izin",
      tanggalMulai: mulai,
      tanggalSelesai: selesai,
      keterangan,
      status,
    });
    expect(buat.status, `buat izin uji "${keterangan}": ${buat.pesan}`).toBeLessThan(300);
    return idMilik(buat.data);
  };

  return {
    idStaf,
    berlaku: await pastikan(`E2E B160 disetujui ${hari}`, "disetujui", hari, hari),
    ditolak: await pastikan(`E2E B160 ditolak ${hari}`, "ditolak", hari, hari),
    lampau: await pastikan("E2E B160 disetujui 2020", "disetujui", "2020-01-01", "2020-01-02"),
  };
}
