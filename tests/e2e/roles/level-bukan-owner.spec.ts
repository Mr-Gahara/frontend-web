import { expect, test, type Page } from "@playwright/test";
import { IZIN } from "../../../lib/auth/permissions";
import { masukSebagai, type PeranUji } from "../../helpers/terkunci-uji";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";

/*
 * Batas level role dari pengguna bukan Owner (RL3a; utang pengujian
 * kelompok 1, sebelumnya hanya teruji unit di form-role.test.ts). Pengguna
 * uji berperan level 90 dengan izin buat dan hapus posisi. Posisi yang
 * berhasil dibuat dihapus lewat API di finally.
 */

const PERAN: PeranUji = {
  nama: "E2E Pengelola Posisi",
  pin: "864238",
  deskripsi: "Peran uji e2e: izin baca Owner ditambah kelola posisi, level 90",
  izin: (n) => n.startsWith("read-") || n === IZIN.buatRole || n === IZIN.ubahRole || n === "delete-role",
};

const URL_KOSTUM = "/dashboard/outlet/pengaturan/roles/buatRole/kostum";
const POLA_ROLE = /\/api\/role(\?|$)/i;
const PESAN_FORM = "Level harus lebih rendah dari level Anda saat ini (90).";
const PESAN_BACKEND =
  "Anda tidak dapat membuat atau mengubah role dengan level melebihi atau setara dengan level Anda sendiri.";

async function bukaKostum(page: Page) {
  await page.goto(URL_KOSTUM);
  await expect(page.getByRole("checkbox").first()).toBeVisible({ timeout: 20_000 });
  return {
    nama: page.getByLabel(/nama posisi/i),
    level: page.getByLabel(/level/i),
    simpan: page.getByRole("button", { name: "Buat Posisi", exact: true }),
  };
}

async function hapusPosisi(page: Page, nama: string) {
  // Cookie sesi pengguna uji dibuang dulu (pola RG4a, `gantiKePenggunaUji`):
  // tanpa itu /login dapat memulihkan sesi pengguna uji bersamaan dengan login
  // Ridho, lalu login pengguna mengalihkan ke dashboard dan isian nama hilang
  // (suite penuh PW26, 28 November 2026).
  await page.goto("about:blank");
  await page.context().clearCookies();
  await login(page);
  const auth = await bukaDenganAuth(page, "/dashboard");
  const daftar = await api<{ id?: string; _id?: string; namaRole?: string }[]>(page, auth, "GET", "/role");
  const ada = (daftar.data ?? []).find((r) => r.namaRole === nama);
  if (!ada) return;
  const hapus = await api(page, auth, "DELETE", "/role/" + String(ada.id ?? ada._id));
  expect.soft(hapus.status, `hapus posisi uji: ${hapus.pesan}`).toBe(200);
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await masukSebagai(page, PERAN);
});

test("level diketahui: form menolak level setara dan di atas level pengguna tanpa permintaan, dan level di bawahnya tersimpan", async ({
  page,
}) => {
  const nama = `E2E Posisi Level ${Date.now()}`;
  let terkirim = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && POLA_ROLE.test(r.url())) terkirim += 1;
  });
  const f = await bukaKostum(page);
  await f.nama.fill(nama);
  for (const nilai of ["90", "95"]) {
    await f.level.fill(nilai);
    await f.simpan.click();
    await expect(page.getByText(PESAN_FORM), `level ${nilai}`).toBeVisible({ timeout: 10_000 });
  }
  expect(terkirim, "POST /role selama level ditolak form").toBe(0);

  try {
    await f.level.fill("89");
    const tJawab = page.waitForResponse((r) => r.request().method() === "POST" && POLA_ROLE.test(r.url()));
    await f.simpan.click();
    const jawab = await tJawab;
    expect(jawab.status(), "level 89 diterima backend").toBeLessThan(300);
    expect(jawab.request().postDataJSON()).toMatchObject({ namaRole: nama, level: 89 });
    const id = String(((await jawab.json()).data as { id?: string; _id?: string }).id ?? "");
    expect(id, "id posisi baru").not.toBe("");

    // Ubah oleh pengguna yang sama: batas yang sama, dan hanya level yang dikirim (RL2a).
    await page.goto(`/dashboard/outlet/pengaturan/roles/${id}/edit`);
    await expect(f.level).toHaveValue("89", { timeout: 20_000 });
    const simpanUbah = page.getByRole("button", { name: "Simpan Perubahan", exact: true });
    let put = 0;
    page.on("request", (r) => {
      if (r.method() === "PUT" && /\/api\/role\/[0-9a-f]{24}$/i.test(r.url())) put += 1;
    });
    await f.level.fill("90");
    await simpanUbah.click();
    await expect(page.getByText(PESAN_FORM)).toBeVisible({ timeout: 10_000 });
    expect(put, "PUT selama level ditolak form").toBe(0);
    await f.level.fill("88");
    const tUbah = page.waitForResponse((r) => r.request().method() === "PUT" && /\/api\/role\/[0-9a-f]{24}$/i.test(r.url()));
    await simpanUbah.click();
    const ubah = await tUbah;
    expect(ubah.request().postDataJSON(), "hanya level yang berubah").toEqual({ level: 88 });
    expect(ubah.status()).toBe(200);
  } finally {
    await hapusPosisi(page, nama);
  }
});

test("level tidak diketahui: form hanya menuntut bilangan bulat, dan penolakan backend 403 tampil (RL3a)", async ({
  page,
}) => {
  // simulasi: level pengguna tidak diketahui bila posisinya tidak ada di daftar role; posisi uji disaring dari respons nyata, sedangkan penolakan simpan datang dari backend sungguhan
  await page.route(POLA_ROLE, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const asli = await route.fetch();
    const body = await asli.json();
    body.data = (body.data ?? []).filter((r: { namaRole?: string }) => r.namaRole !== PERAN.nama);
    await route.fulfill({ response: asli, json: body });
  });
  const nama = `E2E Posisi Tanpa Level ${Date.now()}`;
  const f = await bukaKostum(page);
  await f.nama.fill(nama);
  await f.level.fill("95");
  const tJawab = page.waitForResponse((r) => r.request().method() === "POST" && POLA_ROLE.test(r.url()));
  try {
    await f.simpan.click();
    const jawab = await tJawab;
    expect(jawab.status(), "backend menolak level di atas level pengguna").toBe(403);
    await expect(page.getByText(PESAN_FORM)).toHaveCount(0);
    await expect(page.getByText(PESAN_BACKEND)).toBeVisible({ timeout: 10_000 });
    await expect(f.nama, "form bertahan").toHaveValue(nama);
  } finally {
    await page.unroute(POLA_ROLE);
    await hapusPosisi(page, nama);
  }
});
