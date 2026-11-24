import { test, expect, type Page } from "@playwright/test";
import {
  BASIS,
  JAWAB_GAGAL,
  api,
  bukaDenganAuth,
  login,
  tutupSuratJalanUji,
  type Auth,
  type TransferMentah,
} from "../../../helpers/transfer-uji";

/*
 * Surat jalan pengembalian Outlet ke Gudang di luar alur penuh (utang
 * pengujian "Kirim Barang dan Penerimaan Stok hanya teruji lewat alur
 * penuh"). Pengajuan pengembalian beserta surat jalannya disiapkan lewat API
 * sebagai Owner (modul pengajuan), lalu yang diuji dijalankan lewat halaman
 * Kirim Barang outlet dan Penerimaan Stok gudang (keputusan rancangan butir
 * 23). Jalur gagal memakai jawaban 500 tiruan, karena backend tidak gagal
 * secara deterministik; revisi, batal, dan terima sebagian sungguhan.
 *
 * Data per run: skenario pertama meninggalkan satu surat jalan BATAL, dan
 * pengajuannya kembali PENDING lalu dipakai ulang run berikutnya. Skenario
 * terima sebagian memindahkan dua satuan dari stok outlet, satu di antaranya
 * diterima gudang, secara permanen.
 */

const URL_KIRIM = BASIS + "/dashboard/outlet/inventaris/pengirimanBarang";
const URL_TERIMA_GUDANG = BASIS + "/dashboard/gudang/penerimaanStok";
const CATATAN = "E2E pengembalian jalur gagal";
const POLA_KIRIM = /\/api\/transferstok\/[^/]+\/kirim(\?|$)/i;
const POLA_BATAL = /\/api\/transferstok\/[^/]+\/batal(\?|$)/i;

type Berid = { id?: string; _id?: string };
const idDari = (x: Berid | null | undefined) => String(x?.id ?? x?._id ?? "");
type Pengajuan = Berid & { catatan?: string; transferStokID?: unknown; items: { jumlah: number }[] };
type Inventori = { stok: number; item: (Berid & { satuan?: string }) | null };

async function lokasi(page: Page, auth: Auth) {
  const r = await api<(Berid & { tipe?: string })[]>(page, auth, "GET", "/location");
  expect(r.status, `GET /location: ${r.pesan}`).toBe(200);
  const outlet = (r.data ?? []).find((l) => l.tipe === "Outlet");
  const gudang = (r.data ?? []).find((l) => l.tipe === "Gudang");
  expect(outlet && gudang, "tenant uji punya outlet dan gudang").toBeTruthy();
  return { outlet: idDari(outlet), gudang: idDari(gudang) };
}

async function stok(page: Page, auth: Auth, lokasiID: string, bahanID: string) {
  const r = await api<Inventori[]>(page, auth, "GET", `/inventory?locationID=${lokasiID}`);
  expect(r.status, `GET /inventory: ${r.pesan}`).toBe(200);
  return (r.data ?? []).find((i) => idDari(i.item) === bahanID)?.stok ?? 0;
}

/**
 * Surat jalan pengembalian PENDING berjumlah dua satuan. Pengajuan uji yang
 * kembali PENDING setelah surat jalannya dibatalkan dipakai ulang; bila tidak
 * ada atau stok outletnya kurang, pengajuan baru diajukan dan disetujui.
 */
