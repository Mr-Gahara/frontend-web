import { test, expect, type Page } from "@playwright/test";

/*
 * Wizard setup /setup (modul/setup-akun.md, desain F): pratinjau tampilan
 * tanpa penyimpanan ke backend, belum ditautkan. Plan dipilih lewat ?plan=.
 * Lokasi perangkat dipatok lewat izin dan koordinat Playwright, sehingga
 * tombol ambil koordinat terbaca tanpa perangkat sungguhan.
 */
test.use({ geolocation: { latitude: -0.02633, longitude: 109.342503 }, permissions: ["geolocation"] });

const lanjut = (page: Page) => page.getByRole("button", { name: "Simpan dan lanjut" });
const langkahAktif = (page: Page) =>
  page.getByRole("list", { name: "Langkah setup toko" }).locator('[aria-current="step"]');

async function isiTokoDanOwner(page: Page) {
  await page.getByLabel("Nama toko").fill("Kopi Senja");
  await lanjut(page).click();
  await page.getByLabel("Nama Owner").fill("Rina");
  await page.getByLabel("PIN", { exact: true }).fill("123456");
  await page.getByLabel("Ulangi PIN").fill("123456");
  await lanjut(page).click();
}

async function isiLokasiOutlet(page: Page) {
  await page.getByLabel("Nama outlet").fill("Kopi Senja Pontianak Kota");
  await page.getByLabel("Alamat").fill("Jl. Gajah Mada No. 12, Pontianak");
  await page.getByRole("button", { name: "Ambil koordinat dari perangkat ini" }).click();
  await expect(page.getByLabel("Latitude")).toHaveValue("-0.02633");
  await page.getByLabel("Radius absen (meter)").fill("30");
  await lanjut(page).click();
  await page.getByRole("alertdialog", { name: "Yakin Anda sedang di outlet?" })
    .getByRole("button", { name: "Ya, saya di outlet" })
    .click();
}

test.describe("Wizard setup", () => {
  test("plan Basic: tujuh langkah sampai selesai tanpa permintaan simpan ke backend", async ({ page }) => {
    const simpan: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/") && r.method() !== "GET" && !/refreshtoken|pin-refresh/.test(r.url())) {
        simpan.push(r.method() + " " + r.url());
      }
    });
    await page.goto("/setup");
    await expect(langkahAktif(page)).toHaveText("1Nama toko");
    await isiTokoDanOwner(page);
    await expect(page.getByText("Masuk sebagai Rina, Owner")).toBeVisible();
    await isiLokasiOutlet(page);

    await page.getByLabel("Nama kategori").fill("Kopi");
    await page.getByLabel("Kode kategori").fill("KOP");
    await page.getByRole("button", { name: "Tambah kategori" }).click();
    await lanjut(page).click();

    await page.getByRole("button", { name: "Ya, ada yang pakai resep" }).click();
    await page.getByLabel("Nama bahan").fill("Biji kopi arabika");
    await page.getByLabel("Stok awal").fill("2000");
    await page.getByLabel("Batas stok minimum").fill("200");
    await page.getByRole("button", { name: "Tambah bahan baku" }).click();
    await lanjut(page).click();

    await page.getByLabel("Nama produk").fill("Es kopi susu aren");
    await page.getByLabel("Kategori", { exact: true }).selectOption({ label: "Kopi" });
    await page.getByLabel("Harga dasar").fill("9000");
    await page.getByLabel("Harga jual").fill("22000");
    await page.getByRole("button", { name: "Tidak, stok tidak terbatas" }).click();
    await page.getByRole("button", { name: "Ya, dibuat dari bahan baku" }).click();
    await page.getByLabel("Bahan baku 1").selectOption({ index: 1 });
    await page.getByLabel("Jumlah 1").fill("18");
    await page.getByRole("button", { name: "Simpan produk" }).click();
    await expect(page.getByText("Es kopi susu aren")).toBeVisible();
    await lanjut(page).click();

    await page.getByLabel("Nama pajak").fill("PB1");
    await page.getByLabel("Tarif (%)").fill("10");
    await page.getByRole("button", { name: "Simpan dan selesaikan" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Toko siap dipakai" })).toBeVisible();
    await expect(page.getByText("Aplikasi kasir juga sudah siap dipakai")).toBeVisible();
    await expect(page.getByRole("link", { name: "Masuk ke dashboard" })).toHaveAttribute("href", "/dashboard");
    await expect(langkahAktif(page)).toHaveCount(0);
    expect(simpan).toEqual([]);
  });

  test("daftar langkah mengikuti plan", async ({ page }) => {
    const daftar = page.getByRole("list", { name: "Langkah setup toko" }).getByRole("listitem");
    await page.goto("/setup");
    await expect(daftar).toHaveCount(7);
    await page.goto("/setup?plan=advanced");
    await expect(daftar).toHaveCount(8);
    await expect(daftar.last()).toContainText("Sesi booking");
    await page.goto("/setup?plan=pro");
    await expect(daftar).toHaveCount(9);
    await expect(daftar.last()).toContainText("Gudang");
    await page.goto("/setup?plan=asing");
    await expect(daftar).toHaveCount(7);
  });

  test("koordinat dijaga dua peringatan; Batal di pop up tidak memajukan langkah", async ({ page }) => {
    await page.goto("/setup");
    await isiTokoDanOwner(page);
    await expect(page.getByRole("note").filter({ hasText: "Ambil koordinat saat Anda berada di outlet ini." })).toBeVisible();
    await page.getByLabel("Nama outlet").fill("Kopi Senja Pontianak Kota");
    await page.getByLabel("Alamat").fill("Jl. Gajah Mada No. 12");
    await page.getByRole("button", { name: "Ambil koordinat dari perangkat ini" }).click();
    await page.getByLabel("Radius absen (meter)").fill("30");
    await lanjut(page).click();
    const dialog = page.getByRole("alertdialog", { name: "Yakin Anda sedang di outlet?" });
    await expect(dialog).toContainText("Kopi Senja Pontianak Kota");
    await expect(dialog).toContainText("-0.02633, 109.342503");
    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();
    await expect(langkahAktif(page)).toContainText("Lokasi outlet");
  });

  test("validasi langkah dan Kembali mempertahankan isian", async ({ page }) => {
    await page.goto("/setup");
    await page.getByLabel("Nama toko").fill("Ko");
    await lanjut(page).click();
    await expect(page.getByText("Nama toko minimal 3 karakter.")).toBeVisible();
    await page.getByLabel("Nama toko").fill("Kopi Senja");
    await lanjut(page).click();

    await page.getByLabel("Nama Owner").fill("Rina");
    await page.getByLabel("PIN", { exact: true }).fill("123456");
    await page.getByLabel("Ulangi PIN").fill("654321");
    await lanjut(page).click();
    await expect(page.getByText("PIN tidak sama.")).toBeVisible();

    await page.getByRole("button", { name: "Kembali" }).click();
    await expect(page.getByLabel("Nama toko")).toHaveValue("Kopi Senja");
  });

  test("kategori wajib minimal satu sebelum lanjut", async ({ page }) => {
    await page.goto("/setup");
    await isiTokoDanOwner(page);
    await isiLokasiOutlet(page);
    await lanjut(page).click();
    await expect(page.getByText("Tambahkan minimal satu kategori.")).toBeVisible();
    await expect(langkahAktif(page)).toContainText("Kategori");
  });
});