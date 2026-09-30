import { test, expect } from "@playwright/test";
import {
  BASIS,
  api,
  tutupSuratJalanUji,
  bukaDenganAuth,
  login,
  siapkanSuratJalan,
  type TransferMentah,
} from "../../../helpers/transfer-uji";

/*
 * Spec pembanding daftar surat jalan DIKIRIM: pengiriman di ruang gudang dan
 * penerimaan di ruang outlet (keputusan pemilik proyek K3 pilihan B dan K4).
 * Surat jalan dibuat dari pengajuan uji milik spec (keputusan R8 dan R13) dan
 * dikirim lewat API, lalu ditutup lewat terima penuh di akhir, karena sejak
 * backend 465b438 surat jalan DIKIRIM tidak dapat dibatalkan (kontrak P12).
 * Setiap run memindahkan satu unit bahan uji dari gudang ke outlet secara
 * permanen. Harapan jumlah kartu dihitung dari seluruh surat jalan yang
 * berstatus DIKIRIM, karena backend dahulu mengabaikan query status
 * (kontrak/temuan.md butir 33); cara hitung ini tetap benar sesudah
 * perbaikannya.
 */

const URL_PENGIRIMAN = BASIS + "/dashboard/gudang/pengirimanStok";
const URL_PENERIMAAN = BASIS + "/dashboard/outlet/inventaris/penerimaanBarang";

test.describe("Daftar surat jalan DIKIRIM", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("pengiriman gudang dan penerimaan outlet hanya menampilkan surat jalan DIKIRIM", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PENGIRIMAN);
    const transfer: TransferMentah = await siapkanSuratJalan(page, auth);

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

      await test.step("penerimaan outlet: surat jalan DIKIRIM ke outlet tenant", async () => {
        await page.goto(URL_PENERIMAAN);
        await expect
          .soft(page.getByText(transfer.nomorTransfer).first(), "surat jalan DIKIRIM ke outlet tenant tampil")
          .toBeVisible();
        await expect
          .soft(
            page.getByRole("button", { name: /proses terima/i }),
            "seluruh surat jalan DIKIRIM tampil, karena di MVP semuanya menuju satu-satunya outlet tenant",
          )
          .toHaveCount(dikirim.length);
      });
    } finally {
      await tutupSuratJalanUji(page, auth, transfer.id);
    }
  });
});