async function siapkanPengembalian(page: Page, auth: Auth): Promise<{ sj: TransferMentah; bahanID: string }> {
  const { outlet, gudang } = await lokasi(page, auth);
  const invOutlet = await api<Inventori[]>(page, auth, "GET", `/inventory?locationID=${outlet}`);
  const invGudang = await api<Inventori[]>(page, auth, "GET", `/inventory?locationID=${gudang}`);
  const diGudang = new Set((invGudang.data ?? []).map((i) => idDari(i.item)));
  const bahan = (invOutlet.data ?? []).find((i) => i.stok >= 2 && i.item?.satuan && diGudang.has(idDari(i.item)))?.item;
  test.skip(!bahan, "tidak ada bahan di outlet dan gudang dengan stok outlet minimal 2");
  const bahanID = idDari(bahan);

  const buatSj = (pengajuanStokID: string) =>
    api<Berid>(page, auth, "POST", "/transferstok", { pengajuanStokID, tanggalKirim: new Date().toISOString() });

  const sisa = await api<Pengajuan[]>(page, auth, "GET", "/pengajuanstok?status=PENDING");
  const lama = (sisa.data ?? []).find((p) => p.catatan === CATATAN && !p.transferStokID);
  let buat = lama ? await buatSj(idDari(lama)) : null;
  if (!buat || buat.status !== 201) {
    const baru = await api<Berid>(page, auth, "POST", "/pengajuanstok", {
      dariLocationID: outlet,
      keLocationID: gudang,
      items: [{ bahanBakuID: bahanID, jumlah: 2, satuan: bahan!.satuan }],
      catatan: CATATAN,
    });
    expect(baru.status, `buat pengembalian uji: ${baru.pesan}`).toBe(201);
    const id = idDari(baru.data);
    expect((await api(page, auth, "PATCH", `/pengajuanstok/${id}/submit`, {})).status).toBe(200);
    expect((await api(page, auth, "PATCH", `/pengajuanstok/${id}/approve`, {})).status).toBe(200);
    buat = await buatSj(id);
  }
  expect(buat.status, `buat surat jalan pengembalian: ${buat.pesan}`).toBe(201);
  const detail = await api<TransferMentah>(page, auth, "GET", `/transferstok/${idDari(buat.data)}`);
  expect(detail.status).toBe(200);
  return { sj: detail.data, bahanID: idDari(detail.data.items[0].bahanBaku as Berid) || bahanID };
}

