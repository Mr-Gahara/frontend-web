import { expect, test, type Page } from "@playwright/test";
import { api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { ID_TIDAK_ADA, cocok, pantauPermintaan, unik } from "../../helpers/reservasi-uji";

/*
 * Spec ubah, nonaktifkan, dan aktifkan kembali akun kas lewat PUT
 * /akunkas/:id (keputusan UA1a sampai UA4a). Akun uji dibuat lewat API
 * bersaldo 0 dan ditutup lewat status non-aktif di finally, karena akun kas
 * tidak dapat dihapus (pola keputusan KU4a). Respons tidak dipalsukan:
 * penolakan 409 berasal dari backend dan pesannya dicocokkan dengan yang
 * tampil di layar.
 */

const URL_AKUN = "/dashboard/outlet/keuangan/akunkas";
const urlUbah = (id: string) => `${URL_AKUN}/${id}/ubah`;
const POLA_AKUN_ID = /\/api\/akunkas\/[a-f0-9]{24}(\?|$)/i;

type AkunKasUji = {
  id: string;
  namaAkun: string;
  nomorAkun: string;
  saldo: number;
  status: string;
  keterangan: string | null;
};

const kartuAkun = (page: Page, nama: string) =>
  page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: nama, exact: true }) })
    .filter({ hasText: "Saldo Saat Ini" })
    .last();

async function daftarAkun(page: Page, auth: Auth) {
  const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
  expect(baca.status, "baca akun kas: " + baca.pesan).toBe(200);
  return baca.data ?? [];
}

async function buatAkunUji(page: Page, auth: Auth, nama: string) {
  const buat = await api<AkunKasUji>(page, auth, "POST", "/akunkas", {
    namaAkun: nama,
    nomorAkun: "E2E-" + unik(),
    tipeAkun: "Kas Fisik",
    keterangan: "E2E ubah akun",
    saldo: 0,
    status: "aktif",
  });
  expect(buat.status, "buat akun kas uji: " + buat.pesan).toBe(201);
  const akun = (await daftarAkun(page, auth)).find((a) => a.namaAkun === nama);
  expect(akun, "akun uji tersimpan di backend").toBeTruthy();
  return akun as AkunKasUji;
}

async function tutupAkunUji(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const tutup = await api(page, auth, "PUT", "/akunkas/" + id, { status: "non-aktif" });
  expect.soft(tutup.status, `nonaktifkan akun kas uji: ${tutup.pesan}`).toBe(200);
}

