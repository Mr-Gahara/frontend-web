import { test, expect, type Page } from "@playwright/test";
import { bukaDenganAuth, JAWAB_GAGAL, login } from "../../../helpers/transfer-uji";
import { cocok } from "../../../helpers/reservasi-uji";
import {
  bersihkanHari,
  bulanUji,
  jadwalRentang,
  NAMA_PENGGUNA,
  NAMA_POLA,
  pilihTanggalKalender,
  POLA_BULK_JADWAL,
  siapkanFixtureJadwal,
  tanggalUji,
  URL_GENERATE_OUTLET,
  type BulanUji,
} from "../../../helpers/jadwal-uji";

/*
 * Spec pembanding generate jadwal outlet terhadap kode lama (keputusan R1a):
 * pola uji dua hari (hari 1 shift pagi uji, hari 2 libur) untuk Ridho di
 * tanggal 20 sampai 23 bulan uji. Payload per tanggal dibaca dari permintaan
 * nyata dan hasilnya dibuktikan lewat API. Generate dengan jadwal yang
 * ditolak (J2a) dan generate gudang (J5b) ditambahkan di commit migrasi.
 */

test.use({ timezoneId: "Asia/Pontianak" });

test.beforeEach(async ({ page }) => {
  await login(page);
});

const DARI = 20;
const SAMPAI = 23;

async function pilihTanggalBerlabel(page: Page, label: string, b: BulanUji, hari: number) {
  await page.getByText(label, { exact: true }).locator("xpath=..").getByRole("button").click();
  await pilihTanggalKalender(page, b.selisih, hari);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("grid")).toHaveCount(0);
}

async function isiLangkahSatu(page: Page, b: BulanUji) {
  await page.getByRole("combobox").filter({ hasText: "Pilih pola yang sudah dibuat..." }).click();
  await page.getByPlaceholder("Cari pola roster...").fill(NAMA_POLA);
  await page.getByRole("option", { name: new RegExp(NAMA_POLA) }).click();
  await pilihTanggalBerlabel(page, "Mulai Tanggal", b, DARI);
  await pilihTanggalBerlabel(page, "Sampai Tanggal", b, SAMPAI);
  await page.getByText(NAMA_PENGGUNA, { exact: true }).click();
  await expect(page.getByText("1 Dipilih", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lanjut Pratinjau" }).click();
  await expect(page.getByText("Langkah 2: Pratinjau Jadwal")).toBeVisible();
}

test("generate mengirim satu entri per tanggal sesuai pola dan hasilnya tersimpan", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_GENERATE_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const dari = tanggalUji(b, DARI);
  const sampai = tanggalUji(b, SAMPAI);
  const harapan = [
    [tanggalUji(b, 20), false, fx.shiftPagi],
    [tanggalUji(b, 21), true, null],
    [tanggalUji(b, 22), false, fx.shiftPagi],
    [tanggalUji(b, 23), true, null],
  ];
  await bersihkanHari(page, auth, fx, dari, sampai);
  try {
    await isiLangkahSatu(page, b);
    const tunggu = page.waitForResponse(cocok("POST", POLA_BULK_JADWAL));
    await page.getByRole("button", { name: /Simpan & Terapkan Jadwal/ }).click();
    const res = await tunggu;
    const payload = res.request().postDataJSON() as {
      penggunaID: string;
      tanggalKerja: string;
      isLibur: boolean;
      shiftID?: string;
    }[];
    expect(payload.map((p) => [p.tanggalKerja, p.isLibur, p.shiftID ?? null])).toEqual(harapan);
    expect(payload.every((p) => p.penggunaID === fx.penggunaId)).toBe(true);
    const body = await res.json().catch(() => ({}));
    expect(res.status(), `POST /jadwalshift/bulk: ${JSON.stringify(body).slice(0, 200)}`).toBe(200);
    expect(body.data).toMatchObject({ berhasilDiproses: 4, ditolak: 0 });
    await page.waitForURL(/\/dashboard\/outlet\/jadwal$/);
    const tersimpan = await jadwalRentang(page, auth, fx, dari, sampai);
    expect(
      tersimpan.map((j) => [j.tanggalKerja, j.isLibur, j.shift?.id ?? null]).sort((x, y) => String(x[0]).localeCompare(String(y[0]))),
    ).toEqual(harapan);
  } finally {
    await bersihkanHari(page, auth, fx, dari, sampai);
  }
});

test("generate gagal: tetap di langkah 2 dengan pesan galat", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_GENERATE_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const dari = tanggalUji(b, DARI);
  const sampai = tanggalUji(b, SAMPAI);
  await bersihkanHari(page, auth, fx, dari, sampai);
  try {
    await isiLangkahSatu(page, b);
    await page.route(POLA_BULK_JADWAL, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.getByRole("button", { name: /Simpan & Terapkan Jadwal/ }).click();
    await expect(page.getByText("uji", { exact: true })).toBeVisible();
    await expect(page.getByText("Langkah 2: Pratinjau Jadwal")).toBeVisible();
    await expect(page).toHaveURL(/\/jadwal\/generate$/);
    expect(await jadwalRentang(page, auth, fx, dari, sampai)).toEqual([]);
  } finally {
    await page.unroute(POLA_BULK_JADWAL);
    await bersihkanHari(page, auth, fx, dari, sampai);
  }
});