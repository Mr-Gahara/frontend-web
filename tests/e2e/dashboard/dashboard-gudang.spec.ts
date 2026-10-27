import { test, expect, type Page, type Response } from "@playwright/test";
import { BASIS, login } from "../../helpers/transfer-uji";

/*
 * Dashboard gudang (desain B). Setiap angka dibandingkan dengan respons
 * sumbernya memakai aturan yang sama dengan halaman tujuan, lalu tautan
 * kartu diklik untuk membuktikan angka itu sama dengan isi tab tujuannya.
 * Tidak ada data yang ditulis.
 */
const URL_DASHBOARD = BASIS + "/dashboard/gudang";

type Lokasi = { tipe?: string } | null | undefined;
type PengajuanMentah = { status: string; dariLokasi?: Lokasi; keLokasi?: Lokasi; transferStokID?: unknown };
type RingkasanMentah = {
  pengajuan: {
    menungguApproval: number;
    siapDibuatSuratJalan: number;
    siapDibuatSuratJalanPerArah: { permintaan: number; pengembalian: number };
  };
  transfer: { suratJalanPending: number; sedangDikirim: number };
};
type InventoryMentah = { isStokKritis?: boolean };
type JurnalMentah = { locationID?: Lokasi };

const POLA_PENGAJUAN = /\/api\/pengajuanstok(\?|$)/i;
const POLA_RINGKASAN = /\/api\/dashboard\/gudang(\?|$)/i;
const POLA_INVENTORY = /\/api\/inventory\?/i;
const POLA_JURNAL = /\/api\/jurnalstok(\?|$)/i;

const dapatGet = (pola: RegExp) => (r: Response) => r.request().method() === "GET" && pola.test(r.url());
const angka = (n: number) => new Intl.NumberFormat("id-ID").format(n);

async function isi<T>(r: Response): Promise<T> {
  expect(r.status(), r.url()).toBe(200);
  return ((await r.json()) as { data: T }).data;
}

// Aturan yang sama dengan features/pengajuan-stok (arah.ts, filter.ts, tahap.ts).
const arahBenar = (p: PengajuanMentah) => p.dariLokasi?.tipe === "Gudang" && p.keLokasi?.tipe === "Outlet";
const perluTinjauan = (p: PengajuanMentah) => arahBenar(p) && p.status === "SUBMITTED";
const perluSuratJalan = (p: PengajuanMentah) =>
  arahBenar(p) && (p.status === "APPROVED" || p.status === "PENDING") && !p.transferStokID;

/** Buka dashboard dan tangkap ketiga sumber datanya, serta permintaan daftar pengajuan bila ada. */
async function bukaDashboard(page: Page) {
  const permintaanPengajuan: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "GET" && POLA_PENGAJUAN.test(r.url())) permintaanPengajuan.push(r.url());
  });
  const tunggu = Promise.all(
    [POLA_RINGKASAN, POLA_INVENTORY, POLA_JURNAL].map((p) => page.waitForResponse(dapatGet(p))),
  );
  await page.goto(URL_DASHBOARD, { waitUntil: "commit" });
  const [rRingkasan, rInventory, rJurnal] = await tunggu;
  return {
    permintaanPengajuan: [...permintaanPengajuan],
    ringkasan: await isi<RingkasanMentah>(rRingkasan),
    inventory: await isi<InventoryMentah[]>(rInventory),
    jurnal: await isi<JurnalMentah[]>(rJurnal),
    urlJurnal: rJurnal.url(),
  };
}

