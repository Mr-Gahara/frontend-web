import { test, expect, type Page } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
  PASSWORD_AKUN_UJI,
  hapusAkunKlienUji,
  kredensialAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";
import { isiLoginAkun, isiLoginPengguna } from "../../helpers/masuk-uji";
import {
  PIN_OWNER,
  akunBaru,
  daftarLangkah,
  isiTokoDanOwner,
  langkahAktif,
  lanjut,
  tunggu,
} from "../../helpers/setup-uji";

/*
 * Wizard setup /setup tersambung ke backend (B219 sampai B223, keputusan
 * pemilik proyek 5 November 2026). Setiap skenario memakai akun klien baru
 * dari API admin (terverifikasi, tanpa OTP), mengisi setup lewat UI, lalu
 * akun dibersihkan lewat API admin. Lokasi perangkat dipatok lewat izin dan
 * koordinat Playwright.
 */
test.use({ geolocation: { latitude: -0.02633, longitude: 109.342503 }, permissions: ["geolocation"] });
test.describe.configure({ timeout: 120_000 });

async function isiLokasi(page: Page, jenis: "outlet" | "gudang", nama: string) {
  await page.getByLabel(jenis === "outlet" ? "Nama outlet" : "Nama gudang").fill(nama);
  await page.getByLabel("Alamat").fill("Jl. Gajah Mada No. 12, Pontianak");
  await page.getByRole("button", { name: "Ambil koordinat dari perangkat ini" }).click();
  await expect(page.getByLabel("Latitude")).toHaveValue("-0.02633");
  await page.getByLabel("Radius absen (meter)").fill("30");
  await page.getByRole("button", { name: /^Simpan dan (lanjut|selesaikan)$/ }).click();
  const tLokasi = tunggu(page, "POST", /\/api\/location$/);
  await page
    .getByRole("alertdialog", { name: `Yakin Anda sedang di ${jenis}?` })
    .getByRole("button", { name: `Ya, saya di ${jenis}` })
    .click();
  expect((await tLokasi).status(), `POST /location ${jenis}`).toBe(201);
}

async function tambahKategori(page: Page) {
  await page.getByLabel("Nama kategori").fill("Kopi");
  await page.getByLabel("Kode kategori").fill("KOP");
  const tKategori = tunggu(page, "POST", /\/api\/kategori$/);
  await page.getByRole("button", { name: "Tambah kategori" }).click();
  expect((await tKategori).status(), "POST /kategori").toBe(201);
  await expect(page.getByRole("region", { name: "Kategori ditambahkan" })).toContainText("Kopi");
}

/** Setup inti tanpa resep: outlet, kategori, satu produk berstok, dan pajak. */
async function isiIntiCepat(page: Page) {
  await isiTokoDanOwner(page);
  await isiLokasi(page, "outlet", "Outlet E2E");
  await tambahKategori(page);
  await lanjut(page).click();
  await page.getByRole("button", { name: "Tidak, lewati langkah ini" }).click();
  await lanjut(page).click();
  await isiProdukBerstok(page, "Air mineral");
  await lanjut(page).click();
  await isiPajak(page, "PB1");
}

async function isiProdukBerstok(page: Page, nama: string) {
  await page.getByLabel("Nama produk").fill(nama);
  await page.getByLabel("Kategori", { exact: true }).selectOption({ label: "Kopi" });
  await page.getByLabel("Harga dasar").fill("3000");
  await page.getByLabel("Harga jual").fill("5000");
  await page.getByLabel("Stok awal").fill("24");
  await page.getByLabel("Stok minimal").fill("6");
  const tProduk = tunggu(page, "POST", /\/api\/produk$/);
  await page.getByRole("button", { name: "Simpan produk" }).click();
  const res = await tProduk;
  expect(res.status(), "POST /produk").toBe(201);
  expect(res.request().postDataJSON()).toMatchObject({ isUnlimitedStok: false, stok: 24, stokMinimum: 6 });
}

async function isiPajak(page: Page, nama: string) {
  await page.getByLabel("Nama pajak").fill(nama);
  await page.getByLabel("Tarif (%)").fill("10");
  const tPajak = tunggu(page, "POST", /\/api\/pajak$/);
  await page.getByRole("button", { name: /^Simpan dan (lanjut|selesaikan)$/ }).click();
  expect((await tPajak).status(), "POST /pajak").toBe(201);
}

