import { test, expect, type Page } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
  bukaDaftarAkun,
  periksaTotalDaftar,
  tungguDaftarAkun,
  hapusAkunDariDetail,
  hapusAkunKlienUji,
  kredensialAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";

/*
 * Daftar akun dan buat akun klien di panel admin (keputusan PA7a sampai
 * PA9a). Pencarian, status, dan halaman disaring server (B177): query yang
 * terkirim dan total dari pagination diperiksa, dan seluruh akun dibaca
 * lewat API sebagai bukti. Akun klien uji dibuat lewat UI dengan email
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

const POLA_BUAT = /\/api\/akun\/admin\/users(\?|$)/i;

const kolomCari = (page: Page) => page.getByLabel("Cari akun");
const barisAkun = (page: Page, email: string) => page.getByRole("row").filter({ hasText: email });

const bukaDaftar = (page: Page) => bukaDaftarAkun<AkunRespons>(page);

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

    const tCari = tungguDaftarAkun(page, (q) => q.get("cari") === bertoko.email && q.get("page") === "1");
    await kolomCari(page).fill(bertoko.email);
    await periksaTotalDaftar(page, await tCari);
    await expect(barisAkun(page, bertoko.email)).toContainText(bertoko.daftarTenant[0].namaToko);
    await expect(barisAkun(page, bertoko.email)).toContainText("Klien");
  });

  test("pencarian tanpa hasil dan filter status disaring server (B177)", async ({ page }) => {
    const daftar = await bukaDaftar(page);

    const kosong = "tidak-ada-akun-" + Date.now();
    const tKosong = tungguDaftarAkun(page, (q) => q.get("cari") === kosong);
    await kolomCari(page).fill(kosong);
    expect(await periksaTotalDaftar(page, await tKosong)).toBe(0);
    await expect(page.getByText("Tidak ada akun yang cocok dengan pencarian.")).toBeVisible();

    // Kosong kembali ke kunci halaman pertama yang masih segar, sehingga tidak
    // ada permintaan baru; penunggu status disyaratkan tanpa cari.
    await kolomCari(page).fill("");
    const nonAktif = daftar.filter((a) => a.status === "non-aktif").length;
    const tStatus = tungguDaftarAkun(
      page,
      (q) => q.get("status") === "non-aktif" && q.get("page") === "1" && !q.has("cari"),
    );
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Non-aktif" }).click();
    const respons = await tStatus;
    expect(await periksaTotalDaftar(page, respons)).toBe(nonAktif);
    const isi = (await respons.json()) as { data: AkunRespons[] };
    expect(isi.data.every((a) => a.status === "non-aktif")).toBe(true);
  });

  test("halaman berikutnya meminta page 2, dan pencarian kembali ke halaman 1 (B177)", async ({ page }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length <= 10, "Akun di data uji belum lebih dari satu halaman");

    const tKedua = tungguDaftarAkun(page, (q) => q.get("page") === "2" && q.get("limit") === "10");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const kedua = (await (await tKedua).json()) as { data: AkunRespons[] };
    await expect(page.getByRole("link", { name: kedua.data[0].email })).toBeVisible();

    const tCari = tungguDaftarAkun(page, (q) => q.get("cari") === "@" && q.get("page") === "1");
    await kolomCari(page).fill("@");
    await periksaTotalDaftar(page, await tCari);
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
    let terhapus = false;
    test.setTimeout(90_000);

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

      await page.getByRole("link", { name: email }).click();
      await page.waitForURL("**/admin/akun/" + idAkun);
      await hapusAkunDariDetail(page, email, admin);
      terhapus = true;
    } finally {
      if (idAkun && !terhapus) await hapusAkunKlienUji(idAkun, admin);
    }
  });
});