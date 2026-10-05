import { test, expect, type Request } from "@playwright/test";
import { BASIS, api, login, type Auth } from "../../helpers/transfer-uji";
import {
  NAMA_PROFIL,
  PIN_PROFIL,
  URL_PROFIL,
  loginSebagai,
  siapkanPenggunaProfil,
} from "../../helpers/profil-uji";
import { IZIN, bolehBukaRute } from "../../../lib/auth/permissions";
import type { Page } from "@playwright/test";

/*
 * Gerbang rute dari IZIN_HALAMAN (keputusan GR1a sampai GR7a), dipasang di
 * app/dashboard/layout.tsx. Sisi tertolak diuji dengan pengguna uji profil,
 * yang perannya tidak memegang read-pengguna: izin peran itu dibaca dari
 * backend, lalu rute yang semestinya tertolak dihitung dengan bolehBukaRute
 * yang sama dengan gerbang. Tidak ada data yang ditulis selain pemulihan
 * pengguna uji oleh helper profil.
 */
const PESAN = "Anda tidak memiliki izin membuka halaman ini.";
const ID_TIDAK_ADA = "000000000000000000000000";
const OUTLET = "/dashboard/outlet";

type Mentah = { id?: string; _id?: string; nama?: string };
const idMilik = (x: Mentah | undefined | null) => String(x?.id ?? x?._id ?? "");

/** Nama izin milik peran pengguna uji, dibaca lewat Ridho. */
async function izinPenggunaUji(page: Page, auth: Auth, id: string): Promise<string[]> {
  const pengguna = await api<{ roleID?: unknown }>(page, auth, "GET", "/pengguna/" + id);
  expect(pengguna.status, `GET /pengguna/:id: ${pengguna.pesan}`).toBe(200);
  const mentah = pengguna.data?.roleID;
  const roleID = typeof mentah === "string" ? mentah : idMilik(mentah as Mentah);
  const peran = await api<{ permissions?: unknown[] }>(page, auth, "GET", "/role/" + roleID);
  expect(peran.status, `GET /role/:id: ${peran.pesan}`).toBe(200);
  const semua = await api<Mentah[]>(page, auth, "GET", "/permission");
  expect(semua.status, `GET /permission: ${semua.pesan}`).toBe(200);
  const namaDariId = new Map((semua.data ?? []).map((p) => [idMilik(p), p.nama ?? ""]));
  return (peran.data?.permissions ?? []).map((x) =>
    typeof x === "string"
      ? (namaDariId.get(x) ?? x)
      : ((x as Mentah).nama ?? namaDariId.get(idMilik(x as Mentah)) ?? ""),
  );
}

const CALON = [
  {
    nama: "daftar pengguna",
    path: `${OUTLET}/pengguna`,
    pola: /\/api\/(pengguna|role)(\?.*)?$/i,
  },
  {
    nama: "ubah posisi (rute berparameter, halaman form)",
    path: `${OUTLET}/pengaturan/roles/${ID_TIDAK_ADA}/edit`,
    pola: /\/api\/role(\/|\?|$)/i,
  },
  {
    nama: "ubah produk (rute berparameter, halaman form)",
    path: `${OUTLET}/inventaris/produk/${ID_TIDAK_ADA}/edit`,
    pola: /\/api\/(produk|kategori)(\/|\?|$)/i,
  },
];

test.describe("Gerbang rute dashboard", () => {
  test("tanpa izin: pesan di tempat, isi tidak dipasang, dan rute tanpa syarat tetap terbuka", async ({
    page,
    browser,
  }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const izin = await izinPenggunaUji(page, auth, id);
    test.skip(
      !izin.includes(IZIN.dashboardOutlet),
      "Peran pengguna uji profil tidak memegang read-dashboard-outlet, sehingga layout outlet mengalihkannya sebelum gerbang rute",
    );
    const ditolak = CALON.filter((c) => !bolehBukaRute(c.path, izin));
    expect(
      ditolak.map((c) => c.nama),
      "peran pengguna uji profil tidak memegang read-pengguna",
    ).toContain("daftar pengguna");

    const ctx = await browser.newContext();
    const hal = await ctx.newPage();
    try {
      await loginSebagai(hal, NAMA_PROFIL, PIN_PROFIL);
      for (const c of ditolak) {
        await test.step(`${c.nama}: ditolak tanpa permintaan data`, async () => {
          let terkirim = 0;
          const catat = (req: Request) => {
            if (c.pola.test(req.url())) terkirim += 1;
          };
          hal.on("request", catat);
          await hal.goto(BASIS + c.path);
          await expect(hal.getByRole("main").getByText(PESAN)).toBeVisible({ timeout: 20_000 });
          await expect(hal).toHaveURL(BASIS + c.path);
          // Beri waktu bagi permintaan yang keliru terkirim, bila isi halaman
          // ternyata dipasang.
          await hal.waitForTimeout(1_000);
          hal.off("request", catat);
          expect(terkirim, `permintaan data ${c.nama}`).toBe(0);
        });
      }
      await test.step("profil (rute tanpa syarat) tetap terbuka", async () => {
        await hal.goto(URL_PROFIL);
        await expect(hal.getByLabel(/Nama Lengkap/)).toHaveValue(NAMA_PROFIL, { timeout: 20_000 });
        await expect(hal.getByRole("main").getByText(PESAN)).toHaveCount(0);
      });
    } finally {
      await ctx.close();
    }
  });

  test("pemilik seluruh izin: halaman form dan rute berparameter tetap dipasang", async ({ page }) => {
    await login(page);

    await page.goto(`${BASIS}${OUTLET}/pengaturan/roles/buatRole`, { waitUntil: "commit" });
    const daftar = await page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/role(\?.*)?$/i.test(r.url()),
      { timeout: 20_000 },
    );
    expect(daftar.status(), "GET /role dari halaman buat posisi").toBe(200);
    await expect(page.getByRole("main").getByText(PESAN)).toHaveCount(0);

    await page.goto(`${BASIS}${OUTLET}/pengaturan/roles/${ID_TIDAK_ADA}/edit`, {
      waitUntil: "commit",
    });
    const detail = await page.waitForResponse(
      (r) => r.request().method() === "GET" && r.url().endsWith("/api/role/" + ID_TIDAK_ADA),
      { timeout: 20_000 },
    );
    expect(detail.ok(), "detail posisi yang tidak ada dijawab gagal oleh backend").toBe(false);
    await expect(page.getByRole("main").getByText(PESAN)).toHaveCount(0);
  });
});