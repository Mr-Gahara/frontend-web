import { test, expect } from "@playwright/test";
import { api, bukaDenganAuth, login, tutupSuratJalanUji, type Auth } from "../../../helpers/transfer-uji";

/**
 * Jalur berhasil setujui pengajuan, buat surat jalan, dan kirim surat jalan
 * lewat UI ruang gudang (utang pengujian "setujui pengajuan dan buat surat
 * jalan yang berhasil" dan "kirim surat jalan yang berhasil lewat UI";
 * pemilik proyek, 20 November 2026: diuji sungguhan dan data yang menumpuk
 * diterima). Setiap run meninggalkan satu pengajuan APPROVED dan satu surat
 * jalan DITERIMA, dan satu satuan bahan berpindah dari gudang ke outlet.
 * Pengajuan disiapkan lewat API (modul lain; dibuat lewat UI di
 * alur-pengajuan-stok), lalu disetujui, dibuatkan surat jalan, dan dikirim
 * lewat halaman yang diuji.
 */

const URL_GUDANG = "/dashboard/gudang/pengajuanStok";
type Berid = { id?: string; _id?: string };
const idDari = (x: Berid | null | undefined) => String(x?.id ?? x?._id ?? "");

async function pengajuanTerkirim(page: import("@playwright/test").Page, auth: Auth): Promise<string> {
  const lokasi = await api<(Berid & { tipe?: string })[]>(page, auth, "GET", "/location");
  const gudang = (lokasi.data ?? []).find((l) => l.tipe === "Gudang");
  const outlet = (lokasi.data ?? []).find((l) => l.tipe === "Outlet");
  expect(gudang && outlet, "tenant uji punya gudang dan outlet").toBeTruthy();
  const inventori = await api<(Berid & { stok: number; item: Berid | null })[]>(
    page, auth, "GET", `/inventory?locationID=${idDari(gudang)}`,
  );
  const bahan = (inventori.data ?? []).find((i) => i.stok >= 1 && i.item);
  test.skip(!bahan, "Gudang uji tidak punya bahan berstok");
  const semuaBahan = await api<(Berid & { satuan?: string })[]>(page, auth, "GET", "/bahanbaku");
  const satuan = (semuaBahan.data ?? []).find((b) => idDari(b) === idDari(bahan!.item))?.satuan;
  const buat = await api<Berid>(page, auth, "POST", "/pengajuanstok", {
    dariLocationID: idDari(gudang),
    keLocationID: idDari(outlet),
    items: [{ bahanBakuID: idDari(bahan!.item), jumlah: 1, satuan }],
    catatan: `E2E setujui dan kirim ${Date.now()}`,
  });
  expect(buat.status, `buat pengajuan: ${buat.pesan}`).toBeLessThan(300);
  const id = idDari(buat.data);
  const ajukan = await api(page, auth, "PATCH", `/pengajuanstok/${id}/submit`, {});
  expect(ajukan.status, `ajukan pengajuan: ${ajukan.pesan}`).toBeLessThan(300);
  return id;
}

test("setujui pengajuan, buat surat jalan, lalu kirim lewat UI", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  const auth = await bukaDenganAuth(page, URL_GUDANG);
  const idPengajuan = await pengajuanTerkirim(page, auth);
  let idSurat = "";
  try {
    await test.step("setujui permintaan", async () => {
      await page.goto(`${URL_GUDANG}/${idPengajuan}`);
      await page.getByRole("button", { name: /setujui permintaan/i }).click();
      const tSetuju = page.waitForResponse(
        (r) => r.request().method() === "PATCH" && /\/api\/pengajuanstok\/[^/]+\/approve(\?|$)/i.test(r.url()),
      );
      await page.getByRole("alertdialog").getByRole("button", { name: "Ya, Setujui Sekarang" }).click();
      expect((await tSetuju).status()).toBe(200);
      await expect(page.getByText("Pengajuan Disetujui")).toBeVisible();
      const detail = await api<{ status?: string }>(page, auth, "GET", `/pengajuanstok/${idPengajuan}`);
      expect(detail.data?.status).toBe("APPROVED");
    });

    await test.step("buat surat jalan dan pindah ke detailnya", async () => {
      const tBuat = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/transferstok(\?|$)/i.test(r.url()));
      await page.getByRole("button", { name: /buat surat jalan/i }).click();
      const res = await tBuat;
      expect(res.status()).toBe(201);
      idSurat = idDari(((await res.json()) as { data: Berid }).data);
      await expect(page.getByText("Surat Jalan Berhasil Dibuat")).toBeVisible();
      await page.waitForURL(new RegExp(`/transferStok/${idSurat}$`));
    });

    await test.step("kirim barang sekarang: status DIKIRIM", async () => {
      await page.getByRole("button", { name: /kirim barang sekarang/i }).click();
      const tKirim = page.waitForResponse((r) => r.request().method() === "PATCH" && /\/api\/transferstok\/[^/]+\/kirim(\?|$)/i.test(r.url()));
      await page.getByRole("alertdialog").getByRole("button", { name: /ya, kirim sekarang/i }).click();
      expect((await tKirim).status()).toBe(200);
      await expect(page.getByText("Barang Berhasil Dikirim")).toBeVisible();
      await expect(page.getByRole("button", { name: /kirim barang sekarang/i })).toHaveCount(0);
      const detail = await api<{ status?: string }>(page, auth, "GET", `/transferstok/${idSurat}`);
      expect(detail.data?.status).toBe("DIKIRIM");
    });
  } finally {
    // Surat jalan DIKIRIM ditutup lewat terima penuh (P12), sehingga tidak
    // tertinggal di tab Dalam Perjalanan.
    if (idSurat) await tutupSuratJalanUji(page, auth, idSurat);
  }
});
