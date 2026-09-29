import { expect, type Locator, type Page } from "@playwright/test";
import { normalizeId } from "@/lib/api/normalize";
import { api, BASIS, type Auth } from "./transfer-uji";
import { cocok, tanggalLokal } from "./reservasi-uji";

/*
 * Helper spec jadwal: fixture tetap (shift uji dan pola roster uji), bulan
 * uji, jadwal Ridho lewat API, serta navigasi grid dan kalender. Setiap test
 * membersihkan hari ujinya sendiri di awal dan di finally. Hari uji hanya
 * dipakai spec jadwal, di bulan 30 hari pertama mulai dua bulan ke depan
 * (keputusan J4; data development adalah data pengujian,
 * docs/refactor/backend.md). Respons sukses tidak pernah dipalsukan
 * (keputusan rancangan butir 21).
 */

export const URL_JADWAL_OUTLET = BASIS + "/dashboard/outlet/jadwal";
export const URL_JADWAL_GUDANG = BASIS + "/dashboard/gudang/jadwal";
export const URL_GENERATE_OUTLET = BASIS + "/dashboard/outlet/jadwal/generate";

export const NAMA_PENGGUNA = "Ridho";
export const NAMA_SHIFT_PAGI = "E2E Jadwal Pagi";
export const JAM_PAGI = { masuk: "08:00", pulang: "16:00" };
export const NAMA_POLA = "E2E Jadwal Pola";
export const CATATAN_UJI = "E2E jadwal uji";

export const POLA_DAFTAR_JADWAL = /\/api\/jadwalshift\?/i;
export const POLA_BUAT_JADWAL = /\/api\/jadwalshift$/i;
export const POLA_BULK_JADWAL = /\/api\/jadwalshift\/bulk$/i;

export type JadwalMentah = {
  id: string;
  tanggalKerja: string;
  isLibur: boolean;
  catatan: string | null;
  karyawan: { id: string } | null;
  shift: { id: string; namaShift: string } | null;
};

export type FixtureJadwal = { penggunaId: string; shiftPagi: string; polaId: string };

export type BulanUji = { tahun: number; bulan: number; selisih: number };

type Entri = { id: string } & Record<string, unknown>;

function daftar(data: unknown): Entri[] {
  const hasil = normalizeId(data) as unknown;
  return Array.isArray(hasil) ? (hasil as Entri[]) : [];
}

function idDari(nilai: unknown): string | null {
  if (nilai && typeof nilai === "object" && "id" in nilai) return String((nilai as { id: unknown }).id);
  return nilai ? String(nilai) : null;
}

async function idPengguna(page: Page, auth: Auth): Promise<string> {
  const res = await api<unknown>(page, auth, "GET", "/pengguna?workspace=outlet");
  expect(res.status, `GET /pengguna: ${res.pesan}`).toBe(200);
  const ada = daftar(res.data).find((p) => p.nama === NAMA_PENGGUNA);
  expect(ada, `pengguna ${NAMA_PENGGUNA} ada di ruang outlet`).toBeTruthy();
  return String(ada?.id);
}

async function pastikanShiftPagi(page: Page, auth: Auth): Promise<string> {
  const res = await api<unknown>(page, auth, "GET", "/shift?status=Aktif");
  expect(res.status, `GET /shift: ${res.pesan}`).toBe(200);
  const ada = daftar(res.data).find((s) => s.namaShift === NAMA_SHIFT_PAGI);
  if (ada) return ada.id;
  const buat = await api<unknown>(page, auth, "POST", "/shift", {
    namaShift: NAMA_SHIFT_PAGI,
    jamMasuk: JAM_PAGI.masuk,
    jamPulang: JAM_PAGI.pulang,
    isLintasHari: false,
    toleransiTerlambat: 0,
    status: "Aktif",
  });
  expect([200, 201], `POST /shift: ${buat.pesan}`).toContain(buat.status);
  return String(idDari(normalizeId(buat.data) as unknown));
}

async function pastikanPola(page: Page, auth: Auth, shiftPagi: string): Promise<string> {
  const res = await api<unknown>(page, auth, "GET", "/polaroster");
  expect(res.status, `GET /polaroster: ${res.pesan}`).toBe(200);
  const ada = daftar(res.data).find((p) => p.namaPola === NAMA_POLA);
  if (ada) {
    const detail = (ada.detailSiklus ?? []) as { hariKe: number; shiftID: unknown }[];
    const hariPertama = detail.find((d) => d.hariKe === 1);
    expect(
      idDari(hariPertama?.shiftID),
      `hari 1 pola uji harus memakai shift uji; hapus pola "${NAMA_POLA}" agar dibuat ulang`,
    ).toBe(shiftPagi);
    return ada.id;
  }
  const buat = await api<unknown>(page, auth, "POST", "/polaroster", {
    namaPola: NAMA_POLA,
    siklusHari: 2,
    detailSiklus: [
      { hariKe: 1, isLibur: false, shiftID: shiftPagi },
      { hariKe: 2, isLibur: true, shiftID: null },
    ],
  });
  expect([200, 201], `POST /polaroster: ${buat.pesan}`).toContain(buat.status);
  return String(idDari(normalizeId(buat.data) as unknown));
}

