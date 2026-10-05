import { expect, test, type Page, type Request } from "@playwright/test";
import { JAWAB_GAGAL } from "../../helpers/transfer-uji";
import { ROLE_TEMPLATES } from "../../../lib/roleTemplates";

const BASE = "http://localhost:3000";
const DAFTAR = "/dashboard/outlet/pengaturan/roles";

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /masuk|login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /masuk|login/i }).click();
  await page.waitForURL("**/dashboard/**", { timeout: 15_000 });
}

async function bukaDaftar(page: Page) {
  await page.goto(`${BASE}${DAFTAR}`);
  await expect(page.getByRole("heading", { name: /posisi|role/i }).first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Kartu role pada daftar: div terluar yang memuat nama sekaligus tombol
 * aksinya. Memfilter div terdalam tidak cukup, karena nama dan tombol
 * berada di cabang yang berbeda.
 */
function kartuRole(page: Page, nama: string) {
  return page
    .locator("div")
    .filter({ hasText: nama })
    .filter({ has: page.getByRole("button", { name: /edit/i }) })
    .last();
}

/** Menghapus role bila masih ada, agar pengulangan test tidak menumpuk data. */
async function bersihkanRole(page: Page, nama: string) {
  await bukaDaftar(page);
  const tombolHapus = kartuRole(page, nama)
    .getByRole("button", { name: /hapus/i })
    .first();

  // Tombol hapus sempat disabled sampai daftar role selesai dimuat, karena
  // level pengguna aktif diturunkan dari daftar itu. Melewatinya saat belum
  // terlihat membuat penghapusan tidak pernah terkirim.
  await expect(tombolHapus).toBeEnabled({ timeout: 15_000 });
  await tombolHapus.click();

  // Dialog konfirmasi perlu ditunggu; memeriksa isVisible tanpa menunggu
  // membuat kliknya kadang terlewat dan role tidak jadi terhapus.
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("button", { name: /hapus/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

test.describe("E2E - Role (CRUD)", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
    await bukaDaftar(page);
  });

  test("form kustom membuka dengan wewenang dasar sudah terpilih", async ({
    page,
  }) => {
    await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);

    // IZIN_DASAR (read-akun dan read-tenant) wajib terpilih sejak awal,
    // agar posisi baru selalu dapat membuka aplikasi.
    const kotakTerpilih = page.getByRole("checkbox", { checked: true });
    await expect(kotakTerpilih.first()).toBeVisible({ timeout: 15_000 });
    expect(await kotakTerpilih.count()).toBeGreaterThanOrEqual(2);
  });

  test("melepas wewenang dasar memunculkan peringatan", async ({ page }) => {
    await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);
    await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("checkbox", { checked: true }).first().click();

    // Wewenang dasar tidak boleh dilepas tanpa konfirmasi.
    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 10_000 });
  });

  test("happy path: buat posisi kustom, edit namanya, lalu hapus", async ({
    page,
  }) => {
    const nama = `Posisi E2E ${Date.now()}`;
    const namaEdit = `${nama} Edited`;

    await test.step("Buat posisi kustom", async () => {
      await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);

      await page.getByLabel(/nama posisi|nama role/i).fill(nama);
      await page.getByLabel(/level/i).fill("1");

      await page.getByRole("button", { name: /simpan/i }).click();
      // Halaman form berada di bawah path daftar, sehingga kembalinya
      // diperiksa lewat URL yang berakhir tepat di daftar.
      await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });
    });

    await test.step("Posisi tampil di daftar", async () => {
      await expect(page.getByText(nama).first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Edit nama posisi", async () => {
      await kartuRole(page, nama).getByRole("button", { name: /edit/i }).first().click();
      await page.waitForURL("**/edit", { timeout: 15_000 });

      const inputNama = page.getByLabel(/nama posisi|nama role/i);
      await expect(inputNama).toHaveValue(nama, { timeout: 15_000 });
      await inputNama.fill(namaEdit);

      await page.getByRole("button", { name: /simpan/i }).click();
      // Halaman form berada di bawah path daftar, sehingga kembalinya
      // diperiksa lewat URL yang berakhir tepat di daftar.
      await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });

      await expect(page.getByText(namaEdit).first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Hapus posisi", async () => {
      await bersihkanRole(page, namaEdit);
      await expect(page.getByText(namaEdit)).toHaveCount(0, { timeout: 15_000 });
    });
  });

  test("edit: posisi yang tidak ada menampilkan pesan, bukan form kosong", async ({
    page,
  }) => {
    const idTidakAda = "000000000000000000000000";

    await page.goto(`${BASE}${DAFTAR}/${idTidakAda}/edit`, {
      waitUntil: "commit",
    });
    const respons = await page.waitForResponse(
      (r) =>
        new RegExp(`/api/role/${idTidakAda}$`, "i").test(r.url()) &&
        r.request().method() === "GET",
      { timeout: 15_000 },
    );
    expect(respons.ok()).toBe(false);
    const isi = (await respons.json().catch(() => ({}))) as {
      message?: string;
    };

    const main = page.getByRole("main");
    await expect(main.getByText("Posisi tidak dapat dimuat.")).toBeVisible({
      timeout: 20_000,
    });
    if (isi.message) await expect(main).toContainText(isi.message);

    // Form tidak dipasang, sehingga tidak ada isian kosong yang dapat disimpan.
    await expect(page.getByLabel(/nama posisi|nama role/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /simpan/i })).toHaveCount(0);

    await main.getByRole("link", { name: "Kembali ke Daftar Posisi" }).click();
    await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });
  });

  test("validasi form: nama terlalu pendek dan level desimal ditolak tanpa permintaan", async ({
    page,
  }) => {
    // POST dijawab gagal agar tidak ada posisi yang tersimpan, juga bila
    // form ternyata mengirimnya.
    let terkirim = 0;
    await page.route(/\/api\/role$/i, async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      terkirim += 1;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "Simulasi gagal simpan" }),
      });
    });

    await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);
    const nama = page.getByLabel(/nama posisi|nama role/i);
    const level = page.getByLabel(/level/i);
    const simpan = page.getByRole("button", { name: /simpan/i });
    await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 15_000 });

    await nama.fill("ab");
    await level.fill("1");
    await simpan.click();
    await expect(page.getByText("Nama posisi minimal 3 karakter.")).toBeVisible({
      timeout: 10_000,
    });

    await nama.fill(`Posisi E2E Validasi ${Date.now()}`);
    await level.fill("1.5");
    await simpan.click();
    await expect(
      page.getByText("Level harus berupa bilangan bulat lebih besar dari 0."),
    ).toBeVisible({ timeout: 10_000 });

    expect(terkirim, "POST /role selama isian ditolak form").toBe(0);
    await page.unroute(/\/api\/role$/i);
  });

  test("ubah: simpan nonaktif tanpa perubahan, hanya field berubah yang dikirim, dan deskripsi dapat dikosongkan", async ({
    page,
  }) => {
    const nama = `Posisi E2E Ubah ${Date.now()}`;
    const namaBaru = `${nama} B`;
    const putRole = (r: Request) =>
      r.method() === "PUT" && /\/api\/role\/[0-9a-f]{24}$/i.test(r.url());
    const simpan = page.getByRole("button", { name: /simpan/i });
    const deskripsi = page.locator("#deskripsiRole");

    await page.goto(`${BASE}${DAFTAR}/buatRole/kostum`);
    await page.getByLabel(/nama posisi|nama role/i).fill(nama);
    await deskripsi.fill("Deskripsi uji");
    await page.getByLabel(/level/i).fill("1");
    await simpan.click();
    await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });

    try {
      await test.step("Ubah nama saja: payload hanya berisi namaRole", async () => {
        await kartuRole(page, nama).getByRole("button", { name: /edit/i }).first().click();
        await page.waitForURL("**/edit", { timeout: 15_000 });
        const inputNama = page.getByLabel(/nama posisi|nama role/i);
        await expect(inputNama).toHaveValue(nama, { timeout: 15_000 });
        await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 15_000 });
        await expect.soft(simpan, "simpan nonaktif tanpa perubahan").toBeDisabled();

        await inputNama.fill(namaBaru);
        const [permintaan] = await Promise.all([page.waitForRequest(putRole), simpan.click()]);
        expect(permintaan.postDataJSON()).toEqual({ namaRole: namaBaru });
        await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });
      });

      await test.step("Deskripsi dikosongkan: dikirim sebagai teks kosong dan tersimpan kosong", async () => {
        await kartuRole(page, namaBaru).getByRole("button", { name: /edit/i }).first().click();
        await page.waitForURL("**/edit", { timeout: 15_000 });
        await expect(deskripsi).toHaveValue("Deskripsi uji", { timeout: 15_000 });
        await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 15_000 });

        await deskripsi.fill("");
        const [permintaan] = await Promise.all([page.waitForRequest(putRole), simpan.click()]);
        expect(permintaan.postDataJSON()).toEqual({ deskripsi: "" });
        await expect(page).toHaveURL(new RegExp(`${DAFTAR}$`), { timeout: 15_000 });

        await kartuRole(page, namaBaru).getByRole("button", { name: /edit/i }).first().click();
        await page.waitForURL("**/edit", { timeout: 15_000 });
        await expect(page.getByLabel(/nama posisi|nama role/i)).toHaveValue(namaBaru, {
          timeout: 15_000,
        });
        await expect(deskripsi).toHaveValue("");
      });
    } finally {
      // Nama baru memuat nama lama, sehingga kartunya ditemukan di kedua keadaan.
      await bersihkanRole(page, nama);
    }
  });

  test("template: setiap izin terpetakan ke id, dan badge sesuai payload", async ({
    page,
  }) => {
    await page.goto(`${BASE}${DAFTAR}/buatRole`);
    await page.route(/\/api\/role$/i, (route) =>
      route.request().method() === "POST"
        ? route.fulfill(JAWAB_GAGAL)
        : route.continue(),
    );

    for (const template of ROLE_TEMPLATES) {
      const kartu = page
        .locator("div")
        .filter({ has: page.getByText(template.namaRole, { exact: true }) })
        .filter({ has: page.getByRole("button", { name: /gunakan|membuat/i }) })
        .last();
      const tombol = kartu.getByRole("button", { name: /gunakan/i });
      await expect(tombol, template.namaRole).toBeEnabled({ timeout: 15_000 });

      const permintaan = page.waitForRequest(
        (r) => /\/api\/role$/i.test(r.url()) && r.method() === "POST",
      );
      await tombol.click();
      const body = (await permintaan).postDataJSON() as {
        namaRole: string;
        permissions: string[];
      };

      expect(body.namaRole).toBe(template.namaRole);
      expect
        .soft(body.permissions, `${template.namaRole}: izin tanpa padanan id`)
        .toHaveLength(template.permissions.length);
      await expect
        .soft(kartu.getByText(`${body.permissions.length} Wewenang`), template.namaRole)
        .toBeVisible();
      await expect(tombol).toBeEnabled({ timeout: 15_000 });
    }

    await page.unroute(/\/api\/role$/i);
  });
});
