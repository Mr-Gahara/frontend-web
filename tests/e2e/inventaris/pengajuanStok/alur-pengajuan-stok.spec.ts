import { test, expect, Page, Response } from "@playwright/test";
import { ADA_IZIN_LINTAS } from "../../../helpers/lintas-outlet";
import { bukaDenganAuth, pengajuanUjiDisetujui, type Auth } from "../../../helpers/transfer-uji";

/*
 * Spec pembanding alur tulis pengajuan stok (keputusan pemilik proyek,
 * pilihan A, docs/modul/inventaris.md). Pengajuan tidak dapat dihapus atau
 * dibatalkan, sehingga alur utama membuat dokumen baru dan menutupnya
 * sebagai REJECTED. Setujui dan buat surat jalan hanya diuji jalur gagalnya
 * lewat page.route, memakai pengajuan SUBMITTED atau APPROVED yang sudah ada,
 * karena keduanya meninggalkan dokumen permanen bila berhasil.
 *
 * Dialog yang harus tetap terbuka saat operasi gagal (keputusan Fase 0)
 * diperiksa dengan expect.soft, agar alur tetap berlanjut sampai REJECTED
 * dan tidak meninggalkan dokumen aktif walau pemeriksaan itu gagal.
 */

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/pengajuanStok";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/pengajuanStok";
const POLA_POST = /\/api\/pengajuanstok(\?|$)/i;
const ALASAN = "Uji e2e alur pengajuan";
const JAWAB_GAGAL = {
  status: 500,
  contentType: "application/json",
  body: JSON.stringify({ status: "error", message: "uji" }),
};

type PengajuanMentah = {
  id: string;
  nomorPengajuan: string;
  status: string;
  transferStokID: string | null;
  dariLokasi: { tipe?: string } | null;
  keLokasi: { tipe?: string } | null;
  items?: { jumlah: number; stokGudangSaatIni?: number }[];
};
type PayloadPengajuan = {
  dariLocationID: string;
  keLocationID: string;
  items: { bahanBakuID: string; jumlah: number; satuan: string }[];
};

async function login(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/dashboard");
}

function patchAksi(aksi: string) {
  const pola = new RegExp("/api/pengajuanstok/[^/]+/" + aksi + "(\\?|$)", "i");
  return (r: Response) => r.request().method() === "PATCH" && pola.test(r.url());
}

function getDetail(id: string) {
  return (r: Response) =>
    r.request().method() === "GET" &&
    r.url().split("?")[0].toLowerCase().endsWith("/api/pengajuanstok/" + id.toLowerCase());
}

/*
 * Token API memakai `bukaDenganAuth` bersama (`tests/helpers/transfer-uji.ts`),
 * yang mengikuti setiap `pin-refresh` dan mengembalikan fungsi, bukan string
 * beku. Versi lokal sebelumnya mengambil header dari permintaan API pertama,
 * sehingga tokennya bisa milik halaman sebelumnya dan dijawab 401 setelah
 * navigasi penuh berikutnya (`docs/referensi/playwright.md`, Catatan Playwright).
 */

async function daftarPengajuan(page: Page, auth: Auth, status: string): Promise<PengajuanMentah[]> {
  const res = await page.request.get("http://localhost:3000/api/pengajuanstok?status=" + status, {
    headers: { Authorization: auth() },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: PengajuanMentah[] }).data;
}

