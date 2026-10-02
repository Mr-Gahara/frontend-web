import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";

/*
 * Spec migrasi halaman diskon (keputusan PD2a dan PD3a): perilaku yang
 * berubah atau baru dibanding spec pembanding (diskon.spec.ts). Ubah yang
 * mengirim PUT dengan field berubah saja, aktifkan dan nonaktifkan sebagai
 * pengganti hapus, validasi nilai, batas 50 diskon aktif, dan daftar yang
 * gagal dimuat. Diskon uji dibuat lewat UI berstatus Non-Aktif dengan nama
 * unik dan tertinggal, karena backend tidak punya DELETE; diskon yang
 * sempat diaktifkan dinonaktifkan kembali lewat UI, dan lewat API di
 * finally bila test berhenti di tengah.
 */

const URL_DISKON = BASIS + "/dashboard/outlet/diskon";
const POLA_DISKON = /\/api\/diskon(\?|$)/i;
const POLA_SATU = /\/api\/diskon\/[0-9a-f]{24}$/i;

type DiskonMentah = { id: string; namaDiskon: string; nilai: number; status: string };

const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama diskon...");
const dialogForm = (page: Page) => page.getByRole("dialog");
const dialogStatus = (page: Page) => page.getByRole("alertdialog");

const tunggu = (page: Page, method: string, pola: RegExp) =>
  page.waitForResponse((r) => r.request().method() === method && pola.test(r.url()));

async function diskonLewatApi(page: Page, auth: Auth, id: string): Promise<DiskonMentah> {
  const r = await api<DiskonMentah[]>(page, auth, "GET", "/diskon");
  expect(r.status, r.pesan).toBe(200);
  const diskon = r.data.find((d) => d.id === id);
  expect(diskon, "diskon uji terbaca lewat API").toBeTruthy();
  return diskon as DiskonMentah;
}

async function bukaDiskon(page: Page): Promise<Auth> {
  const auth = await bukaDenganAuth(page, URL_DISKON);
  await expect(page.getByRole("heading", { name: "Kelola Diskon" })).toBeVisible({
    timeout: 15_000,
  });
  return auth;
}

/** Membuat diskon uji Non-Aktif lewat form tambah, lalu mengembalikan id-nya dari API. */
async function buatLewatUi(page: Page, auth: Auth, nama: string): Promise<string> {
  await page.getByRole("button", { name: "Tambah Diskon" }).click();
  const dialog = dialogForm(page);
  await dialog.getByLabel("Nama Diskon").fill(nama);
  await dialog.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Non-Aktif" }).click();
  await dialog.getByLabel("Nilai Potongan").fill("15");
  const tPost = tunggu(page, "POST", POLA_DISKON);
  await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
  expect((await tPost).status(), "POST /diskon").toBe(201);
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  const r = await api<DiskonMentah[]>(page, auth, "GET", "/diskon");
  const tersimpan = r.data.find((d) => d.namaDiskon === nama);
  expect(tersimpan, "diskon uji terbaca lewat API").toBeTruthy();
  await pencarian(page).fill(nama);
  await expect(baris(page, nama)).toHaveCount(1, { timeout: 15_000 });
  return (tersimpan as DiskonMentah).id;
}

async function bukaMenu(page: Page, nama: string, aksi: string) {
  await baris(page, nama).getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("menuitem", { name: aksi, exact: true }).click();
}

