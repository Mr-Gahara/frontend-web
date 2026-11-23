import { expect, test, type Page } from "@playwright/test";
import { api, BASIS, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import { unik } from "../../../helpers/reservasi-uji";
import { daftarAkun, pilihAkun, type AkunKasUji } from "../../../helpers/akun-kas-uji";
import { idDari, lokasiBertipe, type Berid } from "../../../helpers/pembelian-uji";
import { tanpaLuberWadah } from "../../../helpers/tata-letak-uji";

/*
 * Satuan dasar dan kemasan per bahan (backend P87, B359 sampai B364;
 * pemilik proyek, 23 November 2026). Kemasan diisi lewat form bahan baku,
 * pembelian dicatat per kemasan, stok terbaca tampil di daftar stok, resep
 * dan pengajuan menawarkan kemasan. Respons tidak dipalsukan (keputusan
 * rancangan butir 21). Bahan "E2E Bahan Kaleng" (ml, kaleng = 290) menjadi
 * fixture permanen pembelian dan pengajuan, disiapkan lewat API bila belum
 * ada (milik modul bahan baku, keputusan rancangan butir 23); bahan uji
 * kemasan dibuat dan dihapus lewat UI dan API per run.
 */

type Auth = Parameters<typeof api>[1];
type BahanMentah = Berid & { namaBahan: string; satuan: string; konversi?: { satuan: string; isi: number }[] };

const FIXTURE = "E2E Bahan Kaleng";
const URL_BAHAN = "/dashboard/outlet/inventaris/bahanBaku";
const POLA_BAHAN = /\/api\/bahanbaku(\/[a-f0-9]{24})?(\?|$)/i;

async function pastikanFixture(page: Page, auth: Auth): Promise<string> {
  const baca = await api<BahanMentah[]>(page, auth, "GET", "/bahanbaku");
  expect(baca.status, "baca bahan baku: " + baca.pesan).toBe(200);
  const ada = (baca.data ?? []).find((b) => b.namaBahan === FIXTURE);
  if (ada) {
    if (!ada.konversi?.some((k) => k.satuan === "kaleng" && k.isi === 290)) {
      const ubah = await api(page, auth, "PUT", "/bahanbaku/" + idDari(ada), { konversi: [{ satuan: "kaleng", isi: 290 }] });
      expect(ubah.status, "kemasan fixture: " + ubah.pesan).toBe(200);
    }
    return idDari(ada);
  }
  const buat = await api<BahanMentah>(page, auth, "POST", "/bahanbaku", {
    namaBahan: FIXTURE,
    satuan: "ml",
    stok: 0,
    konversi: [{ satuan: "kaleng", isi: 290 }],
  });
  expect(buat.status, "buat fixture: " + buat.pesan).toBe(201);
  return idDari(buat.data);
}

test.describe("konversi satuan bahan (P87)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bagian Kemasan di form buat dan ubah: payload konversi, validasi, lalu hapus (B359)", async ({ page }) => {
    test.setTimeout(90_000);
    const auth = await bukaDenganAuth(page, BASIS + URL_BAHAN + "/buatBahanBaku");
    const nama = "E2E Kemasan " + unik();
    let id = "";
    try {
      await page.getByLabel(/Nama Bahan Baku/).fill(nama);
      await page.getByRole("combobox").filter({ hasText: "gram" }).first().click();
      await page.getByRole("option", { name: "ml", exact: true }).click();
      await page.getByRole("button", { name: "Tambah Kemasan" }).click();
      await page.getByLabel("Nama kemasan").fill("liter");
      await page.getByLabel("Isi (ml)").fill("290");
      let terkirim = 0;
      page.on("request", (r) => {
        if (r.method() === "POST" && POLA_BAHAN.test(r.url())) terkirim++;
      });
      await page.getByRole("button", { name: /Simpan/ }).click();
      await expect(page.getByText("Sudah satuan bawaan atau satuan dasar.")).toBeVisible();
      expect(terkirim, "satuan bawaan ditolak tanpa permintaan").toBe(0);

      await page.getByLabel("Nama kemasan").fill("Kaleng");
      await expect(page.getByText("1 kaleng = 290 ml")).toBeVisible();
      const tBuat = page.waitForResponse((r) => r.request().method() === "POST" && POLA_BAHAN.test(r.url()));
      await page.getByRole("button", { name: /Simpan/ }).click();
      const buat = await tBuat;
      expect(buat.status()).toBe(201);
      expect(buat.request().postDataJSON().konversi).toEqual([{ satuan: "kaleng", isi: 290 }]);
      const data = ((await buat.json()) as { data: BahanMentah & { availableUnits: string[] } }).data;
      id = idDari(data);
      expect(data.availableUnits).toEqual(["ml", "kaleng"]);

      await page.goto(`${BASIS}${URL_BAHAN}/${id}/edit`);
      await expect(page.getByLabel("Nama kemasan")).toHaveValue("kaleng");
      // Satuan dasar tampil di Select dan label isi (defaultValues, keputusan rancangan butir 8).
      await expect(page.getByRole("combobox").filter({ hasText: /^ml$/ })).toBeVisible();
      await page.getByRole("button", { name: "Tambah Kemasan" }).click();
      await page.getByLabel("Nama kemasan").nth(1).fill("pak");
      await page.getByLabel("Isi (ml)").nth(1).fill("3480");
      const tUbah = page.waitForResponse((r) => r.request().method() === "PUT" && POLA_BAHAN.test(r.url()));
      await page.getByRole("button", { name: /Simpan Perubahan/ }).click();
      const ubah = await tUbah;
      expect(ubah.status()).toBe(200);
      expect(ubah.request().postDataJSON().konversi).toEqual([
        { satuan: "kaleng", isi: 290 },
        { satuan: "pak", isi: 3480 },
      ]);
    } finally {
      if (id) {
        const hapus = await api(page, auth, "DELETE", "/bahanbaku/" + id);
        expect.soft(hapus.status, "hapus bahan uji kemasan: " + hapus.pesan).toBe(200);
      }
    }
  });

  test("pembelian per kaleng: satuan terkirim, jumlah dasar dari server, stok terbaca di daftar stok (B361, B362)", async ({ page }) => {
    const urlPembelian = "/dashboard/outlet/inventaris/pembelianStok";
    const auth = await bukaDenganAuth(page, BASIS + urlPembelian);
    const bahanID = await pastikanFixture(page, auth);
    const lokasi = await lokasiBertipe(page, auth, "Outlet");
    const akun = (await daftarAkun(page, auth)).find((a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E")) as
      | AkunKasUji
      | undefined;
    test.skip(!akun, "tidak ada akun kas aktif");
    let idPembelian = "";
    try {
      await page.goto(BASIS + urlPembelian + "/catatPembelian");
      await page.getByLabel("Supplier", { exact: true }).fill("E2E Supplier Kaleng " + unik());
      await pilihAkun(page, "Dibayar dari akun kas", (akun as AkunKasUji).namaAkun);
      await page.getByLabel("Keterangan", { exact: true }).fill("E2E pembelian per kemasan");
      await pilihAkun(page, "Bahan baku baris 1", FIXTURE);
      await page.locator("#pembelian-jumlah-0").fill("2");
      await page.locator("#pembelian-satuan-0").click();
      await page.getByRole("option", { name: "kaleng (290 ml)" }).click();
      await expect(page.locator('label[for="pembelian-harga-0"]')).toContainText("Harga per kaleng");
      await page.locator("#pembelian-harga-0").fill("0");

      const tBuat = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/pembelianstok(\?|$)/i.test(r.url()));
      await page.getByRole("button", { name: "Simpan Pembelian" }).click();
      const buat = await tBuat;
      expect(buat.status()).toBe(201);
      expect(buat.request().postDataJSON().items).toEqual([{ bahanBakuID: bahanID, jumlah: 2, hargaBeli: 0, satuan: "kaleng" }]);
      const hasil = (await buat.json()) as { data: Berid & { items: { jumlahDasar: number; satuan: string }[] } };
      idPembelian = idDari(hasil.data);
      expect(hasil.data.items[0]).toMatchObject({ satuan: "kaleng", jumlahDasar: 580 });
      await expect(page.getByRole("row").filter({ hasText: FIXTURE })).toContainText("2 kaleng (580 ml)");

      // Stok terbaca dari backend tampil sebagai rincian, angka dasar di bawahnya.
      const inv = await api<{ item: Berid | null; stok: number; stokTerbaca: { satuan: string; jumlah: number }[] }[]>(
        page,
        auth,
        "GET",
        "/inventory?locationID=" + lokasi.id,
      );
      const entri = (inv.data ?? []).find((x) => idDari(x.item) === bahanID)!;
      expect(entri.stokTerbaca.some((r) => r.satuan === "kaleng"), "stok terbaca memuat kaleng").toBe(true);
      await page.goto(BASIS + "/dashboard/outlet/inventaris/stok");
      await page.getByRole("searchbox", { name: "Cari nama barang" }).fill(FIXTURE);
      const baris = page.getByRole("row").filter({ hasText: FIXTURE });
      const teks = entri.stokTerbaca.map((r) => `${r.jumlah.toLocaleString("id-ID")} ${r.satuan}`).join(" ");
      await expect(baris).toContainText(teks, { timeout: 15_000 });
      await expect(baris).toContainText(`${entri.stok.toLocaleString("id-ID")} ml`);
      await tanpaLuberWadah(page, "daftar stok berkemasan");
    } finally {
      if (idPembelian) {
        const hapus = await api(page, auth, "DELETE", "/pembelianstok/" + idPembelian);
        expect.soft(hapus.status, "hapus pembelian uji kemasan: " + hapus.pesan).toBe(200);
      }
    }
  });

  test("resep produk dan pengajuan stok menawarkan kemasan; pengajuan menyimpan masukan kaleng (B360, B364)", async ({ page }) => {
    test.setTimeout(90_000);
    const auth = await bukaDenganAuth(page, BASIS + "/dashboard/outlet/inventaris/produk/buatProduk");
    const bahanID = await pastikanFixture(page, auth);

    await test.step("pilihan satuan resep memuat kaleng", async () => {
      await page.reload();
      await page.getByRole("button", { name: /tambah bahan/i }).click();
      await page.getByRole("combobox").filter({ hasText: "Pilih bahan..." }).first().click();
      await page.getByPlaceholder("Cari bahan baku...").fill(FIXTURE);
      await page.getByRole("option", { name: new RegExp(FIXTURE) }).first().click();
      await page.getByRole("combobox").filter({ hasText: /^ml$/i }).first().click();
      await expect(page.getByRole("option", { name: "kaleng", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    });

    let idPengajuan = "";
    try {
      await test.step("pengajuan 1 kaleng: satuan terkirim, jumlah tersimpan 290 ml", async () => {
        await page.goto(BASIS + "/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan");
        await page.getByText("Pilih Outlet Anda...", { exact: true }).click();
        await page.getByRole("option").first().click();
        await page.getByText("Pilih Gudang...", { exact: true }).click();
        await page.getByRole("option").first().click();
        await page.locator("#pengajuan-bahan-0").click();
        await page.getByRole("option", { name: FIXTURE, exact: true }).click();
        await page.locator("#pengajuan-satuan-0").click();
        await page.getByRole("option", { name: "kaleng (290 ml)" }).click();
        await page.locator("#pengajuan-jumlah-0").fill("1");
        const tPost = page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/pengajuanstok(\?|$)/i.test(r.url()));
        await page.getByRole("button", { name: "Simpan sebagai Draft" }).click();
        const res = await tPost;
        expect(res.status(), "POST pengajuan tanpa 409 nomor (B368)").toBe(201);
        expect(res.request().postDataJSON().items).toEqual([{ bahanBakuID: bahanID, jumlah: 1, satuan: "kaleng" }]);
        const data = ((await res.json()) as { data: Berid & { items: { jumlah: number; satuanMasukan: string }[] } }).data;
        idPengajuan = idDari(data);
        expect(data.items[0]).toMatchObject({ jumlah: 290, satuanMasukan: "kaleng" });
        await page.goto(BASIS + "/dashboard/outlet/inventaris/pengajuanStok/" + idPengajuan);
        const baris = page.getByRole("row").filter({ hasText: FIXTURE });
        await expect(baris).toContainText("1 kaleng");
        await expect(baris).toContainText("290 ml");
      });
    } finally {
      if (idPengajuan) {
        const ajukan = await api(page, auth, "PATCH", `/pengajuanstok/${idPengajuan}/submit`, {});
        expect.soft(ajukan.status, "ajukan pengajuan uji: " + ajukan.pesan).toBe(200);
        const tolak = await api(page, auth, "PATCH", `/pengajuanstok/${idPengajuan}/reject`, { alasan: "Pembersihan e2e kemasan" });
        expect.soft(tolak.status, "tolak pengajuan uji: " + tolak.pesan).toBe(200);
      }
    }
  });
});
