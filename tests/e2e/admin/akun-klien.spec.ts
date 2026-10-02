import { test, expect, type Page } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
  hapusAkunKlienUji,
  kredensialAdmin,
  loginAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";

/*
 * Daftar akun dan buat akun klien di panel admin (keputusan PA7a sampai
 * PA9a). Harapan daftar dihitung dari respons GET /akun/admin/all yang
 * dibaca halaman itu sendiri. Akun klien uji dibuat lewat UI dengan email
 * unik per run, lalu dibekukan dan dihapus lewat API di finally, sampai
 * bekukan dan hapus tersedia di UI.
 */

interface AkunRespons {
  id: string;
  email: string;
  role: "client" | "admin";
  status: string;
  daftarTenant: { namaToko: string }[];
  langganan: { aksesBerakhirPada: string | null };
}

const POLA_DAFTAR = /\/api\/akun\/admin\/all(\?|$)/i;
const POLA_BUAT = /\/api\/akun\/admin\/users(\?|$)/i;

const kolomCari = (page: Page) => page.getByLabel("Cari akun");
const barisAkun = (page: Page, email: string) => page.getByRole("row").filter({ hasText: email });

/** Login admin, lalu muat ulang agar respons daftar milik halaman ini tertangkap. */
async function bukaDaftar(page: Page): Promise<AkunRespons[]> {
  await loginAdmin(page, wajibAdmin());
  await page.reload({ waitUntil: "commit" });
  const respons = await page.waitForResponse(
    (r) => POLA_DAFTAR.test(r.url()) && r.request().method() === "GET",
  );
  expect(respons.status()).toBe(200);
  const isi = (await respons.json()) as { data: AkunRespons[] };
  await expect(page.getByText(`${isi.data.length} dari ${isi.data.length} akun`)).toBeVisible({
    timeout: 15_000,
  });
  return isi.data;
}

async function bukaFormBuat(page: Page) {
  await page.getByRole("button", { name: "Buat Akun Klien" }).click();
  await page.waitForURL("**/admin/akun/buat");
  await expect(page.getByRole("heading", { name: "Buat Akun Klien" })).toBeVisible();
}

test.describe("Akun klien di panel admin", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("daftar menampilkan akun dari respons, dengan penanda peran dan toko", async ({ page }) => {
    const daftar = await bukaDaftar(page);

    await expect(page.getByRole("cell", { name: "Admin", exact: true }).first()).toBeVisible();

    const bertoko = daftar.find((a) => a.role === "client" && a.daftarTenant.length > 0);
    test.skip(!bertoko, "Tidak ada akun klien yang sudah punya toko di data uji");
    if (!bertoko) return;

    await kolomCari(page).fill(bertoko.email);
    await expect(page.getByText(`1 dari ${daftar.length} akun`)).toBeVisible();
    await expect(barisAkun(page, bertoko.email)).toContainText(bertoko.daftarTenant[0].namaToko);
    await expect(barisAkun(page, bertoko.email)).toContainText("Klien");
  });

  test("pencarian tanpa hasil dan filter status menghitung dari daftar yang sama", async ({ page }) => {
    const daftar = await bukaDaftar(page);

    await kolomCari(page).fill("tidak-ada-akun-" + Date.now());
    await expect(page.getByText(`0 dari ${daftar.length} akun`)).toBeVisible();
    await expect(page.getByText("Tidak ada akun yang cocok dengan pencarian.")).toBeVisible();

    await kolomCari(page).fill("");
    const nonAktif = daftar.filter((a) => a.status === "non-aktif").length;
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Non-aktif" }).click();
    await expect(page.getByText(`${nonAktif} dari ${daftar.length} akun`)).toBeVisible();
  });

  test("form menolak isian kosong tanpa mengirim permintaan", async ({ page }) => {
    await bukaDaftar(page);
    await bukaFormBuat(page);

    let terkirim = 0;
    const catat = (r: { url(): string; method(): string }) => {
      if (POLA_BUAT.test(r.url()) && r.method() === "POST") terkirim += 1;
    };
    page.on("request", catat);
    try {
      await page.getByRole("button", { name: "Simpan Akun" }).click();
      await expect(page.getByText("Email wajib diisi.")).toBeVisible();
      await expect(page.getByText("Password wajib diisi.")).toBeVisible();

      await page.getByLabel("Email", { exact: true }).fill("klien@contoh.id");
      await page.getByLabel("Password awal").fill("lemah");
      await page.getByRole("button", { name: "Simpan Akun" }).click();
      await expect(page.getByText("Password minimal 8 karakter.")).toBeVisible();
    } finally {
      page.off("request", catat);
    }
    expect(terkirim, "form tidak boleh mengirim isian yang ditolak skema").toBe(0);
  });

  test("email yang sudah terdaftar ditolak backend dan pesannya tampil di form", async ({ page }) => {
    const daftar = await bukaDaftar(page);
    const terdaftar = daftar.find((a) => a.role === "client");
    test.skip(!terdaftar, "Tidak ada akun klien di data uji");
    if (!terdaftar) return;

    await bukaFormBuat(page);
    await page.getByLabel("Email", { exact: true }).fill(terdaftar.email);
    await page.getByLabel("Password awal").fill("UjiKlien123");
    const tunggu = page.waitForResponse(
      (r) => POLA_BUAT.test(r.url()) && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Simpan Akun" }).click();
    const respons = await tunggu;

    expect(respons.status()).toBe(409);
    const pesan = ((await respons.json()) as { message: string }).message;
    await expect(page.getByRole("alert").filter({ hasText: pesan })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/akun\/buat$/);
  });

  test("buat akun klien berlangganan 3 bulan, lalu tampil di daftar", async ({ page }) => {
    const admin = wajibAdmin();
    const unik = Date.now().toString(36);
    const email = `e2e.klien.${unik}@tachyon-uji.com`;
    const username = `e2e-${unik}`.slice(0, 25);
    let idAkun: string | null = null;

    try {
      await bukaDaftar(page);
      await bukaFormBuat(page);

      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Username").fill(username);
      await page.getByLabel("Password awal").fill("UjiKlien123");
      await page.getByRole("combobox", { name: "Langganan" }).click();
      await page.getByRole("option", { name: "3 bulan" }).click();

      const tunggu = page.waitForResponse(
        (r) => POLA_BUAT.test(r.url()) && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Simpan Akun" }).click();
      const respons = await tunggu;
      const isi = (await respons.json()) as { data?: AkunRespons };
      idAkun = isi.data?.id ?? null;

      expect(respons.request().postDataJSON()).toEqual({
        email,
        password: "UjiKlien123",
        username,
        durasiBulan: 3,
      });
      expect(respons.status()).toBe(201);
      expect(isi.data?.status).toBe("aktif");
      expect(isi.data?.daftarTenant).toEqual([]);
      expect(isi.data?.langganan.aksesBerakhirPada, "berlangganan: masa akses terisi").toBeTruthy();

      await page.waitForURL("**/admin");
      await kolomCari(page).fill(email);
      const baris = barisAkun(page, email);
      await expect(baris).toBeVisible({ timeout: 15_000 });
      await expect(baris).toContainText("Belum punya toko");
      await expect(baris).toContainText("Aktif");
      await expect(baris).not.toContainText("Tidak dibatasi");
    } finally {
      if (idAkun) await hapusAkunKlienUji(idAkun, admin);
    }
  });
});