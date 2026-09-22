import { test, expect } from "@playwright/test";
import {
  BASIS,
  JAWAB_GAGAL,
  api,
  batalkan,
  bukaDenganAuth,
  login,
  siapkanSuratJalan,
  type TransferMentah,
} from "../../../helpers/transfer-uji";

/*
 * Spec pembanding alur surat jalan di ruang gudang (keputusan pemilik proyek
 * K3 pilihan B, docs/refactor/keputusan.md). Surat jalan dibuat lewat API dari
 * pengajuan yang layak dan dibiarkan PENDING. Daftar, detail, revisi
 * kuantitas, dan pembatalan dari PENDING diuji dengan data sungguhan;
 * pembatalan di akhir mengembalikan pengajuan ke PENDING, sehingga setiap run
 * menambah satu surat jalan BATAL. Kirim hanya diuji jalur gagalnya lewat
 * page.route, karena kirim yang berhasil memotong stok gudang.
 */

const URL_DAFTAR = BASIS + "/dashboard/gudang/transferStok";
const POLA_DAFTAR = /\/api\/transferstok(\?|$)/i;
const POLA_KIRIM = /\/api\/transferstok\/[^/]+\/kirim(\?|$)/i;
const POLA_BATAL = /\/api\/transferstok\/[^/]+\/batal(\?|$)/i;

test.describe("Alur surat jalan gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar, detail, kirim gagal, revisi kuantitas, dan batal dari PENDING", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const sj = await siapkanSuratJalan(page, auth, { kirim: false });
    test.skip(!sj, "Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup");
    const transfer: TransferMentah = sj!;
    const polaDetail = new RegExp(`/api/transferstok/${transfer.id}(\\?|$)`, "i");
    let dibatalkan = false;

    try {
      await test.step("daftar menampilkan surat jalan dan tab menyaring status", async () => {
        await page.reload({ waitUntil: "commit" });
        await page.waitForResponse((r) => r.request().method() === "GET" && POLA_DAFTAR.test(r.url()));
        const baris = page.locator("tr", { hasText: transfer.nomorTransfer });
        await expect(baris).toBeVisible();

        const tDikirim = page.waitForResponse((r) => r.request().method() === "GET" && POLA_DAFTAR.test(r.url()));
        await page.getByRole("button", { name: /sedang dikirim/i }).click();
        await tDikirim;
        await expect.soft(baris, "surat jalan PENDING tidak boleh tampil di tab SEDANG DIKIRIM").toHaveCount(0);

        const tDraft = page.waitForResponse((r) => r.request().method() === "GET" && POLA_DAFTAR.test(r.url()));
        await page.getByRole("button", { name: /draft sj/i }).click();
        await tDraft;
        await expect(baris).toBeVisible();
      });

      await test.step("detail menampilkan barang, lokasi, dan tombol PENDING", async () => {
        await page.locator("tr", { hasText: transfer.nomorTransfer }).getByRole("button", { name: /detail/i }).click();
        await expect(page).toHaveURL(new RegExp(`/transferStok/${transfer.id}$`));
        await expect(page.getByRole("button", { name: /kirim barang sekarang/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /revisi kuantitas/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /batalkan pengiriman/i })).toBeVisible();
        for (const item of transfer.items) {
          const nama = item.bahanBaku?.namaBahan;
          if (nama) await expect.soft(page.getByText(nama, { exact: true }).first(), "nama barang").toBeVisible();
        }
        for (const nama of [transfer.dariLokasi?.nama, transfer.keLokasi?.nama]) {
          if (nama) await expect.soft(page.getByText(nama).first(), "nama lokasi asal dan tujuan").toBeVisible();
        }
      });

      await test.step("kirim gagal: pesan tampil, dialog bertahan, status tetap PENDING", async () => {
        await page.route(POLA_KIRIM, (route) => route.fulfill(JAWAB_GAGAL));
        try {
          await page.getByRole("button", { name: /kirim barang sekarang/i }).click();
          const dialog = page.getByRole("alertdialog");
          await expect(dialog).toBeVisible();
          const tGagal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_KIRIM.test(r.url()));
          await dialog.getByRole("button", { name: /ya, kirim sekarang/i }).click();
          expect((await tGagal).status()).toBe(500);
          await expect(page.getByText("Gagal Mengirim Barang")).toBeVisible();
          await expect.soft(dialog, "dialog kirim harus tetap terbuka saat gagal (keputusan Fase 0)").toBeVisible();
          if (await dialog.isVisible()) await dialog.getByRole("button", { name: /tunggu sebentar/i }).click();
          await expect(dialog).toBeHidden();
        } finally {
          await page.unroute(POLA_KIRIM);
        }
        const cek = await api<TransferMentah>(page, auth, "GET", `/transferstok/${transfer.id}`);
        expect(cek.data.status, "kirim yang gagal tidak boleh mengubah status").toBe("PENDING");
      });

      await test.step("revisi kuantitas tersimpan", async () => {
        const lama = transfer.items[0].qtyKirim;
        const baru = lama > 1 ? lama - 1 : lama;
        await page.getByRole("button", { name: /revisi kuantitas/i }).click();
        await expect(page).toHaveURL(new RegExp(`/transferStok/${transfer.id}/edit$`));
        const isian = page.locator("tbody input").first();
        await expect(isian).toHaveValue(String(lama));
        await isian.fill(String(baru));
        const tSimpan = page.waitForResponse((r) => r.request().method() === "PUT" && polaDetail.test(r.url()));
        await page.getByRole("button", { name: /simpan revisi/i }).click();
        expect((await tSimpan).status()).toBe(200);
        await expect(page).toHaveURL(new RegExp(`/transferStok/${transfer.id}$`));
        const cek = await api<TransferMentah>(page, auth, "GET", `/transferstok/${transfer.id}`);
        expect(cek.data.items[0].qtyKirim, "jumlah kirim hasil revisi").toBe(baru);
      });

      await test.step("batal dari PENDING lewat UI", async () => {
        await page.getByRole("button", { name: /batalkan pengiriman/i }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog.getByText("Batalkan Surat Jalan?")).toBeVisible();
        const tBatal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_BATAL.test(r.url()));
        await dialog.getByRole("button", { name: /ya, batalkan/i }).click();
        const res = await tBatal;
        if (res.status() === 200) dibatalkan = true;
        expect(res.status()).toBe(200);
        await expect(page.getByText("Surat Jalan Dibatalkan").first()).toBeVisible();
        const cek = await api<TransferMentah>(page, auth, "GET", `/transferstok/${transfer.id}`);
        expect(cek.data.status).toBe("BATAL");
        await expect.soft(page.getByRole("button", { name: /kirim barang sekarang/i }), "tombol aksi hilang setelah batal").toHaveCount(0);
      });
    } finally {
      if (!dibatalkan) await batalkan(page, auth, transfer.id);
    }
  });
});