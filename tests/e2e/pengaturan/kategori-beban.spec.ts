import { expect, test, type Page } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import {
  KATEGORI_FIXTURE,
  daftarKategori,
  idKategori as idDari,
  pastikanKategoriFixture as pastikanFixture,
  type KategoriUji as Kategori,
} from "../../helpers/beban-uji";
import { unik } from "../../helpers/reservasi-uji";

/*
 * Kategori beban di Pengaturan outlet (keputusan BO4a), tanpa respons palsu.
 * Kategori uji bernama unik ditambah, diganti nama, dan dihapus lewat UI,
 * sehingga tidak ada data tertinggal. Penolakan diuji pada fixture tetap
 * "E2E Kategori Beban" (keputusan RG7a): nama kembar, dan hapus kategori yang
 * sudah dipakai beban. Nama uji diawali "E2E KB Uji" agar tidak memuat nama
 * fixture.
 */

const URL_PENGATURAN = "/dashboard/outlet/pengaturan";
const URL_KATEGORI = URL_PENGATURAN + "/kategoriBeban";
const POLA_DAFTAR = /\/api\/kategoribeban(\?|$)/i;
const POLA_ID = /\/api\/kategoribeban\/[a-f0-9]{24}(\?|$)/i;
const FIXTURE = KATEGORI_FIXTURE;

/** Daftar dipaginasi klien, sehingga baris dicari lewat kotak pencarian (TB14a). */
async function cariBaris(page: Page, nama: string) {
  await page.getByPlaceholder("Cari nama kategori...").fill(nama);
  return page.getByRole("row").filter({ hasText: nama });
}

test.describe("kategori beban", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tambah, ganti nama, lalu hapus lewat UI tanpa sisa data (BO4a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PENGATURAN);
    const nama = "E2E KB Uji " + unik();
    const namaBaru = nama + " Ubah";
    let id: string | undefined;
    let terhapus = false;

    try {
      const tDaftar = page.waitForResponse(
        (r) => r.request().method() === "GET" && POLA_DAFTAR.test(r.url()),
      );
      await page.getByRole("link", { name: /Kategori Beban/ }).click();
      await page.waitForURL("**" + URL_KATEGORI);
      expect((await tDaftar).status(), "GET /kategoribeban").toBe(200);
      await expect(page.getByRole("heading", { name: "Kategori Beban", exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Tambah Kategori" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Nama Kategori").fill("  " + nama + "  ");
      const tBuat = page.waitForResponse(
        (r) => r.request().method() === "POST" && POLA_DAFTAR.test(r.url()),
      );
      await dialog.getByRole("button", { name: "Simpan" }).click();
      const buat = await tBuat;
      expect(buat.status(), "POST /kategoribeban").toBe(201);
      expect(buat.request().postDataJSON(), "nama dipangkas").toEqual({ namaKategori: nama });
      id = idDari(((await buat.json()) as { data: Kategori }).data);
      await expect(dialog).toBeHidden();
      await expect(await cariBaris(page, nama)).toHaveCount(1);

      await page.getByRole("button", { name: "Aksi " + nama, exact: true }).click();
      await page.getByRole("menuitem", { name: "Ganti nama" }).click();
      await expect(dialog.getByLabel("Nama Kategori")).toHaveValue(nama);
      await expect(
        dialog.getByRole("button", { name: "Simpan" }),
        "simpan mati selama nama belum berubah",
      ).toBeDisabled();
      await dialog.getByLabel("Nama Kategori").fill(namaBaru);
      const tUbah = page.waitForResponse(
        (r) => r.request().method() === "PUT" && POLA_ID.test(r.url()),
      );
      await dialog.getByRole("button", { name: "Simpan" }).click();
      const ubah = await tUbah;
      expect(ubah.status(), "PUT /kategoribeban/:id").toBe(200);
      expect(ubah.request().postDataJSON()).toEqual({ namaKategori: namaBaru });
      await expect(dialog).toBeHidden();
      await expect(await cariBaris(page, namaBaru)).toHaveCount(1);

      await page.getByRole("button", { name: "Aksi " + namaBaru, exact: true }).click();
      await page.getByRole("menuitem", { name: "Hapus" }).click();
      const konfirmasi = page.getByRole("alertdialog");
      await expect(konfirmasi).toContainText(namaBaru);
      const tHapus = page.waitForResponse(
        (r) => r.request().method() === "DELETE" && POLA_ID.test(r.url()),
      );
      await konfirmasi.getByRole("button", { name: "Hapus" }).click();
      expect((await tHapus).status(), "DELETE /kategoribeban/:id").toBe(200);
      terhapus = true;
      await expect(konfirmasi).toBeHidden();
      await expect(await cariBaris(page, namaBaru)).toHaveCount(0);

      const sisa = (await daftarKategori(page, auth)).filter((k) => k.namaKategori.startsWith(nama));
      expect(sisa, "kategori uji tidak tersisa di backend").toHaveLength(0);
    } finally {
      if (id && !terhapus) {
        const hapus = await api(page, auth, "DELETE", "/kategoribeban/" + id);
        expect.soft(hapus.status, "hapus kategori uji: " + hapus.pesan).toBe(200);
      }
    }
  });

  test("nama kembar ditolak backend, dan dialog bertahan dengan pesannya", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_KATEGORI);
    await pastikanFixture(page, auth);

    await page.getByRole("button", { name: "Tambah Kategori" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama Kategori").fill(FIXTURE);
    const tBuat = page.waitForResponse(
      (r) => r.request().method() === "POST" && POLA_DAFTAR.test(r.url()),
    );
    await dialog.getByRole("button", { name: "Simpan" }).click();
    const buat = await tBuat;
    expect([400, 409], "nama kembar ditolak").toContain(buat.status());
    const pesan = ((await buat.json()) as { message: string }).message;
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toHaveText(pesan);
  });

  test("kategori yang dipakai beban ditolak dihapus (409), dan dialog bertahan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_KATEGORI);
    const idFixture = await pastikanFixture(page, auth);
    const pakai = await api<unknown[]>(
      page,
      auth,
      "GET",
      "/bebanoperasional?kategoriBebanID=" + idFixture + "&page=1&limit=1",
    );
    expect(pakai.status, "baca beban fixture: " + pakai.pesan).toBe(200);
    test.skip((pakai.data ?? []).length === 0, "kategori fixture belum dipakai beban");

    const baris = await cariBaris(page, FIXTURE);
    await expect(baris).toHaveCount(1);
    await page.getByRole("button", { name: "Aksi " + FIXTURE, exact: true }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    const konfirmasi = page.getByRole("alertdialog");
    const tHapus = page.waitForResponse(
      (r) => r.request().method() === "DELETE" && POLA_ID.test(r.url()),
    );
    await konfirmasi.getByRole("button", { name: "Hapus" }).click();
    const hapus = await tHapus;
    expect(hapus.status(), "kategori dipakai beban").toBe(409);
    const pesan = ((await hapus.json()) as { message: string }).message;
    await expect(konfirmasi).toBeVisible();
    await expect(konfirmasi.getByRole("alert")).toHaveText(pesan);
  });
});