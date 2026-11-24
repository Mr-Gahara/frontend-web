import { expect, test, type Page } from "@playwright/test";
import { ROLE_TEMPLATES } from "../../../lib/roleTemplates";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { masukSebagai, type PeranUji } from "../../helpers/terkunci-uji";

/*
 * Role dari template dipakai login dan membuka halaman yang dijanjikan
 * templatnya (utang pengujian kelompok 1: sebelumnya hanya pemetaan nama izin
 * yang teruji). Peran uji memegang tepat izin template beserta levelnya, dan
 * izinnya diturunkan dari daftar izin Owner, sehingga nama template yang tidak
 * ada di seed membuat jumlahnya berbeda dan diperiksa lebih dulu. Halaman
 * dibuktikan dari judulnya dan dari jawaban backend atas permintaan daftarnya,
 * agar gerbang web dan izin route backend sama-sama teruji.
 */

const template = (id: string) => {
  const t = ROLE_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} tidak ada`);
  return t;
};

const peranDariTemplate = (id: string, pin: string): PeranUji => {
  const t = template(id);
  const izin = new Set(t.permissions);
  return {
    nama: `E2E Template ${t.namaRole}`,
    pin,
    deskripsi: `Peran uji e2e: izin template ${t.namaRole}`,
    izin: (n) => izin.has(n),
    level: t.level,
  };
};

interface Halaman {
  url: string;
  judul: string;
  /** Permintaan daftar yang membuktikan backend menerima izin itu. */
  api: RegExp;
}

const HALAMAN_STOK: Halaman[] = [
  { url: "/dashboard/outlet/inventaris/stockOpname", judul: "Stok Opname", api: /\/api\/stockopname(\?|$)/i },
  { url: "/dashboard/gudang/stockOpname", judul: "Stok Opname Gudang", api: /\/api\/stockopname(\?|$)/i },
  {
    url: "/dashboard/outlet/inventaris/stockAdjustment",
    judul: "Jurnal Penyesuaian Stok",
    api: /\/api\/stockopname\/adjustments(\?|$)/i,
  },
  {
    url: "/dashboard/gudang/stockAdjustment",
    judul: "Jurnal Penyesuaian Stok Gudang",
    api: /\/api\/stockopname\/adjustments(\?|$)/i,
  },
  { url: "/dashboard/outlet/inventaris/pembelianStok", judul: "Pembelian Stok", api: /\/api\/pembelianstok(\?|$)/i },
  { url: "/dashboard/gudang/pembelianStok", judul: "Pembelian Stok", api: /\/api\/pembelianstok(\?|$)/i },
  { url: "/dashboard/outlet/rekap-absensi", judul: "Rekap Absensi", api: /\/api\/absensi\/rekap(\?|$)/i },
];

const ditolak = (page: Page) => page.getByRole("heading", { name: "Akses ditolak" });

async function bukaHalaman(page: Page, h: Halaman) {
  const jawab = page.waitForResponse((r) => r.request().method() === "GET" && h.api.test(r.url()), {
    timeout: 20_000,
  });
  await page.goto(h.url);
  await expect(page.getByRole("heading", { level: 1, name: h.judul, exact: true }), h.url).toBeVisible({
    timeout: 20_000,
  });
  expect((await jawab).status(), `${h.url}: jawaban backend`).toBe(200);
  await expect(ditolak(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("seluruh nama izin template ada di seed (izin role Owner)", async ({ page }) => {
  const auth = await bukaDenganAuth(page, "/dashboard");
  const daftar = await api<{ namaRole?: string; permissions?: { nama?: string }[] }[]>(page, auth, "GET", "/role");
  expect(daftar.status).toBe(200);
  const owner = (daftar.data ?? []).find((r) => /^owner$/i.test(r.namaRole ?? ""));
  const izinOwner = new Set((owner?.permissions ?? []).map((p) => p.nama));
  for (const t of ROLE_TEMPLATES) {
    expect.soft(t.permissions.filter((n) => !izinOwner.has(n)), `${t.namaRole}: izin di luar seed`).toEqual([]);
  }
});

const KASUS = [
  { id: "supervisor", pin: "864231", catat: false },
  { id: "manajer", pin: "864232", catat: true },
  { id: "general-manajer", pin: "864233", catat: true },
] as const;

for (const kasus of KASUS) {
  test(`template ${template(kasus.id).namaRole} membuka stock opname, adjustment, pembelian stok, dan rekap absensi`, async ({
    page,
  }) => {
    await masukSebagai(page, peranDariTemplate(kasus.id, kasus.pin));
    for (const h of HALAMAN_STOK) await bukaHalaman(page, h);

    // Buat opname dijanjikan ketiga template (create-stock-opname).
    await bukaHalaman(page, HALAMAN_STOK[0]);
    await expect(page.getByRole("button", { name: "Buat Opname Baru" })).toBeVisible();

    // Catat pembelian hanya untuk Manajer dan General Manajer (RH6a).
    await bukaHalaman(page, HALAMAN_STOK[4]);
    const catat = page.getByRole("link", { name: /Catat Pembelian/ });
    if (kasus.catat) {
      await expect(catat).toBeVisible();
      await page.goto("/dashboard/outlet/inventaris/pembelianStok/catatPembelian");
      await expect(page.getByRole("heading", { level: 1, name: "Catat Pembelian" })).toBeVisible({ timeout: 20_000 });
    } else {
      await expect(catat).toHaveCount(0);
      await page.goto("/dashboard/outlet/inventaris/pembelianStok/catatPembelian");
      await expect(ditolak(page)).toBeVisible({ timeout: 20_000 });
    }
  });
}

test("template Kasir tidak dapat membuka stock opname, adjustment, pembelian stok, dan rekap absensi", async ({
  page,
}) => {
  // GerbangRute (app/dashboard/layout.tsx) membungkus layout ruang, sehingga
  // rute yang izinnya tidak dipegang ditolak sebelum layout mengalihkan.
  await masukSebagai(page, peranDariTemplate("kasir", "864234"));
  for (const h of HALAMAN_STOK) {
    let diminta = false;
    const catat = (r: { method(): string; url(): string }) => {
      if (r.method() === "GET" && h.api.test(r.url())) diminta = true;
    };
    page.on("request", catat);
    await page.goto(h.url);
    await expect(ditolak(page), h.url).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: h.judul, exact: true })).toHaveCount(0);
    page.off("request", catat);
    expect(diminta, `${h.url}: daftar tidak diminta`).toBe(false);
  }
});