test.describe("Surat jalan pengembalian di luar alur penuh", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Kirim Barang outlet: kirim, revisi, dan batal yang gagal tidak mengubah apa pun; revisi dan batal sungguhan tersimpan", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const auth = await bukaDenganAuth(page, URL_KIRIM);
    const { sj } = await siapkanPengembalian(page, auth);
    const id = String(sj.id);
    const polaDetail = new RegExp(`/api/transferstok/${id}(\\?|$)`, "i");
    const statusServer = async () => (await api<TransferMentah>(page, auth, "GET", `/transferstok/${id}`)).data;
    let selesai = false;

    try {
      await page.goto(`${URL_KIRIM}/${id}`);
      await expect(page.getByRole("button", { name: /kirim barang sekarang/i })).toBeVisible({ timeout: 15_000 });

      await test.step("kirim gagal: pesan tampil, dialog bertahan, status tetap PENDING", async () => {
        await page.route(POLA_KIRIM, (route) => route.fulfill(JAWAB_GAGAL));
        try {
          await page.getByRole("button", { name: /kirim barang sekarang/i }).click();
          const dialog = page.getByRole("alertdialog");
          const tGagal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_KIRIM.test(r.url()));
          await dialog.getByRole("button", { name: /ya, kirim sekarang/i }).click();
          expect((await tGagal).status()).toBe(500);
          await expect(page.getByText("Gagal Mengirim Barang")).toBeVisible();
          await expect(dialog, "dialog kirim bertahan saat gagal").toBeVisible();
          await dialog.getByRole("button", { name: /tunggu sebentar/i }).click();
          await expect(dialog).toBeHidden();
        } finally {
          await page.unroute(POLA_KIRIM);
        }
        expect((await statusServer()).status).toBe("PENDING");
      });

      await test.step("revisi gagal: tetap di halaman revisi, jumlah server tidak berubah", async () => {
        const lama = sj.items[0].qtyKirim;
        await page.getByRole("button", { name: /revisi kuantitas/i }).click();
        await expect(page).toHaveURL(new RegExp(`/pengirimanBarang/${id}/edit$`));
        const isian = page.locator("tbody input").first();
        await expect(isian).toHaveValue(String(lama));
        await isian.fill(String(lama - 1));
        await page.route(polaDetail, (route) =>
          route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
        );
        try {
          const tGagal = page.waitForResponse((r) => r.request().method() === "PUT" && polaDetail.test(r.url()));
          await page.getByRole("button", { name: /simpan revisi/i }).click();
          expect((await tGagal).status()).toBe(500);
          await expect(page).toHaveURL(new RegExp(`/pengirimanBarang/${id}/edit$`));
          await expect(isian, "isian revisi tidak hilang").toHaveValue(String(lama - 1));
        } finally {
          await page.unroute(polaDetail);
        }
        expect((await statusServer()).items[0].qtyKirim).toBe(lama);

        const tSimpan = page.waitForResponse((r) => r.request().method() === "PUT" && polaDetail.test(r.url()));
        await page.getByRole("button", { name: /simpan revisi/i }).click();
        expect((await tSimpan).status()).toBe(200);
        await expect(page).toHaveURL(new RegExp(`/pengirimanBarang/${id}$`));
        expect((await statusServer()).items[0].qtyKirim, "jumlah kirim hasil revisi").toBe(lama - 1);
      });

      await test.step("batal gagal: dialog bertahan dan status tetap PENDING, lalu batal sungguhan", async () => {
        await page.route(POLA_BATAL, (route) => route.fulfill(JAWAB_GAGAL));
        const dialog = page.getByRole("alertdialog");
        try {
          await page.getByRole("button", { name: /batalkan pengiriman/i }).click();
          const tGagal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_BATAL.test(r.url()));
          await dialog.getByRole("button", { name: /ya, batalkan/i }).click();
          expect((await tGagal).status()).toBe(500);
          await expect(page.getByText("Gagal Membatalkan")).toBeVisible();
          await expect(dialog, "dialog batal bertahan saat gagal").toBeVisible();
        } finally {
          await page.unroute(POLA_BATAL);
        }
        expect((await statusServer()).status).toBe("PENDING");

        const tBatal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_BATAL.test(r.url()));
        await dialog.getByRole("button", { name: /ya, batalkan/i }).click();
        expect((await tBatal).status()).toBe(200);
        selesai = true;
        await expect(page.getByText("Surat Jalan Dibatalkan").first()).toBeVisible();
        expect((await statusServer()).status).toBe("BATAL");
      });
    } finally {
      if (!selesai) await tutupSuratJalanUji(page, auth, id);
    }
  });

  test("Penerimaan Stok gudang: terima sebagian menuntut alasan selisih, lalu stok gudang bertambah sebesar yang diterima", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const auth = await bukaDenganAuth(page, URL_TERIMA_GUDANG);
    const { gudang } = await lokasi(page, auth);
    const { sj, bahanID } = await siapkanPengembalian(page, auth);
    const id = String(sj.id);
    let diterima = false;
    try {
      const kirim = await api(page, auth, "PATCH", `/transferstok/${id}/kirim`, {});
      expect(kirim.status, `kirim pengembalian uji: ${kirim.pesan}`).toBe(200);
      const qtyKirim = sj.items[0].qtyKirim;
      const sebelum = await stok(page, auth, gudang, bahanID);

      await page.goto(`${URL_TERIMA_GUDANG}/${id}`);
      const isian = page.locator(`input[id^="terima-jumlah-"]`).first();
      await expect(isian).toBeVisible({ timeout: 15_000 });
      await isian.fill(String(qtyKirim - 1));
      const alasan = page.getByPlaceholder("Misal: 1 bungkus pecah, 2 pcs hilang di jalan...");
      await expect(alasan, "alasan selisih muncul saat jumlah kurang").toBeVisible();

      // Tanpa alasan, tombol konfirmasi terkunci sehingga terima tidak terkirim.
      const konfirmasi = page.getByRole("button", { name: /konfirmasi terima barang/i });
      await expect(konfirmasi, "terkunci selama alasan selisih kosong").toBeDisabled();

      await alasan.fill("E2E satu satuan rusak di jalan");
      await expect(konfirmasi).toBeEnabled();
      await konfirmasi.click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText("selisih");
      const tTerima = page.waitForResponse((r) => r.request().method() === "PATCH" && /\/terima(\?|$)/i.test(r.url()));
      await dialog.getByRole("button", { name: /^ya,/i }).click();
      const res = await tTerima;
      expect(res.status()).toBe(200);
      diterima = true;
      const item = (res.request().postDataJSON() as { items: { qtyTerima: number; catatanItem?: string }[] }).items[0];
      expect(item).toMatchObject({ qtyTerima: qtyKirim - 1, catatanItem: "E2E satu satuan rusak di jalan" });

      const akhir = (await api<TransferMentah>(page, auth, "GET", `/transferstok/${id}`)).data;
      expect(akhir.status).toBe("DITERIMA");
      expect(await stok(page, auth, gudang, bahanID), "stok gudang bertambah sebesar yang diterima").toBe(
        sebelum + qtyKirim - 1,
      );
    } finally {
      if (!diterima) await tutupSuratJalanUji(page, auth, id);
    }
  });
});
