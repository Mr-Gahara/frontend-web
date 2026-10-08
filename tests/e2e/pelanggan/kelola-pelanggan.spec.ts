import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { hapusLewatApi, unik } from "../../helpers/reservasi-uji";

/*
 * Spec migrasi halaman pelanggan (keputusan PD1a dan PD5a): perilaku yang
 * berubah atau baru dibanding spec pembanding (pelanggan.spec.ts). Kartu
 * statistik, dialog yang bertahan saat buat dan hapus gagal, ubah yang
 * hanya mengirim field berubah, pengosongan isian, validasi email, dan
 * daftar yang gagal dimuat. Pelanggan uji dibuat lewat UI dengan nama unik;
 * API hanya membaca bukti dan menghapus sisa di finally.
 */

const URL_PELANGGAN = BASIS + "/dashboard/outlet/pelanggan";
const POLA_DAFTAR = /\/api\/pelanggan$/i;
const POLA_SATU = /\/api\/pelanggan\/[0-9a-f]{24}$/i;

type PelangganMentah = {
  id: string;
  namaPelanggan: string;
  tipePelanggan: string;
  nomorHp: string | null;
  email: string | null;
  alamat: string | null;
};

const baris = (page: Page, nama: string) => page.locator("tbody tr").filter({ hasText: nama });
const pencarian = (page: Page) => page.getByPlaceholder("Cari nama pelanggan...");
const dialogKonfirmasi = (page: Page) => page.getByRole("alertdialog");

const tunggu = (page: Page, method: string, pola: RegExp) =>
  page.waitForResponse((r) => r.request().method() === method && pola.test(r.url()));

async function daftarPelanggan(page: Page, auth: Auth): Promise<PelangganMentah[]> {
  const r = await api<PelangganMentah[]>(page, auth, "GET", "/pelanggan");
  expect(r.status, r.pesan).toBe(200);
  return r.data;
}

async function bukaPelanggan(page: Page): Promise<Auth> {
  const auth = await bukaDenganAuth(page, URL_PELANGGAN);
  await expect(page.getByRole("heading", { name: "Manajemen Pelanggan" })).toBeVisible({
    timeout: 15_000,
  });
  return auth;
}

type DataUji = { nama: string; nomorHp: string; alamat: string };

const dataUji = (): DataUji => {
  const akhiran = unik();
  return {
    nama: "E2E Kelola " + akhiran,
    nomorHp: "08" + String(Date.now()).slice(-10),
    alamat: "Jl. E2E Kelola " + akhiran,
  };
};

/** Membuat pelanggan uji lewat panel tambah, lalu mengembalikan id-nya dari API. */
async function buatLewatUi(page: Page, auth: Auth, data: DataUji): Promise<string> {
  await page.getByLabel(/^Nama Pelanggan/).fill(data.nama);
  await page.getByLabel(/^Nomor WhatsApp/).fill(data.nomorHp);
  await page.getByLabel(/^Alamat/).fill(data.alamat);
  await page.getByRole("button", { name: "Simpan Pelanggan" }).click();
  const tPost = tunggu(page, "POST", POLA_DAFTAR);
  await dialogKonfirmasi(page).getByRole("button", { name: "Ya, Simpan" }).click();
  expect((await tPost).status(), "POST /pelanggan").toBe(201);
  await expect(dialogKonfirmasi(page)).toBeHidden({ timeout: 15_000 });
  const tersimpan = (await daftarPelanggan(page, auth)).find((p) => p.namaPelanggan === data.nama);
  expect(tersimpan, "pelanggan uji terbaca lewat API").toBeTruthy();
  await pencarian(page).fill(data.nama);
  await expect(baris(page, data.nama)).toHaveCount(1, { timeout: 15_000 });
  return (tersimpan as PelangganMentah).id;
}

async function bukaDialogUbah(page: Page, nama: string) {
  await baris(page, nama).getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Edit Pelanggan")).toBeVisible();
  return dialog;
}

