import { expect, test, type Page } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { masukBacaSaja } from "../../helpers/terkunci-uji";
import { tanpaLuberWadah } from "../../helpers/tata-letak-uji";
import { formatRupiah } from "../../../lib/format";

/*
 * Modul membership (desain B kanvas "Modul Membership", MB1a sampai MB3a;
 * pemilik proyek, 17 November 2026). Seluruh operasi lewat UI (keputusan
 * rancangan butir 23); API hanya mencari pelanggan dan penjualan yang
 * memenuhi syarat, membaca bukti, dan membersihkan sisa run yang gagal.
 * Respons sukses tidak dipalsukan (butir 21). Membership uji dihapus di
 * akhir, sehingga penjualan yang dipakai kembali tersedia untuk run
 * berikutnya; paket uji juga dihapus.
 */

const URL_MEMBERSHIP = BASIS + "/dashboard/outlet/membership";
const PREFIKS = "E2E Paket Member";

type Mentah = { id?: string; _id?: string };
type PaketMentah = Mentah & { namaPaket: string; status: string };
type MemberMentah = Mentah & { penjualan?: { id: string } | null; paketMembership?: { namaPaket: string } | null };
type PelangganMentah = Mentah & { namaPelanggan: string; isBawaan?: boolean };
type PenjualanMentah = Mentah & { statusPenjualan: string; noReferensi: string };
const idDari = (x: Mentah) => String(x.id ?? x._id);

async function buka(page: Page): Promise<Auth> {
  const auth = await bukaDenganAuth(page, URL_MEMBERSHIP);
  await expect(page.getByRole("heading", { name: "Manajemen Membership" })).toBeVisible({ timeout: 15_000 });
  return auth;
}

/** Sisa run gagal: membership dari paket uji, lalu paket uji itu sendiri. */
async function bersihkan(page: Page, auth: Auth) {
  const member = await api<MemberMentah[]>(page, auth, "GET", "/membership");
  for (const m of member.data ?? []) {
    if (m.paketMembership?.namaPaket.startsWith(PREFIKS)) {
      expect.soft((await api(page, auth, "DELETE", `/membership/${idDari(m)}`)).status).toBeLessThan(300);
    }
  }
  const paket = await api<PaketMentah[]>(page, auth, "GET", "/paketmembership");
  for (const p of paket.data ?? []) {
    if (p.namaPaket.startsWith(PREFIKS)) {
      expect.soft((await api(page, auth, "DELETE", `/paketmembership/${idDari(p)}`)).status).toBeLessThan(300);
    }
  }
}

/** Pelanggan bukan bawaan dengan penjualan bukan VOID yang belum dipakai membership. */
async function cariPelangganBerpenjualan(page: Page, auth: Auth) {
  const dipakai = new Set(
    ((await api<MemberMentah[]>(page, auth, "GET", "/membership")).data ?? []).map((m) => m.penjualan?.id),
  );
  const pelanggan = (await api<PelangganMentah[]>(page, auth, "GET", "/pelanggan")).data ?? [];
  for (const p of pelanggan.filter((x) => !x.isBawaan)) {
    const pj = await api<PenjualanMentah[]>(page, auth, "GET", `/penjualan?pelangganID=${idDari(p)}&page=1&limit=50`);
    const tersedia = (pj.data ?? []).find((x) => x.statusPenjualan !== "VOID" && !dipakai.has(idDari(x)));
    if (tersedia) return { nama: p.namaPelanggan, noReferensi: tersedia.noReferensi };
  }
  return null;
}

