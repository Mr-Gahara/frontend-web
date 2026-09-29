import { test, expect } from "@playwright/test";
import { bukaDenganAuth, JAWAB_GAGAL, login } from "../../../helpers/transfer-uji";
import { cocok } from "../../../helpers/reservasi-uji";
import {
  bersihkanHari,
  bulanUji,
  buatJadwalApi,
  CATATAN_UJI,
  itemSel,
  jadwalRentang,
  keBulanUji,
  NAMA_PENGGUNA,
  NAMA_SHIFT_PAGI,
  pilihShift,
  pilihTanggalKalender,
  POLA_BUAT_JADWAL,
  selHari,
  siapkanFixtureJadwal,
  tanggalUji,
  URL_JADWAL_OUTLET,
} from "../../../helpers/jadwal-uji";

/*
 * Spec pembanding kelola jadwal manual di ruang outlet terhadap kode lama
 * (keputusan R1a): buat lewat klik sel dan lewat Tambah Manual, ubah menjadi
 * libur, hapus, dan simpan gagal. Payload dibaca dari permintaan nyata dan
 * hasilnya dibuktikan lewat API. Jadwal yang seluruhnya ditolak backend
 * (J2a) ditambahkan di commit migrasi.
 */

test.use({ timezoneId: "Asia/Pontianak" });

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("buat jadwal lewat klik sel mengirim payload yang tepat dan tersimpan", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const hari = 10;
  const tgl = tanggalUji(b, hari);
  await bersihkanHari(page, auth, fx, tgl, tgl);
  try {
    await keBulanUji(page, b);
    await itemSel(page, hari).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Kelola Jadwal");
    await pilihShift(page, NAMA_SHIFT_PAGI);
    await dialog.getByPlaceholder("Contoh: Menggantikan shift Andi...").fill(CATATAN_UJI);
    const tunggu = page.waitForResponse(cocok("POST", POLA_BUAT_JADWAL));
    await dialog.getByRole("button", { name: "Simpan Jadwal" }).click();
    const res = await tunggu;
    expect(res.request().postDataJSON()).toMatchObject({
      penggunaId: fx.penggunaId,
      tanggal: tgl,
      isLibur: false,
      shiftIds: [fx.shiftPagi],
      catatan: CATATAN_UJI,
    });
    const body = await res.json().catch(() => ({}));
    expect(res.status(), `POST /jadwalshift: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
    expect(body.data?.ditolak).toBe(0);
    await expect(page.getByText("Jadwal Berhasil Dibuat")).toBeVisible();
    await expect(dialog).toHaveCount(0);
    const tersimpan = await jadwalRentang(page, auth, fx, tgl, tgl);
    expect(tersimpan.map((j) => [j.shift?.id, j.catatan])).toEqual([[fx.shiftPagi, CATATAN_UJI]]);
    await expect(selHari(page, hari)).toContainText(NAMA_SHIFT_PAGI);
  } finally {
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});

test("buat jadwal lewat Tambah Manual dengan karyawan dan tanggal dari kalender", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const hari = 14;
  const tgl = tanggalUji(b, hari);
  await bersihkanHari(page, auth, fx, tgl, tgl);
  try {
    await page.getByRole("button", { name: "Tambah Manual" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Kelola Jadwal");
    await dialog.getByText("Pilih karyawan...").click();
    await page.getByRole("option", { name: NAMA_PENGGUNA, exact: true }).click();
    await dialog.getByRole("button", { name: "Pilih tanggal..." }).click();
    await pilihTanggalKalender(page, b.selisih, hari);
    await expect(page.getByRole("grid")).toHaveCount(0);
    await pilihShift(page, NAMA_SHIFT_PAGI);
    const tunggu = page.waitForResponse(cocok("POST", POLA_BUAT_JADWAL));
    await dialog.getByRole("button", { name: "Simpan Jadwal" }).click();
    const res = await tunggu;
    expect(res.request().postDataJSON()).toMatchObject({
      penggunaId: fx.penggunaId,
      tanggal: tgl,
      isLibur: false,
      shiftIds: [fx.shiftPagi],
    });
    expect(res.status()).toBe(201);
    await expect(dialog).toHaveCount(0);
    const tersimpan = await jadwalRentang(page, auth, fx, tgl, tgl);
    expect(tersimpan.map((j) => j.shift?.id)).toEqual([fx.shiftPagi]);
  } finally {
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});

test("ubah jadwal menjadi libur lewat klik item jadwal", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const hari = 11;
  const tgl = tanggalUji(b, hari);
  await bersihkanHari(page, auth, fx, tgl, tgl);
  try {
    const id = await buatJadwalApi(page, auth, fx, tgl, fx.shiftPagi);
    await keBulanUji(page, b);
    await itemSel(page, hari).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Ubah Jadwal");
    await dialog.getByText("Libur / Off", { exact: true }).click();
    const tunggu = page.waitForResponse(cocok("PUT", new RegExp(`/api/jadwalshift/${id}$`, "i")));
    await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
    const res = await tunggu;
    expect(res.request().postDataJSON()).toMatchObject({ isLibur: true });
    expect(res.status()).toBe(200);
    await expect(page.getByText("Jadwal Diperbarui")).toBeVisible();
    const tersimpan = await jadwalRentang(page, auth, fx, tgl, tgl);
    expect(tersimpan.map((j) => [j.id, j.isLibur, j.shift])).toEqual([[id, true, null]]);
  } finally {
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});

test("hapus jadwal lewat dialog ubah setelah konfirmasi", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const hari = 12;
  const tgl = tanggalUji(b, hari);
  await bersihkanHari(page, auth, fx, tgl, tgl);
  try {
    const id = await buatJadwalApi(page, auth, fx, tgl, fx.shiftPagi);
    await keBulanUji(page, b);
    await itemSel(page, hari).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Ubah Jadwal");
    page.once("dialog", (d) => d.accept());
    const tunggu = page.waitForResponse(cocok("DELETE", new RegExp(`/api/jadwalshift/${id}$`, "i")));
    await dialog.getByRole("button", { name: "Hapus" }).click();
    expect((await tunggu).status()).toBe(200);
    await expect(page.getByText("Jadwal Dihapus")).toBeVisible();
    expect(await jadwalRentang(page, auth, fx, tgl, tgl)).toEqual([]);
  } finally {
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});

test("simpan gagal: dialog tetap terbuka dan toast Gagal Menyimpan tampil", async ({ page }) => {
  const auth = await bukaDenganAuth(page, URL_JADWAL_OUTLET);
  const fx = await siapkanFixtureJadwal(page, auth);
  const b = bulanUji();
  const hari = 13;
  const tgl = tanggalUji(b, hari);
  await bersihkanHari(page, auth, fx, tgl, tgl);
  try {
    await keBulanUji(page, b);
    await itemSel(page, hari).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Kelola Jadwal");
    await pilihShift(page, NAMA_SHIFT_PAGI);
    await page.route(POLA_BUAT_JADWAL, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await dialog.getByRole("button", { name: "Simpan Jadwal" }).click();
    await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
    await expect(dialog, "dialog bertahan saat simpan gagal (keputusan Fase 0)").toBeVisible();
    expect(await jadwalRentang(page, auth, fx, tgl, tgl)).toEqual([]);
  } finally {
    await page.unroute(POLA_BUAT_JADWAL);
    await bersihkanHari(page, auth, fx, tgl, tgl);
  }
});