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
import { masukBacaSaja } from "../../../helpers/terkunci-uji";

/*
 * Spec pembanding daftar surat jalan DIKIRIM: pengiriman di ruang gudang dan
 * penerimaan di ruang outlet (keputusan pemilik proyek K3 pilihan B dan K4).
 * Surat jalan dibuat dari pengajuan uji milik spec (keputusan R8 dan R13) dan
 * dikirim lewat API, lalu ditutup lewat terima penuh di akhir, karena sejak
 * backend 465b438 surat jalan DIKIRIM tidak dapat dibatalkan (kontrak P12).
 * Setiap run memindahkan satu unit bahan uji dari gudang ke outlet secara
 * permanen. Harapan jumlah kartu dihitung dari seluruh surat jalan yang
 * berstatus DIKIRIM, karena backend dahulu mengabaikan query status
 * (kontrak/temuan.md butir 33), lalu disaring menurut arah yang
 * ditampilkan halamannya: pengiriman hanya asal Gudang, dan penerimaan
 * hanya tujuan Outlet. Tanpa saringan itu, satu surat jalan Outlet ke
 * Gudang yang tertinggal DIKIRIM menggagalkan kedua hitungan
 * (arsip/riwayat-pengujian.md, kejadian 1 November 2026).
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
      const dariGudang = dikirim.filter((t) => t.dariLokasi?.tipe === "Gudang");
      const keOutlet = dikirim.filter((t) => t.keLokasi?.tipe === "Outlet");

      await test.step("pengiriman gudang", async () => {
        await page.goto(URL_PENGIRIMAN);
        await expect(page.getByText(transfer.nomorTransfer).first()).toBeVisible();
        await expect
          .soft(
            page.getByRole("button", { name: /cek detail muatan/i }),
            "hanya surat jalan DIKIRIM dari gudang yang tampil",
          )
          .toHaveCount(dariGudang.length);
      });

      await test.step("penerimaan outlet: surat jalan DIKIRIM ke outlet tenant", async () => {
        await page.goto(URL_PENERIMAAN);
        await expect
          .soft(page.getByText(transfer.nomorTransfer).first(), "surat jalan DIKIRIM ke outlet tenant tampil")
          .toBeVisible();
        await expect
          .soft(
            page.getByRole("button", { name: /proses terima/i }),
            "seluruh surat jalan DIKIRIM ke outlet tampil, karena di MVP semuanya menuju satu-satunya outlet tenant",
          )
          .toHaveCount(keOutlet.length);
      });
    } finally {
      await tutupSuratJalanUji(page, auth, transfer.id);
    }
  });
});

test.describe("Detail surat jalan: pengguna baca-saja", () => {
  test("gudang tanpa Kirim, Revisi, dan Batalkan pada PENDING; outlet tanpa Konfirmasi Terima pada DIKIRIM", async ({
    page,
  }) => {
    await login(page);
    let auth = await bukaDenganAuth(page, URL_PENGIRIMAN);
    // Surat jalan uji disiapkan dan dikirim Ridho lewat API, seperti skenario di atas.
    const transfer: TransferMentah = await siapkanSuratJalan(page, auth, { kirim: false });

    try {
      await test.step("gudang: PENDING tanpa aksi", async () => {
        await masukBacaSaja(page);
        await page.goto(`${BASIS}/dashboard/gudang/transferStok/${transfer.id}`);
        await expect(page.getByText(transfer.nomorTransfer).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("button", { name: /kirim barang sekarang/i })).toHaveCount(0);
        await expect(page.getByRole("button", { name: /revisi kuantitas/i })).toHaveCount(0);
        await expect(page.getByRole("button", { name: /batalkan pengiriman/i })).toHaveCount(0);
      });

      await login(page);
      auth = await bukaDenganAuth(page, URL_PENGIRIMAN);
      const kirim = await api(page, auth, "PATCH", `/transferstok/${transfer.id}/kirim`, {});
      expect(kirim.status, `kirim surat jalan uji: ${kirim.pesan}`).toBe(200);

      await test.step("outlet: DIKIRIM tanpa Konfirmasi Terima", async () => {
        await masukBacaSaja(page);
        await page.goto(`${URL_PENERIMAAN}/${transfer.id}`);
        await expect(page.getByText(transfer.nomorTransfer).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("button", { name: /konfirmasi terima barang/i })).toHaveCount(0);
      });
    } finally {
      await login(page);
      auth = await bukaDenganAuth(page, URL_PENGIRIMAN);
      await tutupSuratJalanUji(page, auth, transfer.id);
    }
  });
});
