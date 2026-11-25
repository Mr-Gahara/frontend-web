import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";
import { masukBacaSaja } from "../../helpers/terkunci-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../helpers/admin-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";

/*
 * Spec Profil Toko (keputusan PO12a sampai PO16a). Profil tenant dan lokasi
 * Outlet ditampilkan dari data nyata, dan setiap perubahan dijalankan lewat
 * UI lalu dikembalikan lewat UI; API hanya membaca bukti dan mengembalikan
 * data di finally bila test berhenti di tengah. Nama toko di sidebar dibaca
 * dari GET /tenant/:id (PO15a), sehingga ikut berubah setelah simpan dan
 * bertahan setelah muat ulang. Mode baca-saja tidak teruji di sini, karena
 * satu-satunya akun uji berperan Owner.
 */

const URL_PROFIL = BASIS + "/dashboard/outlet/pengaturan/toko";
const URL_INDEKS = BASIS + "/dashboard/outlet/pengaturan";
const POLA_TENANT = /\/api\/tenant\/[0-9a-f]{24}$/i;
const POLA_LOKASI = /\/api\/location\/[0-9a-f]{24}$/i;

type TenantMentah = {
  id: string;
  namaToko: string;
  alamat: string | null;
  kota: string | null;
  kodePos: string | null;
  nomorTelepon: string | null;
  emailBisnis: string | null;
  idNPWP: string | null;
  footerStruk: string | null;
  jamOperasional: unknown;
};

type OutletMentah = { id: string; tenantID: string; nama: string; alamat: string };

type Keadaan = { auth: Auth; tenant: TenantMentah; outlet: OutletMentah };

const namaToko = (page: Page) => page.getByLabel("Nama Toko", { exact: true });
const kodePos = (page: Page) => page.getByLabel("Kode Pos", { exact: true });
const alamatOutlet = (page: Page) => page.getByLabel("Alamat Lengkap");
const simpanToko = (page: Page) => page.getByRole("button", { name: "Simpan Profil Toko" });
const simpanLokasi = (page: Page) => page.getByRole("button", { name: "Simpan Lokasi Outlet" });
/** Nama toko di kepala sidebar; sejak kartu Logo Toko nama juga tampil di pratinjau struk. */
const diSidebar = (page: Page) => page.locator('[data-sidebar="sidebar"]');

const tungguPut = (page: Page, pola: RegExp) =>
  page.waitForResponse((r) => r.request().method() === "PUT" && pola.test(r.url()));

async function bacaTenant(page: Page, auth: Auth, id: string): Promise<TenantMentah> {
  const r = await api<TenantMentah>(page, auth, "GET", "/tenant/" + id);
  expect(r.status, r.pesan).toBe(200);
  return r.data;
}

async function bukaProfil(page: Page): Promise<Keadaan> {
  const auth = await bukaDenganAuth(page, URL_PROFIL);
  const lokasi = await api<OutletMentah>(page, auth, "GET", "/location/current");
  expect(lokasi.status, lokasi.pesan).toBe(200);
  expect(lokasi.data, "tenant uji harus punya lokasi Outlet").toBeTruthy();
  const tenant = await bacaTenant(page, auth, lokasi.data.tenantID);
  await expect(namaToko(page)).toHaveValue(tenant.namaToko, { timeout: 15_000 });
  await expect(alamatOutlet(page)).toHaveValue(lokasi.data.alamat, { timeout: 15_000 });
  return { auth, tenant, outlet: lokasi.data };
}

/** Menyimpan profil toko lewat UI dan mengembalikan payload yang terkirim. */
async function simpanProfil(page: Page) {
  const tPut = tungguPut(page, POLA_TENANT);
  await simpanToko(page).click();
  const res = await tPut;
  expect(res.status(), "PUT /tenant/:id").toBe(200);
  await expect(simpanToko(page)).toBeDisabled({ timeout: 15_000 });
  return res.request().postDataJSON() as Record<string, unknown>;
}

