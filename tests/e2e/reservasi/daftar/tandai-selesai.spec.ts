import { expect, test } from "@playwright/test";
import { normalizeId } from "@/lib/api/normalize";
import { api, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import { masukTanpaBacaSebagian } from "../../../helpers/terkunci-uji";
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

      // Booking dibaca dari sesiBooking[] detail penjualan (B347), tanpa GET /sesibooking/:id per item.
      const bacaPerBooking: string[] = [];
      page.on("request", (r) => {
        if (r.method() === "GET" && POLA_BOOKING_ID.test(r.url())) bacaPerBooking.push(r.url());
      });
      auth = await bukaDenganAuth(page, "/dashboard/outlet/penjualan/" + penjualanId);
      const bagian = page.getByRole("region", { name: "Sesi booking" });
      await expect(bagian).toContainText(NAMA_ASET_BOOKING, { timeout: 15_000 });
      await expect(bagian).toContainText("Aktif");
      // Opsi B (20 November 2026): sesudah Informasi Transaksi, sebelum Rincian Item.
      const atas = async (l: import("@playwright/test").Locator) => (await l.boundingBox())!.y;
      const yInfo = await atas(page.getByRole("heading", { name: "Informasi Transaksi" }));
      const yBooking = await atas(bagian);
      const yItem = await atas(page.getByRole("region", { name: "Rincian Item" }));
      expect(yBooking, "Sesi Booking di bawah Informasi Transaksi").toBeGreaterThan(yInfo);
      expect(yBooking, "Sesi Booking di atas Rincian Item").toBeLessThan(yItem);

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
      expect(bacaPerBooking, "tidak ada GET /sesibooking/:id dari detail penjualan").toEqual([]);
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("Sesi Booking tampil bagi pemegang read-penjualan tanpa read-booking (B347)", async ({ page }) => {
    let auth = await bukaDenganAuth(page, "/dashboard/outlet/reservasi");
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);

    const mulai = new Date(Date.now() + 5 * 60 * 60 * 1000);
    mulai.setSeconds(0, 0);
    const selesai = new Date(mulai.getTime() + 60 * 60 * 1000);
    const booking = await buatBooking(page, auth, fx, mulai, selesai);
    const penjualanId = booking.dataPenjualan?.id;

    try {
      await masukTanpaBacaSebagian(page);
      const bacaPerBooking: string[] = [];
      page.on("request", (r) => {
        if (r.method() === "GET" && /\/api\/sesibooking\//i.test(r.url())) bacaPerBooking.push(r.url());
      });
      await page.goto("/dashboard/outlet/penjualan/" + penjualanId);
      const bagian = page.getByRole("region", { name: "Sesi booking" });
      await expect(bagian).toContainText(NAMA_ASET_BOOKING, { timeout: 15_000 });
      await expect(bagian).toContainText("Aktif");
      // Peran baca saja: tanpa update-booking, sehingga tanpa Tandai Selesai.
      await expect(bagian.getByRole("button", { name: "Tandai Selesai" })).toHaveCount(0);
      expect(bacaPerBooking, "tanpa read-booking tidak ada permintaan sesibooking").toEqual([]);
    } finally {
      await login(page);
      auth = await bukaDenganAuth(page, "/dashboard/outlet/reservasi");
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("Tandai Selesai tidak tampil untuk booking yang belum dibayar, maupun yang jamnya sudah lewat", async ({ page }) => {
    const auth = await bukaDenganAuth(page, "/dashboard/outlet/reservasi");
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const jam = 60 * 60 * 1000;
    const nanti = new Date(Date.now() + 7 * jam);
    nanti.setSeconds(0, 0);
    const lalu = new Date(Date.now() - 3 * jam);
    lalu.setSeconds(0, 0);
    const penjualan: (string | undefined)[] = [];
    try {
      const belumBayar = await buatBooking(page, auth, fx, nanti, new Date(nanti.getTime() + jam));
      penjualan.push(belumBayar.dataPenjualan?.id);
      await page.goto("/dashboard/outlet/penjualan/" + belumBayar.dataPenjualan?.id);
      let bagian = page.getByRole("region", { name: "Sesi booking" });
      await expect(bagian).toContainText(NAMA_ASET_BOOKING, { timeout: 15_000 });
      await expect(bagian).toContainText("Aktif");
      await expect(bagian.getByRole("button", { name: "Tandai Selesai" }), "belum dibayar").toHaveCount(0);

      // Jam selesai sudah lewat: backend membacanya Selesai (statusEfektif), meski dibayar.
      const lewat = await api<unknown>(page, auth, "POST", "/sesibooking", {
        dataPelanggan: fx.pelangganId,
        items: [{ dataAset: fx.asetId, waktuMulai: lalu.toISOString(), waktuSelesai: new Date(lalu.getTime() + jam).toISOString() }],
      });
      expect(lewat.status, "buat booking lampau: " + lewat.pesan).toBeLessThan(300);
      const daftar = await api<{ id: string; waktuMulai: string; dataAset?: { id: string }; dataPenjualan?: { id: string } }[]>(
        page, auth, "GET", "/sesibooking",
      );
      type Ringkas = { id: string; waktuMulai: string; dataAset?: { id: string }; dataPenjualan?: { id: string } };
      const lampau = (normalizeId(daftar.data ?? []) as unknown as Ringkas[]).find(
        (b) => b.dataAset?.id === fx.asetId && new Date(b.waktuMulai).getTime() === lalu.getTime(),
      );
      expect(lampau, "booking lampau terbaca").toBeTruthy();
      penjualan.push(lampau!.dataPenjualan?.id);
      const metode = await api<{ id: string }[]>(page, auth, "GET", "/metodepembayaran");
      const bayar = await api(page, auth, "POST", "/pembayaran", {
        penjualanID: lampau!.dataPenjualan?.id,
        metodePembayaranID: metode.data?.[0]?.id,
        jumlahBayar: 1,
        tanggalBayar: new Date().toISOString(),
      });
      expect(bayar.status, "bayar booking lampau: " + bayar.pesan).toBeLessThan(300);
      await page.goto("/dashboard/outlet/penjualan/" + lampau!.dataPenjualan?.id);
      bagian = page.getByRole("region", { name: "Sesi booking" });
      await expect(bagian).toContainText(NAMA_ASET_BOOKING, { timeout: 15_000 });
      await expect(bagian.getByRole("button", { name: "Tandai Selesai" }), "jam sudah lewat").toHaveCount(0);
      // Bukti temuan backend: sesiBooking[] detail penjualan (B347) membawa
      // status mentah, tanpa statusEfektif seperti GET /sesibooking.
      await expect(bagian, "booking lewat jam terbaca Selesai").toContainText("Selesai");
    } finally {
      for (const id of penjualan) await batalkanBooking(page, auth, id);
    }
  });
});
