import { test, expect, type Page } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { cocok, pantauPermintaan, tunda, unik } from "../../helpers/reservasi-uji";

/*
 * Spec pengaturan gudang (keputusan GD2a): profil lokasi Gudang tenant
 * ditampilkan dari data nyata, perubahan disimpan sungguhan lewat
 * PUT /location/:id lalu dikembalikan lewat API di finally, dan jalur
 * gagal diuji dengan PUT yang dijawab JAWAB_GAGAL. Tenant uji punya tepat
 * satu gudang ("Gudang A"). Mode baca-saja bagi pengguna tanpa
 * update-location tidak teruji di sini, karena satu-satunya akun uji
 * berperan Owner.
 */

const URL_PENGATURAN = BASIS + "/dashboard/gudang/pengaturan";
const POLA_UBAH = /\/api\/location\/[0-9a-f]{24}$/i;

type GudangMentah = {
  id: string;
  tipe: string;
  nama: string;
  alamat: string;
  radiusAbsen: number;
  koordinat: { coordinates: [number, number] };
};

async function bukaPengaturan(page: Page): Promise<{ auth: Auth; gudang: GudangMentah }> {
  const auth = await bukaDenganAuth(page, URL_PENGATURAN);
  const r = await api<GudangMentah[]>(page, auth, "GET", "/location");
  expect(r.status, r.pesan).toBe(200);
  const gudang = r.data.find((l) => l.tipe === "Gudang");
  expect(gudang, "tenant uji harus punya lokasi Gudang").toBeTruthy();
  await expect(page.getByRole("heading", { name: "Profil Gudang" })).toBeVisible({ timeout: 15_000 });
  return { auth, gudang: gudang as GudangMentah };
}

/** Payload PUT yang mengembalikan profil gudang ke keadaan sebelum test. */
const payloadAsal = (g: GudangMentah) => ({
  nama: g.nama,
  alamat: g.alamat,
  latitude: g.koordinat.coordinates[1],
  longitude: g.koordinat.coordinates[0],
  radiusAbsen: g.radiusAbsen,
});

const isianNama = (page: Page) => page.getByLabel("Nama Gudang / Warehouse");
const tombolSimpan = (page: Page) => page.getByRole("button", { name: /simpan perubahan/i });

test.describe("Pengaturan gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil gudang tampil sesuai data tersimpan, dan simpan nonaktif sebelum ada perubahan", async ({ page }) => {
    const { gudang } = await bukaPengaturan(page);
    await expect(isianNama(page)).toHaveValue(gudang.nama);
    await expect(page.getByLabel("Alamat Lengkap")).toHaveValue(gudang.alamat);
    await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(String(gudang.koordinat.coordinates[1]));
    await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(String(gudang.koordinat.coordinates[0]));
    await expect(page.getByLabel("Radius Toleransi Absen (Meter)")).toHaveValue(String(gudang.radiusAbsen));
    await expect(tombolSimpan(page)).toBeDisabled();
  });

  test("perubahan nama gudang tersimpan, lalu dikembalikan", async ({ page }) => {
    const { auth, gudang } = await bukaPengaturan(page);
    const namaBaru = gudang.nama + " E2E " + unik();
    try {
      await isianNama(page).fill(namaBaru);
      const tUbah = page.waitForResponse(cocok("PUT", POLA_UBAH));
      await tombolSimpan(page).click();
      const res = await tUbah;
      expect(res.status()).toBe(200);
      expect(res.request().postDataJSON()).toEqual({ ...payloadAsal(gudang), nama: namaBaru });
      await expect(page.getByText("Profil Gudang Disimpan")).toBeVisible();
      await expect(isianNama(page)).toHaveValue(namaBaru);
      await expect(tombolSimpan(page)).toBeDisabled();
      const baca = await api<GudangMentah[]>(page, auth, "GET", "/location");
      expect(baca.data.find((l) => l.id === gudang.id)?.nama).toBe(namaBaru);
    } finally {
      const pulih = await api(page, auth, "PUT", "/location/" + gudang.id, payloadAsal(gudang));
      expect.soft(pulih.status, pulih.pesan).toBe(200);
    }
  });

  test("simpan yang gagal mempertahankan isian dan menampilkan pesan", async ({ page }) => {
    const { auth, gudang } = await bukaPengaturan(page);
    await page.route(POLA_UBAH, async (route) => {
      if (route.request().method() === "PUT") await route.fulfill(JAWAB_GAGAL);
      else await route.continue();
    });
    const namaBaru = gudang.nama + " Gagal " + unik();
    await isianNama(page).fill(namaBaru);
    await tombolSimpan(page).click();
    await expect(page.getByText("Gagal Menyimpan Profil Gudang")).toBeVisible();
    await expect(isianNama(page)).toHaveValue(namaBaru);
    await expect(tombolSimpan(page)).toBeEnabled();
    await page.unroute(POLA_UBAH);
    const baca = await api<GudangMentah[]>(page, auth, "GET", "/location");
    expect(baca.data.find((l) => l.id === gudang.id)?.nama).toBe(gudang.nama);
  });

  test("koordinat bukan angka tidak dikirim dan pesannya tampil", async ({ page }) => {
    await bukaPengaturan(page);
    await page.getByLabel("Latitude", { exact: true }).fill("abc");
    const pantau = pantauPermintaan(page, "PUT", POLA_UBAH);
    await tombolSimpan(page).click();
    await expect(page.getByText("Latitude harus berupa angka desimal.")).toBeVisible();
    await tunda(1_000);
    pantau.lepas();
    expect(pantau.jumlah()).toBe(0);
  });
});