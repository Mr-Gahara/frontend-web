import { expect, request, type Page } from "@playwright/test";
import { AKUN_UJI, PENGGUNA_UJI } from "./masuk-uji";
import { buatAkunUji, daftarAkun, type AkunKasUji } from "./akun-kas-uji";
import { api, BASIS, type Auth } from "./transfer-uji";

/*
 * Helper Mesin Kasir untuk spec keuangan (keputusan pemilik proyek,
 * 7 November 2026). Sesi kasir hanya dapat dibuka dari aplikasi
 * (sesiKasirService._wajibAplikasi), sehingga spec membukanya lewat login
 * app sebagai data milik modul lain (keputusan rancangan butir 23). Login
 * app tidak memutar tokenVersion web, sehingga sesi web di browser tetap
 * berlaku (penggunaDeviceService.loginPin).
 */

/** Perangkat trusted milik Ridho di tenant uji, dipakai sebagai mesin kasir uji. */
export const PERANGKAT_UJI = { installationId: "OWNER-DEVICE-UUID-001", nama: "iPad Pro 11" } as const;

/** Laci uji tetap: akun kas tidak dapat dihapus, sehingga dibuat sekali lalu dipakai ulang. */
export const NAMA_LACI_UJI = "E2E Laci Mesin Kasir";

export type MesinKasirMentah = { id: string; installationId: string; namaPerangkat: string; akunKasID: string | null };
export type SesiKasirMentah = {
  id: string;
  installationId: string;
  akunKasID: string | null;
  status: "BUKA" | "TUTUP";
  nominalTutup: number | null;
  selisihTutup: number | null;
  catatanTutup: string | null;
};

/** Laci uji aktif; dibuat lewat API bila belum ada. */
export async function siapkanLaciUji(page: Page, auth: Auth): Promise<AkunKasUji> {
  const ada = (await daftarAkun(page, auth)).find((a) => a.namaAkun === NAMA_LACI_UJI && a.status === "aktif");
  return ada ?? buatAkunUji(page, auth, NAMA_LACI_UJI, "E2E laci tetap untuk spec Mesin Kasir");
}

export async function daftarMesin(page: Page, auth: Auth): Promise<MesinKasirMentah[]> {
  const baca = await api<MesinKasirMentah[]>(page, auth, "GET", "/sesikasir/perangkat");
  expect(baca.status, "baca mesin kasir: " + baca.pesan).toBe(200);
  return baca.data ?? [];
}

export async function sesiBuka(page: Page, auth: Auth): Promise<SesiKasirMentah[]> {
  const baca = await api<SesiKasirMentah[]>(page, auth, "GET", "/sesikasir?status=BUKA&limit=100");
  expect(baca.status, "baca kasir buka: " + baca.pesan).toBe(200);
  return baca.data ?? [];
}

export async function detailSesi(page: Page, auth: Auth, id: string): Promise<SesiKasirMentah> {
  const baca = await api<SesiKasirMentah>(page, auth, "GET", "/sesikasir/" + id);
  expect(baca.status, "baca sesi kasir: " + baca.pesan).toBe(200);
  return baca.data;
}

/**
 * Membersihkan sisa run sebelumnya: sesi terbuka di perangkat atau laci uji
 * ditutup dengan hitungan sama dengan saldo (tanpa selisih), lalu pemetaan
 * yang memakai perangkat atau laci uji dilepas. Dipakai sebelum dan sesudah
 * spec, sehingga pemeriksaannya lunak.
 */
export async function bersihkanMesinUji(page: Page, auth: Auth, laciID: string) {
  const kena = (x: { installationId: string; akunKasID?: string | null }) =>
    x.installationId === PERANGKAT_UJI.installationId || x.akunKasID === laciID;
  for (const sesi of (await sesiBuka(page, auth)).filter(kena)) {
    const saldo = (await daftarAkun(page, auth)).find((a) => a.id === sesi.akunKasID)?.saldo;
    const tutup = await api(page, auth, "POST", `/sesikasir/${sesi.id}/tutup`, { nominal: saldo ?? 0 });
    expect.soft(tutup.status, "tutup sesi uji: " + tutup.pesan).toBe(200);
  }
  for (const mesin of (await daftarMesin(page, auth)).filter(kena)) {
    const hapus = await api(page, auth, "DELETE", "/sesikasir/perangkat/" + mesin.id);
    expect.soft(hapus.status, "lepas mesin kasir uji: " + hapus.pesan).toBe(200);
  }
}

/**
 * Membuka kasir di perangkat uji lewat API aplikasi, dengan hitungan sama
 * dengan saldo laci sehingga tanpa selisih dan tanpa catatan.
 */
export async function bukaKasirLewatAplikasi(nominal: number): Promise<SesiKasirMentah> {
  const ctx = await request.newContext({ baseURL: BASIS });
  try {
    const akun = await ctx.post("/api/akun/auth/login", { data: AKUN_UJI });
    const isiAkun = await akun.json().catch(() => ({}));
    expect(akun.status(), `login akun: ${isiAkun.message ?? ""}`).toBe(200);

    const masuk = await ctx.post("/api/pengguna/pin-login", {
      data: { ...PENGGUNA_UJI, loginType: "app", installationId: PERANGKAT_UJI.installationId },
      headers: { Authorization: "Bearer " + isiAkun.accessToken },
    });
    const isiMasuk = await masuk.json().catch(() => ({}));
    const token = isiMasuk.accessToken ?? isiMasuk.data?.accessToken;
    expect(masuk.status(), `login app: ${isiMasuk.message ?? ""}`).toBe(200);
    expect(token, "login app membawa access token").toBeTruthy();

    const buka = await ctx.post("/api/sesikasir/buka", {
      data: { nominal },
      headers: { Authorization: "Bearer " + token },
    });
    const isiBuka = await buka.json().catch(() => ({}));
    expect(buka.status(), `buka kasir dari aplikasi: ${isiBuka.message ?? ""}`).toBe(201);
    return isiBuka.data as SesiKasirMentah;
  } finally {
    await ctx.dispose();
  }
}
