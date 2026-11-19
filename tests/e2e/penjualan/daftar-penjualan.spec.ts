import { expect, test, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";
import { masukTanpaIzinLintas } from "../../helpers/terkunci-uji";
import { bukaPanelFilter, pilihanPanel, terapkanPanelFilter } from "../../helpers/filter-uji";

/*
 * Daftar penjualan per halaman (keputusan PB6a). Backend 465b438 menjawab
 * GET /penjualan per halaman, sehingga footer tabel memakai angka dan aksi
 * server, urutan kolom terkirim sebagai sort dan order (backend yoga), dan
 * pilihan jumlah baris terkirim sebagai limit. Harapan dihitung dari
 * respons yang dibaca halaman
 * itu sendiri; tidak ada data yang ditulis.
 */

const URL_DAFTAR = "/dashboard/outlet/penjualan";
const POLA_DAFTAR = /\/api\/penjualan\?/i;

type ResponsDaftar = {
  data: { noReferensi: string }[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function tungguDaftar(page: Page, halaman: number, limit: number) {
  return page.waitForResponse((r) => {
    if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
    const q = new URL(r.url()).searchParams;
    return q.get("page") === String(halaman) && q.get("limit") === String(limit);
  });
}

function teksHalaman(respons: ResponsDaftar, halaman: number) {
  return `Halaman ${halaman} dari ${Math.max(1, respons.pagination.totalPages)}`;
}

async function bukaDaftar(page: Page) {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const tAwal = tungguDaftar(page, 1, 10);
  return (await (await tAwal).json()) as ResponsDaftar;
}

test.describe("E2E — Daftar penjualan per halaman", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("satu footer halaman berangka server, dengan tombol urutkan tiga kolom (PB6a, PB14a)", async ({ page }) => {
    const awal = await bukaDaftar(page);
    expect(awal.pagination.limit).toBe(10);
    await expect(page.getByText(`${awal.pagination.total} total data`, { exact: true })).toBeVisible();
    await expect(page.getByText(teksHalaman(awal, 1), { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^(No\. Referensi|Tanggal|Total)$/ })).toHaveCount(3);
    await expect(page.locator("tbody tr")).toHaveCount(awal.data.length);
  });

  test("urutkan Total: sort dan order terkirim, kembali ke halaman 1, dan baris berurutan dari server (PB14a)", async ({
    page,
  }) => {
    type BarisUrut = { noReferensi: string; totalTagihan: number };
    type ResponsUrut = { data: BarisUrut[]; pagination: ResponsDaftar["pagination"] };
    const tungguUrut = (order: string) =>
      page.waitForResponse((r) => {
        if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
        const q = new URL(r.url()).searchParams;
        return q.get("sort") === "totalTagihan" && q.get("order") === order && q.get("page") === "1";
      });

    const awal = await bukaDaftar(page);
    expect(awal.pagination.total, "data uji perlu lebih dari 10 penjualan").toBeGreaterThan(10);
    const tHalaman2 = tungguDaftar(page, 2, 10);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await tHalaman2;

    const tNaik = tungguUrut("asc");
    await page.getByRole("button", { name: "Total", exact: true }).click();
    const naik = (await (await tNaik).json()) as ResponsUrut;
    const angkaNaik = naik.data.map((p) => p.totalTagihan);
    expect(angkaNaik, "urutan naik dari server").toEqual([...angkaNaik].sort((a, b) => a - b));
    await expect(page.getByText(teksHalaman(naik, 1), { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toContainText(naik.data[0].noReferensi);

    const tTurun = tungguUrut("desc");
    await page.getByRole("button", { name: "Total", exact: true }).click();
    const turun = (await (await tTurun).json()) as ResponsUrut;
    const angkaTurun = turun.data.map((p) => p.totalTagihan);
    expect(angkaTurun, "urutan turun dari server").toEqual([...angkaTurun].sort((a, b) => b - a));
    await expect(page.locator("tbody tr").first()).toContainText(turun.data[0].noReferensi);
  });

  test("Previous kembali ke halaman 1, dan jumlah baris terkirim sebagai limit", async ({ page }) => {
    const awal = await bukaDaftar(page);
    expect(awal.pagination.total, "data uji perlu lebih dari 20 penjualan").toBeGreaterThan(20);

    const tHalaman2 = tungguDaftar(page, 2, 10);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await tHalaman2;
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeEnabled();

    // Halaman 1 masih segar di cache (staleTime 5 menit di
    // components/providers/query-provider.tsx), sehingga kembali ke sana tidak
    // mengirim permintaan; buktinya dari tampilan.
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByText(teksHalaman(awal, 1), { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(page.locator("tbody tr").first()).toContainText(awal.data[0].noReferensi);

    const t20 = tungguDaftar(page, 1, 20);
    await page.getByRole("combobox", { name: "Jumlah baris per halaman" }).click();
    await page.getByRole("option", { name: "20", exact: true }).click();
    const r20 = (await (await t20).json()) as ResponsDaftar;
    expect(r20.pagination).toMatchObject({ page: 1, limit: 20 });
    await expect(page.getByText(`${r20.pagination.total} total data`, { exact: true })).toBeVisible();
    await expect(page.getByText(teksHalaman(r20, 1), { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(r20.data.length);
  });

  test("filter tanggal dapat dikosongkan satu per satu lewat tombol Kosongkan di kalender", async ({ page }) => {
    const awal = await bukaDaftar(page);
    let panel = await bukaPanelFilter(page);
    const dari = panel.getByRole("button", { name: /^Dari tanggal,/ });
    await expect(dari).toHaveAccessibleName("Dari tanggal, Semua tanggal");

    await dari.click();
    await expect(page.getByRole("button", { name: "Kosongkan" }), "tanpa tanggal tidak ada Kosongkan").toHaveCount(0);
    await page.getByRole("grid").getByText("1", { exact: true }).first().click();
    await expect(dari).not.toHaveAccessibleName("Dari tanggal, Semua tanggal");

    const tDengan = page.waitForResponse(
      (r) => r.request().method() === "GET" && POLA_DAFTAR.test(r.url()) && new URL(r.url()).searchParams.has("startDate"),
    );
    await terapkanPanelFilter(panel);
    await tDengan;

    // Terapkan menutup panel (FL3a); buka lagi untuk mengosongkan.
    panel = await bukaPanelFilter(page);
    await expect(dari).toHaveAccessibleName(/^Dari tanggal, \d{2} /);
    await dari.click();
    await page.getByRole("button", { name: "Kosongkan" }).click();
    await expect(dari).toHaveAccessibleName("Dari tanggal, Semua tanggal");
    // Tanpa tanggal, kunci query sama dengan daftar awal yang masih segar di
    // cache, sehingga tidak ada permintaan baru; dibuktikan dari tampilan.
    await terapkanPanelFilter(panel);
    await expect(page.getByText(`${awal.pagination.total} total data`, { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toContainText(awal.data[0].noReferensi);
  });

  test("terkunci: daftar disaring server lewat locationID outlet tenant (RG4a)", async ({ page }) => {
    await masukTanpaIzinLintas(page);
    type ResponsLokasi = { data: { locationID: string | null }[]; pagination: ResponsDaftar["pagination"] };
    await page.goto(URL_DAFTAR, { waitUntil: "commit" });
    const tLokasi = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/location\/current/i.test(r.url()),
    );
    const tDaftar = tungguDaftar(page, 1, 10);
    const lokasi = (await (await tLokasi).json()) as { data: { id: string } };
    const res = await tDaftar;
    const daftar = (await res.json()) as ResponsLokasi;
    expect(new URL(res.url()).searchParams.get("locationID"), "locationID outlet tenant").toBe(lokasi.data.id);
    expect(daftar.data.every((p) => p.locationID === lokasi.data.id), "seluruh baris milik outlet tenant").toBe(true);
    await expect(page.getByText(`${daftar.pagination.total} total data`, { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(daftar.data.length);
  });

  test("lintas outlet: memilih satu outlet mengirim locationID dan kembali ke halaman 1 (RG4a, LP1a)", async ({ page }) => {
    type ResponsLokasiDaftar = { data: { id: string; nama: string; tipe: string }[] };
    await page.goto(URL_DAFTAR, { waitUntil: "commit" });
    const tLokasi = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/location(\?.*)?$/i.test(r.url()),
    );
    const tAwal = tungguDaftar(page, 1, 10);
    const lokasi = (await (await tLokasi).json()) as ResponsLokasiDaftar;
    const resAwal = await tAwal;
    const awal = (await resAwal.json()) as ResponsDaftar;
    expect(new URL(resAwal.url()).searchParams.get("locationID"), "Semua Outlet tanpa locationID").toBeNull();
    expect(awal.pagination.total, "data uji perlu lebih dari 10 penjualan").toBeGreaterThan(10);
    const outlet = lokasi.data.find((l) => l.tipe === "Outlet");
    if (!outlet) throw new Error("tenant uji tidak punya lokasi bertipe Outlet");

    const tHalaman2 = tungguDaftar(page, 2, 10);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await tHalaman2;

    const tOutlet = page.waitForResponse((r) => {
      if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
      const q = new URL(r.url()).searchParams;
      return q.get("locationID") === outlet.id && q.get("page") === "1";
    });
    await page.getByRole("combobox").filter({ hasText: "Semua Outlet" }).click();
    await page.getByRole("option", { name: outlet.nama, exact: true }).click();
    const hasil = (await (await tOutlet).json()) as ResponsDaftar;
    await expect(page.getByText(teksHalaman(hasil, 1), { exact: true })).toBeVisible();
    await expect(page.getByText(`${hasil.pagination.total} total data`, { exact: true })).toBeVisible();
  });

  test("panel filter: Terapkan mengirim pilihan, tutup tanpa Terapkan membuang draf, dan pil aktif dihapus satu per satu (FL1a sampai FL4a)", async ({ page }) => {
    await bukaDaftar(page);
    let panel = await bukaPanelFilter(page);
    await pilihanPanel(panel, "Status", "Lunas").click();
    await pilihanPanel(panel, "Tipe transaksi", "POS Kasir").click();
    await pilihanPanel(panel, "Periode cepat", "Bulan ini").click();
    await expect(panel.getByText("3 filter aktif")).toBeVisible();
    const tTerapan = page.waitForResponse((r) => {
      if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
      const q = new URL(r.url()).searchParams;
      return q.get("statusPenjualan") === "PAID" && q.get("jenisTransaksi") === "POS" && q.has("startDate") && q.get("page") === "1";
    });
    await terapkanPanelFilter(panel);
    await tTerapan;
    await expect(page.getByRole("button", { name: "Filter lainnya, 3 aktif" })).toBeVisible();
    const pil = page.getByRole("group", { name: "Filter aktif" });
    await expect(pil.getByRole("button", { name: /^Hapus filter / })).toHaveCount(3);
    await expect(pil.getByRole("button", { name: /^Hapus filter Bulan ini · / })).toBeVisible();

    // Menutup tanpa Terapkan membuang pilihan di panel.
    panel = await bukaPanelFilter(page);
    await pilihanPanel(panel, "Status", "Draft").click();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(pil.getByRole("button", { name: "Hapus filter Status: Lunas" })).toBeVisible();
    panel = await bukaPanelFilter(page);
    await expect(pilihanPanel(panel, "Status", "Lunas")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");

    const tTanpaStatus = page.waitForResponse((r) => {
      if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
      const q = new URL(r.url()).searchParams;
      return !q.has("statusPenjualan") && q.get("jenisTransaksi") === "POS";
    });
    await pil.getByRole("button", { name: "Hapus filter Status: Lunas" }).click();
    await tTanpaStatus;
    await expect(page.getByRole("button", { name: "Filter lainnya, 2 aktif" })).toBeVisible();
    await pil.getByRole("button", { name: "Atur ulang semua" }).click();
    await expect(pil).toBeHidden();
    await expect(page.getByRole("button", { name: "Filter lainnya", exact: true })).toBeVisible();
  });

  test("kotak cari nomor referensi berlaku tanpa panel dan kembali ke halaman 1 (FL1a)", async ({ page }) => {
    const awal = await bukaDaftar(page);
    expect(awal.pagination.total, "data uji perlu lebih dari 10 penjualan").toBeGreaterThan(10);
    const tHalaman2 = tungguDaftar(page, 2, 10);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await tHalaman2;
    const kata = awal.data[0].noReferensi.slice(0, 6);
    const tCari = page.waitForResponse((r) => {
      if (r.request().method() !== "GET" || !POLA_DAFTAR.test(r.url())) return false;
      const q = new URL(r.url()).searchParams;
      return q.get("noReferensi") === kata && q.get("page") === "1";
    });
    await page.getByRole("searchbox", { name: "Cari nomor referensi" }).fill(kata);
    await tCari;
  });

  test("HP 390 px: panel filter layar penuh dan tombol Filter berupa ikon berlencana (FL1a)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bukaDaftar(page);
    const tombol = page.getByRole("button", { name: /^Filter lainnya/ });
    await expect(tombol.getByText("Filter lainnya", { exact: true })).toBeHidden();
    const panel = await bukaPanelFilter(page);
    await page.waitForTimeout(300); // animasi masuk 260 ms (FL5a)
    const k = await panel.boundingBox();
    expect(k, "panel tampil").not.toBeNull();
    expect(Math.round(k!.x), "panel dari tepi kiri layar").toBe(0);
    expect(Math.round(k!.width), "panel selebar layar").toBe(390);
    await expect(panel.getByRole("button", { name: "Terapkan" })).toBeInViewport();
  });
});
