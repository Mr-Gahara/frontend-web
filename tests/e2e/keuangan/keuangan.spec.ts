import { expect, test, type Page } from "@playwright/test";
import { JAWAB_GAGAL, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { cocok, hapusLewatApi, pantauPermintaan, unik } from "../../helpers/reservasi-uji";

/*
 * Spec pembanding modul keuangan, ditulis dan dijalankan terhadap kode lama
 * sebelum migrasi (pola keputusan R1a). Akun kas uji dibuat lewat UI dengan
 * nama unik, dibaca ulang lewat API, lalu dihapus lewat API di finally
 * (keputusan KU4a). Respons sukses tidak dipalsukan (keputusan rancangan
 * butir 21). Mutasi arus kas (KU1a), kegagalan kartu ringkasan (KU2a), dan
 * persentase pertumbuhan laba tidak diuji di sini, karena perilakunya
 * berubah saat migrasi.
 */

const URL_AKUN = "/dashboard/outlet/keuangan/akunkas";
const URL_BUAT_AKUN = "/dashboard/outlet/keuangan/akunkas/buatAkunKas";
const URL_LABA_RUGI = "/dashboard/outlet/keuangan/ringkasanLabaRugi";
const POLA_AKUN = /\/api\/akunkas(\?|$)/i;
const POLA_LABA_RUGI = /\/api\/laporan\/laba-rugi(\?|$)/i;

type AkunKasUji = { id: string; namaAkun: string; saldo: number };
type BarisLabaRugi = {
  totalOmzet: number;
  totalBebanOperasional: number;
  totalLabaBersih: number;
};

const rupiah = (nilai: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(nilai)
    .replace(/\u00a0/g, " ");

const daftarDari = <T>(body: unknown): T[] => {
  const b = body as { data?: unknown };
  if (Array.isArray(b)) return b as T[];
  return Array.isArray(b?.data) ? (b.data as T[]) : [];
};

const jumlah = <T>(daftar: T[], ambil: (x: T) => unknown) =>
  daftar.reduce((s, x) => s + (Number(ambil(x)) || 0), 0);

const kartuAkun = (page: Page, nama: string) =>
  page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: nama, exact: true }) })
    .filter({ hasText: "Saldo Saat Ini" })
    .last();

const nilaiKartuRingkasan = (page: Page, judul: string) =>
  page
    .locator("div")
    .filter({ has: page.getByText(judul, { exact: true }) })
    .filter({ has: page.locator("h3") })
    .last()
    .locator("h3");

async function isiFormAkunValid(page: Page, nama: string) {
  await page.getByRole("combobox").filter({ hasText: "Kas Fisik" }).click();
  await page.getByRole("option", { name: "Rekening Bank" }).click();
  await page.locator('input[name="namaAkun"]').fill(nama);
  await page.locator('input[name="nomorAkun"]').fill("E2E-" + unik());
  await page.getByPlaceholder("Catatan tambahan untuk akun ini...").fill("E2E keuangan");
  const saldo = page.getByPlaceholder("0", { exact: true });
  await saldo.fill("125000");
  await expect(saldo).toHaveValue("125.000");
}

