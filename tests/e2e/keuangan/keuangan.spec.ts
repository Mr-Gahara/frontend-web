import { expect, test, type Page, type Response } from "@playwright/test";
import { JAWAB_GAGAL, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { cocok, pantauPermintaan, unik } from "../../helpers/reservasi-uji";
import { persentasePertumbuhan, teksPertumbuhan } from "../../../features/laporan/periode";
import { keTanggalLokal } from "../../../lib/waktu";

/*
 * Spec modul keuangan. Bagian pembandingnya ditulis dan dijalankan terhadap
 * kode lama sebelum migrasi (pola keputusan R1a). Akun kas uji dibuat lewat
 * UI dengan nama unik, dibaca ulang lewat API, lalu dihapus lewat API di
 * finally (keputusan KU4a). Respons sukses tidak dipalsukan (keputusan
 * rancangan butir 21). Skenario KU1a, KU2a, KU5a, KU6a, dan KU7a ditambahkan
 * saat migrasi.
 */

const URL_AKUN = "/dashboard/outlet/keuangan/akunkas";
const URL_BUAT_AKUN = "/dashboard/outlet/keuangan/akunkas/buatAkunKas";
const URL_LABA_RUGI = "/dashboard/outlet/keuangan/ringkasanLabaRugi";
const URL_MUTASI = "/dashboard/outlet/keuangan/mutasiArusKas";
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

/**
 * Respons laba rugi untuk satu periode. Sejak KU5a halaman meminta periode
 * berjalan dan periode sebelumnya sekaligus; keduanya dibedakan lewat
 * endDate: periode berjalan berakhir hari ini (YYYY-MM-DD lokal, kontrak
 * backend 465b438), pembandingnya sebelum hari ini.
 */
const responsLabaRugi = (periode: string, kini: boolean) => (r: Response) => {
  if (r.request().method() !== "GET" || !POLA_LABA_RUGI.test(r.url())) return false;
  const url = new URL(r.url());
  if (url.searchParams.get("periode") !== periode) return false;
  return (url.searchParams.get("endDate") === keTanggalLokal(new Date())) === kini;
};

async function isiFormAkunValid(
  page: Page,
  nama: string,
  saldo: { ketik: string; tampil: string } | null = { ketik: "125000", tampil: "125.000" },
) {
  await page.getByRole("combobox").filter({ hasText: "Kas Fisik" }).click();
  await page.getByRole("option", { name: "Rekening Bank" }).click();
  await page.locator('input[name="namaAkun"]').fill(nama);
  await page.locator('input[name="nomorAkun"]').fill("E2E-" + unik());
  await page.getByPlaceholder("Catatan tambahan untuk akun ini...").fill("E2E keuangan");
  if (saldo) {
    const isian = page.getByPlaceholder("0", { exact: true });
    await isian.fill(saldo.ketik);
    await expect(isian).toHaveValue(saldo.tampil);
  }
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

  test("payload buat akun kas membawa saldo awal berformat, tanpa menyimpan (KU4a)", async ({ page }) => {
    await bukaDenganAuth(page, URL_AKUN);
    const nama = "E2E Keuangan Akun " + unik();
    await page.goto(URL_BUAT_AKUN);
    await isiFormAkunValid(page, nama);
    // Akun bersaldo tidak dapat ditutup sejak backend 465b438 (hapus tidak ada,
    // nonaktif mensyaratkan saldo 0), sehingga payload bersaldo hanya diperiksa
    // lewat POST yang dijawab gagal.
    await page.route(POLA_AKUN, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    try {
      const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_AKUN.test(r.url()));
      await page.getByRole("button", { name: "Simpan Akun Kas" }).click();
      expect((await tKirim).postDataJSON()).toEqual({
        tipeAkun: "Rekening Bank",
        namaAkun: nama,
        nomorAkun: expect.stringMatching(/^E2E-/),
        keterangan: "E2E keuangan",
        saldo: 125000,
        status: "aktif",
      });
    } finally {
      await page.unroute(POLA_AKUN);
    }
  });

  test("buat akun kas berhasil: tersimpan bersaldo 0, kembali ke daftar, lalu dinonaktifkan (KU4a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const nama = "E2E Keuangan Akun " + unik();
    let id: string | undefined;
    try {
      await page.goto(URL_BUAT_AKUN);
      await isiFormAkunValid(page, nama, null);
      const tKirim = page.waitForResponse(cocok("POST", POLA_AKUN));
      await page.getByRole("button", { name: "Simpan Akun Kas" }).click();
      const res = await tKirim;
      const body = await res.json().catch(() => ({}));
      expect(res.status(), `POST /akunkas: ${JSON.stringify(body).slice(0, 200)}`).toBeLessThan(300);
      expect(res.request().postDataJSON()).toEqual({
        tipeAkun: "Rekening Bank",
        namaAkun: nama,
        nomorAkun: expect.stringMatching(/^E2E-/),
        keterangan: "E2E keuangan",
        saldo: 0,
        status: "aktif",
      });
      await page.waitForURL(/\/keuangan\/akunkas$/);
      await expect(kartuAkun(page, nama)).toContainText(rupiah(0));
      const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
      expect(baca.status, "baca ulang akun kas: " + baca.pesan).toBe(200);
      const tersimpan = (baca.data ?? []).find((a) => a.namaAkun === nama);
      expect(tersimpan, "akun uji tersimpan di backend").toBeTruthy();
      id = tersimpan?.id;
      expect(Number(tersimpan?.saldo)).toBe(0);
    } finally {
      if (!id) {
        const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
        id = (baca.data ?? []).find((a) => a.namaAkun === nama)?.id;
      }
      // Akun kas tidak dapat dihapus sejak backend 465b438; akun uji bersaldo 0
      // ditutup lewat status non-aktif agar tidak menghabiskan kuota 10 akun aktif.
      if (id) {
        const tutup = await api(page, auth, "PUT", "/akunkas/" + id, { status: "non-aktif" });
        expect.soft(tutup.status, `nonaktifkan akun kas uji: ${tutup.pesan}`).toBe(200);
      }
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
      const tRes = page.waitForResponse(responsLabaRugi(periode, true));
      await page.getByRole("button", { name: tombol, exact: true }).click();
      const res = await tRes;
      const url = new URL(res.url());
      expect(res.status(), `GET laba rugi ${periode}`).toBe(200);
      const mulai = url.searchParams.get("startDate") ?? "";
      const akhir = url.searchParams.get("endDate") ?? "";
      expect(mulai, "startDate berbentuk YYYY-MM-DD").toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(akhir, "endDate hari ini").toBe(keTanggalLokal(new Date()));
      if (periode === "harian") expect(mulai, "harian: startDate sama dengan endDate").toBe(akhir);
      else expect(mulai <= akhir, "mingguan: startDate tidak sesudah endDate").toBe(true);
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

  test("daftar akun kas gagal dimuat: pesan tampil, bukan keadaan kosong, dan saldo kas total '-' (KU6a, KU2a)", async ({
    page,
  }) => {
    await page.route(POLA_AKUN, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_AKUN);
    await expect(page.getByText("Gagal memuat daftar akun kas")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Belum ada Akun Kas")).toHaveCount(0);
    await expect(nilaiKartuRingkasan(page, "Saldo Kas Total")).toHaveText("-");
    await page.unroute(POLA_AKUN);
  });

  test("kartu ringkasan laba rugi gagal dimuat: '-' dan keterangan, bukan Rp0 (KU2a)", async ({ page }) => {
    await page.route(POLA_LABA_RUGI, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    const tAkun = page.waitForResponse(cocok("GET", POLA_AKUN));
    await page.goto(URL_AKUN, { waitUntil: "commit" });
    const akun = daftarDari<AkunKasUji>(await (await tAkun).json());
    for (const judul of ["Total Omzet Bulan Ini", "Total Pengeluaran", "Laba Bersih"]) {
      await expect(nilaiKartuRingkasan(page, judul), judul).toHaveText("-", { timeout: 20000 });
    }
    await expect(page.getByText("Gagal memuat data", { exact: true })).toHaveCount(3);
    await expect(nilaiKartuRingkasan(page, "Saldo Kas Total")).toHaveText(rupiah(jumlah(akun, (x) => x.saldo)));
    await page.unroute(POLA_LABA_RUGI);
  });

  test("buat akun kas: nama dan nomor berisi spasi saja ditolak tanpa mengirim permintaan (KU7a)", async ({ page }) => {
    await page.goto(URL_BUAT_AKUN);
    const kirim = pantauPermintaan(page, "POST", POLA_AKUN);
    await page.locator('input[name="namaAkun"]').fill("   ");
    await page.locator('input[name="nomorAkun"]').fill("  ");
    await page.getByRole("button", { name: "Simpan Akun Kas" }).click();
    await expect(page.getByText("Nama Akun wajib diisi.")).toBeVisible();
    await expect(page.getByText("Nomor Akun wajib diisi.")).toBeVisible();
    expect(kirim.jumlah(), "isian spasi saja tidak mengirim POST").toBe(0);
    kirim.lepas();
  });

  test("laba rugi: pertumbuhan dihitung dari periode sebelumnya yang diminta bersamaan (KU5a)", async ({ page }) => {
    await page.goto(URL_LABA_RUGI);
    await expect(page.getByText("Laba Bulan Ini")).toBeVisible();
    const tKini = page.waitForResponse(responsLabaRugi("harian", true));
    const tLalu = page.waitForResponse(responsLabaRugi("harian", false));
    await page.getByRole("button", { name: "Harian", exact: true }).click();
    const [resKini, resLalu] = await Promise.all([tKini, tLalu]);
    const lalu = new URL(resLalu.url());
    const kemarin = new Date();
    kemarin.setDate(kemarin.getDate() - 1);
    expect(lalu.searchParams.get("startDate"), "awal pembanding").toBe(keTanggalLokal(kemarin));
    expect(lalu.searchParams.get("endDate"), "akhir pembanding").toBe(keTanggalLokal(kemarin));
    expect(resKini.status(), "GET laba rugi berjalan").toBe(200);
    expect(resLalu.status(), "GET laba rugi pembanding").toBe(200);
    const totalKini = jumlah(daftarDari<BarisLabaRugi>(await resKini.json()), (x) => x.totalLabaBersih);
    const totalLalu = jumlah(daftarDari<BarisLabaRugi>(await resLalu.json()), (x) => x.totalLabaBersih);
    const harapan = teksPertumbuhan(persentasePertumbuhan(totalKini, totalLalu));
    await expect(
      page.getByText("vs periode sebelumnya").locator("xpath=preceding-sibling::span[1]"),
      "badge pertumbuhan",
    ).toHaveText(harapan);
  });

  test("mutasi arus kas menampilkan keterangan belum tersedia tanpa data tiruan (KU1a)", async ({ page }) => {
    await page.goto(URL_MUTASI);
    await expect(page.getByText("Mutasi arus kas belum tersedia")).toBeVisible();
    await expect(page.getByText("Setoran harian Outlet A")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Download CSV" })).toHaveCount(0);
  });
});