import { test, expect, type Page } from "@playwright/test";
import { normalizeId } from "@/lib/api/normalize";
import { BASIS, JAWAB_GAGAL, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { NAMA_DISKON_GLOBAL, NAMA_DISKON_ITEM, siapkanDiskonUji } from "../../helpers/reservasi-uji";
import {
  TAKARAN,
  batalkanPenjualanUji,
  bayarLewatApi,
  bukaAksiBaris,
  buatDraftLewatUi,
  detailPenjualan,
  isiFormPenjualan,
  isiIsianPenjualan,
  hapusDraft,
  jurnalPenjualan,
  metodeUji,
  pilihDiskon,
  setelStokOutlet,
  setelStokProduk,
  siapkanFixture,
  simpanLewatApi,
  stokOutlet,
  stokProduk,
} from "../../helpers/penjualan-uji";

/**
 * Spec pembanding alur penjualan (keputusan K6b, 24 September 2026): stok
 * bahan di outlet benar-benar berkurang sesuai resep saat finalisasi, dan
 * ditolak utuh bila tidak cukup. Menulis data sungguhan: fixture tetap,
 * penjualan tersimpan (UNPAID sampai PAID) beserta pembayarannya, penjualan
 * VOID, jurnal stok, dan opname persiapan. Penjualan DRAFT yang tersisa
 * dihapus, dan penjualan tersimpan yang dibuat skenario lain dibatalkan
 * pembayarannya lalu di-void (backend 465b438).
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
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan, "tersimpan belum dibayar (backend 465b438)").toBe("UNPAID");
      expect(await stokOutlet(page, auth, fx)).toBe(STOK_AWAL - JUMLAH * TAKARAN);
    });

    await test.step("bayar lunas dengan uang pas", async () => {
      await page.getByRole("button", { name: /terima pembayaran/i }).click();
      await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toBeVisible();
      await page.getByRole("combobox").filter({ hasText: /pilih metode/i }).click();
      await page.getByRole("option").first().click();
      await expect(page.getByLabel("Akun Kas Tujuan"), "akun tujuan dari metode").not.toHaveText(
        "Pilih metode pembayaran lebih dulu.",
      );
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
      expect(kiriman, "akun kas diambil dari metode (backend 465b438)").not.toHaveProperty("akunKasID");

      const lunas = await detailPenjualan(page, auth, penjualan.id);
      expect(lunas.statusBayar).toBe("PAID");
      expect(lunas.statusPenjualan).toBe("PAID");
      expect(lunas.sisaTagihan).toBe(0);
      expect(lunas.totalDibayar).toBe(lunas.totalTagihan);
    });

    await test.step("riwayat pembayaran di detail menampilkan metode yang sebenarnya", async () => {
      const detail = await detailPenjualan(page, auth, penjualan.id);
      const bayar = (detail.pembayaran ?? []).find((p) => p.catatan === "Lunas e2e alur penjualan");
      expect(bayar?.namaMetodePembayaran, "nama metode dari pembayaran[] detail (K12a)").toBeTruthy();
      await page.goto(`${DAFTAR}/${penjualan.id}`);
      await expect(page.getByRole("row").filter({ hasText: /lunas e2e alur penjualan/i })).toContainText(
        bayar!.namaMetodePembayaran!,
      );
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
    const fx = await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, 1);
    const pola = /\/api\/pembayaran(\?|$)/i;
    try {
      // DRAFT tidak dapat dibayar sejak backend 465b438.
      await simpanLewatApi(page, auth, penjualan.id, fx);
      await page.goto(`${DAFTAR}/${penjualan.id}/pembayaran`);
      await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toBeVisible();
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
      await batalkanPenjualanUji(page, auth, penjualan.id);
    }
  });

  test("buat penjualan mengirim kunci idempotensi dan lokasi outlet tenant, tanpa penggunaID", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    const fx = await siapkanFixture(page, auth, 20);
    const tunggu = page.waitForRequest(
      (r) => r.method() === "POST" && /\/api\/penjualan(\?|$)/i.test(r.url()),
    );
    const penjualan = await buatDraftLewatUi(page, 1);
    try {
      const permintaan = await tunggu;
      expect(permintaan.headers()["x-idempotency-key"], "kunci idempotensi (K3a)").toBeTruthy();
      const kiriman = permintaan.postDataJSON();
      expect(kiriman, "kasir dicatat backend dari token (backend 465b438)").not.toHaveProperty("penggunaID");
      expect(kiriman.locationID, "outlet tenant (K13a)").toBe(fx.outletId);
      expect(kiriman).not.toHaveProperty("status");
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("DRAFT");
    } finally {
      await hapusDraft(page, auth, penjualan.id);
    }
  });

  test("dialog buat penjualan bertahan saat gagal, dan kunci idempotensi dipakai ulang saat diulang", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    await siapkanFixture(page, auth, 20);
    await isiFormPenjualan(page, 1);
    const pola = /\/api\/penjualan(\?|$)/i;
    let kunciGagal = "";
    await page.route(pola, (route) => {
      if (route.request().method() !== "POST") return route.continue();
      kunciGagal = route.request().headers()["x-idempotency-key"] ?? "";
      return route.fulfill(JAWAB_GAGAL);
    });
    await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
    await expect(page.getByText(/gagal memproses/i).first()).toBeVisible();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.unroute(pola);
    expect(kunciGagal, "kunci idempotensi terkirim pada percobaan pertama").toBeTruthy();

    const tunggu = page.waitForResponse((r) => r.request().method() === "POST" && pola.test(r.url()));
    await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
    const res = await tunggu;
    const body = await res.json().catch(() => ({}));
    const id = normalizeId((body.data ?? {}) as { id?: string }).id ?? "";
    try {
      expect(res.status(), `POST /penjualan: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
      expect(res.request().headers()["x-idempotency-key"], "kunci sama saat diulang (K3a)").toBe(kunciGagal);
    } finally {
      if (id) await hapusDraft(page, auth, id);
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

  test("diskon item dan diskon global dari form terpasang di backend (backend 465b438)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    await siapkanFixture(page, auth, 20);
    const diskon = await siapkanDiskonUji(page, auth);
    await isiIsianPenjualan(page, 1);
    await pilihDiskon(page, "Diskon Produk", NAMA_DISKON_ITEM);
    await pilihDiskon(page, "Diskon Global", NAMA_DISKON_GLOBAL);
    await page.getByLabel(/keterangan/i).press("Enter");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    const tunggu = page.waitForResponse(
      (r) => r.request().method() === "POST" && /\/api\/penjualan(\?|$)/i.test(r.url()),
    );
    await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
    const res = await tunggu;
    const body = await res.json().catch(() => ({}));
    expect(res.status(), `POST /penjualan: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
    const id = normalizeId((body.data ?? {}) as { id?: string }).id ?? "";
    try {
      const kiriman = res.request().postDataJSON();
      expect(kiriman.itemPenjualan[0].diskonItem, "diskon item dengan nama field backend").toEqual([diskon.diskonItemId]);
      expect(kiriman.diskonGlobal, "diskon global dengan nama field backend").toEqual([diskon.diskonGlobalId]);
      const detail = await detailPenjualan(page, auth, id);
      expect(detail.itemPenjualan?.[0]?.jumlahDiskon, "potongan diskon item dari backend").toBeGreaterThan(0);
      expect(detail.jumlahDiskonTransaksi, "potongan diskon transaksi dari backend").toBeGreaterThan(0);
    } finally {
      if (id) await hapusDraft(page, auth, id);
    }
  });

  test("bayar sebagian dan lunas, batalkan kedua pembayaran dari riwayat, lalu void penjualan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    const fx = await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, 1);
    try {
      await simpanLewatApi(page, auth, penjualan.id, fx);
      const tersimpan = await detailPenjualan(page, auth, penjualan.id);
      expect(tersimpan.statusPenjualan).toBe("UNPAID");
      const metode = await metodeUji(page, auth);
      const sebagian = Math.floor(tersimpan.totalTagihan / 2);
      await bayarLewatApi(page, auth, penjualan.id, metode.id, sebagian, "Siklus sebagian");
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("PARTIAL");
      await bayarLewatApi(page, auth, penjualan.id, metode.id, tersimpan.totalTagihan - sebagian, "Siklus pelunasan");
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("PAID");
      await page.goto(`${DAFTAR}/${penjualan.id}`);
      await expect(page.getByRole("button", { name: /void penjualan/i }), "void menunggu pembayaran dibatalkan").toHaveCount(0);
      // Baris dicari lewat tombol Batalkan, bukan catatan: catatan pembayaran
      // ikut diganti alasan pembatalan (PUT { status, catatan }).
      for (const sisa of [1, 0]) {
        const baris = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Batalkan" }) }).first();
        await baris.getByRole("button", { name: "Batalkan" }).click();
        const dialog = page.getByRole("alertdialog");
        await dialog.getByLabel(/alasan/i).fill("E2E siklus batal");
        const tunggu = page.waitForResponse(
          (r) => r.request().method() === "PUT" && /\/api\/pembayaran\/[a-f0-9]{24}$/i.test(r.url()),
        );
        await dialog.getByRole("button", { name: /ya, batalkan pembayaran/i }).click();
        const res = await tunggu;
        expect(res.status(), `PUT pembayaran: ${(await res.text()).slice(0, 200)}`).toBe(200);
        expect(res.request().postDataJSON()).toEqual({ status: "VOID", catatan: "E2E siklus batal" });
        await expect(dialog).toBeHidden();
        await expect(page.getByRole("button", { name: "Batalkan" }), "tombol Batalkan yang tersisa").toHaveCount(sisa);
      }
      const setelahBatal = await detailPenjualan(page, auth, penjualan.id);
      expect(setelahBatal.statusPenjualan).toBe("UNPAID");
      expect((setelahBatal.pembayaran ?? []).map((p) => p.status), "kedua pembayaran tercatat VOID").toEqual([
        "VOID",
        "VOID",
      ]);
      await page.getByRole("button", { name: /void penjualan/i }).click();
      const tungguVoid = page.waitForResponse(
        (r) => r.request().method() === "PUT" && polaPenjualan(penjualan.id).test(r.url()),
      );
      await page.getByRole("alertdialog").getByRole("button", { name: /ya, void penjualan/i }).click();
      expect((await tungguVoid).status()).toBe(200);
      expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("VOID");
    } finally {
      await batalkanPenjualanUji(page, auth, penjualan.id);
    }
  });

  test("daftar per halaman: permintaan membawa page dan limit, dan Next membuka halaman kedua", async ({ page }) => {
    const pola = /\/api\/penjualan(\?|$)/i;
    const tAwal = page.waitForResponse((r) => r.request().method() === "GET" && pola.test(r.url()));
    await page.goto(DAFTAR, { waitUntil: "commit" });
    const res = await tAwal;
    const url = new URL(res.url());
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("10");
    const pag = (await res.json()).pagination as { total: number; totalPages: number };
    await expect(page.getByText(`${pag.total} total data`, { exact: true })).toBeVisible();
    await expect(page.getByText(`Halaman 1 dari ${Math.max(1, pag.totalPages)}`, { exact: true })).toBeVisible();
    test.skip(pag.totalPages < 2, "Data uji penjualan kurang dari dua halaman");
    const tDua = page.waitForResponse(
      (r) => r.request().method() === "GET" && pola.test(r.url()) && new URL(r.url()).searchParams.get("page") === "2",
    );
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const kedua = normalizeId(((await (await tDua).json()).data ?? []) as { noReferensi: string }[]);
    await expect(page.getByText(/^Halaman 2 dari/)).toBeVisible();
    expect(kedua.length, "halaman kedua berisi penjualan").toBeGreaterThan(0);
    await expect(page.getByRole("row").filter({ hasText: kedua[0].noReferensi })).toHaveCount(1);
  });
});