import { test, expect } from "@playwright/test";
import {
  BASIS,
  api,
  batalkan,
  bukaDenganAuth,
  login,
  siapkanSuratJalan,
  type TransferMentah,
} from "../../../helpers/transfer-uji";

/*
 * Spec pembanding daftar surat jalan DIKIRIM: pengiriman di ruang gudang dan
 * penerimaan di ruang outlet (keputusan pemilik proyek K3 pilihan B dan K4).
 * Surat jalan dibuat dan dikirim lewat API, lalu dibatalkan dari DIKIRIM di
 * akhir sehingga stok gudang kembali; setiap run menambah satu surat jalan
 * BATAL dan dua entri jurnal gudang. Harapan jumlah kartu dihitung dari
 * seluruh surat jalan yang berstatus DIKIRIM, karena backend mengabaikan
 * query status (kontrak/temuan.md butir 33).
 */

const URL_PENGIRIMAN = BASIS + "/dashboard/gudang/pengirimanStok";
const URL_PENERIMAAN = BASIS + "/dashboard/outlet/inventaris/penerimaanBarang";

test.describe("Daftar surat jalan DIKIRIM", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("pengiriman gudang dan penerimaan outlet hanya menampilkan surat jalan DIKIRIM", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PENGIRIMAN);
    const sj = await siapkanSuratJalan(page, auth);
    test.skip(!sj, "Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup");
    const transfer: TransferMentah = sj!;

    try {
      const semua = await api<TransferMentah[]>(page, auth, "GET", "/transferstok");
      expect(semua.status, `GET daftar surat jalan: ${semua.pesan}`).toBe(200);
      const dikirim = (semua.data ?? []).filter((t) => t.status === "DIKIRIM");

      await test.step("pengiriman gudang", async () => {
        await page.goto(URL_PENGIRIMAN);
        await expect(page.getByText(transfer.nomorTransfer).first()).toBeVisible();
        await expect
          .soft(page.getByRole("button", { name: /cek detail muatan/i }), "hanya surat jalan DIKIRIM yang tampil")
          .toHaveCount(dikirim.length);
      });

      await test.step("penerimaan outlet untuk owner", async () => {
        await page.goto(URL_PENERIMAAN);
        await expect
          .soft(page.getByText(transfer.nomorTransfer).first(), "surat jalan DIKIRIM ke outlet mana pun tampil untuk owner")
          .toBeVisible();
        await expect
          .soft(page.getByRole("button", { name: /proses terima/i }), "seluruh surat jalan DIKIRIM tampil untuk owner")
          .toHaveCount(dikirim.length);
      });
    } finally {
      await batalkan(page, auth, transfer.id);
    }
  });
});