test.describe("ubah akun kas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("ubah dari kartu: payload hanya field yang berubah, tersimpan, kembali ke daftar (UA1a, UA4a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const nama = "E2E Ubah Akun " + unik();
    const namaBaru = nama + " Baru";
    let id: string | undefined;
    try {
      const akun = await buatAkunUji(page, auth, nama);
      id = akun.id;
      await page.reload();
      await page.getByRole("link", { name: `Ubah ${nama}`, exact: true }).click();
      await page.waitForURL(new RegExp(`/akunkas/${id}/ubah$`));

      const simpan = page.getByRole("button", { name: "Simpan Perubahan" });
      await expect(page.getByLabel("Nama Akun")).toHaveValue(nama);
      await expect(simpan, "tanpa perubahan, simpan mati").toBeDisabled();

      await page.getByLabel("Nama Akun").fill(namaBaru);
      await page.getByLabel(/Keterangan/).fill("");
      const tKirim = page.waitForResponse(cocok("PUT", POLA_AKUN_ID));
      await simpan.click();
      const res = await tKirim;
      const body = await res.json().catch(() => ({}));
      expect(res.status(), `PUT /akunkas/:id: ${JSON.stringify(body).slice(0, 200)}`).toBe(200);
      expect(res.request().postDataJSON()).toEqual({ namaAkun: namaBaru, keterangan: null });

      await page.waitForURL(/\/keuangan\/akunkas$/);
      await expect(kartuAkun(page, namaBaru)).toBeVisible();
      const tersimpan = (await daftarAkun(page, auth)).find((a) => a.id === id);
      expect(tersimpan?.namaAkun).toBe(namaBaru);
      expect(tersimpan?.keterangan ?? null).toBeNull();
      expect(tersimpan?.nomorAkun).toBe(akun.nomorAkun);
      expect(tersimpan?.status).toBe("aktif");
    } finally {
      await tutupAkunUji(page, auth, id);
    }
  });

  test("spasi di tepi bukan perubahan, dan nama kosong menampilkan pesan tanpa mengirim PUT", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const nama = "E2E Ubah Akun " + unik();
    let id: string | undefined;
    try {
      id = (await buatAkunUji(page, auth, nama)).id;
      await page.goto(urlUbah(id));
      const simpan = page.getByRole("button", { name: "Simpan Perubahan" });
      await expect(page.getByLabel("Nama Akun")).toHaveValue(nama);
      const kirim = pantauPermintaan(page, "PUT", POLA_AKUN_ID);

      await page.getByLabel("Nama Akun").fill(`  ${nama}  `);
      await expect(simpan, "spasi di tepi tidak dihitung perubahan").toBeDisabled();

      await page.getByLabel("Nama Akun").fill("");
      await expect(simpan).toBeEnabled();
      await simpan.click();
      await expect(page.getByText("Nama Akun wajib diisi.")).toBeVisible();
      expect(kirim.jumlah(), "validasi gagal tidak mengirim PUT").toBe(0);
      kirim.lepas();
    } finally {
      await tutupAkunUji(page, auth, id);
    }
  });

  test("nama kembar ditolak 409: pesan backend tampil, halaman tetap, data tidak berubah", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const namaA = "E2E Ubah Kembar A " + unik();
    const namaB = "E2E Ubah Kembar B " + unik();
    let idA: string | undefined;
    let idB: string | undefined;
    try {
      idA = (await buatAkunUji(page, auth, namaA)).id;
      idB = (await buatAkunUji(page, auth, namaB)).id;
      await page.goto(urlUbah(idB));
      await expect(page.getByLabel("Nama Akun")).toHaveValue(namaB);
      await page.getByLabel("Nama Akun").fill(namaA);
      const tKirim = page.waitForResponse(cocok("PUT", POLA_AKUN_ID));
      await page.getByRole("button", { name: "Simpan Perubahan" }).click();
      const res = await tKirim;
      expect(res.status()).toBe(409);
      const pesan = String((await res.json().catch(() => ({}))).message ?? "");
      expect(pesan, "respons 409 membawa pesan").not.toBe("");
      await expect(page.getByText(pesan)).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/akunkas/${idB}/ubah$`));
      const tetap = (await daftarAkun(page, auth)).find((a) => a.id === idB);
      expect(tetap?.namaAkun).toBe(namaB);
    } finally {
      await tutupAkunUji(page, auth, idB);
      await tutupAkunUji(page, auth, idA);
    }
  });

  test("nonaktifkan dari halaman ubah, lalu aktifkan kembali dari bagian lipat (UA2a, UA3a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const nama = "E2E Ubah Status " + unik();
    let id: string | undefined;
    try {
      id = (await buatAkunUji(page, auth, nama)).id;
      await page.goto(urlUbah(id));
      await page.getByRole("button", { name: "Nonaktifkan Akun" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText(`Nonaktifkan ${nama}?`);
      const tTutup = page.waitForResponse(cocok("PUT", POLA_AKUN_ID));
      await dialog.getByRole("button", { name: "Nonaktifkan", exact: true }).click();
      const resTutup = await tTutup;
      expect(resTutup.status()).toBe(200);
      expect(resTutup.request().postDataJSON()).toEqual({ status: "non-aktif" });

      await page.waitForURL(/\/keuangan\/akunkas$/);
      await expect(page.getByRole("heading", { name: nama, exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: /^Akun non-aktif \(\d+\)$/ }).click();
      const baris = page.locator("#daftar-akun-non-aktif").getByRole("listitem").filter({ hasText: nama });
      await expect(baris).toHaveCount(1);

      await baris.getByRole("button", { name: `Aktifkan kembali ${nama}`, exact: true }).click();
      await expect(dialog).toContainText(`Aktifkan kembali ${nama}?`);
      const tAktif = page.waitForResponse(cocok("PUT", POLA_AKUN_ID));
      await dialog.getByRole("button", { name: "Aktifkan Kembali", exact: true }).click();
      const resAktif = await tAktif;
      const bodyAktif = await resAktif.json().catch(() => ({}));
      expect(resAktif.status(), `aktifkan: ${JSON.stringify(bodyAktif).slice(0, 200)}`).toBe(200);
      expect(resAktif.request().postDataJSON()).toEqual({ status: "aktif" });

      await expect(dialog).toHaveCount(0);
      await expect(kartuAkun(page, nama)).toBeVisible();
      const akhir = (await daftarAkun(page, auth)).find((a) => a.id === id);
      expect(akhir?.status).toBe("aktif");
    } finally {
      await tutupAkunUji(page, auth, id);
    }
  });

  test("nonaktifkan akun bersaldo ditolak 409: pesan backend tampil di dialog, akun tetap aktif", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const bersaldo = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && Number(a.saldo) > 0,
    );
    test.skip(!bersaldo, "Tidak ada akun kas aktif bersaldo di data uji");
    const akun = bersaldo as AkunKasUji;
    await page.goto(urlUbah(akun.id));
    await page.getByRole("button", { name: "Nonaktifkan Akun" }).click();
    const dialog = page.getByRole("dialog");
    const tKirim = page.waitForResponse(cocok("PUT", POLA_AKUN_ID));
    await dialog.getByRole("button", { name: "Nonaktifkan", exact: true }).click();
    const res = await tKirim;
    expect(res.status()).toBe(409);
    const pesan = String((await res.json().catch(() => ({}))).message ?? "");
    expect(pesan, "respons 409 membawa pesan").not.toBe("");
    await expect(dialog.getByRole("alert")).toHaveText(pesan);
    await expect(dialog).toBeVisible();
    const tetap = (await daftarAkun(page, auth)).find((a) => a.id === akun.id);
    expect(tetap?.status).toBe("aktif");
    expect(Number(tetap?.saldo)).toBe(Number(akun.saldo));
  });

  test("akun yang tidak ada: keterangan tampil tanpa form", async ({ page }) => {
    await page.goto(urlUbah(ID_TIDAK_ADA));
    await expect(page.getByText("Akun kas tidak ditemukan")).toBeVisible();
    await expect(page.getByRole("button", { name: "Simpan Perubahan" })).toHaveCount(0);
  });
});