export async function siapkanFixtureJadwal(page: Page, auth: Auth): Promise<FixtureJadwal> {
  const penggunaId = await idPengguna(page, auth);
  const shiftPagi = await pastikanShiftPagi(page, auth);
  const polaId = await pastikanPola(page, auth, shiftPagi);
  return { penggunaId, shiftPagi, polaId };
}

/** Bulan 30 hari pertama mulai dua bulan ke depan, agar tidak bersinggungan dengan jadwal berjalan. */
export function bulanUji(): BulanUji {
  const kini = new Date();
  for (let selisih = 2; selisih < 14; selisih++) {
    const awal = new Date(kini.getFullYear(), kini.getMonth() + selisih, 1);
    if (new Date(awal.getFullYear(), awal.getMonth() + 1, 0).getDate() === 30) {
      return { tahun: awal.getFullYear(), bulan: awal.getMonth(), selisih };
    }
  }
  throw new Error("bulan 30 hari tidak ditemukan");
}

export const tanggalUji = (b: BulanUji, hari: number) => tanggalLokal(new Date(b.tahun, b.bulan, hari));

export async function jadwalRentang(
  page: Page,
  auth: Auth,
  fx: FixtureJadwal,
  dari: string,
  sampai: string,
): Promise<JadwalMentah[]> {
  const res = await api<JadwalMentah[]>(
    page,
    auth,
    "GET",
    `/jadwalshift?startDate=${dari}&endDate=${sampai}&penggunaID=${fx.penggunaId}`,
  );
  expect(res.status, `GET /jadwalshift: ${res.pesan}`).toBe(200);
  return (res.data ?? []).filter((j) => j.karyawan?.id === fx.penggunaId);
}

export async function bersihkanHari(page: Page, auth: Auth, fx: FixtureJadwal, dari: string, sampai: string) {
  for (const j of await jadwalRentang(page, auth, fx, dari, sampai)) {
    const res = await api<unknown>(page, auth, "DELETE", `/jadwalshift/${j.id}`);
    expect.soft(res.status, `DELETE /jadwalshift/${j.id}: ${res.pesan}`).toBe(200);
  }
}

export async function buatJadwalApi(
  page: Page,
  auth: Auth,
  fx: FixtureJadwal,
  tanggal: string,
  shiftId: string,
): Promise<string> {
  const res = await api<{ ditolak: number }>(page, auth, "POST", "/jadwalshift", {
    penggunaId: fx.penggunaId,
    tanggal,
    isLibur: false,
    shiftIds: [shiftId],
    catatan: CATATAN_UJI,
  });
  expect(res.status, `POST /jadwalshift: ${res.pesan}`).toBe(201);
  expect(res.data.ditolak, `jadwal uji ${tanggal} ditolak backend`).toBe(0);
  const dibuat = (await jadwalRentang(page, auth, fx, tanggal, tanggal)).find((j) => j.shift?.id === shiftId);
  expect(dibuat, `jadwal uji ${tanggal} terbaca ulang lewat API`).toBeTruthy();
  return String(dibuat?.id);
}

export const labelBulan = (d: Date) => d.toLocaleString("id-ID", { month: "long", year: "numeric" });

/** Maju bulan demi bulan dari bulan berjalan lewat tombol di sebelah label bulan toolbar. */
export async function keBulanUji(page: Page, b: BulanUji) {
  const kini = new Date();
  for (let i = 0; i < b.selisih; i++) {
    const label = page.getByText(labelBulan(new Date(kini.getFullYear(), kini.getMonth() + i, 1)), { exact: true });
    await expect(label).toBeVisible({ timeout: 15_000 });
    const tunggu = page.waitForResponse(cocok("GET", POLA_DAFTAR_JADWAL));
    await label.locator("xpath=following-sibling::button[1]").click();
    await tunggu;
  }
  await expect(page.getByText(labelBulan(new Date(b.tahun, b.bulan, 1)), { exact: true })).toBeVisible();
}

export function barisKaryawan(page: Page): Locator {
  return page.locator("tbody tr").filter({ has: page.getByText(NAMA_PENGGUNA, { exact: true }) });
}

/** Sel pertama baris adalah nama karyawan, sehingga sel hari ke-n berada di indeks n. */
export const selHari = (page: Page, hari: number) => barisKaryawan(page).locator(":scope > td").nth(hari);

export const itemSel = (page: Page, hari: number) => selHari(page, hari).locator(":scope > div > div").first();

export async function pilihTanggalKalender(page: Page, selisihBulan: number, hari: number) {
  for (let i = 0; i < selisihBulan; i++) await page.getByRole("button", { name: /next month/i }).click();
  await page.getByRole("grid").getByText(String(hari), { exact: true }).click();
}

export async function pilihShift(page: Page, nama: string) {
  await page.getByRole("dialog").getByText("Pilih shift...").click();
  await page.getByRole("option", { name: new RegExp("^" + nama) }).click();
}