test.describe("Profil Toko", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("kartu Profil Toko di indeks pengaturan membuka halamannya", async ({ page }) => {
    await page.goto(URL_INDEKS);
    await page.locator('a[href="/dashboard/outlet/pengaturan/toko"]').click();
    await page.waitForURL(URL_PROFIL);
    await expect(page.getByRole("heading", { name: "Profil Toko", exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("profil toko dan lokasi outlet tampil sesuai data tersimpan, dan simpan nonaktif sebelum ada perubahan", async ({ page }) => {
    const { tenant, outlet } = await bukaProfil(page);
    await expect(page.getByLabel("Alamat", { exact: true })).toHaveValue(tenant.alamat ?? "");
    await expect(page.getByLabel("Kota", { exact: true })).toHaveValue(tenant.kota ?? "");
    await expect(kodePos(page)).toHaveValue(tenant.kodePos ?? "");
    await expect(page.getByLabel("Nomor Telepon", { exact: true })).toHaveValue(tenant.nomorTelepon ?? "");
    await expect(page.getByLabel("Email Bisnis", { exact: true })).toHaveValue(tenant.emailBisnis ?? "");
    await expect(page.getByLabel("NPWP", { exact: true })).toHaveValue(tenant.idNPWP ?? "");
    await expect(page.getByLabel("Catatan Kaki Struk")).toHaveValue(tenant.footerStruk ?? "");
    await expect(page.getByLabel("Nama Outlet")).toHaveValue(outlet.nama);
    await expect(simpanToko(page)).toBeDisabled();
    await expect(simpanLokasi(page)).toBeDisabled();
  });

  test("nama toko yang diubah tersimpan, tampil di sidebar, dan bertahan setelah muat ulang, lalu dikembalikan", async ({ page }) => {
    const { auth, tenant } = await bukaProfil(page);
    const baru = "E2E Toko " + unik();
    try {
      await namaToko(page).fill(baru);
      expect(await simpanProfil(page)).toEqual({ namaToko: baru });
      expect((await bacaTenant(page, auth, tenant.id)).namaToko).toBe(baru);
      await expect(diSidebar(page).getByText(baru, { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("pratinjau-struk").getByText(baru, { exact: true })).toBeVisible();

      await page.reload();
      await expect(namaToko(page)).toHaveValue(baru, { timeout: 15_000 });
      await expect(diSidebar(page).getByText(baru, { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Toko Tidak Diketahui")).toHaveCount(0);

      await namaToko(page).fill(tenant.namaToko);
      expect(await simpanProfil(page)).toEqual({ namaToko: tenant.namaToko });
      await expect(diSidebar(page).getByText(tenant.namaToko, { exact: true })).toBeVisible({ timeout: 15_000 });
    } finally {
      const kini = await api<TenantMentah>(page, auth, "GET", "/tenant/" + tenant.id);
      if (kini.data?.namaToko !== tenant.namaToko) {
        const r = await api(page, auth, "PUT", "/tenant/" + tenant.id, { namaToko: tenant.namaToko });
        expect.soft(r.status, "nama toko dikembalikan: " + r.pesan).toBe(200);
      }
    }
  });

  test("field opsional yang diisi tersimpan, dan yang dikosongkan dikirim sebagai teks kosong", async ({ page }) => {
    const { auth, tenant } = await bukaProfil(page);
    const asal = tenant.kodePos ?? "";
    const sementara = asal === "78000" ? "78001" : "78000";
    try {
      await kodePos(page).fill(sementara);
      expect(await simpanProfil(page)).toEqual({ kodePos: sementara });
      expect((await bacaTenant(page, auth, tenant.id)).kodePos).toBe(sementara);

      await kodePos(page).fill("");
      expect(await simpanProfil(page)).toEqual({ kodePos: "" });
      expect((await bacaTenant(page, auth, tenant.id)).kodePos ?? "").toBe("");

      if (asal !== "") {
        await kodePos(page).fill(asal);
        expect(await simpanProfil(page)).toEqual({ kodePos: asal });
      }
    } finally {
      const kini = await api<TenantMentah>(page, auth, "GET", "/tenant/" + tenant.id);
      if ((kini.data?.kodePos ?? "") !== asal) {
        const r = await api(page, auth, "PUT", "/tenant/" + tenant.id, { kodePos: asal });
        expect.soft(r.status, "kode pos dikembalikan: " + r.pesan).toBe(200);
      }
    }
  });

  test("nama toko kurang dari 3 karakter tidak dikirim dan pesannya tampil", async ({ page }) => {
    await bukaProfil(page);
    let jumlahPut = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (r.method() === "PUT" && POLA_TENANT.test(r.url())) jumlahPut++;
    };
    page.on("request", hitung);
    await namaToko(page).fill("ab");
    await simpanToko(page).click();
    await expect(page.getByText("Nama toko minimal 3 karakter")).toBeVisible();
    page.off("request", hitung);
    expect(jumlahPut).toBe(0);
  });

  test("simpan profil toko yang gagal mempertahankan isian dan menampilkan pesan", async ({ page }) => {
    const { auth, tenant } = await bukaProfil(page);
    const baru = "E2E Gagal " + unik();
    await page.route(POLA_TENANT, async (route) => {
      if (route.request().method() === "PUT") await route.fulfill(JAWAB_GAGAL);
      else await route.continue();
    });
    await namaToko(page).fill(baru);
    await simpanToko(page).click();
    await expect(page.getByText("Gagal Menyimpan Profil Toko")).toBeVisible({ timeout: 15_000 });
    await expect(namaToko(page)).toHaveValue(baru);
    await expect(simpanToko(page)).toBeEnabled();
    await page.unroute(POLA_TENANT);
    expect((await bacaTenant(page, auth, tenant.id)).namaToko).toBe(tenant.namaToko);
  });

  test("alamat outlet yang diubah tersimpan, lalu dikembalikan", async ({ page }) => {
    const { auth, outlet } = await bukaProfil(page);
    const baru = "Jl. E2E Outlet " + unik();
    const simpan = async () => {
      const tPut = tungguPut(page, POLA_LOKASI);
      await simpanLokasi(page).click();
      const res = await tPut;
      expect(res.status(), "PUT /location/:id").toBe(200);
      await expect(simpanLokasi(page)).toBeDisabled({ timeout: 15_000 });
      return res.request().postDataJSON() as Record<string, unknown>;
    };
    try {
      await alamatOutlet(page).fill(baru);
      expect(await simpan()).toMatchObject({ alamat: baru });
      const dibaca = await api<OutletMentah>(page, auth, "GET", "/location/current");
      expect(dibaca.data.alamat).toBe(baru);
      await expect(alamatOutlet(page)).toHaveValue(baru);

      await alamatOutlet(page).fill(outlet.alamat);
      expect(await simpan()).toMatchObject({ alamat: outlet.alamat });
    } finally {
      const kini = await api<OutletMentah>(page, auth, "GET", "/location/current");
      if (kini.data?.alamat !== outlet.alamat) {
        const r = await api(page, auth, "PUT", "/location/" + outlet.id, { alamat: outlet.alamat });
        expect.soft(r.status, "alamat outlet dikembalikan: " + r.pesan).toBe(200);
      }
    }
  });
});

test.describe("Profil Toko: jam buka (JB8a, P81, B331)", () => {
  test("jam buka diatur lewat kartu Jam Buka, tersimpan utuh di jamOperasional, lalu dikembalikan", async ({ page }) => {
    await login(page);
    const { auth, tenant } = await bukaProfil(page);
    const asal = tenant.jamOperasional ?? null;
    const simpanJam = page.getByRole("button", { name: "Simpan Jam Buka" });
    try {
      // Mulai dari belum diatur agar isian awal pasti tanpa pilihan.
      const kosong = await api(page, auth, "PUT", "/tenant/" + tenant.id, { jamOperasional: null });
      expect(kosong.status, "jamOperasional dikosongkan: " + kosong.pesan).toBe(200);
      await page.reload();
      await expect(simpanJam).toBeVisible({ timeout: 15_000 });

      await page.getByRole("group", { name: "Toko buka kapan?" }).getByRole("button", { name: /^Jam tertentu/ }).click();
      const senin = page
        .getByRole("list", { name: "Jam buka per hari" })
        .getByRole("listitem", { name: "Senin", exact: true });
      await senin.getByLabel("Jam buka Senin (jam)").fill("07");
      await senin.getByLabel("Jam buka Senin (menit)").fill("00");
      await senin.getByLabel("Jam tutup Senin (jam)").fill("01");
      await senin.getByLabel("Jam tutup Senin (menit)").fill("00");
      await page.getByRole("button", { name: "Samakan semua hari dengan Senin" }).click();
      const tPut = tungguPut(page, POLA_TENANT);
      await simpanJam.click();
      const res = await tPut;
      expect(res.status(), "PUT /tenant/:id").toBe(200);
      const hari = Array.from({ length: 7 }, () => ({ status: "buka", jamBuka: "07:00", jamTutup: "01:00" }));
      expect(res.request().postDataJSON()).toEqual({ jamOperasional: { mode: "tertentu", hari } });
      expect((await bacaTenant(page, auth, tenant.id)).jamOperasional).toEqual({ mode: "tertentu", hari });

      // Setelah dipasang ulang, isian menampilkan nilai tersimpan dan simpan nonaktif.
      await expect(senin.getByLabel("Jam tutup Senin (jam)")).toHaveValue("01", { timeout: 15_000 });
      await expect(senin.getByText("Tutup keesokan harinya, Selasa pukul 01.00")).toBeVisible();
      await expect(simpanJam).toBeDisabled();
    } finally {
      const r = await api(page, auth, "PUT", "/tenant/" + tenant.id, { jamOperasional: asal });
      expect.soft(r.status, "jamOperasional dikembalikan: " + r.pesan).toBe(200);
    }
  });
});

test.describe("Profil Toko: pengguna baca-saja", () => {
  test("kartu profil dan lokasi outlet hanya dibaca, tanpa tombol simpan dan deteksi lokasi", async ({ page }) => {
    await login(page);
    await masukBacaSaja(page);
    await page.goto(URL_PROFIL);
    await expect(page.getByRole("heading", { name: "Profil Toko", exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(namaToko(page)).not.toHaveValue("");
    await expect(namaToko(page)).toHaveAttribute("readonly", "");
    await expect(page.getByLabel("Latitude", { exact: true })).toHaveAttribute("readonly", "");
    await expect(page.getByRole("button", { name: "Simpan Profil Toko" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Simpan Lokasi Outlet" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Deteksi Otomatis" })).toHaveCount(0);
  });
});

test.describe("toko tanpa outlet (akun klien sekali pakai)", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("kartu lokasi menampilkan Outlet Belum Didaftarkan dengan tautan ke Setup, tanpa form lokasi, dan kartu profil tetap tampil", async ({
    page,
  }) => {
    // Wizard berhenti sesudah Owner, sebelum langkah lokasi outlet.
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("tachyon.panduan.otomatis", "mati"));
    const { id } = await akunBaru(page, "profil-tanpa-outlet");
    try {
      await isiTokoDanOwner(page);
      const tLokasi = page.waitForResponse(
        (r) => r.request().method() === "GET" && /\/api\/location\/current(\?|$)/.test(r.url()),
      );
      await page.goto(URL_PROFIL, { waitUntil: "commit" });
      const lokasi = await tLokasi;
      expect(lokasi.status(), "outlet tenant dibaca walau belum ada").toBeLessThan(500);
      await expect(page.getByText("Outlet Belum Didaftarkan")).toBeVisible({ timeout: 15_000 });
      // Setup outlet lewat wizard web, bukan aplikasi (pemilik proyek, 25 November 2026).
      await expect(page.getByText("Lengkapi langkah Lokasi outlet di Setup lebih dulu.")).toBeVisible();
      await expect(page.getByRole("link", { name: "Lengkapi setup" })).toHaveAttribute("href", "/setup");
      await expect(page.getByRole("button", { name: "Simpan Lokasi Outlet" })).toHaveCount(0);
      await expect(namaToko(page)).toHaveValue("Kopi Senja E2E");
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });
});
