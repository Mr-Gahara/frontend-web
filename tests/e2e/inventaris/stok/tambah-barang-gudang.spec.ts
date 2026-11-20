import { test, expect } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../../helpers/transfer-uji";

/**
 * Jalur berhasil Tarik Master Data ke Gudang (utang pengujian "tambah barang
 * gudang yang berhasil"; pemilik proyek, 20 November 2026: diuji sungguhan
 * dan data yang menumpuk diterima). UI tidak punya cara menghapus entri
 * inventory, sehingga setiap run meninggalkan satu bahan master uji
 * "E2E Tarik Gudang ..." beserta entri inventory gudangnya. Bahan master
 * disiapkan lewat API (modul bahan baku), lalu ditarik lewat halaman yang
 * diuji.
 */

const URL_GUDANG = "/dashboard/gudang/inventaris";
type Berid = { id?: string; _id?: string };
const idDari = (x: Berid | null | undefined) => String(x?.id ?? x?._id ?? "");

test("bahan master baru ditarik ke gudang beserta stok awal dan minimumnya", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const auth = await bukaDenganAuth(page, URL_GUDANG);
  const lokasi = await api<(Berid & { tipe?: string })[]>(page, auth, "GET", "/location");
  const outlet = (lokasi.data ?? []).find((l) => l.tipe === "Outlet");
  const gudang = (lokasi.data ?? []).find((l) => l.tipe === "Gudang");
  expect(outlet && gudang, "tenant uji punya outlet dan gudang").toBeTruthy();
  const nama = `E2E Tarik Gudang ${Date.now()}`;
  const bahan = await api<Berid>(page, auth, "POST", "/bahanbaku", {
    namaBahan: nama,
    satuan: "pcs",
    stok: 0,
    stokMinimum: 0,
    locationID: idDari(outlet),
  });
  expect(bahan.status, `POST bahan uji: ${bahan.pesan}`).toBeLessThan(300);

  await page.reload();
  await page.getByRole("button", { name: /masukkan master data/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Tarik Master Data ke Gudang")).toBeVisible();
  await dialog.getByText("Pilih bahan baku...").click();
  await page.getByRole("option", { name: new RegExp(nama) }).click();
  await dialog.getByPlaceholder("0").nth(0).fill("3");
  await dialog.getByPlaceholder("0").nth(1).fill("1");

  const tPost = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/inventory(\?|$)/.test(r.url()));
  await dialog.getByRole("button", { name: "Simpan ke Gudang" }).click();
  const res = await tPost;
  expect(res.status(), "POST /inventory berhasil").toBeLessThan(300);
  await expect(page.getByText("Barang Berhasil Ditambahkan")).toBeVisible();
  await expect(dialog).toBeHidden();

  const isi = await api<(Berid & { stok: number; stokMinimum?: number; item: Berid | null })[]>(
    page, auth, "GET", `/inventory?locationID=${idDari(gudang)}&cari=${encodeURIComponent(nama)}`,
  );
  const entri = (isi.data ?? []).find((i) => idDari(i.item) === idDari(bahan.data));
  expect(entri, "entri inventory gudang untuk bahan uji").toBeTruthy();
  expect(entri!.stok).toBe(3);
  expect(entri!.stokMinimum).toBe(1);
});
