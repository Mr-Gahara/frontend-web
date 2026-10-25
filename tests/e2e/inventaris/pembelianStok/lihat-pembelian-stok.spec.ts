import { test, expect, type Page, type Request, type Response } from "@playwright/test";
import { BASIS, login } from "../../../helpers/transfer-uji";

const URL_OUTLET = `${BASIS}/dashboard/outlet/inventaris/pembelianStok`;
const URL_GUDANG = `${BASIS}/dashboard/gudang/pembelianStok`;
const POLA_DAFTAR = /\/api\/pembelianstok\?/;
const ID_TIDAK_ADA = "000000000000000000000000";

type Relasi = { _id?: string; id?: string };
type LokasiMentah = Relasi & { tipe: string; nama?: string };
type HalamanMentah = { data: Relasi[] };

function idDari(x: Relasi | null | undefined) {
  return x?.id ?? x?._id ?? "";
}

/** Isi respons, dengan atau tanpa amplop { data }. */
function isiData<T>(json: unknown): T {
  const j = json as { data?: T } | null;
  return (j && typeof j === "object" && "data" in j ? j.data : json) as T;
}

function tanggalLokal(d: Date) {
  const dd = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
}

function periodeBulanIni() {
  const sekarang = new Date();
  return {
    dari: tanggalLokal(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)),
    sampai: tanggalLokal(sekarang),
  };
}

const mintaDaftar = (r: Request) => r.method() === "GET" && POLA_DAFTAR.test(r.url());
const query = (r: Request) => Object.fromEntries(new URL(r.url()).searchParams);

/** Tabel dicocokkan dengan respons halaman itu: pesan kosong, atau satu baris per pembelian. */
async function cocokkanTabel(page: Page, respons: Response) {
  expect(respons.status()).toBe(200);
  const halaman = (await respons.json()) as HalamanMentah;
  if (halaman.data.length === 0) {
    await expect(page.getByText("Belum ada pembelian pada filter ini.")).toBeVisible();
  } else {
    await expect(page.getByRole("row")).toHaveCount(halaman.data.length + 1);
  }
}

test.describe("Pembelian stok: daftar dan detail", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("outlet: daftar meminta lokasi outlet, periode bulan berjalan, halaman 1 dan 10 baris", async ({ page }) => {
    await page.goto(URL_OUTLET, { waitUntil: "commit" });
    const [lokasiRes, permintaan] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "GET" && /\/api\/location\/current/.test(r.url())),
      page.waitForRequest(mintaDaftar),
    ]);
    const isi = isiData<LokasiMentah | LokasiMentah[]>(await lokasiRes.json());
    const lokasi = Array.isArray(isi) ? isi[0] : isi;
    const { dari, sampai } = periodeBulanIni();

    expect(query(permintaan)).toEqual({ locationID: idDari(lokasi), dari, sampai, page: "1", limit: "10" });
    await expect(page.getByRole("heading", { name: "Pembelian Stok" })).toBeVisible();
    await cocokkanTabel(page, (await permintaan.response())!);
  });

  test("gudang: daftar meminta lokasi Gudang pertama, dan menu Pembelian Stok tersedia", async ({ page }) => {
    await page.goto(URL_GUDANG, { waitUntil: "commit" });
    const [lokasiRes, permintaan] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "GET" && /\/api\/location(\?|$)/.test(r.url())),
      page.waitForRequest(mintaDaftar),
    ]);
    const daftarLokasi = isiData<LokasiMentah[]>(await lokasiRes.json());
    const gudang = daftarLokasi.find((l) => l.tipe === "Gudang");
    expect(gudang, "tenant uji punya lokasi Gudang").toBeTruthy();

    expect(query(permintaan).locationID).toBe(idDari(gudang));
    // Item sidebar tanpa sub-menu dirender SidebarMenuButton sebagai button, bukan link.
    await expect(page.getByRole("button", { name: "Pembelian Stok", exact: true })).toBeVisible();
    await cocokkanTabel(page, (await permintaan.response())!);
  });

  test("cari supplier mengirim nama terpangkas setelah jeda, dari halaman 1", async ({ page }) => {
    await page.goto(URL_OUTLET);
    const kotak = page.getByLabel("Cari supplier");
    await expect(kotak).toBeEnabled();

    const permintaanCari = page.waitForRequest(
      (r) => mintaDaftar(r) && new URL(r.url()).searchParams.get("supplier") === "manis",
    );
    await kotak.fill("  manis ");
    const permintaan = await permintaanCari;

    expect(query(permintaan)).toMatchObject({ supplier: "manis", page: "1", limit: "10" });
    await cocokkanTabel(page, (await permintaan.response())!);
  });

  test("daftar yang gagal dimuat tampil sebagai pesan tanpa tabel", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "Uji gagal memuat" }),
      }),
    );
    await page.goto(URL_OUTLET);

    await expect(page.getByRole("alert").filter({ hasText: "Gagal memuat pembelian stok" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("detail yang tidak ada menampilkan pesan tidak ditemukan di kedua ruang", async ({ page }) => {
    for (const url of [URL_OUTLET, URL_GUDANG]) {
      await page.goto(`${url}/${ID_TIDAK_ADA}`, { waitUntil: "commit" });
      const respons = await page.waitForResponse(
        (r) => r.request().method() === "GET" && r.url().includes(`/api/pembelianstok/${ID_TIDAK_ADA}`),
      );
      expect(respons.status()).toBe(404);

      await expect(page.getByText("Pembelian tidak ditemukan.")).toBeVisible();
      await page.getByRole("button", { name: "Kembali ke Daftar" }).click();
      await expect(page).toHaveURL(url);
    }
  });
});