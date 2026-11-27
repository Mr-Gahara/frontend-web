import { test, expect } from "@playwright/test";
import { masukLokasiGudang, masukLokasiGudangTanpaLokasi } from "../../helpers/terkunci-uji";
import { BASIS, login } from "../../helpers/transfer-uji";

/*
 * Ruang mengikuti lokasi kerja (LK3a, modul/jadwal-shift.md): staf berlokasi
 * kerja Gudang tanpa akses-lintas-outlet hanya membuka ruang gudang. Pengguna
 * uji "E2E Lokasi Gudang" memegang seluruh izin baca Owner, sehingga ruang
 * outlet tertutup karena lokasi kerjanya, bukan karena izin.
 */

const PESAN_LUAR = "Ruang ini di luar lokasi kerja Anda.";

test.describe("Ruang mengikuti lokasi kerja", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await masukLokasiGudang(page);
  });

  test("/dashboard mengarah ke ruang gudang, dan pemilih ruang tidak menawarkan Ruang Outlet", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/gudang(\/|$)/);
    await page.getByText("Gudang Ops.").click();
    await expect(page.getByRole("menuitem", { name: /ruang gudang/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("menuitem", { name: /ruang outlet/i })).toHaveCount(0);
  });

  test("ruang outlet ditolak seluruhnya tanpa permintaan data, termasuk halaman tingkat toko", async ({ page }) => {
    const permintaanOutlet: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/(location\/current|pajak|penjualan)(\?|$|\/)/.test(r.url())) permintaanOutlet.push(r.url());
    });
    for (const path of ["/dashboard/outlet", "/dashboard/outlet/pengaturan/pajak", "/dashboard/outlet/penjualan"]) {
      await page.goto(BASIS + path);
      await expect(page.getByText(PESAN_LUAR), path).toBeVisible({ timeout: 15_000 });
    }
    expect(permintaanOutlet, "halaman ruang outlet tidak dipasang").toEqual([]);
  });

  test("lonceng di ruang gudang tidak memuat sumber outlet dan tidak menerima 403 (LN20a, LN21a)", async ({ page }) => {
    // Sumber outlet lonceng (modul/pemberitahuan.md, LN20a), ditambah langganan
    // dan hasil pengajuan saya (LN21a); halaman inventaris gudang sendiri tidak memintanya.
    const SUMBER_OUTLET =
      /\/api\/(produk|dashboard\/outlet|penjualan|sesikasir|sesibooking|membership|diskon|absensi\/monitoring|jadwalshift|akun\/langganan)(\?|$)|\/api\/stockopname\?.*tipeLokasi=Outlet|\/api\/pengajuanstok\?status=APPROVED/i;
    const permintaanOutlet: string[] = [];
    const ditolak: string[] = [];
    page.on("request", (r) => {
      if (SUMBER_OUTLET.test(r.url())) permintaanOutlet.push(r.url());
    });
    // Jadwal lokasi gudang adalah sumber gudang sejak PW20 (KS15a, absensi
    // gudang di kartu kesiapan); id gudang dibaca dari GET /location halaman.
    const idGudang = new Set<string>();
    page.on("response", async (r) => {
      if (/\/api\//.test(r.url()) && r.status() === 403) ditolak.push(`${r.request().method()} ${r.url()}`);
      if (r.request().method() === "GET" && /\/api\/location(\?|$)/.test(r.url()) && r.ok()) {
        const isi = (await r.json().catch(() => null)) as { data?: { _id?: string; id?: string; tipe?: string }[] } | null;
        for (const l of isi?.data ?? []) if (l.tipe === "Gudang") idGudang.add(String(l.id ?? l._id));
      }
    });
    // Staf gudang pemegang izin dashboard outlet beralih ke ringkasan gudang.
    const tRingkasanGudang = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/dashboard\/gudang(\?|$)/.test(r.url()),
    );
    await page.goto(BASIS + "/dashboard/gudang/inventaris");
    await expect(page.getByText("Gudang Ops.")).toBeVisible({ timeout: 15_000 });
    expect((await tRingkasanGudang).status()).toBe(200);
    await page.waitForLoadState("networkidle");
    const jadwalGudang = (u: string) =>
      /\/api\/jadwalshift\?/.test(u) && idGudang.has(new URL(u).searchParams.get("locationID") ?? "");
    expect(idGudang.size, "id gudang terbaca dari /location").toBeGreaterThan(0);
    expect(permintaanOutlet.filter((u) => !jadwalGudang(u)), "lonceng tidak meminta sumber outlet").toEqual([]);
    expect(ditolak, "tidak ada permintaan yang ditolak").toEqual([]);
  });

  test("halaman ruang gudang tetap terbuka", async ({ page }) => {
    await page.goto(BASIS + "/dashboard/gudang/inventaris");
    await expect(page.getByText("Gudang Ops.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(PESAN_LUAR)).toHaveCount(0);
  });
});

test.describe("Ruang mengikuti lokasi kerja tanpa read-location (B339)", () => {
  test("tipe lokasi kerja dibaca dari detail diri, sehingga ruang outlet tetap ditolak", async ({ page }) => {
    await login(page);
    await masukLokasiGudangTanpaLokasi(page);
    const tDetail = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/pengguna\/[0-9a-f]{24}$/i.test(r.url()),
    );
    await page.goto(BASIS + "/dashboard/outlet", { waitUntil: "commit" });
    const detail = await tDetail;
    expect(detail.status()).toBe(200);
    expect((await detail.json()).data.lokasiKerja?.tipe, "lokasiKerja terbaca tanpa read-location").toBe("Gudang");
    await expect(page.getByText(PESAN_LUAR)).toBeVisible({ timeout: 15_000 });
  });
});
