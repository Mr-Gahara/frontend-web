import { test, expect, Page, Response } from "@playwright/test";
import type { StockAdjustment } from "../../../../types/stockOpname";
import { formatKoreksi, susunSumber } from "../../../../features/stock-adjustment/tampilan";
import { normalizeId } from "../../../../lib/api/normalize";
import { ADA_IZIN_LINTAS, JALUR_TERKUNCI, MENUNGGU_IZIN_LINTAS } from "../../../helpers/lintas-outlet";

const URL_DAFTAR =
  "http://localhost:3000/dashboard/outlet/inventaris/stockAdjustment";

type RingkasAdjustment = StockAdjustment;
type DetailAdjustment = StockAdjustment;

// ============================================================
// HELPER: Login
// ============================================================
async function login(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/dashboard");
}

// ============================================================
// HELPER: Respons server sebagai sumber data uji
// ============================================================
function responsDaftar(r: Response) {
  return (
    r.request().method() === "GET" &&
    /\/api\/stockopname\/adjustments(\?|$)/.test(r.url())
  );
}

function responsDetail(r: Response) {
  return (
    r.request().method() === "GET" &&
    /\/api\/stockopname\/adjustments\/[^/?]+/.test(r.url())
  );
}

/** Membuka halaman daftar dan mengembalikan data yang dikirim server. */
async function bukaDaftar(page: Page): Promise<RingkasAdjustment[]> {
  const tunggu = page.waitForResponse(responsDaftar);
  await page.goto(URL_DAFTAR);
  const res = await tunggu;
  expect(res.status()).toBe(200);
  const body = await res.json();
  await expect(
    page.getByRole("heading", { name: /jurnal penyesuaian stok/i }),
  ).toBeVisible();
  // Dinormalkan seperti lib/api/client.ts: objek bersarang seperti
  // referenceID masih membawa _id di respons mentah. Ruang outlet hanya
  // menampilkan adjustment lokasi Outlet, sehingga harapan disaring sama.
  return (normalizeId(body.data) as RingkasAdjustment[]).filter((a) => a.lokasi?.tipe === "Outlet");
}

