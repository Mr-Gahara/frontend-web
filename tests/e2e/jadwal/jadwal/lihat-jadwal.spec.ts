import { test, expect, type Page } from "@playwright/test";
import { api, bukaDenganAuth, JAWAB_GAGAL, login } from "../../../helpers/transfer-uji";
import { penggunaDiRuang } from "../../../../features/pengguna/ruang-staf";
import { cocok, tanggalLokal } from "../../../helpers/reservasi-uji";
import {
  barisKaryawan,
  bersihkanHari,
  idLokasiRuang,
  itemSel,
  bulanUji,
  buatJadwalLewatKalender,
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

// Jadwal uji dibuat lewat kalender (buatJadwalLewatKalender), lebih lama dari POST langsung.
test.describe.configure({ timeout: 120_000 });

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
    test("baris karyawan sama dengan pengguna ruang itu menurut aturan ruang staf (RS1a)", async ({ page }) => {
      const auth = await bukaDenganAuth(page, url);
      const pengguna = await penggunaSetelahMuatUlang(page, ruang);
      expect(pengguna.length, `respons pengguna ${ruang}`).toBeGreaterThan(0);
      // Sejak RS1a baris kalender bukan respons workspace backend apa adanya,
      // melainkan lokasi kerja, lalu izin dashboard (daftar workspace), lalu outlet.
      type P = { id: string; locationID?: string | null };
      const [semua, outlet, gudang, lokasi] = await Promise.all([
        api<P[]>(page, auth, "GET", "/pengguna"),
        api<P[]>(page, auth, "GET", "/pengguna?workspace=outlet"),
        api<P[]>(page, auth, "GET", "/pengguna?workspace=gudang"),
        api<{ id?: string; _id?: string; tipe: string }[]>(page, auth, "GET", "/location"),
      ]);
      const harapan = penggunaDiRuang(ruang, {
        semua: semua.data,
        diRuangBackend: { outlet: new Set(outlet.data.map((p) => p.id)), gudang: new Set(gudang.data.map((p) => p.id)) },
        tipeLokasi: new Map(lokasi.data.map((l) => [String(l.id ?? l._id), l.tipe])),
      });
      await expect(barisKaryawan(page)).toHaveCount(1, { timeout: 15_000 });
      await expect(page.locator("tbody tr")).toHaveCount(harapan.length);
    });

    test("jadwal uji tampil di sel harinya", async ({ page }) => {
      const auth = await bukaDenganAuth(page, url);
      const fx = await siapkanFixtureJadwal(page, auth, ruang);
      const b = bulanUji();
      const tgl = tanggalUji(b, HARI_UJI);
      await bersihkanHari(page, auth, fx, tgl, tgl);
      try {
        await buatJadwalLewatKalender(page, auth, fx, tgl, fx.shiftPagi);
        await keBulanUji(page, b);
        const sel = selHari(page, HARI_UJI);
        await expect(sel).toContainText(NAMA_SHIFT_PAGI);
        await expect(sel).toContainText(`${JAM_PAGI.masuk} - ${JAM_PAGI.pulang}`);
        await expect(selHari(page, HARI_UJI + 1)).not.toContainText(NAMA_SHIFT_PAGI);
      } finally {
        await bersihkanHari(page, auth, fx, tgl, tgl);
      }
    });

    test("jadwal di lokasi lain tampil sebagai penanda baca-saja, dan daftar disaring per lokasi (B184)", async ({
      page,
    }) => {
      const lain = ruang === "outlet" ? "gudang" : "outlet";
      const daftarJadwal: URLSearchParams[] = [];
      page.on("request", (r) => {
        if (r.method() === "GET" && POLA_DAFTAR_JADWAL.test(r.url())) daftarJadwal.push(new URL(r.url()).searchParams);
      });
      const auth = await bukaDenganAuth(page, url);
      const lokasiRuang = await idLokasiRuang(page, auth, ruang);
      const fxLain = await siapkanFixtureJadwal(page, auth, lain);
      const b = bulanUji();
      const hari = HARI_UJI + 2;
      const tgl = tanggalUji(b, hari);
      await bersihkanHari(page, auth, fxLain, tgl, tgl);
      try {
        await buatJadwalLewatKalender(page, auth, fxLain, tgl, fxLain.shiftPagi);
        await keBulanUji(page, b);
        const sel = selHari(page, hari);
        await expect(sel).toContainText("Lokasi lain", { timeout: 15_000 });
        await expect(sel).toContainText(NAMA_SHIFT_PAGI);
        // Baca-saja: tidak ada tombol ubah maupun tombol buat di sel itu.
        await expect(sel.getByRole("button")).toHaveCount(0);

        expect(daftarJadwal.some((q) => q.get("locationID") === lokasiRuang), "daftar per lokasi ruang").toBe(true);
        expect(daftarJadwal.some((q) => !q.has("locationID")), "daftar seluruh lokasi untuk penanda").toBe(true);
      } finally {
        await bersihkanHari(page, auth, fxLain, tgl, tgl);
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
test("kolom Staf dikunci 220 px di desktop dan 112 px di HP (CV16a)", async ({ page }) => {
  await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const kepala = page.getByRole("columnheader", { name: /Staf \/ Karyawan/i });
  for (const [lebar, harapan] of [
    [1280, 220],
    [390, 112],
  ] as const) {
    await page.setViewportSize({ width: lebar, height: 800 });
    await expect
      .poll(async () => Math.round((await kepala.boundingBox())?.width ?? 0), { message: `lebar Staf di ${lebar} px` })
      .toBe(harapan);
  }
});

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
    // Libur dibuat lewat dialog Kelola Jadwal (keputusan rancangan butir 23).
    await keBulanUji(page, b);
    await itemSel(page, hari).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Kelola Jadwal");
    await dialog.getByText("Libur / Off", { exact: true }).click();
    const tunggu = page.waitForResponse(
      (r) => r.request().method() === "POST" && /\/api\/jadwalshift$/i.test(r.url()),
    );
    await dialog.getByRole("button", { name: "Simpan Jadwal" }).click();
    const res = await tunggu;
    const body = await res.json().catch(() => ({}));
    expect(res.status(), `POST /jadwalshift libur: ${JSON.stringify(body).slice(0, 160)}`).toBe(201);
    expect(res.request().postDataJSON()).toMatchObject({ penggunaId: fx.penggunaId, tanggal: tgl, isLibur: true });
    expect(body.data?.ditolak).toBe(0);
    await expect(dialog).toHaveCount(0);
    await expect(selHari(page, hari)).toContainText("LIBUR");
    await expect(selHari(page, hari + 1)).not.toContainText("LIBUR");
  } finally {
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});
