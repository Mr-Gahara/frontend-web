import { test, expect, Page, Response } from "@playwright/test";

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/jurnalStok";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/jurnalStok";

type Relasi = { _id?: string; id?: string };
type JurnalMentah = Relasi & {
  tipeKoreksi: "Masuk" | "Keluar";
  bahanBakuID: (Relasi & { namaBahan: string }) | null;
  locationID: (Relasi & { tipe: string; nama?: string }) | null;
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
function responsGet(pola: RegExp) {
  return (r: Response) => r.request().method() === "GET" && pola.test(r.url());
}

function idDari(x: Relasi | null | undefined) {
  return x?._id ?? x?.id;
}

function isiData<T>(body: unknown): T {
  return (body as { data: T }).data;
}

/** Membuka halaman jurnal dan mengembalikan seluruh jurnal yang dikirim server. */
async function bukaJurnal(page: Page, url: string, tungguLokasi = false) {
  const tJurnal = page.waitForResponse(responsGet(/\/api\/jurnalstok(\?|$)/i));
  const tLokasi = tungguLokasi
    ? page.waitForResponse(responsGet(/\/api\/location\/current(\?|$)/))
    : null;
  await page.goto(url);

  const rJurnal = await tJurnal;
  expect(rJurnal.status()).toBe(200);
  const jurnal = isiData<JurnalMentah[]>(await rJurnal.json());

  let lokasiAktif: string | undefined;
  if (tLokasi) {
    const rLokasi = await tLokasi;
    const data = isiData<Relasi | Relasi[] | null>(await rLokasi.json());
    lokasiAktif = idDari(Array.isArray(data) ? data[0] : data);
  }

  await expect(page.getByRole("heading", { name: /buku jurnal stok/i })).toBeVisible();
  return { jurnal, lokasiAktif };
}

function barisTabel(page: Page) {
  return page.locator("table tbody tr");
}

async function periksaJumlahBaris(page: Page, jumlah: number) {
  if (jumlah === 0) {
    await expect(barisTabel(page)).toHaveCount(1);
    await expect(barisTabel(page).first()).toContainText(/kosong|tidak ada catatan/i);
  } else {
    await expect(barisTabel(page)).toHaveCount(jumlah);
  }
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Jurnal stok", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("owner: seluruh outlet tanpa jurnal gudang", async ({ page }) => {
    const { jurnal } = await bukaJurnal(page, URL_OUTLET);
    await periksaJumlahBaris(page, jurnal.filter((j) => j.locationID?.tipe === "Outlet").length);
  });

  test("owner: pilih satu outlet menyaring jurnal outlet itu", async ({ page }) => {
    const { jurnal } = await bukaJurnal(page, URL_OUTLET);
    const target = jurnal.find((j) => j.locationID?.tipe === "Outlet" && j.locationID?.nama);
    test.skip(!target, "Belum ada jurnal outlet");
    const idTarget = idDari(target!.locationID);

    await page.getByText("Semua Outlet", { exact: true }).click();
    const tTersaring = page.waitForResponse(responsGet(/\/api\/jurnalstok\?(.*&)?locationID=/i));
    await page.getByRole("option", { name: target!.locationID!.nama!, exact: true }).click();
    const rTersaring = await tTersaring;
    expect(new URL(rTersaring.url()).searchParams.get("locationID")).toBe(idTarget);
    await periksaJumlahBaris(page, jurnal.filter((j) => idDari(j.locationID) === idTarget).length);
  });

  test("outlet: filter arah menyaring barang keluar", async ({ page }) => {
    const { jurnal } = await bukaJurnal(page, URL_OUTLET);
    const diLokasi = jurnal.filter((j) => j.locationID?.tipe === "Outlet");
    test.skip(diLokasi.length === 0, "Belum ada jurnal outlet");

    await page.getByText("Semua Arah", { exact: true }).click();
    await page.getByRole("option", { name: "Barang Keluar" }).click();

    await periksaJumlahBaris(
      page,
      diLokasi.filter((j) => j.tipeKoreksi === "Keluar").length,
    );
  });

  test("outlet: pencarian menyaring berdasarkan nama barang", async ({ page }) => {
    const { jurnal } = await bukaJurnal(page, URL_OUTLET);
    const diLokasi = jurnal.filter((j) => j.locationID?.tipe === "Outlet");
    const nama = diLokasi.find((j) => j.bahanBakuID?.namaBahan)?.bahanBakuID?.namaBahan;
    test.skip(!nama, "Belum ada jurnal outlet bernama barang");

    await page.getByPlaceholder("Cari nama barang...").fill(nama!);

    await periksaJumlahBaris(
      page,
      diLokasi.filter((j) =>
        j.bahanBakuID?.namaBahan?.toLowerCase().includes(nama!.toLowerCase()),
      ).length,
    );
  });

  test("gudang: hanya menampilkan jurnal di lokasi bertipe gudang", async ({ page }) => {
    const { jurnal } = await bukaJurnal(page, URL_GUDANG);

    await periksaJumlahBaris(
      page,
      jurnal.filter((j) => j.locationID?.tipe === "Gudang").length,
    );
  });

  test("gudang: gagal memuat jurnal menampilkan pesan, bukan daftar kosong", async ({ page }) => {
    const pola = "**/api/jurnalstok";
    await page.route(pola, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_GUDANG);
    await expect(page.getByText("Gagal memuat jurnal stok. Coba muat ulang halaman.")).toBeVisible({ timeout: 20000 });
    await page.unroute(pola);
  });

  test("outlet: gagal memuat daftar lokasi dibedakan dari lokasi yang belum dikonfigurasi", async ({ page }) => {
    // Owner memakai daftar lokasi; jalur staf (/location/current) diuji di unit test cakupan.
    const pola = "**/api/location";
    await page.route(pola, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_OUTLET);
    await expect(page.getByText("Gagal Memuat Lokasi Outlet")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Identitas Outlet Tidak Ditemukan")).toHaveCount(0);
    await page.unroute(pola);
  });
});