function barisBerisi(page: Page, teks: string) {
  return page.getByRole("row").filter({ hasText: teks });
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Stock adjustment outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar: menampilkan jurnal yang dikirim server", async ({ page }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length === 0, "Belum ada stock adjustment di database");

    for (const a of daftar.slice(0, 5)) {
      await expect(barisBerisi(page, a.nomorAdjustment)).toBeVisible();
    }
  });

  test("daftar: pencarian menyaring berdasarkan nomor jurnal", async ({
    page,
  }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length < 2, "Butuh minimal dua stock adjustment");
    const [a, b] = daftar;

    await page.getByPlaceholder("Cari nomor jurnal...").fill(a.nomorAdjustment);

    await expect(barisBerisi(page, a.nomorAdjustment)).toBeVisible();
    await expect(barisBerisi(page, b.nomorAdjustment)).toHaveCount(0);
  });

  test("tanpa izin lintas outlet: hanya adjustment outlet tenant", async ({ page }) => {
    test.skip(ADA_IZIN_LINTAS, JALUR_TERKUNCI);
    await page.goto(URL_DAFTAR, { waitUntil: "commit" });
    const tAktif = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/location\/current(\?|$)/.test(r.url()),
    );
    const tDaftar = page.waitForResponse(responsDaftar);
    const aktif = ((await (await tAktif).json()) as { data: { id?: string; _id?: string } | null }).data;
    const idAktif = aktif?.id ?? aktif?._id;
    expect(idAktif, "outlet tenant dari /location/current").toBeTruthy();
    const rDaftar = await tDaftar;
    expect(new URL(rDaftar.url()).searchParams.get("locationID")).toBe(idAktif);
    const daftar = normalizeId((await rDaftar.json()).data) as RingkasAdjustment[];
    expect(daftar.every((a) => a.lokasi?.id === idAktif)).toBe(true);
    await expect(page.getByText("Semua Outlet", { exact: true })).toHaveCount(0);
  });

  test("lintas outlet: semua outlet tanpa adjustment gudang", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
    await page.goto(URL_DAFTAR, { waitUntil: "commit" });
    const rDaftar = await page.waitForResponse(responsDaftar);
    expect(new URL(rDaftar.url()).searchParams.has("locationID")).toBe(false);
    const semua = normalizeId((await rDaftar.json()).data) as RingkasAdjustment[];
    for (const a of semua.filter((x) => x.lokasi?.tipe !== "Outlet").slice(0, 5)) {
      await expect(barisBerisi(page, a.nomorAdjustment)).toHaveCount(0);
    }
    for (const a of semua.filter((x) => x.lokasi?.tipe === "Outlet").slice(0, 5)) {
      await expect(barisBerisi(page, a.nomorAdjustment)).toBeVisible();
    }
  });

  test("lintas outlet: pilih satu outlet mengirim locationID", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
    const daftar = await bukaDaftar(page);
    const target = daftar.find((a) => a.lokasi?.id && a.lokasi?.nama);
    const namaTarget = target?.lokasi?.nama;
    test.skip(!target || !namaTarget, "Belum ada stock adjustment outlet");
    const tTersaring = page.waitForResponse(
      (r) => responsDaftar(r) && new URL(r.url()).searchParams.get("locationID") === target!.lokasi!.id,
    );
    await page.getByText("Semua Outlet", { exact: true }).click();
    await page.getByRole("option", { name: namaTarget!, exact: true }).click();
    const hasil = normalizeId((await (await tTersaring).json()).data) as RingkasAdjustment[];
    expect(hasil.every((a) => a.lokasi?.id === target!.lokasi!.id)).toBe(true);
    await expect(barisBerisi(page, target!.nomorAdjustment)).toBeVisible();
  });

  test("daftar: gagal memuat tampil sebagai pesan, bukan daftar kosong", async ({ page }) => {
    const pola = /\/api\/stockopname\/adjustments(\?|$)/;
    await page.route(pola, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_DAFTAR);
    await expect(page.getByText(/gagal memuat jurnal penyesuaian stok/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Belum ada riwayat penyesuaian stok.")).toHaveCount(0);
    await page.unroute(pola);
  });

  test("detail: dibuka dari daftar, isinya sesuai server, lalu kembali", async ({
    page,
  }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length === 0, "Belum ada stock adjustment di database");
    const a = daftar[0];

    const tungguDetail = page.waitForResponse(responsDetail);
    await barisBerisi(page, a.nomorAdjustment)
      .getByRole("button", { name: /lihat audit trail/i })
      .click();

    await expect(page).toHaveURL(new RegExp(`/stockAdjustment/${a.id}$`));
    const res = await tungguDetail;
    expect(res.status()).toBe(200);
    const detail = (await res.json()).data as DetailAdjustment;

    await expect(
      page.getByRole("heading", { name: /detail jurnal penyesuaian/i }),
    ).toBeVisible();
    await expect(page.getByText(/no\. ref:/i)).toContainText(
      detail.nomorAdjustment,
    );
    if (detail.lokasi?.nama) {
      await expect(
        page.getByText(detail.lokasi.nama, { exact: true }),
      ).toBeVisible();
    }
    for (const item of detail.items ?? []) {
      if (!item.namaSnapshot) continue;
      const baris = barisBerisi(page, item.namaSnapshot);
      await expect(baris).toBeVisible();
      await expect(baris).toContainText(String(item.qtyPhysical));
    }

    await page.getByRole("button", { name: /kembali ke daftar jurnal/i }).click();
    await expect(
      page.getByRole("heading", { name: /jurnal penyesuaian stok/i }),
    ).toBeVisible();
  });

  test("detail: id yang tidak ada menampilkan pesan dan tombol kembali", async ({
    page,
  }) => {
    await page.goto(`${URL_DAFTAR}/000000000000000000000000`);

    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: /kembali ke daftar/i }).click();
    await expect(
      page.getByRole("heading", { name: /jurnal penyesuaian stok/i }),
    ).toBeVisible();
  });

  test("daftar: kolom sumber menampilkan asal adjustment dari server", async ({
    page,
  }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length === 0, "Belum ada stock adjustment di database");
    const a = daftar[0];
    expect(a.referenceType).not.toBeNull();

    await expect(page.getByRole("columnheader", { name: /^sumber$/i })).toBeVisible();
    const sel = barisBerisi(page, a.nomorAdjustment).getByRole("cell");
    await expect(sel.nth(2)).toHaveText(susunSumber(a).label);
  });

  test("detail: saldo, koreksi, alasan, dan sumber mengikuti respons server", async ({
    page,
  }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length === 0, "Belum ada stock adjustment di database");

    const tungguDetail = page.waitForResponse(responsDetail);
    await page.goto(`${URL_DAFTAR}/${daftar[0].id}`);
    const detail = normalizeId((await (await tungguDetail).json()).data) as DetailAdjustment;

    expect(detail.referenceType).not.toBeNull();
    const sumber = susunSumber(detail);
    const baris = page.getByText(/sumber dokumen:/i);
    await expect(baris).toContainText(sumber.label);
    if (sumber.href) {
      await expect(baris.getByRole("link")).toHaveAttribute("href", sumber.href);
    }
    if (detail.alasan) {
      await expect(page.getByText(detail.alasan)).toBeVisible();
    }
    await expect(page.getByRole("columnheader", { name: /catatan ekstra/i })).toHaveCount(0);

    const item = (detail.items ?? []).find((i) => i.namaSnapshot);
    test.skip(!item, "Jurnal pertama tidak punya item bernama");
    const sel = barisBerisi(page, item!.namaSnapshot!).getByRole("cell");
    await expect(sel.nth(1)).toContainText(String(item!.qtyCurrent));
    if (item!.qtySnapshot !== item!.qtyCurrent) {
      await expect(sel.nth(1)).toContainText(`Saat draf: ${item!.qtySnapshot}`);
    }
    await expect(sel.nth(2)).toHaveText(String(item!.qtyPhysical));
    await expect(sel.nth(3)).toHaveText(formatKoreksi(item!.qtyDifference));
  });
});