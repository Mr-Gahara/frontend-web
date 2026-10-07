import { expect, test } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import {
  NAMA_ASET_BOOKING,
  batalkanBooking,
  bersihkanSisaBooking,
  buatBooking,
  siapkanFixtureBooking,
  statusBooking,
} from "../../../helpers/reservasi-uji";

/*
 * Tandai Selesai dari detail penjualan booking (keputusan NZ7a), tanpa respons
 * palsu. Booking uji dan pembayaran Rp1-nya disiapkan lewat API karena milik
 * alur buat reservasi dan pembayaran (keputusan rancangan butir 23); yang
 * diuji lewat UI adalah Tandai Selesai. Di finally pembayarannya dibatalkan
 * dan penjualannya di-void, sehingga booking berakhir VOID.
 */

const POLA_BOOKING_ID = /\/api\/sesibooking\/[a-f0-9]{24}$/i;

test.describe("tandai selesai booking", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("booking yang sudah dibayar ditandai selesai dari detail penjualan (NZ7a)", async ({ page }) => {
    let auth = await bukaDenganAuth(page, "/dashboard/outlet/reservasi");
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);

    const mulai = new Date(Date.now() + 3 * 60 * 60 * 1000);
    mulai.setSeconds(0, 0);
    const selesai = new Date(mulai.getTime() + 60 * 60 * 1000);
    const booking = await buatBooking(page, auth, fx, mulai, selesai);
    const penjualanId = booking.dataPenjualan?.id;

    try {
      const metode = await api<{ id: string }[]>(page, auth, "GET", "/metodepembayaran");
      expect(metode.status, "baca metode pembayaran: " + metode.pesan).toBe(200);
      const bayar = await api(page, auth, "POST", "/pembayaran", {
        penjualanID: penjualanId,
        metodePembayaranID: metode.data?.[0]?.id,
        jumlahBayar: 1,
        tanggalBayar: new Date().toISOString(),
      });
      expect(bayar.status, "bayar booking uji: " + bayar.pesan).toBeLessThan(300);

      auth = await bukaDenganAuth(page, "/dashboard/outlet/penjualan/" + penjualanId);
      const bagian = page.getByRole("region", { name: "Sesi booking" });
      await expect(bagian).toContainText(NAMA_ASET_BOOKING, { timeout: 15_000 });
      await expect(bagian).toContainText("Aktif");

      await bagian.getByRole("button", { name: "Tandai Selesai" }).click();
      const dialog = page.getByRole("alertdialog");
      const tPut = page.waitForResponse(
        (r) => r.request().method() === "PUT" && POLA_BOOKING_ID.test(r.url()),
      );
      await dialog.getByRole("button", { name: "Tandai Selesai" }).click();
      const respons = await tPut;
      expect(respons.status()).toBe(200);
      expect(respons.url()).toContain(booking.id);
      expect(respons.request().postDataJSON()).toEqual({ status: "Selesai" });

      await expect(dialog).toBeHidden();
      await expect(bagian).toContainText("Selesai");
      await expect(bagian.getByRole("button", { name: "Tandai Selesai" })).toHaveCount(0);
      expect(await statusBooking(page, auth, booking.id)).toBe("Selesai");
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });
});