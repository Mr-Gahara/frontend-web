import { expect, test, type Page } from "@playwright/test";
import { JAWAB_GAGAL, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { ID_TIDAK_ADA, cocok, unik } from "../../helpers/reservasi-uji";

/*
 * Spec migrasi metode pembayaran (submodul 1 modul Pengaturan outlet),
 * melengkapi spec pembanding metode-pembayaran.spec.ts dengan perilaku yang
 * berubah: daftar kelola memakai showAll dan tanpa kolom Sistem (PO2a,
 * PO4a), buat dan ubah yang berhasil dengan payload sesuai allowlist backend
 * (kontrak/temuan.md butir 84), aktifkan dan nonaktifkan dari daftar (PO2a),
 * batas 10 metode aktif (PO3a), detail yang tidak ditemukan, gagal memuat
 * daftar, dan penolakan backend tanpa galat runtime.
 *
 * Data uji (PO10a): metode "E2E Metode Uji" dibuat sekali lewat API di akun
 * kas yang sudah dipakai metode tunai bawaan, disimpan nonaktif, lalu diubah
 * dan dikembalikan tiap test. Buat sungguhan bernama unik lalu dinonaktifkan,
 * karena metode pembayaran tidak dapat dihapus; setiap run meninggalkan satu
 * metode uji nonaktif. Akun kas uji spec keuangan tidak dipakai, karena
 * metode yang menunjuk sebuah akun mengunci akun itu dari penonaktifan.
 */

const URL_DAFTAR = "/dashboard/outlet/pengaturan/metodePembayaran";
const URL_BUAT = URL_DAFTAR + "/buatMetodePembayaran";
const POLA_DAFTAR = /\/api\/metodepembayaran(\?|$)/i;
const POLA_BUAT = /\/api\/metodepembayaran$/i;
const POLA_DETAIL = /\/api\/metodepembayaran\/[a-f0-9]{24}$/i;
const PLACEHOLDER_NAMA = "Misal: Transfer Bank Mandiri";
const NAMA_FIXTURE = "E2E Metode Uji";

type MetodeMentah = {
  id: string;
  namaPembayaran: string;
  kategori: "tunai" | "non-tunai";
  isActive: boolean;
  akunKas: { id: string; namaAkun: string | null; nomorAkun: string | null } | null;
};

const barisMetode = (page: Page, nama: string) =>
  page.getByRole("row").filter({ has: page.getByText(nama, { exact: true }) });

const pemicu = (page: Page, teks: string | RegExp) => page.getByRole("combobox").filter({ hasText: teks });

/** Daftar dapat melebihi 10 baris karena metode uji menumpuk; baris dicari lewat kotak pencarian. */
const cari = (page: Page, nama: string) => page.getByPlaceholder("Cari nama pembayaran...").fill(nama);

async function metodeTunaiAktif(page: Page, auth: Auth) {
  const r = await api<MetodeMentah[]>(page, auth, "GET", "/metodepembayaran");
  expect(r.status, "GET /metodepembayaran " + r.pesan).toBe(200);
  const m = r.data.find((x) => x.kategori === "tunai" && x.akunKas?.id && x.akunKas.namaAkun);
  expect(m, "tenant uji punya metode tunai aktif berakun kas").toBeTruthy();
  return m!;
}

async function pastikanFixture(page: Page, auth: Auth): Promise<MetodeMentah> {
  const r = await api<MetodeMentah[]>(page, auth, "GET", "/metodepembayaran?showAll=true");
  expect(r.status, "GET daftar kelola " + r.pesan).toBe(200);
  const ada = r.data.find((m) => m.namaPembayaran === NAMA_FIXTURE);
  if (ada && !ada.isActive) return ada;
  if (ada) {
    const t = await api<MetodeMentah>(page, auth, "PUT", "/metodepembayaran/" + ada.id, { isActive: false });
    expect(t.status, "nonaktifkan fixture " + t.pesan).toBe(200);
    return t.data;
  }
  const acuan = await metodeTunaiAktif(page, auth);
  const b = await api<MetodeMentah>(page, auth, "POST", "/metodepembayaran", {
    namaPembayaran: NAMA_FIXTURE,
    kategori: "non-tunai",
    akunKasID: acuan.akunKas!.id,
    isActive: false,
  });
  expect(b.status, "buat fixture " + b.pesan).toBe(201);
  return b.data;
}

async function nonaktifkanLewatApi(page: Page, auth: Auth, id: string | undefined) {
  if (!id) return;
  const d = await api<MetodeMentah>(page, auth, "GET", "/metodepembayaran/" + id);
  if (!d.data?.isActive) return;
  const t = await api(page, auth, "PUT", "/metodepembayaran/" + id, { isActive: false });
  expect.soft(t.status, `nonaktifkan metode uji ${id}: ${t.pesan}`).toBe(200);
}

test.describe("E2E — Kelola metode pembayaran", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar meminta showAll=true, menampilkan metode nonaktif, tanpa kolom Sistem (PO2a, PO4a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await pastikanFixture(page, auth);
    await page.goto(URL_DAFTAR, { waitUntil: "commit" });
    const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
    expect(new URL(res.url()).searchParams.get("showAll")).toBe("true");
    const data = ((await res.json()) as { data: MetodeMentah[] }).data;
    expect(data.some((m) => !m.isActive), "respons memuat metode nonaktif").toBe(true);
    await cari(page, NAMA_FIXTURE);
    await expect(barisMetode(page, NAMA_FIXTURE).getByText("Non-Aktif", { exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Sistem" })).toHaveCount(0);
  });

  test("buat berhasil: payload tanpa field gateway, lalu dinonaktifkan dari daftar (butir 84, PO2a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const acuan = await metodeTunaiAktif(page, auth);
    const akun = acuan.akunKas!;
    const nama = "E2E Metode " + unik();
    let id: string | undefined;
    try {
      await page.goto(URL_BUAT);
      await page.getByPlaceholder(PLACEHOLDER_NAMA).fill(nama);
      await pemicu(page, /pilih akun kas/i).click();
      await page.getByRole("option").filter({ hasText: `${akun.namaAkun} (${akun.nomorAkun})` }).click();
      const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_BUAT.test(r.url()));
      const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
      await page.getByRole("button", { name: /simpan metode/i }).click();
      expect((await tKirim).postDataJSON()).toEqual({
        namaPembayaran: nama,
        kategori: "non-tunai",
        akunKasID: akun.id,
        isActive: true,
      });
      const jawab = await tJawab;
      expect(jawab.status()).toBe(201);
      id = ((await jawab.json()) as { data: MetodeMentah }).data.id;
      await expect(page).toHaveURL(new RegExp(URL_DAFTAR + "$"));
      await cari(page, nama);
      const baris = barisMetode(page, nama);
      await expect(baris.getByText("Aktif", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: `Aksi ${nama}` }).click();
      await page.getByRole("menuitem", { name: "Nonaktifkan" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText(`Nonaktifkan metode ${nama}?`);
      const tPut = page.waitForRequest((r) => r.method() === "PUT" && POLA_DETAIL.test(r.url()));
      await dialog.getByRole("button", { name: "Nonaktifkan" }).click();
      expect((await tPut).postDataJSON()).toEqual({ isActive: false });
      await expect(dialog).toBeHidden();
      await expect(baris.getByText("Non-Aktif", { exact: true })).toBeVisible();
      expect((await api<MetodeMentah>(page, auth, "GET", "/metodepembayaran/" + id)).data.isActive).toBe(false);
    } finally {
      await nonaktifkanLewatApi(page, auth, id);
    }
  });

  test("ubah berhasil: hanya nama yang berubah terkirim, lalu kembali ke daftar", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await pastikanFixture(page, auth);
    const namaBaru = NAMA_FIXTURE + " " + unik();
    try {
      await page.goto(`${URL_DAFTAR}/${fx.id}`);
      const isian = page.getByPlaceholder(PLACEHOLDER_NAMA);
      await expect(isian).toHaveValue(NAMA_FIXTURE);
      await isian.fill(namaBaru);
      const tKirim = page.waitForRequest((r) => r.method() === "PUT" && POLA_DETAIL.test(r.url()));
      const tJawab = page.waitForResponse(cocok("PUT", POLA_DETAIL));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      expect((await tKirim).postDataJSON()).toEqual({ namaPembayaran: namaBaru });
      expect((await tJawab).status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(URL_DAFTAR + "$"));
      await cari(page, namaBaru);
      await expect(barisMetode(page, namaBaru)).toHaveCount(1);
    } finally {
      const r = await api(page, auth, "PUT", "/metodepembayaran/" + fx.id, { namaPembayaran: NAMA_FIXTURE });
      expect.soft(r.status, "kembalikan nama fixture: " + r.pesan).toBe(200);
    }
  });

  test("aktifkan kembali dari daftar: dialog, PUT isActive true, status Aktif (PO2a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await pastikanFixture(page, auth);
    try {
      await page.goto(URL_DAFTAR);
      await cari(page, NAMA_FIXTURE);
      const baris = barisMetode(page, NAMA_FIXTURE);
      await expect(baris.getByText("Non-Aktif", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: `Aksi ${NAMA_FIXTURE}` }).click();
      await page.getByRole("menuitem", { name: "Aktifkan" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText(`Aktifkan metode ${NAMA_FIXTURE}?`);
      const tPut = page.waitForRequest((r) => r.method() === "PUT" && POLA_DETAIL.test(r.url()));
      await dialog.getByRole("button", { name: "Aktifkan" }).click();
      expect((await tPut).postDataJSON()).toEqual({ isActive: true });
      await expect(dialog).toBeHidden();
      await expect(baris.getByText("Aktif", { exact: true })).toBeVisible();
      expect((await api<MetodeMentah>(page, auth, "GET", "/metodepembayaran/" + fx.id)).data.isActive).toBe(true);
    } finally {
      await nonaktifkanLewatApi(page, auth, fx.id);
    }
  });

  test("batas 10 metode aktif: aktifkan ditahan, tambah hanya dapat menyimpan nonaktif (PO3a, NZ5a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await pastikanFixture(page, auth);
    await page.route(POLA_DAFTAR, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const res = await route.fetch();
      const body = (await res.json()) as { data: MetodeMentah[] };
      const aktif = body.data.filter((m) => m.isActive);
      const tambahan = Array.from({ length: Math.max(0, 10 - aktif.length) }, (_, i) => ({
        ...aktif[0],
        id: ID_TIDAK_ADA.slice(0, -2) + String(i).padStart(2, "0"),
        namaPembayaran: "E2E Simulasi Aktif " + i,
      }));
      // simulasi: sepuluh metode aktif tidak dapat dibuat di data uji, karena metode tidak dapat dihapus
      await route.fulfill({ response: res, json: { ...body, data: [...tambahan, ...body.data] } });
    });
    await page.goto(URL_DAFTAR);
    await expect(page.getByText(/batas maksimal/)).toBeVisible();
    await cari(page, NAMA_FIXTURE);
    await page.getByRole("button", { name: `Aksi ${NAMA_FIXTURE}` }).click();
    await expect(page.getByRole("menuitem", { name: "Aktifkan" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /tambah metode/i }).click();
    await expect(page).toHaveURL(new RegExp(URL_BUAT + "$"));
    await expect(page.getByText(/hanya dapat disimpan nonaktif/)).toBeVisible();
    await pemicu(page, "Non-Aktif").click();
    await expect(page.getByRole("option", { name: "Aktif", exact: true })).toBeDisabled();
  });

  test("metode aktif terakhir tidak dapat dinonaktifkan dari daftar maupun form ubah (NZ4a)", async ({ page }) => {
    await bukaDenganAuth(page, URL_DAFTAR);
    let terakhir: MetodeMentah | undefined;
    await page.route(POLA_DAFTAR, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const res = await route.fetch();
      const body = (await res.json()) as { data: MetodeMentah[] };
      terakhir = body.data.find((m) => m.isActive);
      const data = body.data.map((m) => ({ ...m, isActive: m.id === terakhir?.id }));
      // simulasi: menyisakan satu metode aktif sungguhan mengosongkan pilihan kasir spec lain
      await route.fulfill({ response: res, json: { ...body, data } });
    });
    await page.goto(URL_DAFTAR);
    await expect(page.getByText(/Hanya satu metode yang aktif/)).toBeVisible();
    const nama = terakhir?.namaPembayaran ?? "";
    expect(nama).not.toBe("");
    await cari(page, nama);
    await page.getByRole("button", { name: `Aksi ${nama}`, exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "Nonaktifkan" })).toBeDisabled();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByText(/Ini satu-satunya metode aktif/)).toBeVisible();
    await pemicu(page, "Aktif").click();
    await expect(page.getByRole("option", { name: "Non-Aktif", exact: true })).toBeDisabled();
  });

  test("detail yang tidak ditemukan menampilkan pesan, bukan memuat tanpa akhir", async ({ page }) => {
    await page.goto(`${URL_DAFTAR}/${ID_TIDAK_ADA}`);
    await expect(page.getByText("Metode pembayaran tidak ditemukan")).toBeVisible();
    await expect(page.getByRole("button", { name: "Kembali ke Daftar" })).toBeVisible();
  });

  test("daftar yang gagal dimuat menampilkan pesan, bukan daftar kosong", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_DAFTAR);
    await expect(page.getByText("Gagal memuat metode pembayaran")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Belum ada data metode pembayaran.")).toHaveCount(0);
  });

  test("buat yang ditolak backend tidak menimbulkan galat runtime", async ({ page }) => {
    const galat: string[] = [];
    page.on("pageerror", (e) => galat.push(e.message));
    await page.route(POLA_BUAT, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_BUAT);
    await page.getByPlaceholder(PLACEHOLDER_NAMA).fill("E2E Metode " + unik());
    await pemicu(page, /pilih akun kas/i).click();
    await page.getByRole("option").first().click();
    const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
    await page.getByRole("button", { name: /simpan metode/i }).click();
    await tJawab;
    await expect(page.getByRole("main").getByText("uji", { exact: true })).toBeVisible();
    await expect(page.getByText("Runtime ApiError")).toHaveCount(0);
    expect(galat).toEqual([]);
  });
});