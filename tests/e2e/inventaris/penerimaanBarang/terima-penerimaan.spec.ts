import { test, expect, Request } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, batalkan, bukaDenganAuth, login, siapkanSuratJalan } from "../../../helpers/transfer-uji";

/*
 * Spec penerimaan barang outlet (keputusan pemilik proyek K3 pilihan B,
 * 21 September 2026). Setiap test menyiapkan surat jalan sendiri lewat API:
 * dibuat dari pengajuan APPROVED atau PENDING berarah benar tanpa surat
 * jalan, lalu dikirim. Stok gudang terpotong saat kirim dan dikembalikan
 * backend saat surat jalan dibatalkan dari DIKIRIM di akhir test, sehingga
 * setiap run menambah satu surat jalan BATAL dan dua entri jurnal gudang,
 * sedangkan pengajuannya kembali ke PENDING dan dapat dipakai lagi.
 *
 * Terima hanya diuji jalur gagalnya: PATCH terima selalu dijawab gagal lewat
 * page.route, karena terima yang berhasil menambah stok outlet secara
 * permanen. Isi payload dibaca dari permintaan yang tertahan itu.
 *
 * Bila test berhenti sebelum blok finally, surat jalan tertinggal DIKIRIM;
 * batalkan lewat PATCH /api/transferstok/:id/batal.
 */

const URL_DAFTAR = BASIS + "/dashboard/outlet/inventaris/penerimaanBarang";
const POLA_TERIMA = /\/api\/transferstok\/[^/]+\/terima(\?|$)/i;
const ALASAN = "Uji e2e penerimaan";

type ItemTerima = {
  bahanBakuID: string;
  qtyKirim: number;
  qtyTerima: number;
  catatanItem?: string | null;
};

test.describe("Penerimaan barang outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("detail menampilkan barang, terima gagal mengirim seluruh item, dan jumlah 0 ditahan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const sj = await siapkanSuratJalan(page, auth);
    test.skip(!sj, "Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup");
    const transfer = sj!;

    const terkirim: ItemTerima[][] = [];
    const catat = (r: Request) => {
      if (r.method() === "PATCH" && POLA_TERIMA.test(r.url())) terkirim.push(r.postDataJSON()?.items ?? []);
    };
    await page.route(POLA_TERIMA, (route) => route.fulfill(JAWAB_GAGAL));
    page.on("request", catat);

    try {
      await test.step("nama barang tampil dari bahanBaku", async () => {
        await page.goto(`${URL_DAFTAR}/${transfer.id}`);
        await expect(page.getByRole("button", { name: /konfirmasi terima barang/i })).toBeVisible();
        for (const item of transfer.items) {
          const nama = item.bahanBaku?.namaBahan;
          if (!nama) continue;
          await expect.soft(page.getByText(nama, { exact: true }).first(), "nama barang dari bahanBaku.namaBahan").toBeVisible();
        }
      });

      await test.step("terima gagal: seluruh item terkirim, pesan tampil, dialog bertahan", async () => {
        await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        const tGagal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_TERIMA.test(r.url()));
        await dialog.getByRole("button", { name: /ya, selesaikan inbound/i }).click();
        expect((await tGagal).status()).toBe(500);
        await expect(page.getByText("Gagal Memproses Penerimaan")).toBeVisible();
        expect.soft(terkirim.at(-1) ?? [], "payload terima harus membawa seluruh item surat jalan").toEqual(
          transfer.items.map((item) =>
            expect.objectContaining({
              bahanBakuID: item.bahanBaku?.id,
              qtyKirim: item.qtyKirim,
              qtyTerima: item.qtyKirim,
            }),
          ),
        );
        await expect.soft(dialog, "dialog harus tetap terbuka saat gagal (keputusan Fase 0)").toBeVisible();
      });

      await test.step("jumlah diterima 0 ditahan tanpa PATCH", async () => {
        await page.reload();
        const jumlah = page.getByRole("spinbutton");
        await expect(jumlah).toHaveCount(transfer.items.length);
        const sebelum = terkirim.length;
        await jumlah.first().fill("0");
        await page.getByPlaceholder(/bungkus pecah/i).first().fill(ALASAN);
        await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
        await page.getByRole("alertdialog").getByRole("button", { name: /ya, selesaikan inbound/i }).click();
        await expect.soft(page.getByText(/belum dapat diproses/i).first(), "pesan penahanan jumlah 0").toBeVisible();
        expect.soft(terkirim.length - sebelum, "jumlah 0 tidak boleh mengirim PATCH terima selama backend memakai ||").toBe(0);
      });
    } finally {
      page.off("request", catat);
      await page.unroute(POLA_TERIMA);
      await batalkan(page, auth, transfer.id);
    }
  });

  test.fixme("jumlah diterima 0 terkirim apa adanya setelah backend berhenti memakai qtyTerima || qtyKirim", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const sj = await siapkanSuratJalan(page, auth);
    test.skip(!sj, "Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup");
    const transfer = sj!;

    await page.route(POLA_TERIMA, (route) => route.fulfill(JAWAB_GAGAL));
    try {
      await page.goto(`${URL_DAFTAR}/${transfer.id}`);
      await page.getByRole("spinbutton").first().fill("0");
      await page.getByPlaceholder(/bungkus pecah/i).first().fill(ALASAN);
      await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
      const tKirim = page.waitForRequest((r) => r.method() === "PATCH" && POLA_TERIMA.test(r.url()));
      await page.getByRole("alertdialog").getByRole("button", { name: /ya, selesaikan inbound/i }).click();
      const items: ItemTerima[] = (await tKirim).postDataJSON()?.items ?? [];
      expect(items[0]).toEqual(
        expect.objectContaining({
          bahanBakuID: transfer.items[0].bahanBaku?.id,
          qtyKirim: transfer.items[0].qtyKirim,
          qtyTerima: 0,
          catatanItem: ALASAN,
        }),
      );
    } finally {
      await page.unroute(POLA_TERIMA);
      await batalkan(page, auth, transfer.id);
    }
  });
});