test.describe("Wizard setup", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("plan Basic: alur nyata sampai selesai, dilanjutkan setelah dimuat ulang tanpa PIN", async ({ page }) => {
    const { id } = await akunBaru(page, "basic");
    try {
      await expect(daftarLangkah(page).getByRole("listitem")).toHaveCount(7);
      await isiTokoDanOwner(page);

      await test.step("muat ulang setelah Owner: tetap di wizard, langkah lokasi, tanpa PIN", async () => {
        await page.reload();
        await expect(langkahAktif(page)).toContainText("Lokasi outlet", { timeout: 15_000 });
        expect(new URL(page.url()).pathname).toBe("/setup");
        await expect(daftarLangkah(page).getByRole("listitem").nth(1)).toContainText("(selesai)");
      });

      await isiLokasi(page, "outlet", "Kopi Senja Pontianak Kota");
      await tambahKategori(page);

      await test.step("muat ulang setelah kategori: lanjut di bahan baku, kategori tersimpan", async () => {
        await page.reload();
        await expect(langkahAktif(page)).toContainText("Bahan baku", { timeout: 15_000 });
        await page.getByRole("button", { name: "Kembali" }).click();
        await expect(page.getByRole("region", { name: "Kategori ditambahkan" })).toContainText("Kopi");
        await page.getByRole("button", { name: "Kembali" }).click();
        await expect(page.getByText("Kopi Senja Pontianak Kota")).toBeVisible();
        await expect(page.getByRole("link", { name: "Ubah di Profil Toko" })).toHaveAttribute(
          "href",
          "/dashboard/outlet/pengaturan/toko",
        );
        await page.getByRole("button", { name: "Lanjut", exact: true }).click();
        await lanjut(page).click();
      });

      await test.step("bahan baku dan produk beresep", async () => {
        await page.getByRole("button", { name: "Ya, ada yang pakai resep" }).click();
        await page.getByLabel("Nama bahan").fill("Biji kopi arabika");
        await page.getByLabel("Satuan", { exact: true }).selectOption("gram");
        await page.getByLabel("Stok awal").fill("2000");
        await page.getByLabel("Batas stok minimum").fill("200");
        const tBahan = tunggu(page, "POST", /\/api\/bahanbaku$/);
        await page.getByRole("button", { name: "Tambah bahan baku" }).click();
        expect((await tBahan).status(), "POST /bahanbaku").toBe(201);
        await lanjut(page).click();

        await page.getByLabel("Nama produk").fill("Es kopi susu aren");
        await page.getByLabel("Kategori", { exact: true }).selectOption({ label: "Kopi" });
        await page.getByLabel("Harga dasar").fill("9000");
        await page.getByLabel("Harga jual").fill("22000");
        await page.getByRole("button", { name: "Ya, dibuat dari bahan baku" }).click();
        await expect(page.getByLabel("Stok awal")).toHaveCount(0);
        await page.getByLabel("Bahan baku 1").selectOption({ label: "Biji kopi arabika (gram)" });
        await page.getByLabel("Jumlah 1").fill("18");
        const tProduk = tunggu(page, "POST", /\/api\/produk$/);
        await page.getByRole("button", { name: "Simpan produk" }).click();
        const res = await tProduk;
        expect(res.status(), "POST /produk beresep").toBe(201);
        expect(res.request().postDataJSON()).toMatchObject({ isUnlimitedStok: false, stok: 0 });
        await expect(page.getByRole("region", { name: "Produk ditambahkan" })).toContainText("pakai resep");
      });

      await test.step("produk berstok wajib stok di atas 0 (B238)", async () => {
        await page.getByLabel("Nama produk").fill("Air mineral");
        await page.getByLabel("Kategori", { exact: true }).selectOption({ label: "Kopi" });
        await page.getByLabel("Harga dasar").fill("3000");
        await page.getByLabel("Harga jual").fill("5000");
        await page.getByLabel("Stok awal").fill("0");
        await page.getByLabel("Stok minimal").fill("0");
        await page.getByRole("button", { name: "Simpan produk" }).click();
        await expect(page.getByText("Stok awal harus lebih dari 0.")).toBeVisible();
        await page.getByLabel("Nama produk").fill("");
        await isiProdukBerstok(page, "Air mineral");
        await lanjut(page).click();
      });

      await isiPajak(page, "PB1");
      await expect(page.getByRole("heading", { level: 1, name: "Toko siap dipakai" })).toBeVisible();
      await expect(page.getByText("1 kategori, 2 produk, 1 bahan baku")).toBeVisible();
      await expect(page.getByRole("link", { name: "Masuk ke dashboard" })).toHaveAttribute("href", "/dashboard");

      await test.step("setup tuntas tidak dibuka lagi: /setup dialihkan ke dashboard", async () => {
        await page.goto("/setup");
        await page.waitForURL("**/dashboard", { timeout: 15_000 });
      });
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("plan Pro: setup fitur boleh dilewati, lalu dilengkapi saat wizard dibuka lagi", async ({ page }) => {
    const { id } = await akunBaru(page, "pro", { plan: "pro", durasiBulan: 1 });
    try {
      const langkah = daftarLangkah(page).getByRole("listitem");
      await expect(langkah).toHaveCount(9);
      await expect(langkah.nth(7)).toContainText("Sesi booking");
      await expect(langkah.nth(8)).toContainText("Gudang");
      await isiIntiCepat(page);

      await test.step("lewati sesi booking dan gudang", async () => {
        await expect(langkahAktif(page)).toContainText("Sesi booking");
        await page.getByRole("button", { name: "Lewati, lengkapi nanti" }).click();
        await expect(langkahAktif(page)).toContainText("Gudang");
        await page.getByRole("button", { name: "Lewati, lengkapi nanti" }).click();
        await expect(page.getByRole("heading", { level: 1, name: "Toko siap dipakai" })).toBeVisible();
        await expect(page.getByText(/Setup sesi booking dan gudang dilewati/)).toBeVisible();
      });

      await test.step("wizard dibuka lagi mulai dari sesi booking; pajak dapat ditambah", async () => {
        await page.goto("/setup");
        await expect(langkahAktif(page)).toContainText("Sesi booking", { timeout: 15_000 });
        await page.getByRole("button", { name: "Kembali" }).click();
        const tersimpan = page.getByRole("region", { name: "Pajak tersimpan" });
        await expect(tersimpan).toContainText("PB1");
        await page.getByLabel("Nama pajak").fill("Pajak minuman");
        await page.getByLabel("Tarif (%)").fill("5");
        await page.getByRole("button", { name: "Produk tertentu" }).click();
        const tPajak = tunggu(page, "POST", /\/api\/pajak$/);
        await page.getByRole("button", { name: "Tambah pajak" }).click();
        expect((await tPajak).status(), "POST /pajak kedua").toBe(201);
        await expect(tersimpan.getByRole("listitem")).toHaveCount(2);
        await expect(page.getByLabel("Nama pajak")).toHaveValue("");
        await lanjut(page).click();
        await expect(langkahAktif(page)).toContainText("Sesi booking");
        await page.getByLabel("Nama tipe aset").fill("Meja biliar");
        await page.getByLabel("Nama aset").fill("Meja 1");
        await page.getByLabel("Nama tarif").fill("Reguler");
        await page.getByLabel("Harga").fill("30000");
        const tTarif = tunggu(page, "POST", /\/api\/tarif$/);
        await lanjut(page).click();
        const tarif = await tTarif;
        expect(tarif.status(), "POST /tarif").toBe(201);
        expect(tarif.request().postDataJSON()).toMatchObject({ namaTarif: "Reguler", harga: 30000, isActive: true });
        await page.getByRole("button", { name: "Kembali" }).click();
        await expect(page.getByRole("link", { name: "Ubah di halaman Tarif" })).toHaveAttribute(
          "href",
          "/dashboard/outlet/reservasi/tarif",
        );
        await page.getByRole("button", { name: "Lanjut", exact: true }).click();
      });

      await isiLokasi(page, "gudang", "Gudang E2E");
      await expect(page.getByRole("heading", { level: 1, name: "Toko siap dipakai" })).toBeVisible();
      await expect(page.getByText("Semua langkah setup plan Pro sudah selesai.", { exact: false })).toBeVisible();
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("Owner terdaftar tanpa sesi pengguna masuk lewat PIN, lalu kembali ke wizard", async ({ page, browser }) => {
    const { id, email } = await akunBaru(page, "pin");
    const lain = await browser.newContext();
    try {
      await isiTokoDanOwner(page);
      const halaman = await lain.newPage();
      await halaman.goto("/login");
      await isiLoginAkun(halaman, email, PASSWORD_AKUN_UJI);
      await halaman.waitForURL("**/login/pengguna?kembali=%2Fsetup", { timeout: 15_000 });
      await isiLoginPengguna(halaman, "Rina E2E", PIN_OWNER);
      await halaman.waitForURL("**/setup");
      await expect(langkahAktif(halaman)).toContainText("Lokasi outlet", { timeout: 15_000 });
    } finally {
      await lain.close();
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("koordinat dijaga dua peringatan; Batal di pop up tidak menyimpan", async ({ page }) => {
    const { id } = await akunBaru(page, "koordinat");
    try {
      await isiTokoDanOwner(page);
      await expect(page.getByRole("note").filter({ hasText: "Ambil koordinat saat Anda berada di outlet ini." })).toBeVisible();
      await page.getByLabel("Nama outlet").fill("Kopi Senja Pontianak Kota");
      await page.getByLabel("Alamat").fill("Jl. Gajah Mada No. 12");
      await page.getByRole("button", { name: "Ambil koordinat dari perangkat ini" }).click();
      await page.getByLabel("Radius absen (meter)").fill("30");
      let terkirim = 0;
      page.on("request", (r) => {
        if (r.method() === "POST" && /\/api\/location$/.test(r.url())) terkirim += 1;
      });
      await lanjut(page).click();
      const dialog = page.getByRole("alertdialog", { name: "Yakin Anda sedang di outlet?" });
      await expect(dialog).toContainText("Kopi Senja Pontianak Kota");
      await expect(dialog).toContainText("-0.02633, 109.342503");
      await dialog.getByRole("button", { name: "Batal" }).click();
      await expect(dialog).toBeHidden();
      await expect(langkahAktif(page)).toContainText("Lokasi outlet");
      expect(terkirim, "Batal tidak menyimpan lokasi").toBe(0);
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("validasi langkah, dan Kembali menampilkan nama toko yang tersimpan", async ({ page }) => {
    const { id } = await akunBaru(page, "validasi");
    try {
      let terkirim = 0;
      page.on("request", (r) => {
        if (r.method() === "POST" && /\/api\/tenant$/.test(r.url())) terkirim += 1;
      });
      await page.getByLabel("Nama toko").fill("Ko");
      await lanjut(page).click();
      await expect(page.getByText("Nama toko minimal 3 karakter.")).toBeVisible();
      expect(terkirim).toBe(0);
      await page.getByLabel("Nama toko").fill("Kopi Senja E2E");
      await lanjut(page).click();

      await page.getByLabel("Nama Owner").fill("Rina E2E");
      await page.getByLabel("PIN", { exact: true }).fill(PIN_OWNER);
      await page.getByLabel("Ulangi PIN").fill("654321");
      await lanjut(page).click();
      await expect(page.getByText("PIN tidak sama.")).toBeVisible();

      await page.getByRole("button", { name: "Kembali" }).click();
      await expect(page.getByText("Langkah ini sudah tersimpan.")).toBeVisible();
      await expect(page.getByText("Kopi Senja E2E").first()).toBeVisible();
      expect(terkirim, "nama toko hanya dikirim sekali").toBe(1);
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("plan Advanced: delapan langkah tanpa gudang, dan kategori wajib minimal satu", async ({ page }) => {
    const { id } = await akunBaru(page, "advanced", { plan: "advanced", durasiBulan: 1 });
    try {
      const langkah = daftarLangkah(page).getByRole("listitem");
      await expect(langkah).toHaveCount(8);
      await expect(langkah.last()).toContainText("Sesi booking");
      await expect(daftarLangkah(page).getByText("Gudang")).toHaveCount(0);
      await isiTokoDanOwner(page);
      await isiLokasi(page, "outlet", "Outlet E2E");
      await lanjut(page).click();
      await expect(page.getByText("Tambahkan minimal satu kategori.")).toBeVisible();
      await expect(langkahAktif(page)).toContainText("Kategori");
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });
});