test.describe("Kelola pelanggan", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("kartu statistik sesuai data tersimpan", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const daftar = await daftarPelanggan(page, auth);
    const kartu = (judul: string) =>
      page.getByText(judul, { exact: true }).locator("..").locator("h3");
    await expect(kartu("Total Pelanggan")).toHaveText(String(daftar.length), { timeout: 15_000 });
    await expect(kartu("Pelanggan Member")).toHaveText(
      String(daftar.filter((p) => p.tipePelanggan === "member").length),
    );
    await expect(kartu("Klien Korporat")).toHaveText(
      String(daftar.filter((p) => p.tipePelanggan === "korporat").length),
    );
  });

  test("buat yang gagal: dialog konfirmasi bertahan, dan isian opsional kosong tidak dikirim", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const sebelum = (await daftarPelanggan(page, auth)).length;
    const nama = "E2E Gagal " + unik();
    await page.route(POLA_DAFTAR, async (route) => {
      if (route.request().method() === "POST") await route.fulfill(JAWAB_GAGAL);
      else await route.continue();
    });
    await page.getByLabel(/^Nama Pelanggan/).fill(nama);
    await expect(page.getByRole("combobox", { name: "Tipe Pelanggan" })).toContainText("Umum");
    await page.getByRole("button", { name: "Simpan Pelanggan" }).click();
    const tPost = tunggu(page, "POST", POLA_DAFTAR);
    await dialogKonfirmasi(page).getByRole("button", { name: "Ya, Simpan" }).click();
    const res = await tPost;
    expect(res.request().postDataJSON()).toEqual({ namaPelanggan: nama, tipePelanggan: "umum" });
    await expect(dialogKonfirmasi(page).getByText("Simpan Pelanggan Baru?")).toBeVisible();
    await expect(dialogKonfirmasi(page).getByRole("button", { name: "Ya, Simpan" })).toBeEnabled({
      timeout: 15_000,
    });
    await page.unroute(POLA_DAFTAR);
    await dialogKonfirmasi(page).getByRole("button", { name: "Batal" }).click();
    await expect(dialogKonfirmasi(page)).toBeHidden();
    await expect(page.getByLabel(/^Nama Pelanggan/)).toHaveValue(nama);
    expect((await daftarPelanggan(page, auth)).length).toBe(sebelum);
  });

  test("email yang salah bentuk tidak dikirim dan pesannya tampil", async ({ page }) => {
    await bukaPelanggan(page);
    let jumlahPost = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (r.method() === "POST" && POLA_DAFTAR.test(r.url())) jumlahPost++;
    };
    page.on("request", hitung);
    await page.getByLabel(/^Nama Pelanggan/).fill("E2E Email " + unik());
    await page.getByLabel(/^Email/).fill("bukan-email");
    await page.getByRole("button", { name: "Simpan Pelanggan" }).click();
    await expect(page.getByText("Format email tidak valid.")).toBeVisible();
    await expect(dialogKonfirmasi(page)).toHaveCount(0);
    page.off("request", hitung);
    expect(jumlahPost).toBe(0);
  });

  test("hapus yang gagal: dialog bertahan, lalu hapus berhasil menutupnya", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const data = dataUji();
    let id: string | undefined;
    try {
      id = await buatLewatUi(page, auth, data);
      await page.route(POLA_SATU, async (route) => {
        if (route.request().method() === "DELETE") await route.fulfill(JAWAB_GAGAL);
        else await route.continue();
      });
      await baris(page, data.nama).getByRole("button", { name: "Buka menu" }).click();
      await page.getByRole("menuitem", { name: "Hapus" }).click();
      const dialog = dialogKonfirmasi(page);
      const tGagal = tunggu(page, "DELETE", POLA_SATU);
      await dialog.getByRole("button", { name: "Hapus", exact: true }).click();
      expect((await tGagal).status()).toBeGreaterThanOrEqual(400);
      await expect(dialog.getByText(`Hapus pelanggan ${data.nama}?`)).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Hapus", exact: true })).toBeEnabled({
        timeout: 15_000,
      });
      expect((await daftarPelanggan(page, auth)).some((p) => p.id === id)).toBe(true);

      await page.unroute(POLA_SATU);
      const tHapus = tunggu(page, "DELETE", POLA_SATU);
      await dialog.getByRole("button", { name: "Hapus", exact: true }).click();
      expect((await tHapus).status(), "DELETE /pelanggan/:id").toBe(200);
      await expect(dialog).toBeHidden({ timeout: 15_000 });
      await expect(baris(page, data.nama)).toHaveCount(0, { timeout: 15_000 });
      id = undefined;
    } finally {
      await hapusLewatApi(page, auth, "/pelanggan", id);
    }
  });

  test("ubah: tanpa perubahan tidak mengirim, perubahan hanya mengirim field yang berubah, dan pengosongan ditampilkan sesuai hasil server", async ({ page }) => {
    const auth = await bukaPelanggan(page);
    const data = dataUji();
    let id: string | undefined;
    try {
      id = await buatLewatUi(page, auth, data);

      await test.step("tanpa perubahan", async () => {
        const dialog = await bukaDialogUbah(page, data.nama);
        let jumlahPut = 0;
        const hitung = (r: { method(): string; url(): string }) => {
          if (r.method() === "PUT" && POLA_SATU.test(r.url())) jumlahPut++;
        };
        page.on("request", hitung);
        await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
        await expect(page.getByText("Tidak ada perubahan untuk disimpan")).toBeVisible();
        page.off("request", hitung);
        expect(jumlahPut).toBe(0);
        await dialog.getByRole("button", { name: "Batal" }).click();
        await expect(dialog).toBeHidden();
      });

      await test.step("hanya field yang berubah", async () => {
        const alamatBaru = data.alamat + " Ubah";
        const dialog = await bukaDialogUbah(page, data.nama);
        await dialog.getByLabel(/^Alamat/).fill(alamatBaru);
        const tPut = tunggu(page, "PUT", POLA_SATU);
        await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
        const res = await tPut;
        expect(res.status(), "PUT /pelanggan/:id").toBe(200);
        expect(res.request().postDataJSON()).toEqual({ alamat: alamatBaru });
        await expect(dialog).toBeHidden({ timeout: 15_000 });
        const tersimpan = (await daftarPelanggan(page, auth)).find((p) => p.id === id);
        expect(tersimpan).toMatchObject({ alamat: alamatBaru, nomorHp: data.nomorHp });
      });

      await test.step("pengosongan nomor HP", async () => {
        const dialog = await bukaDialogUbah(page, data.nama);
        await dialog.getByLabel(/^Nomor WhatsApp/).fill("");
        const tPut = tunggu(page, "PUT", POLA_SATU);
        await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
        const res = await tPut;
        expect(res.status(), "PUT /pelanggan/:id").toBe(200);
        expect(res.request().postDataJSON()).toEqual({ nomorHp: "" });
        const hasil = (await res.json()).data as PelangganMentah;
        expect(hasil.nomorHp ?? "", "nomor HP di respons PUT").toBe("");
        await expect(page.getByText("Data pelanggan berhasil diperbarui.")).toBeVisible();
        await expect(dialog).toBeHidden({ timeout: 15_000 });
      });
    } finally {
      await hapusLewatApi(page, auth, "/pelanggan", id);
    }
  });

  test("nomor HP yang dikosongkan tersimpan kosong", async ({ page }) => {
    // Terbukti sejak backend nizar 8dc6211: kontak yang dikirim kosong
    // dihapus dari dokumen (kontrak/temuan.md butir 104).
    const auth = await bukaPelanggan(page);
    const data = dataUji();
    let id: string | undefined;
    try {
      id = await buatLewatUi(page, auth, data);
      const dialog = await bukaDialogUbah(page, data.nama);
      await dialog.getByLabel(/^Nomor WhatsApp/).fill("");
      const tPut = tunggu(page, "PUT", POLA_SATU);
      await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
      expect((await tPut).status(), "PUT /pelanggan/:id").toBe(200);
      await expect(page.getByText("Data pelanggan berhasil diperbarui.")).toBeVisible();
      const tersimpan = (await daftarPelanggan(page, auth)).find((p) => p.id === id);
      expect(tersimpan?.nomorHp ?? "").toBe("");
      await expect(baris(page, data.nama)).not.toContainText(data.nomorHp);
    } finally {
      await hapusLewatApi(page, auth, "/pelanggan", id);
    }
  });

  test("daftar yang gagal dimuat menampilkan pesan, dan coba lagi memuatnya", async ({ page }) => {
    await page.route(POLA_DAFTAR, async (route) => {
      if (route.request().method() === "GET") await route.fulfill(JAWAB_GAGAL);
      else await route.continue();
    });
    await bukaPelanggan(page);
    await expect(page.getByText(/Gagal memuat data pelanggan/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Belum ada data pelanggan.")).toHaveCount(0);
    await page.unroute(POLA_DAFTAR);
    const tGet = tunggu(page, "GET", POLA_DAFTAR);
    await page.getByRole("button", { name: "Coba Lagi" }).click();
    expect((await tGet).status(), "GET /pelanggan").toBe(200);
    await expect(pencarian(page)).toBeVisible({ timeout: 15_000 });
  });
});