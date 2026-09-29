import { test, expect, type Page } from "@playwright/test";
import { api, bukaDenganAuth, JAWAB_GAGAL, login } from "../../../helpers/transfer-uji";
import { cocok, tanggalLokal } from "../../../helpers/reservasi-uji";
import {
  barisKaryawan,
  CATATAN_UJI,
  bersihkanHari,
  bulanUji,
  buatJadwalApi,
  JAM_PAGI,
  keBulanUji,
  NAMA_SHIFT_PAGI,
  POLA_DAFTAR_JADWAL,
  selHari,
  siapkanFixtureJadwal,
  tanggalUji,
  URL_JADWAL_GUDANG,
  URL_JADWAL_OUTLET,
} from "../../../helpers/jadwal-uji";

/*
 * Spec pembanding jadwal outlet dan gudang terhadap kode lama (keputusan
 * R1a): baris karyawan menurut ruang, jadwal uji tampil di sel harinya, dan
 * kegagalan memuat. Rentang bulan (J1a) dan kelola jadwal gudang (J5b)
 * ditambahkan di commit migrasi.
 */

test.use({ timezoneId: "Asia/Pontianak" });

test.beforeEach(async ({ page }) => {
  await login(page);
});

const HARI_UJI = 15;

async function penggunaSetelahMuatUlang(page: Page, ruang: "outlet" | "gudang") {
  await page.reload({ waitUntil: "commit" });
  const res = await page.waitForResponse(cocok("GET", new RegExp(`/api/pengguna\\?workspace=${ruang}`, "i")));
  return ((await res.json()).data ?? []) as { nama: string }[];
}

for (const ruang of ["outlet", "gudang"] as const) {
  const url = ruang === "outlet" ? URL_JADWAL_OUTLET : URL_JADWAL_GUDANG;

  test.describe(`jadwal ${ruang}`, () => {
    test("baris karyawan sama dengan respons pengguna ruang itu", async ({ page }) => {
      await bukaDenganAuth(page, url);
      const pengguna = await penggunaSetelahMuatUlang(page, ruang);
      expect(pengguna.length, `respons pengguna ${ruang}`).toBeGreaterThan(0);
      await expect(barisKaryawan(page)).toHaveCount(1, { timeout: 15_000 });
      await expect(page.locator("tbody tr")).toHaveCount(pengguna.length);
    });

    test("jadwal uji tampil di sel harinya", async ({ page }) => {
      const auth = await bukaDenganAuth(page, url);
      const fx = await siapkanFixtureJadwal(page, auth);
      const b = bulanUji();
      const tgl = tanggalUji(b, HARI_UJI);
      await bersihkanHari(page, auth, fx, tgl, tgl);
      try {
        await buatJadwalApi(page, auth, fx, tgl, fx.shiftPagi);
        await keBulanUji(page, b);
        const sel = selHari(page, HARI_UJI);
        await expect(sel).toContainText(NAMA_SHIFT_PAGI);
        await expect(sel).toContainText(`${JAM_PAGI.masuk} - ${JAM_PAGI.pulang}`);
        await expect(selHari(page, HARI_UJI + 1)).not.toContainText(NAMA_SHIFT_PAGI);
      } finally {
        await bersihkanHari(page, auth, fx, tgl, tgl);
      }
    });

    test("gagal memuat jadwal menampilkan pesan", async ({ page }) => {
      await bukaDenganAuth(page, url);
      await page.route(POLA_DAFTAR_JADWAL, (route) =>
        route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      try {
        await page.reload();
        await expect(page.getByText("Gagal Memuat Data")).toBeVisible({ timeout: 20_000 });
      } finally {
        await page.unroute(POLA_DAFTAR_JADWAL);
      }
    });
  });
}

// ============================================================
// MIGRASI features/jadwal (keputusan J1a dan JD5a)
// ============================================================
test("rentang bulan memakai tanggal lokal (keputusan J1a)", async ({ page }) => {
  const tunggu = page.waitForResponse(cocok("GET", POLA_DAFTAR_JADWAL));
  await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const url = new URL((await tunggu).url());
  const kini = new Date();
  expect([url.searchParams.get("startDate"), url.searchParams.get("endDate")]).toEqual([
    tanggalLokal(new Date(kini.getFullYear(), kini.getMonth(), 1)),
    tanggalLokal(new Date(kini.getFullYear(), kini.getMonth() + 1, 0)),
  ]);
});

test("jadwal libur tampil LIBUR, berbeda dari hari tanpa jadwal (keputusan JD5a)", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const hari = 16;
  const tgl = tanggalUji(b, hari);
  await bersihkanHari(page, auth, fx, tgl, tgl);
  try {
    const res = await api<{ ditolak: number }>(page, auth, "POST", "/jadwalshift", {
      penggunaId: fx.penggunaId,
      tanggal: tgl,
      isLibur: true,
      shiftIds: [],
      catatan: CATATAN_UJI,
    });
    expect(res.status, `POST /jadwalshift libur: ${res.pesan}`).toBe(201);
    expect(res.data.ditolak).toBe(0);
    await keBulanUji(page, b);
    await expect(selHari(page, hari)).toContainText("LIBUR");
    await expect(selHari(page, hari + 1)).not.toContainText("LIBUR");
  } finally {
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});
