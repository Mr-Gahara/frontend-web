import { test, expect, type Page } from "@playwright/test";
import { normalizeId } from "@/lib/api/normalize";
import { BASIS, JAWAB_GAGAL, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import {
  TAKARAN,
  buatDraftLewatUi,
  detailPenjualan,
  hapusDraft,
  jurnalPenjualan,
  setelStokOutlet,
  setelStokProduk,
  siapkanFixture,
  stokOutlet,
  stokProduk,
} from "../../helpers/penjualan-uji";

/**
 * Spec pembanding alur penjualan (keputusan K6b, 24 September 2026): stok
 * bahan di outlet benar-benar berkurang sesuai resep saat finalisasi, dan
 * ditolak utuh bila tidak cukup. Menulis data sungguhan: fixture tetap,
 * penjualan FINAL beserta pembayarannya, penjualan VOID, jurnal stok, dan
 * opname persiapan. Penjualan DRAFT yang tersisa dihapus.
 *
 * Jurnal stok belum dapat diperiksa lewat API: daftar jurnal di-cache 300
 * detik dan tidak dibersihkan saat inventoryService menulis jurnal
 * (penjualan maupun opname). Asersinya ditulis lengkap di dua test.fixme.
 *
 * Dialog yang harus bertahan saat operasi gagal (keputusan Fase 0) diuji di
 * test tersendiri.
 */
const DAFTAR = BASIS + "/dashboard/outlet/penjualan";
const polaPenjualan = (id: string) => new RegExp(`/api/penjualan/${id}(\\?|$)`, "i");

async function finalisasiLewatDetail(page: Page, id: string) {
  await page.goto(`${DAFTAR}/${id}`);
  await page.getByRole("button", { name: /finalisasi invoice/i }).click();
  const tunggu = page.waitForResponse((r) => r.request().method() === "PUT" && polaPenjualan(id).test(r.url()));
  await page.getByRole("button", { name: /ya, finalisasi transaksi/i }).click();
  return tunggu;
}

async function bukaAksiBaris(page: Page, noReferensi: string, menu: RegExp) {
  const baris = page.getByRole("row").filter({ hasText: noReferensi });
  await expect(baris).toHaveCount(1);
  await baris.getByRole("cell").last().getByRole("button").click();
  await page.getByRole("menuitem", { name: menu }).click();
}

test.describe("Alur penjualan: stok, finalisasi, pembayaran, void, dan hapus", () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("buat, finalisasi, dan bayar lunas: stok bahan outlet berkurang sesuai resep", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    const STOK_AWAL = 20;
    const JUMLAH = 3;
    const fx = await siapkanFixture(page, auth, STOK_AWAL);

    const penjualan = await test.step("buat DRAFT lewat UI", () => buatDraftLewatUi(page, JUMLAH));
    expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("DRAFT");

    await test.step("finalisasi memotong stok bahan di outlet sesuai resep", async () => {
      const res = await finalisasiLewatDetail(page, penjualan.id);
      expect(res.status(), `PUT finalisasi: ${(await res.text()).slice(0, 200)}`).toBe(200);
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("FINAL");
      expect(await stokOutlet(page, auth, fx)).toBe(STOK_AWAL - JUMLAH * TAKARAN);
    });

    await test.step("bayar lunas dengan uang pas", async () => {
      await page.getByRole("button", { name: /terima pembayaran/i }).click();
      await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toBeVisible();
      await page.getByRole("combobox").filter({ hasText: /pilih akun kas/i }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").filter({ hasText: /pilih metode/i }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("button", { name: /bayar uang pas/i }).click();
      const catatan = page.getByLabel(/catatan pembayaran/i);
      await catatan.fill("Lunas e2e alur penjualan");
      await catatan.press("Enter");
      await expect(page.getByRole("alertdialog")).toBeVisible();
      const tunggu = page.waitForResponse(
        (r) => r.request().method() === "POST" && /\/api\/pembayaran(\?|$)/i.test(r.url()),
      );
      await page.getByRole("button", { name: /ya, catat/i }).click();
      const res = await tunggu;
      expect(res.status(), `POST /pembayaran: ${(await res.text()).slice(0, 200)}`).toBeLessThan(300);
      // K2a: status ditentukan backend; tanggalBayar wajib untuk PAID.
      const kiriman = res.request().postDataJSON();
      expect(kiriman).not.toHaveProperty("status");
      expect(typeof kiriman.tanggalBayar).toBe("string");

      const lunas = await detailPenjualan(page, auth, penjualan.id);
      expect(lunas.statusBayar).toBe("PAID");
      expect(lunas.sisaTagihan).toBe(0);
      expect(lunas.totalDibayar).toBe(lunas.totalTagihan);
    });

    await test.step("riwayat pembayaran di detail menampilkan metode yang sebenarnya", async () => {
      type Bayar = { id: string; penjualanID: string | null; metodePembayaranID: string | null };
      type Metode = { id: string; namaPembayaran: string };
      const semua = normalizeId((await api<Bayar[]>(page, auth, "GET", "/pembayaran")).data ?? []);
      const bayar = semua.find((p) => p.penjualanID === penjualan.id);
      expect(bayar, "pembayaran penjualan uji").toBeTruthy();
      const metode = normalizeId((await api<Metode[]>(page, auth, "GET", "/metodepembayaran")).data ?? []);
      const nama = metode.find((m) => m.id === bayar!.metodePembayaranID)?.namaPembayaran;
      expect(nama, "nama metode pembayaran").toBeTruthy();
      await page.goto(`${DAFTAR}/${penjualan.id}`);
      await expect(page.getByRole("row").filter({ hasText: /lunas e2e alur penjualan/i })).toContainText(nama!);
    });
  });

  test("finalisasi ditolak bila stok bahan di outlet tidak cukup, tanpa perubahan stok", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    const JUMLAH = 3;
    const fx = await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, JUMLAH);
    try {
      const stokKurang = JUMLAH * TAKARAN - 1;
      await setelStokOutlet(page, auth, fx, stokKurang);
      const produkSebelum = await stokProduk(page, auth, fx);

      const res = await finalisasiLewatDetail(page, penjualan.id);
      expect(res.status()).toBe(400);
      expect(String((await res.json()).message)).toMatch(/tidak mencukupi/i);
      await expect(page.getByText(/gagal finalisasi/i).first()).toBeVisible();

      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("DRAFT");
      expect(await stokOutlet(page, auth, fx), "stok outlet tidak berubah").toBe(stokKurang);
      expect(await stokProduk(page, auth, fx), "produk.stok ikut dibatalkan").toBe(produkSebelum);
    } finally {
      await hapusDraft(page, auth, penjualan.id);
    }
  });

  test.fixme(
    "jurnal Keluar penjualan langsung terbaca setelah finalisasi (cache daftar jurnal tidak dibersihkan saat inventory menulis jurnal)",
    async ({ page }) => {
      const auth = await bukaDenganAuth(page, DAFTAR);
      const JUMLAH = 3;
      const fx = await siapkanFixture(page, auth, 20);
      const jurnalAwal = (await jurnalPenjualan(page, auth, fx, JUMLAH)).length;
      const penjualan = await buatDraftLewatUi(page, JUMLAH);
      const res = await finalisasiLewatDetail(page, penjualan.id);
      expect(res.status(), `PUT finalisasi: ${(await res.text()).slice(0, 200)}`).toBe(200);

      const jurnal = await jurnalPenjualan(page, auth, fx, JUMLAH);
      expect(jurnal.length - jurnalAwal, "jurnal Keluar bertambah tepat satu").toBe(1);
      const terbaru = [...jurnal].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      expect(terbaru.tipeKoreksi).toBe("Keluar");
      expect(terbaru.jumlah).toBe(JUMLAH * TAKARAN);
      expect(terbaru.locationID?.id).toBe(fx.outletId);
    },
  );

  test.fixme(
    "finalisasi yang ditolak tidak menambah jurnal, terbaca langsung dari daftar jurnal (bermakna hanya bila fixme jurnal di atas lolos)",
    async ({ page }) => {
      const auth = await bukaDenganAuth(page, DAFTAR);
      const JUMLAH = 3;
      const fx = await siapkanFixture(page, auth, 20);
      const penjualan = await buatDraftLewatUi(page, JUMLAH);
      try {
        await setelStokOutlet(page, auth, fx, JUMLAH * TAKARAN - 1);
        const jurnalSebelum = (await jurnalPenjualan(page, auth, fx, JUMLAH)).length;
        const res = await finalisasiLewatDetail(page, penjualan.id);
        expect(res.status()).toBe(400);
        expect((await jurnalPenjualan(page, auth, fx, JUMLAH)).length, "tidak ada jurnal baru").toBe(jurnalSebelum);
      } finally {
        await hapusDraft(page, auth, penjualan.id);
      }
    },
  );

  test.fixme(
    "finalisasi berhasil bila stok bahan outlet cukup walau stok produk tingkat tenant tidak (kontrak/temuan.md butir 37)",
    async ({ page }) => {
      const auth = await bukaDenganAuth(page, DAFTAR);
      const JUMLAH = 3;
      const fx = await siapkanFixture(page, auth, 20);
      await setelStokProduk(page, auth, fx, 4);
      await setelStokOutlet(page, auth, fx, 20);
      const penjualan = await buatDraftLewatUi(page, JUMLAH);
      try {
        const res = await finalisasiLewatDetail(page, penjualan.id);
        expect(res.status(), `PUT finalisasi: ${(await res.text()).slice(0, 200)}`).toBe(200);
        expect(await stokOutlet(page, auth, fx)).toBe(20 - JUMLAH * TAKARAN);
      } finally {
        await hapusDraft(page, auth, penjualan.id);
      }
    },
  );

  test(
    "dialog finalisasi bertahan saat finalisasi gagal (keputusan Fase 0)",
    async ({ page }) => {
      const auth = await bukaDenganAuth(page, DAFTAR);
      await siapkanFixture(page, auth, 20);
      const penjualan = await buatDraftLewatUi(page, 1);
      const pola = polaPenjualan(penjualan.id);
      try {
        await page.goto(`${DAFTAR}/${penjualan.id}`);
        await page.getByRole("button", { name: /finalisasi invoice/i }).click();
        await page.route(pola, (route) =>
          route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
        );
        await page.getByRole("button", { name: /ya, finalisasi transaksi/i }).click();
        await expect(page.getByText(/gagal finalisasi/i).first()).toBeVisible();
        await expect(page.getByRole("alertdialog")).toBeVisible();
      } finally {
        await page.unroute(pola);
        await hapusDraft(page, auth, penjualan.id);
      }
    },
  );

  test(
    "dialog void bertahan saat void gagal (keputusan Fase 0)",
    async ({ page }) => {
      const auth = await bukaDenganAuth(page, DAFTAR);
      await siapkanFixture(page, auth, 20);
      const penjualan = await buatDraftLewatUi(page, 1);
      const pola = polaPenjualan(penjualan.id);
      try {
        await page.goto(DAFTAR);
        await bukaAksiBaris(page, penjualan.noReferensi, /void penjualan/i);
        await page.route(pola, (route) =>
          route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
        );
        await page.getByRole("alertdialog").getByRole("button", { name: /ya, void penjualan/i }).click();
        await expect(page.getByText(/gagal memproses/i).first()).toBeVisible();
        await expect(page.getByRole("alertdialog")).toBeVisible();
      } finally {
        await page.unroute(pola);
        await hapusDraft(page, auth, penjualan.id);
      }
    },
  );

  test(
    "dialog hapus bertahan saat hapus gagal (keputusan Fase 0)",
    async ({ page }) => {
      const auth = await bukaDenganAuth(page, DAFTAR);
      await siapkanFixture(page, auth, 20);
      const penjualan = await buatDraftLewatUi(page, 1);
      const pola = polaPenjualan(penjualan.id);
      try {
        await page.goto(DAFTAR);
        await bukaAksiBaris(page, penjualan.noReferensi, /hapus permanen/i);
        await page.route(pola, (route) =>
          route.request().method() === "DELETE" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
        );
        await page.getByRole("alertdialog").getByRole("button", { name: /hapus permanen/i }).click();
        await expect(page.getByText(/gagal menghapus/i).first()).toBeVisible();
        await expect(page.getByRole("alertdialog")).toBeVisible();
      } finally {
        await page.unroute(pola);
        await hapusDraft(page, auth, penjualan.id);
      }
    },
  );

  test("dialog konfirmasi pembayaran bertahan saat pembayaran gagal (keputusan Fase 0)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, 1);
    const pola = /\/api\/pembayaran(\?|$)/i;
    try {
      await page.goto(`${DAFTAR}/${penjualan.id}/pembayaran`);
      await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toBeVisible();
      await page.getByRole("combobox").filter({ hasText: /pilih akun kas/i }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").filter({ hasText: /pilih metode/i }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("button", { name: /bayar uang pas/i }).click();
      const catatan = page.getByLabel(/catatan pembayaran/i);
      await catatan.fill("Uji pembayaran gagal");
      await catatan.press("Enter");
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.route(pola, (route) =>
        route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await page.getByRole("button", { name: /ya, catat/i }).click();
      await expect(page.getByText(/^gagal$/i).first()).toBeVisible();
      await expect(page.getByRole("alertdialog")).toBeVisible();
    } finally {
      await page.unroute(pola);
      await hapusDraft(page, auth, penjualan.id);
    }
  });

  test("detail penjualan yang tidak ada menampilkan pesan tidak ditemukan tanpa mengalihkan", async ({ page }) => {
    await bukaDenganAuth(page, `${DAFTAR}/000000000000000000000000`);
    await expect(page.getByText("Penjualan tidak ditemukan.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /kembali ke daftar/i })).toBeVisible();
    await expect(page).toHaveURL(/\/penjualan\/0{24}$/);
  });

  test("void DRAFT dari daftar: gagal menampilkan pesan, status VOID saat berhasil", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, 1);
    const pola = polaPenjualan(penjualan.id);
    try {
      await page.goto(DAFTAR);
      await bukaAksiBaris(page, penjualan.noReferensi, /void penjualan/i);
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText(penjualan.noReferensi);

      await page.route(pola, (route) =>
        route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await dialog.getByRole("button", { name: /ya, void penjualan/i }).click();
      await expect(page.getByText(/gagal memproses/i).first()).toBeVisible();
      await page.unroute(pola);

      if (!(await dialog.isVisible())) await bukaAksiBaris(page, penjualan.noReferensi, /void penjualan/i);
      const tunggu = page.waitForResponse((r) => r.request().method() === "PUT" && pola.test(r.url()));
      await dialog.getByRole("button", { name: /ya, void penjualan/i }).click();
      expect((await tunggu).status()).toBe(200);
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("VOID");
    } finally {
      await page.unroute(pola);
      await hapusDraft(page, auth, penjualan.id);
    }
  });

  test("hapus DRAFT dari daftar: gagal menampilkan pesan, data hilang saat berhasil", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, 1);
    const pola = polaPenjualan(penjualan.id);
    try {
      await page.goto(DAFTAR);
      await bukaAksiBaris(page, penjualan.noReferensi, /hapus permanen/i);
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText(penjualan.noReferensi);

      await page.route(pola, (route) =>
        route.request().method() === "DELETE" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await dialog.getByRole("button", { name: /hapus permanen/i }).click();
      await expect(page.getByText(/gagal menghapus/i).first()).toBeVisible();
      await page.unroute(pola);

      if (!(await dialog.isVisible())) await bukaAksiBaris(page, penjualan.noReferensi, /hapus permanen/i);
      const tunggu = page.waitForResponse((r) => r.request().method() === "DELETE" && pola.test(r.url()));
      await dialog.getByRole("button", { name: /hapus permanen/i }).click();
      expect((await tunggu).status()).toBe(200);
      await expect(page.getByRole("row").filter({ hasText: penjualan.noReferensi })).toHaveCount(0);
    } finally {
      await page.unroute(pola);
      await hapusDraft(page, auth, penjualan.id);
    }
  });
});