test.describe("Dashboard gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("angka pengajuan dari ringkasan sama dengan isi tab tujuannya", async ({ page }) => {
    const { ringkasan, permintaanPengajuan } = await bukaDashboard(page);
    expect(permintaanPengajuan, "dashboard tidak mengambil daftar pengajuan").toEqual([]);
    const grup = page.getByRole("region", { name: "Pengajuan dari outlet" });
    const { menungguApproval, siapDibuatSuratJalanPerArah: perArah } = ringkasan.pengajuan;
    // B111: kartu gudang memakai permintaan; surat jalan pengembalian dibuat outlet (AR6a).
    const siapDibuatSuratJalan = perArah.permintaan;
    expect(perArah.permintaan + perArah.pengembalian, "rincian per arah menjumlah ke total").toBe(
      ringkasan.pengajuan.siapDibuatSuratJalan,
    );
    await expect(grup).toContainText(`${angka(menungguApproval)} pengajuan perlu disetujui`);
    await expect(grup).toContainText(
      `${angka(siapDibuatSuratJalan)} pengajuan sudah disetujui, surat jalannya belum dibuat`,
    );

    const tungguDaftar = page.waitForResponse(dapatGet(POLA_PENGAJUAN));
    if (siapDibuatSuratJalan === 0) {
      await expect(grup.getByRole("link")).toHaveCount(menungguApproval === 0 ? 0 : 1);
      await expect(grup).toContainText("Semua sudah dibuatkan surat jalan");
      await page.goto(BASIS + "/dashboard/gudang/pengajuanStok?tab=perlu-surat-jalan", { waitUntil: "commit" });
    } else {
      await grup.getByRole("link", { name: /surat jalannya belum dibuat/ }).click();
      await expect(page).toHaveURL(BASIS + "/dashboard/gudang/pengajuanStok?tab=perlu-surat-jalan");
      await expect(page.getByRole("button", { name: "Perlu Surat Jalan", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.getByText(`${siapDibuatSuratJalan} total data`, { exact: true })).toBeVisible();
    }

    // B101 dan B111: hitungan server sama dengan aturan tab daftar gudang, yang
    // memuat permintaan saja (arahBenar).
    const rDaftar = await tungguDaftar;
    expect(new URL(rDaftar.url()).searchParams.get("status")).toBeNull();
    const pengajuan = await isi<PengajuanMentah[]>(rDaftar);
    expect(pengajuan.filter(perluTinjauan).length, "perlu tinjauan").toBe(menungguApproval);
    expect(pengajuan.filter(perluSuratJalan).length, "perlu surat jalan").toBe(siapDibuatSuratJalan);
  });

  test("angka pengiriman dari ringkasan dan tautan Kirim sekarang ke tab Belum Dikirim", async ({ page }) => {
    const { ringkasan } = await bukaDashboard(page);
    const grup = page.getByRole("region", { name: "Pengiriman ke outlet" });
    const { suratJalanPending, sedangDikirim } = ringkasan.transfer;
    await expect(grup).toContainText(`${angka(suratJalanPending)} surat jalan belum dikirim`);
    await expect(grup).toContainText(`${angka(sedangDikirim)} surat jalan sedang dalam perjalanan`);

    if (suratJalanPending === 0) {
      await expect(grup).toContainText("Semua surat jalan sudah dikirim");
      return;
    }
    await grup.getByRole("link", { name: /surat jalan belum dikirim/ }).click();
    await expect(page).toHaveURL(BASIS + "/dashboard/gudang/transferStok?tab=draf");
    await expect(page.getByRole("button", { name: "Belum Dikirim", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("stok kritis dan jurnal hanya gudang, paling banyak lima baris", async ({ page }) => {
    const { inventory, jurnal, urlJurnal } = await bukaDashboard(page);
    const kritis = inventory.filter((i) => i.isStokKritis).length;
    const panelStok = page.getByRole("region", { name: /^Stok kritis/ });
    if (kritis === 0) {
      await expect(panelStok).toContainText("Tidak ada stok kritis di gudang");
    } else {
      await expect(panelStok.getByRole("heading")).toHaveText(`Stok kritis · ${angka(kritis)} barang`);
      await expect(panelStok.getByRole("listitem")).toHaveCount(Math.min(kritis, 5));
    }

    const jurnalGudang = jurnal.filter((j) => j.locationID?.tipe === "Gudang").length;
    const query = new URL(urlJurnal).searchParams;
    expect(query.get("page"), "panel jurnal meminta halaman pertama").toBe("1");
    expect(query.get("limit"), "panel jurnal meminta lima baris").toBe("5");
    expect(query.get("locationID"), "panel jurnal menyaring satu lokasi gudang").toBeTruthy();
    expect(jurnalGudang, "server hanya mengirim jurnal gudang").toBe(jurnal.length);
    const panelJurnal = page.getByRole("region", { name: "Jurnal terbaru" });
    if (jurnalGudang === 0) {
      await expect(panelJurnal).toContainText("Belum ada jurnal stok di gudang.");
    } else {
      await expect(panelJurnal.getByRole("listitem")).toHaveCount(Math.min(jurnalGudang, 5));
    }
  });

  test("ringkasan yang gagal dimuat menampilkan pesan, lalu Coba lagi memuat ulang", async ({ page }) => {
    await page.route(POLA_RINGKASAN, (route) =>
      route.fulfill({ status: 500, json: { success: false, message: "galat uji" } }),
    );
    await page.goto(URL_DASHBOARD, { waitUntil: "commit" });
    const grup = page.getByRole("region", { name: "Pengiriman ke outlet" });
    await expect(grup.getByRole("alert")).toContainText("Angka pengiriman gagal dimuat.", { timeout: 15_000 });

    await page.unroute(POLA_RINGKASAN);
    const tunggu = page.waitForResponse(dapatGet(POLA_RINGKASAN));
    await grup.getByRole("button", { name: "Coba lagi" }).click();
    const { transfer } = await isi<RingkasanMentah>(await tunggu);
    await expect(grup.getByRole("alert")).toHaveCount(0);
    await expect(grup).toContainText(`${angka(transfer.suratJalanPending)} surat jalan belum dikirim`);
  });
});