test.describe("Alur tulis pengajuan stok", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("buat, revisi, ajukan, lalu tolak; dialog bertahan saat ajukan gagal", async ({ page }) => {
    test.setTimeout(120_000);
    let id = "";
    let dibuat = {} as PayloadPengajuan;

    await test.step("buat draft dari outlet", async () => {
      await page.goto(URL_OUTLET + "/buatPengajuan");
      if (ADA_IZIN_LINTAS) {
        await page.getByText("Pilih Outlet Anda...", { exact: true }).click();
        await page.getByRole("option").first().click();
      } else {
        await expect(page.locator("#pengajuan-outlet"), "outlet peminta terkunci ke outlet tenant").toBeDisabled();
      }
      await page.getByText("Pilih Gudang...", { exact: true }).click();
      await page.getByRole("option").first().click();
      if ((await page.getByText("Pilih...", { exact: true }).count()) === 0) {
        await page.getByRole("button", { name: /tambah baris/i }).click();
      }
      await page.getByText("Pilih...", { exact: true }).first().click();
      await page.getByRole("option").first().click();
      await page.getByPlaceholder("0").first().fill("1");

      const tPost = page.waitForResponse((r) => r.request().method() === "POST" && POLA_POST.test(r.url()));
      await page.getByRole("button", { name: "Simpan sebagai Draft" }).click();
      const res = await tPost;
      expect(res.status()).toBe(201);
      dibuat = res.request().postDataJSON() as PayloadPengajuan;
      id = ((await res.json()) as { data: PengajuanMentah }).data.id;
      expect(id).toBeTruthy();
      await page.waitForURL(/\/pengajuanStok$/);
    });

    await test.step("revisi jumlah draft", async () => {
      await page.goto(`${URL_OUTLET}/${id}`);
      await page.getByRole("button", { name: /revisi draft/i }).click();
      await page.waitForURL(new RegExp(`/pengajuanStok/${id}/edit$`));
      const jumlah = page.getByPlaceholder("0").first();
      await expect(jumlah).toHaveValue("1");
      await jumlah.fill("2");

      const tPut = page.waitForResponse(
        (r) => r.request().method() === "PUT" && r.url().toLowerCase().includes("/api/pengajuanstok/" + id.toLowerCase()),
      );
      await page.getByRole("button", { name: "Simpan Perubahan" }).click();
      const res = await tPut;
      expect(res.status()).toBe(200);
      const payload = res.request().postDataJSON() as PayloadPengajuan;
      expect(payload.dariLocationID).toBe(dibuat.dariLocationID);
      expect(payload.keLocationID).toBe(dibuat.keLocationID);
      expect(payload.items[0].jumlah).toBe(2);
      await page.waitForURL(new RegExp(`/pengajuanStok/${id}$`));
    });

    await test.step("ajukan gagal: dialog bertahan dan pesan tampil", async () => {
      const tombol = page.getByRole("button", { name: /ajukan ke gudang/i });
      await expect(tombol).toBeVisible();
      const pola = /\/api\/pengajuanstok\/[^/]+\/submit(\?|$)/i;
      await page.route(pola, (route) =>
        route.request().method() === "PATCH" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await tombol.click();
      const dialog = page.getByRole("alertdialog");
      const tGagal = page.waitForResponse(patchAksi("submit"));
      await dialog.getByRole("button", { name: "Ya, Ajukan Sekarang" }).click();
      expect((await tGagal).status()).toBe(500);
      await expect(page.getByText("Gagal Mengajukan")).toBeVisible();
      await expect.soft(dialog, "dialog ajukan harus tetap terbuka saat gagal (keputusan Fase 0)").toBeVisible();
      await page.unroute(pola);
    });

    await test.step("ajukan", async () => {
      const dialog = page.getByRole("alertdialog");
      if (!(await dialog.isVisible())) {
        await page.getByRole("button", { name: /ajukan ke gudang/i }).click();
      }
      const t = page.waitForResponse(patchAksi("submit"));
      await dialog.getByRole("button", { name: "Ya, Ajukan Sekarang" }).click();
      expect((await t).status()).toBe(200);
      await expect(dialog).toBeHidden();
      await expect(page.getByRole("button", { name: /revisi draft/i })).toHaveCount(0);
    });

    await test.step("buka detail di gudang", async () => {
      await page.goto(`${URL_GUDANG}/${id}`, { waitUntil: "commit" });
      const detail = await page
        .waitForResponse(getDetail(id))
        .then(async (r) => ((await r.json()) as { data: PengajuanMentah }).data);
      expect(detail.status).toBe("SUBMITTED");
    });

    await test.step("tolak dengan alasan", async () => {
      await page.getByRole("button", { name: "Tolak Permintaan" }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByPlaceholder("Ketik alasan penolakan di sini...").fill(ALASAN);
      const t = page.waitForResponse(patchAksi("reject"));
      await dialog.getByRole("button", { name: "Tolak Permintaan" }).click();
      const res = await t;
      expect(res.status()).toBe(200);
      expect(res.request().postDataJSON()).toEqual({ alasan: ALASAN });
      await expect(dialog).toBeHidden();
      await expect(page.getByRole("button", { name: /setujui permintaan/i })).toHaveCount(0);
    });
  });

  test("pengembalian: buat dari outlet, ajukan, tampil di inbox gudang, lalu tolak", async ({ page }) => {
    test.setTimeout(120_000);
    let id = "";
    let nomor = "";

    await test.step("buat draft pengembalian dari outlet", async () => {
      await page.goto(URL_OUTLET + "/buatPengajuan");
      const pilihKembali = page.getByRole("button", { name: /kembalikan ke gudang/i });
      await pilihKembali.click();
      await expect(pilihKembali).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText("Outlet Asal Barang")).toBeVisible();
      await expect(page.getByText("Gudang Tujuan")).toBeVisible();
      if (ADA_IZIN_LINTAS) {
        await page.getByText("Pilih Outlet Anda...", { exact: true }).click();
        await page.getByRole("option").first().click();
      }
      await page.getByText("Pilih Gudang...", { exact: true }).click();
      await page.getByRole("option").first().click();
      if ((await page.getByText("Pilih...", { exact: true }).count()) === 0) {
        await page.getByRole("button", { name: /tambah baris/i }).click();
      }
      await page.getByText("Pilih...", { exact: true }).first().click();
      await page.getByRole("option").first().click();
      await page.getByPlaceholder("0").first().fill("1");

      const tPost = page.waitForResponse((r) => r.request().method() === "POST" && POLA_POST.test(r.url()));
      await page.getByRole("button", { name: "Simpan sebagai Draft" }).click();
      const res = await tPost;
      expect(res.status()).toBe(201);
      const data = ((await res.json()) as { data: PengajuanMentah }).data;
      id = data.id;
      nomor = data.nomorPengajuan;
      expect(id).toBeTruthy();
      await page.waitForURL(/\/pengajuanStok$/);
    });

    await test.step("detail outlet: outlet sebagai asal barang (P8)", async () => {
      await page.goto(`${URL_OUTLET}/${id}`, { waitUntil: "commit" });
      const detail = await page
        .waitForResponse(getDetail(id))
        .then(async (r) => ((await r.json()) as { data: PengajuanMentah }).data);
      expect(detail.dariLokasi?.tipe, "asal barang pengembalian adalah outlet").toBe("Outlet");
      expect(detail.keLokasi?.tipe, "tujuan barang pengembalian adalah gudang").toBe("Gudang");
      await expect(page.getByText("Outlet Asal Barang")).toBeVisible();
      await expect(page.getByText("Barang yang Dikembalikan")).toBeVisible();
    });

    await test.step("ajukan", async () => {
      await page.getByRole("button", { name: /ajukan ke gudang/i }).click();
      const dialog = page.getByRole("alertdialog");
      const t = page.waitForResponse(patchAksi("submit"));
      await dialog.getByRole("button", { name: "Ya, Ajukan Sekarang" }).click();
      expect((await t).status()).toBe(200);
      await expect(dialog).toBeHidden();
    });

    await test.step("inbox gudang: tampil sebagai pengembalian", async () => {
      await page.goto(URL_GUDANG);
      await page.getByRole("combobox", { name: "Filter arah" }).click();
      await page.getByRole("option", { name: "Pengembalian" }).click();
      const baris = page.getByRole("row").filter({ hasText: nomor });
      await expect(baris).toBeVisible();
      await expect(baris.getByText("Pengembalian", { exact: true })).toBeVisible();
    });

    await test.step("detail gudang: stok outlet, lalu tolak", async () => {
      await page.goto(`${URL_GUDANG}/${id}`);
      await expect(page.getByRole("columnheader", { name: "Stok Outlet" })).toBeVisible();
      await page.getByRole("button", { name: "Tolak Pengembalian" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByPlaceholder("Ketik alasan penolakan di sini...").fill(ALASAN);
      const t = page.waitForResponse(patchAksi("reject"));
      await dialog.getByRole("button", { name: "Tolak Permintaan" }).click();
      const res = await t;
      expect(res.status()).toBe(200);
      expect(res.request().postDataJSON()).toEqual({ alasan: ALASAN });
      await expect(dialog).toBeHidden();
      await expect(page.getByRole("button", { name: /setujui pengembalian/i })).toHaveCount(0);
    });
  });

  test("setujui gagal: dialog bertahan dan pesan tampil", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_GUDANG);
    let sasaran: PengajuanMentah | undefined;
    for (const p of await daftarPengajuan(page, auth, "SUBMITTED")) {
      if (p.dariLokasi?.tipe !== "Gudang" || p.keLokasi?.tipe !== "Outlet") continue;
      const res = await page.request.get("http://localhost:3000/api/pengajuanstok/" + p.id, {
        headers: { Authorization: auth() },
      });
      const detail = ((await res.json()) as { data: PengajuanMentah }).data;
      if ((detail.items ?? []).every((i) => (i.stokGudangSaatIni ?? 0) >= i.jumlah)) {
        sasaran = detail;
        break;
      }
    }
    test.skip(!sasaran, "Tidak ada pengajuan SUBMITTED berarah benar dengan stok gudang cukup");

    const pola = /\/api\/pengajuanstok\/[^/]+\/approve(\?|$)/i;
    await page.route(pola, (route) =>
      route.request().method() === "PATCH" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(`${URL_GUDANG}/${sasaran!.id}`);
    const setujui = page.getByRole("button", { name: /setujui permintaan/i });
    await expect(setujui).toBeEnabled();
    await setujui.click();
    const dialog = page.getByRole("alertdialog");
    const tGagal = page.waitForResponse(patchAksi("approve"));
    await dialog.getByRole("button", { name: "Ya, Setujui Sekarang" }).click();
    expect((await tGagal).status()).toBe(500);
    await expect(page.getByText("Gagal Menyetujui")).toBeVisible();
    await expect(dialog, "dialog setujui harus tetap terbuka saat gagal (keputusan Fase 0)").toBeVisible();
    await page.unroute(pola);
  });

  test("buat surat jalan gagal menampilkan pesan dan tetap di detail", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_GUDANG);
    // Pengajuan uji transfer disiapkan APPROVED bila belum ada; jalur gagal
    // tidak mengubahnya, sehingga spec transfer memakainya ulang.
    const idUji = await pengajuanUjiDisetujui(page, auth);
    const sasaran = (await daftarPengajuan(page, auth, "APPROVED")).find((p) => p.id === idUji);
    expect(sasaran, "pengajuan uji APPROVED tanpa surat jalan").toBeTruthy();

    const pola = /\/api\/transferstok(\?|$)/i;
    await page.route(pola, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(`${URL_GUDANG}/${sasaran!.id}`);
    const tGagal = page.waitForResponse((r) => r.request().method() === "POST" && pola.test(r.url()));
    await page.getByRole("button", { name: /buat surat jalan/i }).click();
    expect((await tGagal).status()).toBe(500);
    await expect(page.getByText("Gagal Membuat Surat Jalan")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pengajuanStok/${sasaran!.id}$`));
    await page.unroute(pola);
  });
});