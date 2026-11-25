import { expect, test } from "@playwright/test";
import { IZIN_HALAMAN, bolehBukaHalaman } from "../../../lib/auth/permissions";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { masukBacaSaja } from "../../helpers/terkunci-uji";

/*
 * Sisi tertolak gerbang rute untuk seluruh rute statis IZIN_HALAMAN (utang
 * pengujian: sebelumnya e2e hanya untuk beberapa rute, sisanya unit
 * gerbang-rute.test.ts). Pengguna baca-saja memegang seluruh izin baca
 * Owner; setiap rute statis yang syaratnya tidak ia penuhi harus ditolak,
 * dan setiap rute yang syaratnya terpenuhi tidak boleh ditolak. Izinnya
 * dibaca dari role Owner tenant uji dengan penyaring yang sama dengan
 * tests/helpers/terkunci-uji.ts.
 */

const STATIS = Object.keys(IZIN_HALAMAN).filter((r) => !r.includes("[") && r.startsWith("/dashboard/"));

test("baca-saja: setiap rute statis tanpa izin lengkap ditolak, dan rute berizin lengkap terbuka", async ({ page }) => {
  test.setTimeout(400_000);
  await login(page);
  const auth = await bukaDenganAuth(page, "/dashboard");
  const role = await api<{ namaRole?: string; permissions?: { nama?: string }[] }[]>(page, auth, "GET", "/role");
  const owner = (role.data ?? []).find((r) => /^owner$/i.test(r.namaRole ?? ""));
  const izin = (owner?.permissions ?? []).map((p) => p.nama ?? "").filter((n) => n.startsWith("read-"));
  expect(izin.length).toBeGreaterThan(0);

  const ditolak = STATIS.filter((r) => !bolehBukaHalaman(r, izin));
  const terbuka = STATIS.filter((r) => bolehBukaHalaman(r, izin) && IZIN_HALAMAN[r].length > 0);
  expect(ditolak.length, "ada rute statis yang menuntut izin tulis").toBeGreaterThan(0);
  test.info().annotations.push({ type: "rute", description: `ditolak ${ditolak.length}, terbuka ${terbuka.length}` });

  await masukBacaSaja(page);
  const salah: string[] = [];
  for (const rute of ditolak) {
    await page.goto(rute);
    const tolak = page.getByRole("heading", { name: "Akses ditolak" });
    try {
      await expect(tolak).toBeVisible({ timeout: 15_000 });
    } catch {
      salah.push(`${rute}: tidak ditolak`);
    }
  }
  for (const rute of terbuka) {
    await page.goto(rute);
    // Jangkar positif: judul halaman tampil, lalu pastikan bukan penolakan gerbang.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });
    if ((await page.getByRole("heading", { name: "Akses ditolak" }).count()) > 0) salah.push(`${rute}: ditolak`);
  }
  expect(salah, `ditolak ${ditolak.length}, terbuka ${terbuka.length}`).toEqual([]);
});

/*
 * Rute ber-[id] (utang pengujian: sebelumnya e2e hanya ubah akun kas).
 * Gerbang memutuskan dari izin, bukan dari data, sehingga satu id yang sah
 * bentuknya tetapi tidak ada dipakai untuk semua rute. Rute yang ditolak
 * menampilkan Akses ditolak tanpa meminta data id itu; rute yang terbuka
 * dibuktikan oleh permintaan API yang membawa id itu.
 */
const ID_UJI = "6a0000000000000000000000";
const BERID = Object.keys(IZIN_HALAMAN).filter((r) => r.includes("[id]"));

test("baca-saja: setiap rute ber-[id] tanpa izin lengkap ditolak tanpa memuat data, dan yang berizin memuat datanya", async ({
  page,
}) => {
  test.setTimeout(300_000);
  await login(page);
  const auth = await bukaDenganAuth(page, "/dashboard");
  const role = await api<{ namaRole?: string; permissions?: { nama?: string }[] }[]>(page, auth, "GET", "/role");
  const owner = (role.data ?? []).find((r) => /^owner$/i.test(r.namaRole ?? ""));
  const izin = (owner?.permissions ?? []).map((p) => p.nama ?? "").filter((n) => n.startsWith("read-"));

  const ditolak = BERID.filter((r) => !bolehBukaHalaman(r, izin));
  const terbuka = BERID.filter((r) => bolehBukaHalaman(r, izin));
  expect(ditolak.length, "ada rute ber-[id] yang menuntut izin tulis").toBeGreaterThan(0);
  expect(terbuka.length, "ada rute ber-[id] yang cukup izin baca").toBeGreaterThan(0);
  test.info().annotations.push({ type: "rute", description: `ditolak ${ditolak.length}, terbuka ${terbuka.length}` });

  await masukBacaSaja(page);
  const membawaId = (u: string) => u.includes("/api/") && u.includes(ID_UJI);
  const salah: string[] = [];
  for (const pola of ditolak) {
    const diminta: string[] = [];
    const catat = (r: { url(): string }) => {
      if (membawaId(r.url())) diminta.push(r.url());
    };
    page.on("request", catat);
    await page.goto(pola.replace("[id]", ID_UJI));
    try {
      await expect(page.getByRole("heading", { name: "Akses ditolak" })).toBeVisible({ timeout: 15_000 });
    } catch {
      salah.push(`${pola}: tidak ditolak`);
    }
    page.off("request", catat);
    if (diminta.length) salah.push(`${pola}: ditolak tetapi meminta ${diminta[0]}`);
  }
  for (const pola of terbuka) {
    const tData = page.waitForRequest((r) => membawaId(r.url()), { timeout: 20_000 }).catch(() => null);
    await page.goto(pola.replace("[id]", ID_UJI));
    if (!(await tData)) salah.push(`${pola}: tidak memuat data id`);
    if ((await page.getByRole("heading", { name: "Akses ditolak" }).count()) > 0) salah.push(`${pola}: ditolak`);
  }
  expect(salah, `ditolak ${ditolak.length}, terbuka ${terbuka.length}`).toEqual([]);
});
