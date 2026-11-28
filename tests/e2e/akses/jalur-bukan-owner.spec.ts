import { expect, test, type Page } from "@playwright/test";
import { masukUlang } from "../../helpers/masuk-uji";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { dariLonceng } from "../../helpers/lonceng-uji";
import { daftarAkun, pilihAkun, type AkunKasUji } from "../../helpers/akun-kas-uji";
import { KATEGORI_FIXTURE, pastikanKategoriFixture } from "../../helpers/beban-uji";
import {
  masukAdjustmentOutlet,
  masukAkunBukanOwner,
  masukPencatatBeban,
  masukPetugasTransfer,
  masukTanpaBacaSebagian,
  masukTanpaLokasi,
  masukTanpaSdm,
} from "../../helpers/terkunci-uji";

/*
 * Jalur bukan-Owner yang sebelumnya hanya teruji di unit test (utang
 * pengujian; pemilik proyek, 14 November 2026, mengizinkan peran dan
 * pengguna uji menetap). Peran uji berlevel 90 dan izinnya diturunkan dari
 * izin Owner (tests/helpers/terkunci-uji.ts). Tidak ada data yang ditulis:
 * simpan beban dijawab gagal oleh route.fulfill (keputusan rancangan butir
 * 21) agar payloadnya terbaca tanpa beban baru.
 */

const ditolak = (page: Page) => expect(page.getByRole("heading", { name: "Akses ditolak" })).toBeVisible({ timeout: 15_000 });

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("pemegang update-akun yang bukan Owner tidak melihat kartu Akun Toko dan ditolak di halamannya", async ({ page }) => {
  await masukAkunBukanOwner(page);
  await page.goto("/dashboard/outlet/pengaturan");
  // Jangkar positif: kartu berizin tampil setelah sesi pengguna pulih. Tanpa
  // itu ketiadaan kartu lolos sebelum izin terbaca, dan goto berikutnya
  // memotong pin-refresh yang sudah diputar backend (lihat SDM di bawah).
  await expect(page.getByRole("link", { name: /Profil Toko/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Akun Toko/ })).toHaveCount(0);
  await page.goto("/dashboard/outlet/pengaturan/akun");
  await ditolak(page);
});

test("pencatat beban bukan Owner: tanggal terkunci hari ini dan payload memakai waktu simpan", async ({ page }) => {
  const auth = await bukaDenganAuth(page, "/dashboard/outlet/pengeluaran");
  await pastikanKategoriFixture(page, auth);
  const sumber = (await daftarAkun(page, auth)).find(
    (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
  );
  test.skip(!sumber, "tidak ada akun kas aktif bersaldo");

  await masukPencatatBeban(page);
  await page.goto("/dashboard/outlet/pengeluaran/catatBeban");
  const utama = page.getByRole("main");
  await expect(utama.getByText("Hanya Owner yang dapat mencatat beban bertanggal lampau.")).toBeVisible({
    timeout: 15_000,
  });
  await expect(utama.getByText(/^Hari ini, /)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Tanggal Beban,/ }), "tanpa pemilih tanggal").toHaveCount(0);

  await pilihAkun(page, "Akun Kas", (sumber as AkunKasUji).namaAkun);
  await pilihAkun(page, "Kategori", KATEGORI_FIXTURE);
  await page.getByLabel("Jumlah (Rp)").fill("1");
  await page.getByLabel("Keterangan", { exact: true }).fill("E2E beban bukan Owner");

  const pola = /\/api\/bebanoperasional(\?|$)/i;
  await page.route(pola, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: "E2E beban ditahan" }),
        })
      : route.continue(),
  );
  try {
    const sebelum = Date.now();
    const tBuat = page.waitForRequest((r) => r.method() === "POST" && pola.test(r.url()));
    await page.getByRole("button", { name: "Simpan Beban" }).click();
    const kiriman = (await tBuat).postDataJSON() as { tanggal: string };
    const waktu = new Date(kiriman.tanggal).getTime();
    expect(waktu, "waktu simpan, bukan tanggal pilihan").toBeGreaterThanOrEqual(sebelum - 60_000);
    expect(waktu).toBeLessThanOrEqual(Date.now() + 60_000);
  } finally {
    await page.unroute(pola);
  }
});

