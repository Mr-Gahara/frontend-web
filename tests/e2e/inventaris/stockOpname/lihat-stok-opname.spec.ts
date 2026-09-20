import { test, expect, Page, Response } from "@playwright/test";

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/stockOpname";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/stockOpname";

type OpnameMentah = {
  id: string;
  nomorOpname: string;
  status: string;
  lokasi: { id?: string; nama?: string | null; tipe?: string | null } | null;
};

// ============================================================
// HELPER: Login
// ============================================================
async function login(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/dashboard");
}

// ============================================================
// HELPER: Respons server sebagai sumber data uji
// ============================================================
function getOpname(syarat?: (url: URL) => boolean) {
  return (r: Response) => {
    if (r.request().method() !== "GET") return false;
    if (!/\/api\/stockopname(\?|$)/.test(r.url())) return false;
    return syarat ? syarat(new URL(r.url())) : true;
  };
}

/** Menunggu respons dan langsung membaca isinya (lihat spec stok). */
function tunggu<T>(page: Page, syarat: (r: Response) => boolean): Promise<T> {
  return page.waitForResponse(syarat).then(async (r) => {
    expect(r.status()).toBe(200);
    return ((await r.json()) as { data: T }).data;
  });
}

function barisDokumen(page: Page, nomor: string) {
  return page.locator("table tbody tr").filter({ hasText: nomor });
}

function diOutlet(daftar: OpnameMentah[]) {
  return daftar.filter((o) => o.lokasi?.tipe === "Outlet");
}

/** Lima dokumen pertama dari respons harus tampil; urutan backend: tanggal terbaru dulu. */
async function periksaTampil(page: Page, daftar: OpnameMentah[]) {
  for (const opn of daftar.slice(0, 5)) {
    await expect(barisDokumen(page, opn.nomorOpname)).toHaveCount(1);
  }
}

async function periksaTidakTampil(page: Page, daftar: OpnameMentah[]) {
  for (const opn of daftar.slice(0, 3)) {
    await expect(barisDokumen(page, opn.nomorOpname)).toHaveCount(0);
  }
}

async function bukaDaftar(page: Page, url: string) {
  // Penunggu dipasang setelah dokumen baru ter-commit (lihat spec stok).
  await page.goto(url, { waitUntil: "commit" });
  const daftar = await tunggu<OpnameMentah[]>(
    page,
    getOpname((u) => !u.searchParams.has("status")),
  );
  await expect(page.getByRole("columnheader", { name: /no\. opname/i })).toBeVisible();
  return daftar;
}

async function pilihStatus(page: Page, label: string, nilai: string) {
  const pHasil = tunggu<OpnameMentah[]>(
    page,
    getOpname((u) => u.searchParams.get("status") === nilai),
  );
  await page.getByText("Semua Status", { exact: true }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
  return pHasil;
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Daftar stock opname outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("owner: semua outlet tanpa dokumen gudang", async ({ page }) => {
    const daftar = await bukaDaftar(page, URL_OUTLET);
    const outlet = diOutlet(daftar);
    test.skip(outlet.length === 0, "Belum ada dokumen stock opname outlet");

    await periksaTampil(page, outlet);
    await periksaTidakTampil(page, daftar.filter((o) => o.lokasi?.tipe !== "Outlet"));
  });

  test("filter status mengirim status ke server dan menyaring tabel", async ({ page }) => {
    const semua = diOutlet(await bukaDaftar(page, URL_OUTLET));
    const draft = diOutlet(await pilihStatus(page, "Draft", "DRAFT"));

    await periksaTampil(page, draft);
    await periksaTidakTampil(page, semua.filter((o) => o.status !== "DRAFT"));
  });

  test("owner: pilih satu outlet mengirim locationID", async ({ page }) => {
    const daftar = await bukaDaftar(page, URL_OUTLET);
    const target = daftar.find((o) => o.lokasi?.tipe === "Outlet" && o.lokasi?.id && o.lokasi?.nama);
    test.skip(!target, "Belum ada dokumen stock opname outlet");
    const idOutlet = target!.lokasi!.id!;

    const pHasil = tunggu<OpnameMentah[]>(
      page,
      getOpname((u) => u.searchParams.get("locationID") === idOutlet),
    );
    await page.getByText("Semua Outlet", { exact: true }).click();
    await page.getByRole("option", { name: target!.lokasi!.nama!, exact: true }).click();
    const hasil = await pHasil;

    expect(hasil.every((o) => o.lokasi?.id === idOutlet)).toBe(true);
    await periksaTampil(page, hasil);
  });

  test("tombol buat membuka halaman buat opname", async ({ page }) => {
    await bukaDaftar(page, URL_OUTLET);
    await page.getByRole("button", { name: /buat opname baru/i }).click();
    await page.waitForURL("**/outlet/inventaris/stockOpname/buatStockOpname");
  });
});

test.describe("Daftar stock opname gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("hanya dokumen di lokasi bertipe gudang", async ({ page }) => {
    const daftar = await bukaDaftar(page, URL_GUDANG);
    const diGudang = daftar.filter((o) => o.lokasi?.tipe === "Gudang");
    test.skip(diGudang.length === 0, "Belum ada dokumen stock opname gudang");

    await periksaTampil(page, diGudang);
    await periksaTidakTampil(page, daftar.filter((o) => o.lokasi?.tipe !== "Gudang"));
  });

  test("filter status mengirim status ke server dan menyaring tabel", async ({ page }) => {
    const semua = (await bukaDaftar(page, URL_GUDANG)).filter((o) => o.lokasi?.tipe === "Gudang");
    const draft = (await pilihStatus(page, "Draft", "DRAFT")).filter(
      (o) => o.lokasi?.tipe === "Gudang",
    );

    await periksaTampil(page, draft);
    await periksaTidakTampil(page, semua.filter((o) => o.status !== "DRAFT"));
  });

  test("tombol buat membuka halaman buat opname gudang", async ({ page }) => {
    await bukaDaftar(page, URL_GUDANG);
    await page.getByRole("button", { name: /buat opname gudang/i }).click();
    await page.waitForURL("**/gudang/stockOpname/buatStockOpname");
  });
});