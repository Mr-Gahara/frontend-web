import { expect, test } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Bug visual buat penjualan (pemilik proyek, 12 November 2026): di lebar lg ke
 * atas kolom kanan yang sticky (Pelanggan, Diskon Global, Ringkasan) dibatasi
 * seluruh form, sehingga saat digulir ke bawah kartu Ringkasan menutupi baris
 * aksi dan tombol Buat Penjualan. Kini kedua kolom dibungkus grid sendiri, dan
 * kolom kanan berhenti di atas baris aksi.
 */

const URL_BUAT = "/dashboard/outlet/penjualan/buatPenjualan";

for (const lebar of [1024, 1280]) {
  test(`buat penjualan ${lebar} px: digulir ke bawah, kolom kanan tidak menutupi baris aksi`, async ({ page }) => {
    await page.setViewportSize({ width: lebar, height: 800 });
    await login(page);
    await page.goto(URL_BUAT);
    const tambah = page.getByRole("button", { name: "Tambah Item" });
    await expect(tambah).toBeVisible({ timeout: 20_000 });
    // Kolom kiri dibuat lebih panjang dari layar agar kolom kanan menempel.
    await tambah.click();
    await tambah.click();

    const simpan = page.getByRole("button", { name: "Buat Penjualan", exact: true });
    const batal = page.getByRole("button", { name: "Batal", exact: true });
    const ringkasan = page.getByText("Ringkasan", { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded')][1]");

    // Gulir area isi dashboard sampai bawah (yang menggulir pembungkus, bukan window).
    await simpan.evaluate((el) => {
      let p = el.parentElement;
      while (p && !(p.scrollHeight > p.clientHeight + 10 && /auto|scroll/.test(getComputedStyle(p).overflowY))) {
        p = p.parentElement;
      }
      if (p) p.scrollTop = p.scrollHeight;
    });

    const kSimpan = (await simpan.boundingBox())!;
    const kRingkasan = (await ringkasan.boundingBox())!;
    expect(kRingkasan.y + kRingkasan.height, "Ringkasan berakhir di atas baris aksi").toBeLessThanOrEqual(kSimpan.y);

    // Titik tengah kedua tombol mengenai tombol itu sendiri, bukan kartu di atasnya.
    for (const [nama, tombol] of [
      ["Buat Penjualan", simpan],
      ["Batal", batal],
    ] as const) {
      const tertutup = await tombol.evaluate((el) => {
        const k = el.getBoundingClientRect();
        const atas = document.elementFromPoint(k.x + k.width / 2, k.y + k.height / 2);
        return !(atas && el.contains(atas));
      });
      expect(tertutup, `${nama} tidak tertutup elemen lain`).toBe(false);
    }
  });
}
