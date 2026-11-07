import { expect, test, type Page, type Response } from "@playwright/test";
import { BASIS, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import {
  batalkanPenjualanUji,
  bayarLewatApi,
  buatDraftLewatUi,
  detailPenjualan,
  metodeUji,
  siapkanFixture,
  simpanLewatApi,
} from "../../helpers/penjualan-uji";
import { formatRupiah } from "../../../lib/format";

/*
 * Halaman mutasi arus kas (keputusan MK1a sampai MK3a): buku gabungan dari
 * GET /akunkas/mutasi dengan filter dan paginasi server. Harapan dihitung
 * dari respons yang dibaca halaman itu sendiri. Hanya membaca, kecuali test
 * rincian pembayaran: ia menyiapkan penjualan lunasnya sendiri lewat helper
 * penjualan, karena halaman pertama bulan berjalan tidak selalu memuat
 * pembayaran (spec keuangan berjalan sebelum spec penjualan), lalu
 * membatalkannya di akhir. Satu jalur gagal disimulasikan lewat page.route
 * (keputusan rancangan butir 21).
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
const POLA_RINGKASAN_GABUNGAN = /\/api\/akunkas\/ringkasan(\?|$)/i;
/** Field baris yang ikut dikirim sejak backend nizar c29310c (butir 124). */
type BarisNz = {
  pengguna?: { nama: string } | null;
  referensi?: { penjualanID?: string | null; noReferensi?: string | null } | null;
};

/** Rupiah seperti yang ditampilkan halaman (formatRupiah); spasi tak-putus diganti spasi biasa. */
const rupiah = (nilai: number) => formatRupiah(nilai).replace(/\u00a0/g, " ");

const barisTabel = (page: Page) => page.locator("tbody tr");
const pemilih = (page: Page, nama: string) => page.getByRole("combobox", { name: nama, exact: true });

/** Membuka dialog rincian baris ke-i lewat menu titik tiga, dan mengembalikan dialognya. */
async function bukaRincian(page: Page, i: number) {
  await barisTabel(page).nth(i).getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("menuitem", { name: "Lihat detail" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Respons mutasi yang query-nya memenuhi syarat. */
const responsMutasi = (syarat: (q: URLSearchParams) => boolean) => (r: Response) =>
  r.request().method() === "GET" && POLA_MUTASI.test(r.url()) && syarat(new URL(r.url()).searchParams);

/**
 * Membuka halaman dan mengembalikan respons mutasi pertama serta daftar akun
 * kas. `masuk: false` untuk test yang sudah login dan menyiapkan data lebih dulu.
 */
async function bukaMutasi(page: Page, { masuk = true }: { masuk?: boolean } = {}) {
  if (masuk) await login(page);
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
    const rincian = await bukaRincian(page, 0);
    await expect(rincian).toContainText(pertama.keterangan);
    await expect(rincian).toContainText(rupiah(pertama.saldoSesudah));
  });

  test("periode diubah lewat PilihTanggal dikirim sebagai awal dan akhir hari lokal, lalu Reset Filter kembali ke bulan berjalan", async ({
    page,
  }) => {
    await bukaMutasi(page);
    const kini = new Date();
    const tanggal = (hari: number) => new Date(kini.getFullYear(), kini.getMonth(), hari);
    const awalBulan = tanggal(1).toISOString();
    const akhir20 = new Date(kini.getFullYear(), kini.getMonth(), 20, 23, 59, 59, 999).toISOString();

    // Tanggal 15 dan 20 tidak pernah tampil sebagai hari bulan lain di kalender.
    // "Sampai" diisi lebih dulu, karena "dari" tidak boleh melewati "sampai".
    const tSampai = page.waitForResponse(
      responsMutasi((q) => q.get("dari") === awalBulan && q.get("sampai") === akhir20),
    );
    await page.getByRole("button", { name: /^Dicatat sampai, / }).click();
    await page.getByRole("grid").getByText("20", { exact: true }).click();
    await expect(page.getByRole("grid")).toHaveCount(0);
    expect((await tSampai).status()).toBe(200);

    const tDari = page.waitForResponse(
      responsMutasi((q) => q.get("dari") === tanggal(15).toISOString() && q.get("sampai") === akhir20 && q.get("page") === "1"),
    );
    await page.getByRole("button", { name: /^Dicatat dari, / }).click();
    await page.getByRole("grid").getByText("15", { exact: true }).click();
    await expect(page.getByRole("grid")).toHaveCount(0);
    expect((await tDari).status()).toBe(200);

    // Kunci periode bawaan sudah pernah dimuat (staleTime), sehingga reset
    // dibuktikan dari tampilan tanggal, bukan dari permintaan baru.
    await page.getByRole("button", { name: "Reset Filter" }).click();
    // Format tombol PilihTanggal: "dd MMMM yyyy" berbahasa Indonesia.
    const teks = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")} ${new Intl.DateTimeFormat("id-ID", { month: "long" }).format(d)} ${d.getFullYear()}`;
    await expect(page.getByRole("button", { name: `Dicatat dari, ${teks(tanggal(1))}`, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: `Dicatat sampai, ${teks(kini)}`, exact: true })).toBeVisible();
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

  test("jenis selisih kas sesi kasir ditawarkan sesuai arah dan diterima server (B228)", async ({ page }) => {
    await bukaMutasi(page);
    for (const [arah, label, jenis, lawan] of [
      ["Uang masuk", "Selisih kas lebih", "SELISIH_KAS_MASUK", "Selisih kas kurang"],
      ["Uang keluar", "Selisih kas kurang", "SELISIH_KAS_KELUAR", "Selisih kas lebih"],
    ] as const) {
      await test.step(`${arah}: ${label}`, async () => {
        await pemilih(page, "Arah").click();
        await page.getByRole("option", { name: arah, exact: true }).click();
        await pemilih(page, "Jenis").click();
        await expect(page.getByRole("option", { name: lawan, exact: true })).toHaveCount(0);
        const tJenis = page.waitForResponse(responsMutasi((q) => q.get("jenis") === jenis));
        await page.getByRole("option", { name: label, exact: true }).click();
        const respons = await tJenis;
        expect(respons.status(), `jenis ${jenis} diterima server`).toBe(200);
        const isi = (await respons.json()) as ResponsMutasi;
        expect(isi.data.every((b) => b.jenis === jenis)).toBe(true);
        if (isi.data.length > 0) {
          await expect(barisTabel(page).filter({ hasText: label })).toHaveCount(isi.data.length, { timeout: 15_000 });
        }
      });
    }
  });

  test("ringkasan gabungan tanpa akun terpilih, lalu ringkasan akun saat satu akun dipilih (NZ1a)", async ({ page }) => {
    const tGabungan = page.waitForResponse(
      (r) => r.request().method() === "GET" && POLA_RINGKASAN_GABUNGAN.test(r.url()),
    );
    const { mutasi, akun } = await bukaMutasi(page);
    const resGabungan = await tGabungan;
    expect(resGabungan.status()).toBe(200);
    const gabungan = ((await resGabungan.json()) as { data: RingkasanUji }).data;
    const kartuGabungan = page.getByRole("region", { name: "Ringkasan seluruh akun kas" });
    await expect(kartuGabungan).toBeVisible({ timeout: 15_000 });
    await expect(kartuGabungan).toContainText(rupiah(gabungan.saldoAwalPeriode));
    await expect(kartuGabungan).toContainText(rupiah(gabungan.totalMasuk));
    await expect(kartuGabungan).toContainText(rupiah(gabungan.totalKeluar));
    await expect(kartuGabungan).toContainText(rupiah(gabungan.saldoAkhirPeriode));

    test.skip(mutasi.data.length === 0, "Belum ada mutasi pada bulan berjalan di data uji");
    const dipilih = akun.find((a) => a.id === mutasi.data[0].akunKasID);
    test.skip(!dipilih, "Akun kas pemilik mutasi tidak ada di daftar akun");
    if (!dipilih) return;

    const ringkasan = page.getByRole("region", { name: `Ringkasan ${dipilih.namaAkun}` });
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

    await expect(kartuGabungan).toHaveCount(0);
    await expect(ringkasan).toBeVisible({ timeout: 15_000 });
    await expect(ringkasan).toContainText(rupiah(angka.saldoAwalPeriode));
    await expect(ringkasan).toContainText(rupiah(angka.totalMasuk));
    await expect(ringkasan).toContainText(rupiah(angka.totalKeluar));
    await expect(ringkasan).toContainText(rupiah(angka.saldoAkhirPeriode));
  });

  test("rincian baris pembayaran menampilkan pencatat dan tautan ke detail penjualannya (NZ2a)", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);
    const auth = await bukaDenganAuth(page, BASIS + URL_MUTASI);
    let idPenjualan: string | undefined;
    try {
      const fx = await siapkanFixture(page, auth, 20);
      const penjualan = await buatDraftLewatUi(page, 1);
      idPenjualan = penjualan.id;
      await simpanLewatApi(page, auth, penjualan.id, fx);
      const tagihan = (await detailPenjualan(page, auth, penjualan.id)).sisaTagihan;
      expect(tagihan, "penjualan uji tersimpan dengan tagihan").toBeGreaterThan(0);
      const metode = await metodeUji(page, auth);
      await bayarLewatApi(page, auth, penjualan.id, metode.id, tagihan, "E2E rincian mutasi pembayaran");

      const { mutasi } = await bukaMutasi(page, { masuk: false });
      const data = mutasi.data as unknown as BarisNz[];
      const i = data.findIndex((b) => b.referensi?.penjualanID === penjualan.id);
      expect(i, "mutasi pembayaran penjualan uji ada di halaman pertama").toBeGreaterThanOrEqual(0);
      const m = data[i];
      const pencatat = m.pengguna?.nama ?? "";
      expect(pencatat, "pencatat pembayaran dikirim backend").not.toBe("");
      await expect(barisTabel(page)).toHaveCount(data.length, { timeout: 15_000 });
      const rincian = await bukaRincian(page, i);
      await expect(rincian).toContainText(pencatat);
      const tautan = rincian.getByRole("link");
      await expect(tautan).toHaveText(m.referensi?.noReferensi || "Lihat penjualan");
      await expect(tautan).toHaveAttribute("href", `/dashboard/outlet/penjualan/${penjualan.id}`);
      await tautan.click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/outlet/penjualan/${penjualan.id}$`));
    } finally {
      await batalkanPenjualanUji(page, auth, idPenjualan);
    }
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