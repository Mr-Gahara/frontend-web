import { expect, test, type Page, type Response } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Halaman mutasi arus kas (keputusan MK1a sampai MK3a): buku gabungan dari
 * GET /akunkas/mutasi dengan filter dan paginasi server. Harapan dihitung
 * dari respons yang dibaca halaman itu sendiri. Hanya membaca; satu jalur
 * gagal disimulasikan lewat page.route (keputusan rancangan butir 21).
 */

interface BarisMutasi {
  id: string;
  akunKasID: string;
  jenis: string;
  keterangan: string;
  saldoSesudah: number;
}
interface ResponsMutasi {
  data: BarisMutasi[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
interface AkunKasUji {
  id: string;
  namaAkun: string;
}
interface RingkasanUji {
  saldoAwalPeriode: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhirPeriode: number;
}

const URL_MUTASI = "/dashboard/outlet/keuangan/mutasiArusKas";
const POLA_MUTASI = /\/api\/akunkas\/mutasi(\?|$)/i;
const POLA_AKUN = /\/api\/akunkas(\?|$)/i;
const POLA_RINGKASAN = /\/api\/akunkas\/[0-9a-f]{24}\/ringkasan(\?|$)/i;

const rupiah = (nilai: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(nilai)
    .replace(/\u00a0/g, " ");

const barisTabel = (page: Page) => page.locator("tbody tr");
const pemilih = (page: Page, nama: string) => page.getByRole("combobox", { name: nama, exact: true });

/** Respons mutasi yang query-nya memenuhi syarat. */
const responsMutasi = (syarat: (q: URLSearchParams) => boolean) => (r: Response) =>
  r.request().method() === "GET" && POLA_MUTASI.test(r.url()) && syarat(new URL(r.url()).searchParams);

/** Membuka halaman dan mengembalikan respons mutasi pertama serta daftar akun kas. */
async function bukaMutasi(page: Page) {
  await login(page);
  const tMutasi = page.waitForResponse(responsMutasi((q) => q.get("page") === "1"));
  const tAkun = page.waitForResponse((r) => r.request().method() === "GET" && POLA_AKUN.test(r.url()));
  await page.goto(URL_MUTASI);
  const respons = await tMutasi;
  expect(respons.status()).toBe(200);
  const mutasi = (await respons.json()) as ResponsMutasi;
  const akun = ((await (await tAkun).json()) as { data: AkunKasUji[] }).data;
  await expect(page.getByRole("heading", { name: "Laporan Mutasi Arus Kas" })).toBeVisible();
  return { mutasi, akun, query: new URL(respons.url()).searchParams };
}

test.describe("Mutasi arus kas", () => {
  test("dibuka dengan periode bulan berjalan, dan baris tabel sesuai respons (MK3a)", async ({ page }) => {
    const { mutasi, akun, query } = await bukaMutasi(page);
    const kini = new Date();

    expect(query.get("dari")).toBe(new Date(kini.getFullYear(), kini.getMonth(), 1).toISOString());
    expect(query.get("sampai")).toBe(
      new Date(kini.getFullYear(), kini.getMonth(), kini.getDate(), 23, 59, 59, 999).toISOString(),
    );
    expect(query.get("limit")).toBe("20");
    expect([query.get("akunKasID"), query.get("arah"), query.get("jenis")]).toEqual([null, null, null]);

    test.skip(mutasi.data.length === 0, "Belum ada mutasi pada bulan berjalan di data uji");
    await expect(barisTabel(page)).toHaveCount(mutasi.data.length, { timeout: 15_000 });
    const pertama = mutasi.data[0];
    const namaAkun = akun.find((a) => a.id === pertama.akunKasID)?.namaAkun ?? "Akun tidak dikenal";
    await expect(barisTabel(page).first()).toContainText(namaAkun);
    await expect(barisTabel(page).first()).toContainText(pertama.keterangan);
    await expect(barisTabel(page).first()).toContainText(rupiah(pertama.saldoSesudah));
  });

  test("pindah halaman meminta page berikutnya dan menampilkan barisnya", async ({ page }) => {
    const { mutasi } = await bukaMutasi(page);
    test.skip(mutasi.pagination.totalPages < 2, "Mutasi bulan berjalan belum sampai dua halaman");

    const tunggu = page.waitForResponse(responsMutasi((q) => q.get("page") === "2"));
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const respons = await tunggu;
    expect(respons.status()).toBe(200);
    const kedua = (await respons.json()) as ResponsMutasi;

    expect(kedua.data[0].id, "halaman kedua berisi baris lain").not.toBe(mutasi.data[0].id);
    await expect(barisTabel(page)).toHaveCount(kedua.data.length, { timeout: 15_000 });
    await expect(barisTabel(page).first()).toContainText(kedua.data[0].keterangan);
  });

  test("filter arah dan jenis dikirim ke server, dan pilihan jenis mengikuti arah", async ({ page }) => {
    await bukaMutasi(page);

    const tArah = page.waitForResponse(responsMutasi((q) => q.get("arah") === "KELUAR"));
    await pemilih(page, "Arah").click();
    await page.getByRole("option", { name: "Uang keluar" }).click();
    const arah = await tArah;
    expect(arah.status()).toBe(200);
    expect(new URL(arah.url()).searchParams.get("page"), "filter mengembalikan ke halaman 1").toBe("1");

    await pemilih(page, "Jenis").click();
    await expect(page.getByRole("option", { name: "Pembayaran", exact: true })).toHaveCount(0);
    const tJenis = page.waitForResponse(responsMutasi((q) => q.get("jenis") === "VOID_PEMBAYARAN"));
    await page.getByRole("option", { name: "Pembatalan pembayaran", exact: true }).click();
    const jenis = await tJenis;
    expect(jenis.status()).toBe(200);
    const isi = (await jenis.json()) as ResponsMutasi;

    expect(isi.data.every((b) => b.jenis === "VOID_PEMBAYARAN")).toBe(true);
    test.skip(isi.data.length === 0, "Belum ada pembatalan pembayaran pada bulan berjalan");
    await expect(barisTabel(page)).toHaveCount(isi.data.length, { timeout: 15_000 });
    await expect(barisTabel(page).filter({ hasText: "Pembatalan pembayaran" })).toHaveCount(isi.data.length);
  });

  test("ringkasan periode tampil hanya saat satu akun dipilih (MK2a)", async ({ page }) => {
    const { mutasi, akun } = await bukaMutasi(page);
    test.skip(mutasi.data.length === 0, "Belum ada mutasi pada bulan berjalan di data uji");
    const dipilih = akun.find((a) => a.id === mutasi.data[0].akunKasID);
    test.skip(!dipilih, "Akun kas pemilik mutasi tidak ada di daftar akun");
    if (!dipilih) return;

    const ringkasan = page.getByRole("region", { name: `Ringkasan ${dipilih.namaAkun}` });
    await expect(ringkasan).toHaveCount(0);

    const tMutasi = page.waitForResponse(responsMutasi((q) => q.get("akunKasID") === dipilih.id));
    const tRingkasan = page.waitForResponse(
      (r) => r.request().method() === "GET" && POLA_RINGKASAN.test(r.url()),
    );
    await pemilih(page, "Akun kas").click();
    await page.getByRole("option", { name: dipilih.namaAkun, exact: true }).click();
    expect((await tMutasi).status()).toBe(200);
    const respons = await tRingkasan;
    expect(respons.status()).toBe(200);
    expect(respons.url()).toContain(dipilih.id);
    const angka = ((await respons.json()) as { data: RingkasanUji }).data;

    await expect(ringkasan).toBeVisible({ timeout: 15_000 });
    await expect(ringkasan).toContainText(rupiah(angka.saldoAwalPeriode));
    await expect(ringkasan).toContainText(rupiah(angka.totalMasuk));
    await expect(ringkasan).toContainText(rupiah(angka.totalKeluar));
    await expect(ringkasan).toContainText(rupiah(angka.saldoAkhirPeriode));
  });

  test("mutasi gagal dimuat: pesan backend tampil, lalu Coba Lagi memuat datanya", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);
    await page.route(POLA_MUTASI, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "Simulasi gagal memuat mutasi." }),
      }),
    );
    await page.goto(URL_MUTASI);

    const pesan = page.getByRole("main").getByRole("alert").filter({ hasText: "Simulasi gagal memuat mutasi." });
    await expect(pesan).toBeVisible({ timeout: 45_000 });
    await expect(barisTabel(page)).toHaveCount(0);

    await page.unroute(POLA_MUTASI);
    const tunggu = page.waitForResponse(responsMutasi(() => true));
    await pesan.getByRole("button", { name: "Coba Lagi" }).click();
    expect((await tunggu).status()).toBe(200);
    await expect(pesan).toHaveCount(0, { timeout: 15_000 });
  });
});