import { test, expect, Page, Response } from "@playwright/test";

const URL_DAFTAR =
  "http://localhost:3000/dashboard/outlet/inventaris/stockAdjustment";

type RingkasAdjustment = { id: string; nomorAdjustment: string };
type ItemAdjustment = { namaSnapshot: string | null; qtyPhysical: number };
type DetailAdjustment = {
  nomorAdjustment: string;
  lokasi: { nama: string | null } | null;
  items?: ItemAdjustment[];
};

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
  return body.data as RingkasAdjustment[];
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

  test("daftar: kolom sumber yang hanya mengulang nomor jurnal tidak ditampilkan", async ({
    page,
  }) => {
    await bukaDaftar(page);
    await expect(page.getByText("Sumber / Referensi")).toHaveCount(0);
  });

  // Bergantung pada MAPPER_ADJUSTMENT_SUDAH_BENAR = false di features/stock-adjustment/tampilan.ts.
  test("detail: nilai yang belum dikirim server tampil sebagai strip, bukan 0", async ({
    page,
  }) => {
    const daftar = await bukaDaftar(page);
    test.skip(daftar.length === 0, "Belum ada stock adjustment di database");

    const tungguDetail = page.waitForResponse(responsDetail);
    await page.goto(`${URL_DAFTAR}/${daftar[0].id}`);
    const detail = (await (await tungguDetail).json()).data as DetailAdjustment;

    await expect(page.getByText("Sumber Dokumen")).toHaveCount(0);
    await expect(page.getByText("Alasan belum dikirim server.")).toBeVisible();

    const item = (detail.items ?? []).find((i) => i.namaSnapshot);
    test.skip(!item, "Jurnal pertama tidak punya item bernama");
    await expect(
      page.getByText("Saldo sistem dan koreksi belum dikirim server."),
    ).toBeVisible();
    const sel = barisBerisi(page, item!.namaSnapshot!).getByRole("cell");
    await expect(sel.nth(1)).toHaveText("-");
    await expect(sel.nth(2)).toHaveText(String(item!.qtyPhysical));
    await expect(sel.nth(3)).toHaveText("-");
  });
});