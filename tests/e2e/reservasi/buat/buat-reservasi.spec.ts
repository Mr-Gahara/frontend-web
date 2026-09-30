import { expect, test, type Page } from "@playwright/test";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { JAWAB_GAGAL, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import {
  NAMA_ASET_BOOKING,
  NAMA_ASET_PERBAIKAN,
  NAMA_DISKON_GLOBAL,
  NAMA_DISKON_ITEM,
  NAMA_PELANGGAN_BOOKING,
  batalkanBooking,
  bersihkanSisaBooking,
  buatBooking,
  cocok,
  pantauPermintaan,
  siapkanFixtureBuatReservasi,
} from "../../../helpers/reservasi-uji";
import { bayarLewatApi, metodeUji } from "../../../helpers/penjualan-uji";

/*
 * Spec pembanding buat reservasi, ditulis dan dijalankan terhadap kode lama
 * sebelum migrasi (keputusan R1a). Booking yang tercipta dibatalkan lewat
 * penjualannya di finally (R2c); fixture diskon mengikuti R7b, dan tanggal
 * dipilih lewat kalender kostum (R8b). Respons sukses tidak dipalsukan
 * (keputusan rancangan butir 21).
 */

const URL_DAFTAR = "/dashboard/outlet/reservasi";
const URL_BUAT = "/dashboard/outlet/reservasi/buatReservasi";
const POLA_POST = /\/api\/sesibooking(\?|$)/i;

let urut = 0;

/**
 * Tanggal 10 bulan depan, pada jam yang bergeser menurut menit berjalan dan
 * urutan pemanggilan. Daftar booking per tanggal yang dibaca form untuk
 * mendeteksi bentrok dahulu tidak dibersihkan saat void (kontrak/temuan.md
 * butir 57, dilaporkan diperbaiki backend 465b438 dan dibuktikan lewat fixme
 * R3a); pergeseran jam dipertahankan agar booking uji run sebelumnya tidak
 * berada di slot yang sama.
 */
function slotBulanDepan(durasiJam: number) {
  const sekarang = new Date();
  const jam = 6 + ((Math.floor(Date.now() / 60_000) + urut++ * 5) % 14);
  const mulai = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 10, jam, 0, 0, 0);
  return { mulai, selesai: new Date(mulai.getTime() + durasiJam * 3_600_000) };
}

const teksTanggal = (d: Date) => format(d, "dd MMMM yyyy", { locale: localeID });

async function bukaBuat(page: Page) {
  await page.goto(URL_BUAT);
  await expect(page.getByText("Buat Sesi Booking (Reservasi)")).toBeVisible();
}

async function pilihPelanggan(page: Page) {
  await page.getByRole("combobox").filter({ hasText: "Ketik untuk mencari pelanggan..." }).click();
  await page.getByPlaceholder("Cari nama pelanggan...").fill(NAMA_PELANGGAN_BOOKING);
  await page.getByRole("option", { name: NAMA_PELANGGAN_BOOKING }).click();
}

async function bukaPilihanAset(page: Page) {
  await page.getByRole("combobox").filter({ hasText: "Pilih aset yang tersedia" }).click();
}

async function pilihAsetUji(page: Page) {
  await bukaPilihanAset(page);
  await page.getByRole("option", { name: new RegExp("^" + NAMA_ASET_BOOKING + " \\(") }).click();
}