test.describe("Kelola diskon", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("ubah: tanpa perubahan tidak mengirim, dan perubahan mengirim PUT ke id diskon dengan field yang berubah saja", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const nama = "E2E Diskon Ubah " + unik();
    const id = await buatLewatUi(page, auth, nama);

    await bukaMenu(page, nama, "Edit");
    const dialog = dialogForm(page);
    await expect(dialog.getByText("Edit Diskon")).toBeVisible();
    await expect(dialog.getByLabel("Nilai Potongan")).toHaveValue("15");

    let jumlahTulis = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (r.method() !== "GET" && /\/api\/diskon/i.test(r.url())) jumlahTulis++;
    };
    page.on("request", hitung);
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    await expect(page.getByText("Tidak ada perubahan untuk disimpan")).toBeVisible();
    page.off("request", hitung);
    expect(jumlahTulis).toBe(0);

    await dialog.getByLabel("Nilai Potongan").fill("20");
    const tTulis = page.waitForRequest(
      (r) => r.method() !== "GET" && /\/api\/diskon/i.test(r.url()),
    );
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    const req = await tTulis;
    expect(`${req.method()} ${req.url().replace(/^.*\/api/, "")}`).toBe(`PUT /diskon/${id}`);
    expect(req.postDataJSON()).toEqual({ nilai: 20 });
    expect((await req.response())?.status(), "PUT /diskon/:id").toBe(200);
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    expect((await diskonLewatApi(page, auth, id)).nilai).toBe(20);
    await expect(baris(page, nama)).toContainText("20%");
  });

  test("aktifkan dan nonaktifkan lewat menu: dialog bertahan saat gagal, lalu status berubah", async ({ page }) => {
    const auth = await bukaDiskon(page);
    const nama = "E2E Diskon Status " + unik();
    const id = await buatLewatUi(page, auth, nama);
    try {
      await page.route(POLA_SATU, async (route) => {
        if (route.request().method() === "PUT") await route.fulfill(JAWAB_GAGAL);
        else await route.continue();
      });
      await bukaMenu(page, nama, "Aktifkan");
      const dialog = dialogStatus(page);
      await expect(dialog.getByText(`Aktifkan diskon ${nama}?`)).toBeVisible();
      const tGagal = tunggu(page, "PUT", POLA_SATU);
      await dialog.getByRole("button", { name: "Aktifkan", exact: true }).click();
      expect((await tGagal).status()).toBeGreaterThanOrEqual(400);
      await expect(dialog.getByText(`Aktifkan diskon ${nama}?`)).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Aktifkan", exact: true })).toBeEnabled({
        timeout: 15_000,
      });
      expect((await diskonLewatApi(page, auth, id)).status).toBe("Non-Aktif");

      await page.unroute(POLA_SATU);
      const tAktif = tunggu(page, "PUT", POLA_SATU);
      await dialog.getByRole("button", { name: "Aktifkan", exact: true }).click();
      const resAktif = await tAktif;
      expect(resAktif.status(), "PUT status Aktif").toBe(200);
      expect(resAktif.request().postDataJSON()).toEqual({ status: "Aktif" });
      await expect(dialog).toBeHidden({ timeout: 15_000 });
      expect((await diskonLewatApi(page, auth, id)).status).toBe("Aktif");
      await expect(baris(page, nama)).not.toContainText("Non-Aktif");

      await bukaMenu(page, nama, "Nonaktifkan");
      await expect(dialog.getByText(`Nonaktifkan diskon ${nama}?`)).toBeVisible();
      const tNonaktif = tunggu(page, "PUT", POLA_SATU);
      await dialog.getByRole("button", { name: "Nonaktifkan", exact: true }).click();
      const resNonaktif = await tNonaktif;
      expect(resNonaktif.status(), "PUT status Non-Aktif").toBe(200);
      expect(resNonaktif.request().postDataJSON()).toEqual({ status: "Non-Aktif" });
      await expect(dialog).toBeHidden({ timeout: 15_000 });
      expect((await diskonLewatApi(page, auth, id)).status).toBe("Non-Aktif");
      await expect(baris(page, nama)).toContainText("Non-Aktif");
    } finally {
      const kini = await api<DiskonMentah[]>(page, auth, "GET", "/diskon");
      if (kini.data?.find((d) => d.id === id)?.status === "Aktif") {
        const r = await api(page, auth, "PUT", "/diskon/" + id, { status: "Non-Aktif" });
        expect.soft(r.status, "diskon uji dinonaktifkan kembali: " + r.pesan).toBe(200);
      }
    }
  });

  test("nilai kosong dan persen di atas 100 tidak dikirim, dan pesannya tampil", async ({ page }) => {
    await bukaDiskon(page);
    let jumlahPost = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (r.method() === "POST" && POLA_DISKON.test(r.url())) jumlahPost++;
    };
    page.on("request", hitung);
    await page.getByRole("button", { name: "Tambah Diskon" }).click();
    const dialog = dialogForm(page);
    await dialog.getByLabel("Nama Diskon").fill("E2E Diskon Validasi " + unik());
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    await expect(dialog.getByText("Nilai potongan wajib berupa angka lebih dari 0.")).toBeVisible();
    await dialog.getByLabel("Nilai Potongan").fill("150");
    await dialog.getByRole("button", { name: "Simpan Konfigurasi" }).click();
    await expect(dialog.getByText("Nilai diskon persen tidak boleh melebihi 100.")).toBeVisible();
    page.off("request", hitung);
    expect(jumlahPost).toBe(0);
    await dialog.getByRole("button", { name: "Tutup" }).click();
    await expect(dialog).toBeHidden();
  });

  test("batas diskon aktif: tombol tambah nonaktif beserta keterangannya", async ({ page }) => {
    await page.route(POLA_DISKON, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const asli = await route.fetch();
      const body = await asli.json();
      const contoh = Array.isArray(body.data) ? body.data[0] : undefined;
      const data = contoh
        ? Array.from({ length: 50 }, (_, i) => ({
            ...contoh,
            id: i.toString(16).padStart(24, "0"),
            namaDiskon: "Simulasi Aktif " + i,
            status: "Aktif",
          }))
        : body.data;
      // simulasi: lima puluh diskon aktif tidak dapat dibuat di data uji tanpa menumpuk diskon aktif permanen
      await route.fulfill({ status: asli.status(), json: { ...body, data } });
    });
    await bukaDiskon(page);
    await expect(page.getByText("50 total data")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/sudah punya 50 diskon aktif/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Tambah Diskon" })).toBeDisabled();
  });

  test("daftar yang gagal dimuat menampilkan pesan, dan coba lagi memuatnya", async ({ page }) => {
    await page.route(POLA_DISKON, async (route) => {
      if (route.request().method() === "GET") await route.fulfill(JAWAB_GAGAL);
      else await route.continue();
    });
    await bukaDiskon(page);
    await expect(page.getByText(/Gagal memuat data diskon/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Belum ada data diskon.")).toHaveCount(0);
    await page.unroute(POLA_DISKON);
    const tGet = tunggu(page, "GET", POLA_DISKON);
    await page.getByRole("button", { name: "Coba Lagi" }).click();
    expect((await tGet).status(), "GET /diskon").toBe(200);
    await expect(pencarian(page)).toBeVisible({ timeout: 15_000 });
  });
});