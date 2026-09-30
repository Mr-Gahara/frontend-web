import { test, expect, Request } from "@playwright/test";
import {
  BASIS,
  JAWAB_GAGAL,
  api,
  bukaDenganAuth,
  login,
  siapkanSuratJalan,
  tutupSuratJalanUji,
  type TransferMentah,
} from "../../../helpers/transfer-uji";

/*
 * Spec penerimaan barang outlet (keputusan pemilik proyek K3 pilihan B,
 * 21 September 2026). Setiap test menyiapkan surat jalan sendiri lewat API
 * dari pengajuan uji milik spec (keputusan R8 dan R13, disetujui pengguna
 * penyetuju uji), lalu dikirim. Stok gudang terpotong saat kirim. Sejak
 * backend 465b438 surat jalan DIKIRIM tidak dapat dibatalkan (kontrak P12),
 * sehingga blok finally menutupnya lewat terima penuh: setiap run
 * memindahkan satu unit bahan uji dari gudang ke outlet secara permanen.
 *
 * Terima lewat UI hanya diuji jalur gagalnya: PATCH terima dari halaman
 * selalu dijawab gagal lewat page.route, dan isi payload dibaca dari
 * permintaan yang tertahan itu. Penutupan di finally memakai API langsung,
 * yang tidak tertahan page.route.
 *
 * Bila test berhenti sebelum blok finally, surat jalan tertinggal DIKIRIM;
 * tutup lewat PATCH /api/transferstok/:id/terima dengan body kosong.
 */

const URL_DAFTAR = BASIS + "/dashboard/outlet/inventaris/penerimaanBarang";
const POLA_TERIMA = /\/api\/transferstok\/[^/]+\/terima(\?|$)/i;
const ALASAN = "Uji e2e penerimaan";

type ItemTerima = {
  itemId?: string;
  bahanBakuID?: string;
  qtyKirim: number;
  qtyTerima: number;
  catatanItem?: string | null;
};

test.describe("Penerimaan barang outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("detail menampilkan barang, dan terima gagal mengirim seluruh item", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const transfer = await siapkanSuratJalan(page, auth);

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
              itemId: item.id,
              qtyKirim: item.qtyKirim,
              qtyTerima: item.qtyKirim,
            }),
          ),
        );
        await expect.soft(dialog, "dialog harus tetap terbuka saat gagal (keputusan Fase 0)").toBeVisible();
      });

    } finally {
      page.off("request", catat);
      await page.unroute(POLA_TERIMA);
      await tutupSuratJalanUji(page, auth, transfer.id);
    }
  });

  test("jumlah diterima 0 dicatat backend sebagai tidak sampai: terima sungguhan lewat UI (backend 465b438)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const transfer = await siapkanSuratJalan(page, auth);
    try {
      await page.goto(`${URL_DAFTAR}/${transfer.id}`);
      await page.getByRole("spinbutton").first().fill("0");
      await page.getByPlaceholder(/bungkus pecah/i).first().fill(ALASAN);
      await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
      const tTerima = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_TERIMA.test(r.url()));
      await page.getByRole("alertdialog").getByRole("button", { name: /ya, selesaikan inbound/i }).click();
      const res = await tTerima;
      expect(res.status(), `PATCH terima: ${(await res.text()).slice(0, 200)}`).toBe(200);
      const items: ItemTerima[] = res.request().postDataJSON()?.items ?? [];
      expect(items[0]).toEqual(
        expect.objectContaining({
          itemId: transfer.items[0].id,
          qtyKirim: transfer.items[0].qtyKirim,
          qtyTerima: 0,
          catatanItem: ALASAN,
        }),
      );
      const sesudah = await api<TransferMentah>(page, auth, "GET", `/transferstok/${transfer.id}`);
      expect(sesudah.data.status, "surat jalan diterima").toBe("DITERIMA");
      expect(sesudah.data.items[0].qtyTerima, "barang pertama tercatat tidak sampai").toBe(0);
    } finally {
      await tutupSuratJalanUji(page, auth, transfer.id);
    }
  });
});