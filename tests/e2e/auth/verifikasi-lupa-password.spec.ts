import { test, expect, type Locator, type Page } from "@playwright/test";

/*
 * Verifikasi email (/daftar/verifikasi) dan lupa password (/lupa-password),
 * desain F. Pratinjau tampilan tanpa backend (N3, N4): spec ini memastikan
 * kotak kode, validasi, dan perpindahan tahap, serta tidak ada permintaan
 * ubah data ke backend.
 */
async function tempelKode(kotak: Locator, kode: string) {
  await kotak.evaluate((el, teks) => {
    const data = new DataTransfer();
    data.setData("text", teks);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  }, kode);
}

function catatUbahData(page: Page) {
  const ubah: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/") && r.method() !== "GET" && !/refreshtoken|pin-refresh/.test(r.url())) {
      ubah.push(r.method() + " " + r.url());
    }
  });
  return ubah;
}

test.describe("Verifikasi email", () => {
  test("email, stepper langkah 2, dan kirim ulang yang menunggu hitung mundur", async ({ page }) => {
    await page.goto("/daftar/verifikasi?email=pemilik@kopisenja.id");
    await expect(page.getByRole("heading", { level: 1, name: "Cek email Anda" })).toBeVisible();
    await expect(page.getByText("pemilik@kopisenja.id")).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Langkah pendaftaran" }).locator('[aria-current="step"]'),
    ).toContainText("Verifikasi email");
    await expect(page.getByRole("button", { name: /Kirim ulang dalam (1:00|0:5\d)/ })).toBeDisabled();
  });

  test("kotak kode: maju otomatis, Backspace mundur, dan tempel mengisi semua", async ({ page }) => {
    await page.goto("/daftar/verifikasi");
    await page.getByLabel("Digit 1 dari 6").pressSequentially("4");
    await expect(page.getByLabel("Digit 2 dari 6")).toBeFocused();
    await page.keyboard.press("Backspace");
    await expect(page.getByLabel("Digit 1 dari 6")).toBeFocused();
    await expect(page.getByLabel("Digit 1 dari 6")).toHaveValue("");

    await tempelKode(page.getByLabel("Digit 1 dari 6"), "60-42 18");
    for (const [i, d] of ["6", "0", "4", "2", "1", "8"].entries()) {
      await expect(page.getByLabel(`Digit ${i + 1} dari 6`)).toHaveValue(d);
    }
  });

  test("kode belum lengkap ditolak; kode lengkap menuju setup tanpa ubah data", async ({ page }) => {
    const ubah = catatUbahData(page);
    await page.goto("/daftar/verifikasi");
    await page.getByRole("button", { name: "Verifikasi email" }).click();
    await expect(page.getByText("Masukkan 6 digit kode verifikasi.")).toBeVisible();
    await tempelKode(page.getByLabel("Digit 1 dari 6"), "604218");
    await page.getByRole("button", { name: "Verifikasi email" }).click();
    await page.waitForURL("**/setup");
    expect(ubah).toEqual([]);
  });
});

test.describe("Lupa password", () => {
  test("email, kode dan password baru, lalu selesai tanpa ubah data", async ({ page }) => {
    const ubah = catatUbahData(page);
    await page.goto("/lupa-password");
    await expect(page.getByRole("heading", { level: 1, name: "Atur ulang password akun toko." })).toBeVisible();

    await page.getByRole("button", { name: "Kirim kode" }).click();
    await expect(page.getByText("Email wajib diisi")).toBeVisible();
    await page.getByLabel("Email").fill("pemilik@kopisenja.id");
    await page.getByRole("button", { name: "Kirim kode" }).click();

    await expect(page.getByRole("heading", { name: "Buat password baru" })).toBeVisible();
    await expect(page.getByText("pemilik@kopisenja.id")).toBeVisible();
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText("Masukkan 6 digit kode verifikasi.")).toBeVisible();
    await expect(page.getByText("Password wajib diisi", { exact: true })).toBeVisible();

    await tempelKode(page.getByLabel("Digit 1 dari 6"), "604218");
    await page.getByLabel("Password baru", { exact: true }).fill("abcdefgh");
    await page.getByLabel("Ulangi password baru").fill("abcdefgh");
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText("Password harus mengandung minimal 1 huruf kapital")).toBeVisible();

    await page.getByLabel("Password baru", { exact: true }).fill("Senja2026");
    await page.getByLabel("Ulangi password baru").fill("Senja2027");
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText("Password tidak sama")).toBeVisible();

    await page.getByLabel("Ulangi password baru").fill("Senja2026");
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByRole("heading", { name: "Password diganti" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/login");
    expect(ubah).toEqual([]);
  });

  test("Ganti email kembali ke tahap email dengan isian sebelumnya", async ({ page }) => {
    await page.goto("/lupa-password");
    await page.getByLabel("Email").fill("pemilik@kopisenja.id");
    await page.getByRole("button", { name: "Kirim kode" }).click();
    await page.getByRole("button", { name: "Ganti email" }).click();
    await expect(page.getByLabel("Email")).toHaveValue("pemilik@kopisenja.id");
  });
});