/** Tanggal lewat kalender kostum (R8b), lalu jam dan menit, lalu durasi. */
async function aturWaktu(page: Page, mulai: Date, durasiJam: number) {
  const hariIni = new Date();
  await page.getByRole("button", { name: `Tanggal Fasilitas #1, ${teksTanggal(hariIni)}` }).click();
  const selisihBulan = (mulai.getFullYear() - hariIni.getFullYear()) * 12 + mulai.getMonth() - hariIni.getMonth();
  for (let i = 0; i < selisihBulan; i++) await page.getByRole("button", { name: /next month/i }).click();
  await page.getByRole("grid").getByText(String(mulai.getDate()), { exact: true }).click();
  await expect(page.getByRole("button", { name: `Tanggal Fasilitas #1, ${teksTanggal(mulai)}` })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Jam Mulai Fasilitas #1 (jam)" })
    .fill(String(mulai.getHours()).padStart(2, "0"));
  await page
    .getByRole("textbox", { name: "Jam Mulai Fasilitas #1 (menit)" })
    .fill(String(mulai.getMinutes()).padStart(2, "0"));
  await page.getByRole("button", { name: `${durasiJam} jam`, exact: true }).click();
}

async function pilihDiskon(page: Page, urutanTombol: number, cari: string, nama: string) {
  await page.getByRole("button", { name: "Pilih Diskon" }).nth(urutanTombol).click();
  await page.getByPlaceholder(cari).fill(nama);
  await page.getByRole("option", { name: nama }).click();
  await page.keyboard.press("Escape");
}

test.describe("E2E — Reservasi › Buat reservasi", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("validasi: tanpa pelanggan dan aset, pesan tampil tanpa mengirim permintaan", async ({ page }) => {
    await bukaBuat(page);
    const kirim = pantauPermintaan(page, "POST", POLA_POST);
    await page.getByRole("button", { name: "Proses & Buat Tagihan" }).click();
    await expect(page.getByText("Pelanggan wajib dipilih")).toBeVisible();
    await expect(page.getByText("Aset wajib dipilih")).toBeVisible();
    expect(kirim.jumlah(), "validasi gagal tidak mengirim POST").toBe(0);
    kirim.lepas();
  });

  test("aset berstatus perbaikan tidak ditawarkan, sedangkan aset uji ditawarkan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixtureBuatReservasi(page, auth);
    await bukaBuat(page);
    await bukaPilihanAset(page);
    await expect(page.getByRole("option", { name: new RegExp("^" + NAMA_ASET_BOOKING + " \\(") })).toBeVisible();
    await expect(page.getByRole("option", { name: new RegExp(NAMA_ASET_PERBAIKAN) })).toHaveCount(0);
  });

  test("bentrok: jadwal yang sudah dibayar menampilkan peringatan dan menonaktifkan simpan (backend 465b438)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBuatReservasi(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = slotBulanDepan(1);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      // Jadwal baru terkunci setelah pembayaran pertama masuk.
      const metode = await metodeUji(page, auth);
      await bayarLewatApi(page, auth, penjualanId!, metode.id, 1, "DP e2e bentrok");
      await bukaBuat(page);
      await pilihPelanggan(page);
      await pilihAsetUji(page);
      await aturWaktu(page, mulai, 1);
      await expect(page.getByText(/Aset ini sedang dipesan dari/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Waktu Terpakai" })).toBeDisabled();
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("booking belum dibayar di jam yang sama: peringatan tampil, simpan tetap aktif (backend 465b438)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBuatReservasi(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = slotBulanDepan(1);
    let penjualanId: string | undefined;
    try {
      const b = await buatBooking(page, auth, fx, mulai, selesai);
      penjualanId = b.dataPenjualan?.id;
      await bukaBuat(page);
      await pilihPelanggan(page);
      await pilihAsetUji(page);
      await aturWaktu(page, mulai, 1);
      await expect(page.getByRole("status").filter({ hasText: /booking belum dibayar/i })).toBeVisible();
      await expect(page.getByText(/Aset ini sedang dipesan dari/)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Proses & Buat Tagihan" })).toBeEnabled();
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("berhasil: kalender kostum, jam, durasi, dan kedua diskon terkirim, lalu membuka detail penjualan (R7b, R8b)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const fx = await siapkanFixtureBuatReservasi(page, auth);
    await bersihkanSisaBooking(page, auth, fx);
    const { mulai, selesai } = slotBulanDepan(2);
    let penjualanId: string | undefined;
    try {
      await bukaBuat(page);
      await pilihPelanggan(page);
      await pilihAsetUji(page);
      await aturWaktu(page, mulai, 2);
      await pilihDiskon(page, 0, "Cari diskon fasilitas...", NAMA_DISKON_ITEM);
      await pilihDiskon(page, 1, "Cari diskon transaksi...", NAMA_DISKON_GLOBAL);
      const tKirim = page.waitForResponse(cocok("POST", POLA_POST));
      await page.getByRole("button", { name: "Proses & Buat Tagihan" }).click();
      const res = await tKirim;
      const body = await res.json().catch(() => ({}));
      penjualanId = body?.data?.penjualanID ?? body?.penjualanID;
      expect(res.status(), `POST /sesibooking: ${JSON.stringify(body).slice(0, 200)}`).toBeLessThan(300);
      expect(res.request().postDataJSON()).toEqual({
        dataPelanggan: fx.pelangganId,
        diskonGlobal: [fx.diskonGlobalId],
        items: [
          {
            dataAset: fx.asetId,
            waktuMulai: mulai.toISOString(),
            waktuSelesai: selesai.toISOString(),
            diskonItem: [fx.diskonItemId],
          },
        ],
      });
      expect(penjualanId, "respons membawa penjualanID").toBeTruthy();
      await page.waitForURL(`**/dashboard/outlet/penjualan/${penjualanId}`);
    } finally {
      await batalkanBooking(page, auth, penjualanId);
    }
  });

  test("jam mulai yang dikosongkan menahan simpan dengan pesan, tanpa mengirim permintaan (K-TW5a)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixtureBuatReservasi(page, auth);
    await bukaBuat(page);
    await pilihPelanggan(page);
    await pilihAsetUji(page);
    const kirim = pantauPermintaan(page, "POST", POLA_POST);
    const jam = page.getByRole("textbox", { name: "Jam Mulai Fasilitas #1 (jam)" });
    await jam.fill("");
    await page.getByRole("button", { name: "Proses & Buat Tagihan" }).click();
    await expect(page.getByText("Waktu mulai wajib diisi")).toBeVisible();
    await expect(jam).toHaveAttribute("aria-invalid", "true");
    expect(kirim.jumlah(), "jam kosong tidak mengirim POST").toBe(0);
    kirim.lepas();
  });

  test("gagal: pesan tampil dan halaman tetap di buat reservasi", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixtureBuatReservasi(page, auth);
    const { mulai } = slotBulanDepan(1);
    await bukaBuat(page);
    await pilihPelanggan(page);
    await pilihAsetUji(page);
    await aturWaktu(page, mulai, 1);
    await page.route(POLA_POST, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.getByRole("button", { name: "Proses & Buat Tagihan" }).click();
    await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
    await expect(page).toHaveURL(/\/buatReservasi$/);
    await page.unroute(POLA_POST);
  });

  test("Batalkan kembali ke daftar reservasi tanpa mengirim permintaan", async ({ page }) => {
    await page.goto(URL_DAFTAR);
    await bukaBuat(page);
    const kirim = pantauPermintaan(page, "POST", POLA_POST);
    await page.getByRole("button", { name: "Batalkan" }).click();
    await page.waitForURL("**/dashboard/outlet/reservasi");
    expect(kirim.jumlah(), "Batalkan tidak mengirim POST").toBe(0);
    kirim.lepas();
  });
});