test("tanpa read-location: Status Staf tidak dipasang, absensi dan lokasi Profil Toko menampilkan pesan izin, dan daftar penjualan tanpa cakupan", async ({
  page,
}) => {
  await masukTanpaLokasi(page);

  await page.goto("/dashboard/outlet");
  await expect(page.getByRole("region", { name: "Omzet Hari Ini" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("Status Staf"), "panel Status Staf menuntut read-location").toHaveCount(0);

  await page.goto("/dashboard/outlet/pengguna");
  await expect(
    page.getByText("Anda tidak memiliki izin melihat lokasi ruang, sehingga absensi staf tidak dapat dimuat."),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto("/dashboard/outlet/pengaturan/toko");
  await expect(page.getByText("Anda tidak memiliki izin melihat lokasi outlet.")).toBeVisible({ timeout: 15_000 });

  const tDaftar = page.waitForResponse(
    (r) => r.request().method() === "GET" && /\/api\/penjualan\?/i.test(r.url()) && !dariLonceng(r.url()),
  );
  await page.goto("/dashboard/outlet/penjualan");
  const daftar = await tDaftar;
  expect(daftar.status()).toBe(200);
  expect(new URL(daftar.url()).searchParams.has("locationID"), "tanpa cakupan lokasi (K11b)").toBe(false);
  await expect(page.getByText("Filter Lokasi", { exact: true })).toHaveCount(0);
});

test("tanpa izin baca shift, pola roster, dan jadwal: menunya tidak tampil dan halamannya ditolak", async ({ page }) => {
  await masukTanpaSdm(page);
  await page.goto("/dashboard/outlet");
  const sidebar = page.locator("[data-sidebar=sidebar]").first();
  // Jangkar positif: menu berizin baru tampil setelah pin-refresh selesai dan
  // izin terbaca. "Dashboard" tampil sebelum sesi pulih, sehingga ketiadaan
  // menu SDM lolos tanpa bukti dan goto berikutnya memotong pin-refresh yang
  // sudah memutar tokenVersion; dokumen baru membawa cookie basi dan
  // terlempar ke login pengguna (suite penuh 16 November 2026).
  await expect(sidebar.getByText("Pelanggan", { exact: true })).toBeVisible({ timeout: 15_000 });
  for (const menu of ["Kalender Jadwal", "Pola Roster", "Master Shift"]) {
    await expect(sidebar.getByText(menu, { exact: true }), menu).toHaveCount(0);
  }
  for (const rute of ["/dashboard/outlet/jadwal", "/dashboard/outlet/pola-roster", "/dashboard/outlet/shift"]) {
    await page.goto(rute);
    await ditolak(page);
  }
});

test("tanpa read-pajak, read-jurnal-transfer, dan read-langganan: kartu, riwayat, dan halaman tertutup", async ({ page }) => {
  await masukTanpaBacaSebagian(page);
  await page.goto("/dashboard/outlet/pengaturan");
  await expect(page.getByRole("link", { name: /Profil Toko/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Pajak & Biaya Layanan/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Langganan/ })).toHaveCount(0);
  await page.goto("/dashboard/outlet/pengaturan/pajak");
  await ditolak(page);
  await page.goto("/dashboard/outlet/pengaturan/langganan");
  await ditolak(page);
  // Pindah Dana tanpa izin baca maupun buat: halaman terbuka (entri IZIN_HALAMAN kosong),
  // keadaan tanpa izin tampil, dan riwayat tidak dipasang.
  await page.goto("/dashboard/outlet/keuangan/akunkas/pindahDana");
  await expect(page.getByText("Tidak ada izin Pindah Dana")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("region", { name: "Riwayat transfer" })).toHaveCount(0);
});

test("petugas transfer tanpa izin setujui hanya melihat tab yang dapat ia tangani", async ({ page }) => {
  await masukPetugasTransfer(page);
  await page.goto("/dashboard/outlet/inventaris/pengajuanStok");
  await expect(page.getByRole("button", { name: "Menunggu Persetujuan", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Disetujui", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Draft", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ditolak", exact: true })).toHaveCount(0);
});

test("tanpa read-location: kartu Lokasi Outlet Profil Toko menampilkan keterangan izin tanpa memuat lokasi", async ({ page }) => {
  await masukTanpaLokasi(page);
  let mintaLokasi = false;
  page.on("request", (r) => {
    if (r.method() === "GET" && /\/api\/location\/current(\?|$)/.test(r.url())) mintaLokasi = true;
  });
  await page.goto("/dashboard/outlet/pengaturan/toko");
  await expect(page.getByText("Informasi Toko")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Anda tidak memiliki izin melihat lokasi outlet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan Lokasi Outlet" })).toHaveCount(0);
  expect(mintaLokasi, "GET /location/current tidak diminta halaman").toBe(false);
});

test("gate stock adjustment: tanpa read-location ruang outlet ditolak; izin per ruang hanya membuka ruangnya (RH3a)", async ({ page }) => {
  await masukTanpaLokasi(page);
  await page.goto("/dashboard/outlet/pengaturan");
  await expect(page.getByRole("link", { name: /Profil Toko/ })).toBeVisible({ timeout: 15_000 });
  await page.goto("/dashboard/outlet/inventaris/stockAdjustment");
  await ditolak(page);

  // Peran uji dibuat dan diselaraskan dengan sesi Owner, bukan sesi peran sebelumnya.
  await masukUlang(page);
  await masukAdjustmentOutlet(page);
  await page.goto("/dashboard/outlet/inventaris/stockAdjustment");
  await expect(page.getByRole("heading", { name: "Akses ditolak" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Jurnal Penyesuaian Stok", exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await page.goto("/dashboard/gudang/stockAdjustment");
  await ditolak(page);
});

test("penyaringan stock adjustment per ruang di server: izin ruang outlet hanya membaca adjustment outlet (temuan 40)", async ({
  page,
}) => {
  // Bentuk respons mapper adjustment: lokasi { id, nama, tipe }.
  type Adj = { id: string; lokasi?: { tipe?: string } | null };
  const idDari = (a: Adj) => a.id;
  const tipeDari = (a: Adj) => a.lokasi?.tipe;

  // Owner: satu adjustment Gudang sebagai sasaran yang harus ditolak.
  const owner = await bukaDenganAuth(page, "/dashboard");
  const gudang = await api<Adj[]>(page, owner, "GET", "/stockopname/adjustments?tipeLokasi=Gudang&page=1&limit=1");
  expect(gudang.status, gudang.pesan).toBe(200);
  const sasaran = gudang.data?.[0];
  test.skip(!sasaran, "tenant uji belum punya stock adjustment Gudang");

  await masukAdjustmentOutlet(page);
  const staf = await bukaDenganAuth(page, "/dashboard/outlet/inventaris/stockAdjustment");
  const daftar = await api<Adj[]>(page, staf, "GET", "/stockopname/adjustments?page=1&limit=50");
  expect(daftar.status, daftar.pesan).toBe(200);
  expect(daftar.data.length, "ada adjustment outlet yang terbaca").toBeGreaterThan(0);
  expect(
    daftar.data.filter((a) => tipeDari(a) !== "Outlet").map(idDari),
    "daftar tanpa adjustment di luar ruang outlet",
  ).toEqual([]);
  const minta = await api<Adj[]>(page, staf, "GET", "/stockopname/adjustments?tipeLokasi=Gudang&page=1&limit=5");
  expect([200, 403], minta.pesan).toContain(minta.status);
  if (minta.status === 200) expect(minta.data, "filter Gudang tidak membuka ruang gudang").toEqual([]);
  const detail = await api(page, staf, "GET", "/stockopname/adjustments/" + idDari(sasaran as Adj));
  expect(detail.status, `detail adjustment Gudang: ${detail.pesan}`).toBe(403);
});