async function tambahPaket(page: Page, nama: string) {
  await page.getByRole("tab", { name: "Paket" }).click();
  await page.getByRole("button", { name: "Tambah Paket" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama paket *").fill(nama);
  await dialog.getByLabel("Harga (Rp) *").fill("100000");
  await dialog.getByLabel("Durasi (hari) *").fill("30");
  const tPost = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/paketmembership$/.test(r.url()));
  await dialog.getByRole("button", { name: "Simpan" }).click();
  expect((await tPost).status(), "POST /paketmembership").toBe(201);
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  return page.getByRole("article", { name: `Paket ${nama}` });
}

test.describe("Membership", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tab Paket: tambah, ubah harga, nonaktifkan, lalu hapus paket lewat dialog", async ({ page }) => {
    const auth = await buka(page);
    await bersihkan(page, auth);
    const nama = `${PREFIKS} ${Date.now()}`;
    const kartu = await tambahPaket(page, nama);
    await expect(kartu).toContainText(formatRupiah(100_000).replace(/ /g, " "));
    await expect(kartu).toContainText("30 hari · 0 member aktif");

    await kartu.getByRole("button", { name: `Aksi paket ${nama}` }).click();
    await page.getByRole("menuitem", { name: "Ubah" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Nama paket *")).toHaveValue(nama);
    await dialog.getByLabel("Harga (Rp) *").fill("120000");
    const tPut = page.waitForResponse((r) => r.request().method() === "PUT" && /\/api\/paketmembership\//.test(r.url()));
    await dialog.getByRole("button", { name: "Simpan" }).click();
    const put = await tPut;
    expect(put.status()).toBe(200);
    expect(put.request().postDataJSON(), "hanya field yang berubah").toEqual({ harga: 120_000 });
    await expect(kartu).toContainText(formatRupiah(120_000).replace(/ /g, " "));

    await kartu.getByRole("button", { name: `Aksi paket ${nama}` }).click();
    await page.getByRole("menuitem", { name: "Nonaktifkan" }).click();
    await expect(kartu).toContainText("Non-Aktif");

    await kartu.getByRole("button", { name: `Aksi paket ${nama}` }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Hapus" }).click();
    await expect(kartu).toHaveCount(0, { timeout: 15_000 });
  });

  test("daftarkan member dari penjualan pelanggan, ubah tanggal mulai, lencana di laman Pelanggan, lalu hapus", async ({ page }) => {
    const auth = await buka(page);
    await bersihkan(page, auth);
    const target = await cariPelangganBerpenjualan(page, auth);
    test.skip(!target, "Tidak ada pelanggan dengan penjualan yang belum dipakai membership");
    const nama = `${PREFIKS} ${Date.now()}`;
    await tambahPaket(page, nama);
    try {
      await page.getByRole("tab", { name: "Member" }).click();
      await page.getByRole("button", { name: "Daftarkan Member" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("combobox", { name: "Pelanggan *" }).click();
      await page.getByPlaceholder("Cari nama pelanggan...").last().fill(target!.nama);
      await page.getByRole("option", { name: new RegExp(`^${target!.nama}`) }).first().click();
      await dialog.getByText(nama, { exact: true }).click();
      await dialog.getByText(target!.noReferensi, { exact: true }).click();
      await expect(dialog).toContainText("Berlaku sampai");
      const tPost = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/membership$/.test(r.url()));
      await dialog.getByRole("button", { name: "Daftarkan" }).click();
      const post = await tPost;
      expect(post.status(), "POST /membership").toBe(201);
      expect(Object.keys(post.request().postDataJSON()).sort()).toEqual(["paketMembershipID", "pelangganID", "penjualanID", "tanggalMulai"]);
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      const baris = page.getByRole("row").filter({ hasText: nama });
      await expect(baris).toContainText(target!.nama);
      await expect(baris).toContainText("sisa 30 hari");

      // Ubah: pelanggan dan penjualan terkunci, hanya tanggal mulai yang dikirim.
      await baris.getByRole("button", { name: /^Aksi membership/ }).click();
      await page.getByRole("menuitem", { name: "Ubah" }).click();
      await expect(dialog.getByRole("combobox", { name: "Pelanggan *" })).toHaveCount(0);
      await expect(dialog).toContainText(target!.noReferensi);
      await dialog.getByRole("button", { name: /^Tanggal mulai/ }).click();
      await page.getByRole("button", { name: /next month/i }).click();
      const bulanDepan = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      await page
        .getByRole("grid")
        .locator(`button[data-day="${bulanDepan.getMonth() + 1}/1/${bulanDepan.getFullYear()}"]`)
        .click();
      const tPut = page.waitForResponse((r) => r.request().method() === "PUT" && /\/api\/membership\//.test(r.url()));
      await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
      const put = await tPut;
      expect(put.status()).toBe(200);
      expect(Object.keys(put.request().postDataJSON())).toEqual(["tanggalMulai"]);
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      // Lencana status membership di laman Pelanggan (MB3a).
      await page.goto(BASIS + "/dashboard/outlet/pelanggan");
      await expect(
        page.getByRole("row").filter({ hasText: target!.nama }).getByText(/^Member s\.d\. /).first(),
      ).toBeVisible({ timeout: 15_000 });

      await page.goto(URL_MEMBERSHIP);
      const barisLagi = page.getByRole("row").filter({ hasText: nama });
      await barisLagi.getByRole("button", { name: /^Aksi membership/ }).click();
      await page.getByRole("menuitem", { name: "Hapus" }).click();
      const tDel = page.waitForResponse((r) => r.request().method() === "DELETE" && /\/api\/membership\//.test(r.url()));
      await page.getByRole("alertdialog").getByRole("button", { name: "Hapus" }).click();
      expect((await tDel).status()).toBe(200);
      await expect(barisLagi).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await bersihkan(page, auth);
    }
  });

  test("form diskon menawarkan Khusus member lagi (PD8a dibuka)", async ({ page }) => {
    await bukaDenganAuth(page, BASIS + "/dashboard/outlet/diskon");
    await page.getByRole("button", { name: "Tambah Diskon" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Aturan tambahan" }).click();
    const centang = dialog.getByRole("checkbox", { name: /Khusus member/ });
    await expect(centang).toBeVisible();
    await expect(centang).not.toBeChecked();
  });

  test("HP 390 px: tab Member dan Paket tanpa luberan", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await buka(page);
    await tanpaLuberWadah(page, "membership tab Member 390 px");
    await page.getByRole("tab", { name: "Paket" }).click();
    await tanpaLuberWadah(page, "membership tab Paket 390 px");
  });

  test("pengguna baca-saja melihat kedua tab tanpa tombol daftarkan dan tambah paket", async ({ page }) => {
    await masukBacaSaja(page);
    await page.goto(URL_MEMBERSHIP);
    await expect(page.getByRole("heading", { name: "Manajemen Membership" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: "Member" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Daftarkan Member" })).toHaveCount(0);
    await page.getByRole("tab", { name: "Paket" }).click();
    await expect(page.getByRole("button", { name: "Tambah Paket" })).toHaveCount(0);
  });
});
