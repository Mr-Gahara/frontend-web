import { test, expect, type Page } from "@playwright/test";
import { BASIS, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { pantauPermintaan } from "../../helpers/reservasi-uji";
import {
  batalkanPenjualanUji,
  bukaAksiBaris,
  buatDraftLewatUi,
  detailPenjualan,
  hapusDraft,
  metodeUji,
  siapkanFixture,
  simpanLewatApi,
} from "../../helpers/penjualan-uji";
import { teksAkunTujuan } from "../../../features/pembayaran/payload";

/*
 * Spec form pembayaran penjualan, ditulis ulang untuk backend 465b438
 * (keputusan penyesuaian 465b438). Spec lama lolos tanpa membuktikan apa
 * pun: test utamanya menunggu teks "berhasil" yang masih tampil dari toast
 * buat invoice, dan alurnya (bayar DRAFT, pilih akun kas) tidak berlaku
 * lagi. Setiap test membuat penjualan uji sendiri lewat helper bersama lalu
 * membersihkannya: DRAFT dihapus, penjualan tersimpan di-void. Pembayaran
 * yang berhasil diuji spec alur penjualan.
 */
const DAFTAR = BASIS + "/dashboard/outlet/penjualan";
const POLA_BAYAR = /\/api\/pembayaran(\?|$)/i;

async function siapkanTersimpan(page: Page, auth: Auth) {
  const fx = await siapkanFixture(page, auth, 20);
  const penjualan = await buatDraftLewatUi(page, 1);
  await simpanLewatApi(page, auth, penjualan.id, fx);
  return penjualan;
}

test.describe("Form pembayaran penjualan", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("halaman bayar untuk DRAFT menampilkan pesan dan tautan ke detail, tanpa form", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, 1);
    try {
      await page.goto(`${DAFTAR}/${penjualan.id}/pembayaran`);
      await expect(page.getByText(/penjualan masih draft/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toHaveCount(0);
      await page.getByRole("button", { name: /ke detail penjualan/i }).click();
      await expect(page).toHaveURL(new RegExp(`/penjualan/${penjualan.id}$`));
    } finally {
      await hapusDraft(page, auth, penjualan.id);
    }
  });

  test("penjualan tersimpan: menu daftar, akun tujuan dari metode, validasi, uang pas, dan batal tanpa POST", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    const penjualan = await siapkanTersimpan(page, auth);
    try {
      await test.step("menu Terima Pembayaran di daftar membuka form", async () => {
        await page.goto(DAFTAR);
        await bukaAksiBaris(page, penjualan.noReferensi, /terima pembayaran/i);
        await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toBeVisible();
        await expect(
          page.getByRole("combobox").filter({ hasText: /pilih akun kas/i }),
          "isian akun kas sudah tidak ada",
        ).toHaveCount(0);
      });

      await test.step("tanpa metode: pesan metode dan dialog tidak muncul", async () => {
        await page.getByRole("button", { name: /proses pembayaran/i }).click();
        await expect(page.getByText("Silakan pilih Metode Pembayaran.")).toBeVisible();
        await expect(page.getByRole("alertdialog")).toHaveCount(0);
      });

      await test.step("akun kas tujuan mengikuti metode yang dipilih", async () => {
        await expect(page.getByLabel("Akun Kas Tujuan")).toHaveText("Pilih metode pembayaran lebih dulu.");
        const metode = await metodeUji(page, auth);
        await page.getByRole("combobox").filter({ hasText: /pilih metode/i }).click();
        await page.getByRole("option", { name: metode.namaPembayaran, exact: true }).click();
        await expect(page.getByLabel("Akun Kas Tujuan")).toHaveText(teksAkunTujuan(metode));
      });

      await test.step("jumlah kosong dan jumlah melebihi sisa tagihan ditolak form", async () => {
        const jumlah = page.getByLabel(/jumlah diterima/i);
        await jumlah.clear();
        await page.getByRole("button", { name: /proses pembayaran/i }).click();
        await expect(page.getByText("Jumlah pembayaran tidak valid.")).toBeVisible();
        await jumlah.fill("999999999999");
        await page.getByRole("button", { name: /proses pembayaran/i }).click();
        await expect(page.getByText(/jumlah bayar tidak boleh melebihi sisa tagihan/i)).toBeVisible();
        await expect(page.getByRole("alertdialog")).toHaveCount(0);
      });

      await test.step("uang pas mengisi sisa tagihan dari backend, simulasi sisa Rp 0", async () => {
        const { sisaTagihan } = await detailPenjualan(page, auth, penjualan.id);
        await page.getByRole("button", { name: /bayar uang pas/i }).click();
        await expect(page.getByLabel(/jumlah diterima/i)).toHaveValue(new Intl.NumberFormat("id-ID").format(sisaTagihan));
        const simulasi = page.getByText(/simulasi setelah pembayaran/i).locator("..");
        await expect(simulasi.getByText(/^rp\s*0$/i)).toBeVisible();
      });

      await test.step("batal di dialog konfirmasi: dialog tertutup, tanpa POST, dan tetap di form", async () => {
        const kirim = pantauPermintaan(page, "POST", POLA_BAYAR);
        await page.getByRole("button", { name: /proses pembayaran/i }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("button", { name: /^batal$/i }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByRole("heading", { name: /terima pembayaran/i })).toBeVisible();
        expect(kirim.jumlah(), "batal tidak mengirim POST /pembayaran").toBe(0);
        kirim.lepas();
      });
    } finally {
      await batalkanPenjualanUji(page, auth, penjualan.id);
    }
  });
});
