import { expect, test, type Page } from "@playwright/test";
import { format } from "date-fns";
import { normalizeId } from "@/lib/api/normalize";
import { JAWAB_GAGAL, api, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import {
  NAMA_ASET_BOOKING,
  NAMA_PELANGGAN_BOOKING,
  batalkanBooking,
  bersihkanSisaBooking,
  buatBooking,
  cocok,
  siapkanFixtureBooking,
  statusBooking,
  tahanLaluTeruskan,
  tanggalLokal,
  type AsetMentah,
  type SesiBookingMentah,
} from "../../../helpers/reservasi-uji";

/*
 * Spec pembanding daftar reservasi (timeline aset), ditulis dan dijalankan
 * terhadap kode lama sebelum migrasi (keputusan R1a). Booking dibuat lewat
 * API dengan fixture tetap dan dibatalkan lewat penjualannya di finally
 * (keputusan R2b dan R2c). Respons sukses tidak dipalsukan (keputusan
 * rancangan butir 21).
 */

const URL_DAFTAR = "/dashboard/outlet/reservasi";
const POLA_ASET = /\/api\/aset(\?|$)/i;
const POLA_SESI = /\/api\/sesibooking\?tanggal=/i;
const LABEL_STATUS: Record<string, string> = {
  tersedia: "Tersedia",
  digunakan: "Digunakan",
  perbaikan: "Perbaikan",
};

// Baris dikenali dari elemen nama yang teksnya persis nama aset uji, karena
// nama aset lain dapat diawali nama itu ("E2E Reservasi Aset Perbaikan").
const barisAsetUji = (page: Page) =>
  page.locator("div.group").filter({ has: page.getByText(NAMA_ASET_BOOKING, { exact: true }) });

const blokBooking = (page: Page, mulai: Date, selesai: Date) =>
  barisAsetUji(page)
    .locator("div.absolute")
    .filter({ hasText: `${format(mulai, "HH:mm")} – ${format(selesai, "HH:mm")}` });

/** Rentang booking yang mencakup waktu sekarang dan dimulai pada tanggal hari ini. */
function rentangSekarang(menit: number) {
  const sekarang = new Date();
  const mulai = new Date(sekarang.getTime() - 60_000);
  if (tanggalLokal(mulai) !== tanggalLokal(sekarang)) mulai.setTime(sekarang.getTime());
  mulai.setMilliseconds(0);
  return { mulai, selesai: new Date(mulai.getTime() + menit * 60_000) };
}

/** Membuka halaman dan membaca respons aset serta daftar booking yang dipakainya. */
async function buka(page: Page) {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const [resAset, resSesi] = await Promise.all([
    page.waitForResponse(cocok("GET", POLA_ASET)),
    page.waitForResponse(cocok("GET", POLA_SESI)),
  ]);
  const aset = normalizeId((await resAset.json()).data ?? []) as unknown as AsetMentah[];
  const sesi = normalizeId((await resSesi.json()).data ?? []) as unknown as SesiBookingMentah[];
  return { aset, sesi };
}

test.describe("E2E — Reservasi › Daftar (timeline aset)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("menampilkan tanggal hari ini dan setiap aset dari backend, dengan status aset uji", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixtureBooking(page, auth);
    const { aset } = await buka(page);
    await expect(page.getByText(/^Hari ini, /)).toBeVisible();
    expect(aset.length, "respons GET /aset tidak kosong").toBeGreaterThan(0);
    for (const a of aset) {
      await expect(page.getByText(a.namaAset, { exact: true }).first()).toBeVisible();
    }
    const uji = aset.find((a) => a.namaAset === NAMA_ASET_BOOKING);
    expect(uji, "aset uji ada di respons").toBeTruthy();
    const label = LABEL_STATUS[String(uji!.status).toLowerCase()] ?? "Tersedia";
    await expect(barisAsetUji(page)).toContainText(label);
  });

  test("booking Aktif tampil di baris asetnya dengan nama pelanggan dan jamnya", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = rentangSekarang(60);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      const { sesi } = await buka(page);
      expect(sesi.some((x) => x.id === b.id), "daftar tanggal ini memuat booking uji").toBe(true);
      // Booking VOID berjam sama dari run sebelumnya tidak ditampilkan
      // (keputusan R5a), dan checkConflict tidak mengizinkan dua booking Aktif
      // bertumpuk, sehingga tepat satu blok tampil.
      const blok = blokBooking(page, mulai, selesai);
      await expect(blok).toHaveCount(1);
      await expect(blok).toContainText(NAMA_PELANGGAN_BOOKING);
      await expect(blok).toHaveCSS("opacity", "1");
      await expect(blok).not.toContainText("Selesai");
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("booking yang dibayar dan sedang berjalan membuat aset Digunakan; yang belum dibayar tidak", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = rentangSekarang(60);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      // Belum dibayar: jadwal belum dikunci, aset tetap Tersedia.
      let { aset } = await buka(page);
      expect(aset.find((a) => a.namaAset === NAMA_ASET_BOOKING)?.status).toBe("tersedia");
      await expect(barisAsetUji(page)).toContainText("Tersedia");

      // Dibayar Rp1 (modul pembayaran, keputusan rancangan butir 23).
      const metode = await api<{ id: string }[]>(page, auth, "GET", "/metodepembayaran");
      const bayar = await api(page, auth, "POST", "/pembayaran", {
        penjualanID: penjualanId,
        metodePembayaranID: metode.data?.[0]?.id,
        jumlahBayar: 1,
        tanggalBayar: new Date().toISOString(),
      });
      expect(bayar.status, "bayar booking uji: " + bayar.pesan).toBeLessThan(300);
      ({ aset } = await buka(page));
      expect(aset.find((a) => a.namaAset === NAMA_ASET_BOOKING)?.status, "status dihitung ulang setiap dibaca").toBe(
        "digunakan",
      );
      await expect(barisAsetUji(page)).toContainText("Digunakan");
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("booking yang mulai kemarin dan masih berjalan lewat tengah malam tampil di timeline hari ini (TL1a)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const mulai = new Date();
    mulai.setDate(mulai.getDate() - 1);
    mulai.setHours(23, 0, 0, 0);
    const selesai = new Date(Date.now() + 60 * 60_000);
    selesai.setSeconds(0, 0);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      const { sesi } = await buka(page);
      const q = sesi.find((x) => x.id === b.id);
      expect(q, "timeline hari ini memuat booking yang mulai kemarin (B327)").toBeTruthy();
      const blok = blokBooking(page, mulai, selesai);
      await expect(blok).toHaveCount(1);
      await expect(blok).toContainText(NAMA_PELANGGAN_BOOKING);
      // Bagian sebelum awal hari dipotong: blok mulai di tepi kiri timeline.
      expect(await blok.evaluate((el) => (el as HTMLElement).style.left)).toBe("0%");
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("tanggal berikutnya meminta daftar booking tanggal itu, dan tanggal sebelumnya kembali ke hari ini", async ({
    page,
  }) => {
    await page.goto(URL_DAFTAR);
    await expect(page.getByText(/^Hari ini, /)).toBeVisible();
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    const tMinta = page.waitForRequest(
      (r) => r.method() === "GET" && POLA_SESI.test(r.url()) && r.url().includes("tanggal=" + tanggalLokal(besok)),
    );
    await page.getByRole("button", { name: "Tanggal berikutnya" }).click();
    // TL1a, B327: timeline meminta booking yang tumpang tindih dengan hari itu.
    expect(new URL((await tMinta).url()).searchParams.get("tampilan")).toBe("timeline");
    await expect(page.getByText(/^Hari ini, /)).toHaveCount(0);
    await page.getByRole("button", { name: "Tanggal sebelumnya" }).click();
    await expect(page.getByText(/^Hari ini, /)).toBeVisible();
  });

  test("menampilkan Memuat data selama daftar booking dimuat, lalu hilang", async ({ page }) => {
    await tahanLaluTeruskan(page, "GET", POLA_SESI);
    await page.goto(URL_DAFTAR);
    await expect(page.getByText("Memuat data...")).toBeVisible();
    await expect(page.getByText("Memuat data...")).toHaveCount(0, { timeout: 10_000 });
    await page.unroute(POLA_SESI);
  });

  test("gagal memuat daftar booking menampilkan pesan galat", async ({ page }) => {
    await page.route(POLA_SESI, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_DAFTAR);
    await expect(page.getByText("Gagal memuat data. Periksa koneksi atau coba lagi.")).toBeVisible({
      timeout: 20_000,
    });
    await page.unroute(POLA_SESI);
  });

  test("booking yang dibatalkan: detail VOID, dan timeline tidak menampilkannya (keputusan R5a)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = rentangSekarang(45);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      await batalkanBooking(page, auth, penjualanId);
      penjualanId = undefined;
      expect(await statusBooking(page, auth, b.id), "detail booking setelah void (backend 465b438)").toBe("VOID");
      const { sesi } = await buka(page);
      expect(sesi.find((x) => x.id === b.id)?.status, "daftar yang belum di-cache membawa status VOID").toBe(
        "VOID",
      );
      // Keputusan R5a: booking VOID tidak ditampilkan, termasuk booking VOID
      // berjam sama dari run sebelumnya.
      await expect(blokBooking(page, mulai, selesai)).toHaveCount(0);
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("blok booking membuka detail penjualan booking itu (keputusan R4b)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = rentangSekarang(50);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      await buka(page);
      const tautan = blokBooking(page, mulai, selesai).getByRole("link");
      await expect(tautan).toHaveAttribute("href", `/dashboard/outlet/penjualan/${penjualanId}`);
      await tautan.click();
      await page.waitForURL(`**/dashboard/outlet/penjualan/${penjualanId}`);
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("setelah booking di-void, timeline yang dimuat ulang tidak lagi menampilkan booking itu", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBooking(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = rentangSekarang(30);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      await buka(page);
      await expect(blokBooking(page, mulai, selesai)).toHaveCount(1);
      await batalkanBooking(page, auth, penjualanId);
      penjualanId = undefined;
      expect(await statusBooking(page, auth, b.id), "detail booking setelah void").toBe("VOID");
      await page.reload({ waitUntil: "commit" });
      const res = await page.waitForResponse(cocok("GET", POLA_SESI));
      const sesi = normalizeId((await res.json()).data ?? []) as unknown as SesiBookingMentah[];
      expect(sesi.find((x) => x.id === b.id)?.status, "daftar yang dimuat ulang membawa status VOID").toBe(
        "VOID",
      );
      await expect(blokBooking(page, mulai, selesai)).toHaveCount(0);
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });
});