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
type RingkasanMentah = { transfer: { suratJalanPending: number; sedangDikirim: number } };
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

/** Buka dashboard dan tangkap keempat sumber datanya. */
async function bukaDashboard(page: Page) {
  const tunggu = Promise.all(
    [POLA_PENGAJUAN, POLA_RINGKASAN, POLA_INVENTORY, POLA_JURNAL].map((p) => page.waitForResponse(dapatGet(p))),
  );
  await page.goto(URL_DASHBOARD, { waitUntil: "commit" });
  const [rPengajuan, rRingkasan, rInventory, rJurnal] = await tunggu;
  expect(new URL(rPengajuan.url()).searchParams.get("status")).toBeNull();
  return {
    pengajuan: await isi<PengajuanMentah[]>(rPengajuan),
    ringkasan: await isi<RingkasanMentah>(rRingkasan),
    inventory: await isi<InventoryMentah[]>(rInventory),
    jurnal: await isi<JurnalMentah[]>(rJurnal),
  };
}

test.describe("Dashboard gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("angka pengajuan sama dengan isi tab tujuannya", async ({ page }) => {
    const { pengajuan } = await bukaDashboard(page);
    const grup = page.getByRole("region", { name: "Pengajuan dari outlet" });
    const tinjau = pengajuan.filter(perluTinjauan).length;
    const suratJalan = pengajuan.filter(perluSuratJalan).length;
    await expect(grup).toContainText(`${angka(tinjau)} pengajuan perlu disetujui`);
    await expect(grup).toContainText(`${angka(suratJalan)} pengajuan sudah disetujui, surat jalannya belum dibuat`);

    if (suratJalan === 0) {
      await expect(grup.getByRole("link")).toHaveCount(tinjau === 0 ? 0 : 1);
      await expect(grup).toContainText("Semua sudah dibuatkan surat jalan");
      return;
    }
    await grup.getByRole("link", { name: /surat jalannya belum dibuat/ }).click();
    await expect(page).toHaveURL(BASIS + "/dashboard/gudang/pengajuanStok?tab=perlu-surat-jalan");
    await expect(page.getByRole("button", { name: "PERLU SURAT JALAN", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText(`${suratJalan} total data`, { exact: true })).toBeVisible();
  });

  test("angka pengiriman dari ringkasan dan tautan Kirim sekarang ke tab DRAFT SJ", async ({ page }) => {
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
    await expect(page.getByRole("button", { name: "DRAFT SJ", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("stok kritis dan jurnal hanya gudang, paling banyak lima baris", async ({ page }) => {
    const { inventory, jurnal } = await bukaDashboard(page);
    const kritis = inventory.filter((i) => i.isStokKritis).length;
    const panelStok = page.getByRole("region", { name: /^Stok kritis/ });
    if (kritis === 0) {
      await expect(panelStok).toContainText("Tidak ada stok kritis di gudang");
    } else {
      await expect(panelStok.getByRole("heading")).toHaveText(`Stok kritis · ${angka(kritis)} barang`);
      await expect(panelStok.getByRole("listitem")).toHaveCount(Math.min(kritis, 5));
    }

    const jurnalGudang = jurnal.filter((j) => j.locationID?.tipe === "Gudang").length;
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