test.describe("E2E — Keuangan", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar akun kas menampilkan setiap akun dari backend", async ({ page }) => {
    await page.goto(URL_AKUN, { waitUntil: "commit" });
    const res = await page.waitForResponse(cocok("GET", POLA_AKUN));
    const daftar = daftarDari<AkunKasUji>(await res.json());
    expect(daftar.length, "data uji punya akun kas").toBeGreaterThan(0);
    await expect(page.getByText("Saldo Saat Ini", { exact: true })).toHaveCount(daftar.length);
    for (const akun of daftar) {
      await expect(page.getByRole("heading", { name: akun.namaAkun, exact: true }).first()).toBeVisible();
    }
  });

  test("buat akun kas: nama dan nomor kosong menampilkan pesan tanpa mengirim permintaan", async ({ page }) => {
    await page.goto(URL_BUAT_AKUN);
    const kirim = pantauPermintaan(page, "POST", POLA_AKUN);
    await page.getByRole("button", { name: "Simpan Akun Kas" }).click();
    await expect(page.getByText("Nama Akun wajib diisi.")).toBeVisible();
    await expect(page.getByText("Nomor Akun wajib diisi.")).toBeVisible();
    expect(kirim.jumlah(), "validasi gagal tidak mengirim POST").toBe(0);
    kirim.lepas();
  });

  test("buat akun kas berhasil: payload utuh, kembali ke daftar, dan akun tersimpan (KU4a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const nama = "E2E Keuangan Akun " + unik();
    let id: string | undefined;
    try {
      await page.goto(URL_BUAT_AKUN);
      await isiFormAkunValid(page, nama);
      const tKirim = page.waitForResponse(cocok("POST", POLA_AKUN));
      await page.getByRole("button", { name: "Simpan Akun Kas" }).click();
      const res = await tKirim;
      const body = await res.json().catch(() => ({}));
      expect(res.status(), `POST /akunkas: ${JSON.stringify(body).slice(0, 200)}`).toBeLessThan(300);
      const payload = res.request().postDataJSON();
      expect(payload).toEqual({
        tipeAkun: "Rekening Bank",
        namaAkun: nama,
        nomorAkun: expect.stringMatching(/^E2E-/),
        keterangan: "E2E keuangan",
        saldo: 125000,
        status: "aktif",
      });
      await page.waitForURL(/\/keuangan\/akunkas$/);
      await expect(kartuAkun(page, nama)).toContainText(rupiah(125000));
      const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
      expect(baca.status, "baca ulang akun kas: " + baca.pesan).toBe(200);
      const tersimpan = (baca.data ?? []).find((a) => a.namaAkun === nama);
      expect(tersimpan, "akun uji tersimpan di backend").toBeTruthy();
      id = tersimpan?.id;
      expect(Number(tersimpan?.saldo)).toBe(125000);
    } finally {
      if (!id) {
        const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
        id = (baca.data ?? []).find((a) => a.namaAkun === nama)?.id;
      }
      await hapusLewatApi(page, auth, "/akunkas", id);
    }
  });

  test("buat akun kas gagal: pesan tampil dan halaman tetap", async ({ page }) => {
    await page.goto(URL_BUAT_AKUN);
    await isiFormAkunValid(page, "E2E Keuangan Gagal " + unik());
    await page.route(POLA_AKUN, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.getByRole("button", { name: "Simpan Akun Kas" }).click();
    await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
    await expect(page).toHaveURL(/\/buatAkunKas$/);
    await page.unroute(POLA_AKUN);
  });

  test("laba rugi: periode harian dan mingguan mengirim rentang tanggal dan menampilkan total laba bersih", async ({
    page,
  }) => {
    await page.goto(URL_LABA_RUGI);
    await expect(page.getByText("Laba Bulan Ini")).toBeVisible();
    for (const [tombol, periode, label] of [
      ["Harian", "harian", "Laba Hari Ini"],
      ["Mingguan", "mingguan", "Laba Minggu Ini"],
    ] as const) {
      const tRes = page.waitForResponse(
        (r) => r.request().method() === "GET" && POLA_LABA_RUGI.test(r.url()) && r.url().includes("periode=" + periode),
      );
      await page.getByRole("button", { name: tombol, exact: true }).click();
      const res = await tRes;
      const url = new URL(res.url());
      const mulai = url.searchParams.get("startDate");
      const akhir = url.searchParams.get("endDate");
      expect(mulai && akhir, "startDate dan endDate terkirim").toBeTruthy();
      expect(new Date(akhir!).getTime()).toBeGreaterThan(new Date(mulai!).getTime());
      const daftar = daftarDari<BarisLabaRugi>(await res.json());
      const total = jumlah(daftar, (x) => x.totalLabaBersih);
      await expect(page.getByText(label)).toBeVisible();
      await expect(
        page.locator("div").filter({ hasText: "vs periode sebelumnya" }).filter({ hasText: rupiah(total) }).first(),
      ).toBeVisible();
    }
  });

  test("kartu ringkasan: omzet, pengeluaran, dan laba bulan ini serta saldo kas total sesuai respons", async ({
    page,
  }) => {
    const tLaba = page.waitForResponse(
      (r) => r.request().method() === "GET" && POLA_LABA_RUGI.test(r.url()) && r.url().includes("periode=bulanan"),
    );
    const tAkun = page.waitForResponse(cocok("GET", POLA_AKUN));
    await page.goto(URL_AKUN, { waitUntil: "commit" });
    const laba = daftarDari<BarisLabaRugi>(await (await tLaba).json());
    const akun = daftarDari<AkunKasUji>(await (await tAkun).json());
    const harapan: [string, number][] = [
      ["Total Omzet Bulan Ini", jumlah(laba, (x) => x.totalOmzet)],
      ["Total Pengeluaran", jumlah(laba, (x) => x.totalBebanOperasional)],
      ["Laba Bersih", jumlah(laba, (x) => x.totalLabaBersih)],
      ["Saldo Kas Total", jumlah(akun, (x) => x.saldo)],
    ];
    for (const [judul, nilai] of harapan) {
      await expect(nilaiKartuRingkasan(page, judul), judul).toHaveText(rupiah(nilai));
    }
  });
});