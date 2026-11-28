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
import { masukUlang } from "../../../helpers/masuk-uji";
import { masukBacaSaja } from "../../../helpers/terkunci-uji";

/*
 * Spec pembanding daftar surat jalan DIKIRIM: pengiriman di ruang gudang dan
 * penerimaan di ruang outlet (keputusan pemilik proyek K3 pilihan B dan K4).
 * Surat jalan dibuat dari pengajuan uji milik spec (keputusan R8 dan R13) dan
 * dikirim lewat API, lalu ditutup lewat terima penuh di akhir, karena sejak
 * backend 465b438 surat jalan DIKIRIM tidak dapat dibatalkan (kontrak P12).
 * Setiap run memindahkan satu unit bahan uji dari gudang ke outlet secara
 * permanen. Sejak 20 November 2026 kedua halaman berhalaman di server
 * (query diperiksa, kartu paling banyak satu halaman). Harapan jumlah dihitung dari seluruh surat jalan yang
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

      // Berhalaman di server sejak 20 November 2026 (paramHalamanPemantauan):
      // status, tipe lokasi, dan halaman ikut query; kartu paling banyak satu
      // halaman, dan "total data" sama dengan hitungan seluruh surat jalan.
      const responsHalaman = (syarat: (q: URLSearchParams) => boolean) =>
        page.waitForResponse((r) => {
          if (r.request().method() !== "GET" || !/\/api\/transferstok(\?|$)/.test(r.url())) return false;
          return syarat(new URL(r.url()).searchParams);
        });

      await test.step("pengiriman gudang", async () => {
        const tHalaman = responsHalaman((q) => q.get("dariTipeLokasi") === "Gudang" && q.get("page") === "1");
        await page.goto(URL_PENGIRIMAN, { waitUntil: "commit" });
        const q = new URL((await tHalaman).url()).searchParams;
        expect(Object.fromEntries(q)).toEqual({ page: "1", limit: "10", status: "DIKIRIM", dariTipeLokasi: "Gudang" });
        await expect(
          page.getByRole("button", { name: /cek detail muatan/i }),
          "kartu satu halaman dari surat jalan DIKIRIM dari gudang",
        ).toHaveCount(Math.min(10, dariGudang.length));
        await expect(page.getByText(`${dariGudang.length} total data`, { exact: true })).toBeVisible();

        const tCari = responsHalaman((q) => q.get("cari") === transfer.nomorTransfer);
        await page.getByLabel("Cari surat jalan").fill(transfer.nomorTransfer);
        expect((await tCari).status()).toBe(200);
        await expect(page.getByText(transfer.nomorTransfer).first()).toBeVisible();
        await expect(page.getByRole("button", { name: /cek detail muatan/i })).toHaveCount(1);
        await expect(page.getByText("1 total data", { exact: true })).toBeVisible();
      });

      await test.step("penerimaan outlet: surat jalan DIKIRIM ke outlet tenant", async () => {
        const tHalaman = responsHalaman((q) => q.get("status") === "DIKIRIM" && q.get("page") === "1" && !q.get("cari"));
        await page.goto(URL_PENERIMAAN, { waitUntil: "commit" });
        const q = new URL((await tHalaman).url()).searchParams;
        expect(q.get("limit")).toBe("10");
        expect(q.get("keLocationID") ?? q.get("keTipeLokasi"), "lingkup tujuan outlet dikirim ke server").toBeTruthy();
        await expect(
          page.getByRole("button", { name: /proses terima/i }),
          "kartu satu halaman; di MVP seluruh surat jalan DIKIRIM ke outlet menuju satu-satunya outlet tenant",
        ).toHaveCount(Math.min(10, keOutlet.length));
        await expect(page.getByText(`${keOutlet.length} total data`, { exact: true })).toBeVisible();

        const tCari = responsHalaman((q) => q.get("cari") === transfer.nomorTransfer);
        await page.getByLabel("Cari penerimaan").fill(transfer.nomorTransfer);
        expect((await tCari).status()).toBe(200);
        await expect(page.getByText(transfer.nomorTransfer).first()).toBeVisible();
        await expect(page.getByRole("button", { name: /proses terima/i })).toHaveCount(1);
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

      await masukUlang(page);
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
      await masukUlang(page);
      auth = await bukaDenganAuth(page, URL_PENGIRIMAN);
      await tutupSuratJalanUji(page, auth, transfer.id);
    }
  });
});
