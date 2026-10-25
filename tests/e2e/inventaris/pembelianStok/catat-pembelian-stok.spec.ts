import { test, expect, type Page } from "@playwright/test";
import { api, BASIS, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import { unik } from "../../../helpers/reservasi-uji";
import { daftarAkun, pilihAkun, type AkunKasUji } from "../../../helpers/akun-kas-uji";
import { BAHAN_FIXTURE, idBahanFixture, idDari, lokasiBertipe, type Berid } from "../../../helpers/pembelian-uji";
import { formatRupiah } from "../../../../lib/format";

/*
 * Spec catat pembelian stok, tanpa respons sukses palsu (keputusan rancangan
 * butir 21 dan 23). Pembelian dicatat lewat UI di kedua ruang dengan bahan
 * fixture permanen "E2E Bahan Pak", lalu payload, detail, daftar, dan
 * pertambahan stok di lokasi ruang itu dibuktikan. Info pembelian lalu
 * diubah dan pembeliannya dihapus lewat UI, yang mengurangi kembali
 * stoknya; hapus yang ditolak 409 dijawab route.fulfill, karena stok yang
 * sudah terpakai tidak dapat dibuat secara deterministik (butir 21). API
 * hanya membersihkan sisa run yang gagal. Pengguna uji berperan Owner, sehingga jalur
 * tanggal terkunci bagi peran lain hanya teruji di unit test
 * (payloadBuatPembelian).
 */

type Auth = Parameters<typeof api>[1];

const POLA_BUAT = /\/api\/pembelianstok(\?|$)/i;
const POLA_ID = /\/api\/pembelianstok\/[a-f0-9]{24}(\?|$)/i;
const PESAN_409 = "Stok dari pembelian ini sudah terpakai sehingga pembelian tidak dapat dihapus.";
const RUANG = [
  { ruang: "outlet", url: "/dashboard/outlet/inventaris/pembelianStok", tipe: "Outlet" },
  { ruang: "gudang", url: "/dashboard/gudang/pembelianStok", tipe: "Gudang" },
] as const;

/**
 * Stok satu bahan di satu lokasi. Respons GET /inventory memetakan bahan ke
 * item { tipeItem, id, nama, satuan } dan lokasi ke lokasi, bukan bahanBakuID
 * (trace 25 Oktober 2026). Bahan yang belum punya entri di lokasi itu berstok 0.
 */
async function stokBahan(page: Page, auth: Auth, lokasiID: string, bahanID: string) {
  const baca = await api<{ item: Berid | null; stok: number }[]>(
    page,
    auth,
    "GET",
    "/inventory?locationID=" + lokasiID,
  );
  expect(baca.status, "baca inventory: " + baca.pesan).toBe(200);
  const entri = (baca.data ?? []).find((x) => idDari(x.item) === bahanID);
  return Number(entri?.stok ?? 0);
}

test.describe("Pembelian stok: catat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const r of RUANG) {
    test(`${r.ruang}: catat, ubah info, lalu hapus lewat UI: payload persis, stok ${r.tipe} bertambah lalu pulih`, async ({ page }) => {
      const auth = await bukaDenganAuth(page, BASIS + r.url);
      const lokasi = await lokasiBertipe(page, auth, r.tipe);
      const bahanID = await idBahanFixture(page, auth);
      const akun = (await daftarAkun(page, auth)).find(
        (a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E"),
      ) as AkunKasUji | undefined;
      test.skip(!akun, "tidak ada akun kas aktif");
      const stokAwal = await stokBahan(page, auth, lokasi.id, bahanID);
      const supplier = "E2E Supplier " + unik();
      const keterangan = "E2E pembelian " + unik();
      let idPembelian: string | undefined;
      let terhapus = false;
      const supplierBaru = supplier + " ubah";
      const nomorFaktur = "E2E-FK-" + unik();

      try {
        await page.getByRole("link", { name: "Catat Pembelian" }).click();
        await page.waitForURL("**" + r.url + "/catatPembelian");
        await expect(page.getByRole("heading", { name: "Catat Pembelian", exact: true })).toBeVisible();
        await expect(page.getByText(lokasi.nama, { exact: true }), "lokasi penerima mengikuti ruang").toBeVisible();

        await page.getByLabel("Supplier", { exact: true }).fill(supplier);
        await pilihAkun(page, "Dibayar dari akun kas", (akun as AkunKasUji).namaAkun);
        await expect(
          page.getByRole("button", { name: /^Tanggal pembelian, / }),
          "Owner memilih tanggal",
        ).toBeVisible();
        await page.getByLabel("Keterangan", { exact: true }).fill(keterangan);
        await pilihAkun(page, "Bahan baku baris 1", BAHAN_FIXTURE);
        await page.locator("#pembelian-jumlah-0").fill("1,5");
        await page.locator("#pembelian-harga-0").fill("2000");
        await expect(page.getByText(formatRupiah(3000)).first(), "subtotal dan total dihitung").toBeVisible();

        const tBuat = page.waitForResponse(
          (res) => res.request().method() === "POST" && POLA_BUAT.test(res.url()),
        );
        await page.getByRole("button", { name: "Simpan Pembelian" }).click();
        const buat = await tBuat;
        expect(buat.status(), "POST /pembelianstok").toBe(201);
        expect(buat.request().postDataJSON(), "tanpa tanggal hari ini dan tanpa nomor faktur kosong").toEqual({
          akunKasID: (akun as AkunKasUji).id,
          supplier,
          keterangan,
          locationID: lokasi.id,
          items: [{ bahanBakuID: bahanID, jumlah: 1.5, hargaBeli: 2000 }],
        });
        idPembelian = idDari(((await buat.json()) as { data: Berid }).data);
        expect(idPembelian, "id pembelian dari respons").toBeTruthy();

        await page.waitForURL("**" + r.url + "/" + idPembelian);
        await expect(page.getByRole("heading", { name: "Pembelian dari " + supplier })).toBeVisible();
        await expect(page.getByText("Stok masuk ke " + lokasi.nama)).toBeVisible();
        const baris = page.getByRole("row").filter({ hasText: BAHAN_FIXTURE });
        await expect(baris).toContainText("1,5 pak");
        await expect(baris).toContainText(formatRupiah(3000));
        expect(await stokBahan(page, auth, lokasi.id, bahanID), "stok bertambah 1,5").toBeCloseTo(stokAwal + 1.5);

        await page.getByRole("button", { name: "Kembali ke Pembelian Stok" }).click();
        await page.waitForURL("**" + r.url);
        await expect(page.getByRole("row").filter({ hasText: supplier })).toHaveCount(1);

        await page.getByRole("link", { name: supplier, exact: true }).click();
        await page.waitForURL("**" + r.url + "/" + idPembelian);
        await page.getByRole("button", { name: "Ubah Info" }).click();
        const dialogUbah = page.getByRole("dialog");
        await expect(dialogUbah.getByLabel("Supplier")).toHaveValue(supplier);
        await expect(dialogUbah.getByRole("button", { name: "Simpan" }), "tanpa perubahan").toBeDisabled();
        await dialogUbah.getByLabel("Supplier").fill(supplierBaru);
        await dialogUbah.getByLabel("Nomor faktur").fill(nomorFaktur);
        const tUbah = page.waitForResponse((res) => res.request().method() === "PUT" && POLA_ID.test(res.url()));
        await dialogUbah.getByRole("button", { name: "Simpan" }).click();
        const ubah = await tUbah;
        expect(ubah.status(), "PUT ubah info").toBe(200);
        expect(ubah.request().postDataJSON(), "hanya field yang berubah").toEqual({ supplier: supplierBaru, nomorFaktur });
        await expect(dialogUbah).toBeHidden();
        await expect(page.getByRole("heading", { name: "Pembelian dari " + supplierBaru })).toBeVisible();
        await expect(page.getByText(nomorFaktur)).toBeVisible();

        await page.getByRole("button", { name: "Hapus", exact: true }).click();
        const dialogHapus = page.getByRole("alertdialog");
        await expect(dialogHapus).toContainText(BAHAN_FIXTURE);
        await expect(dialogHapus).toContainText("1,5 pak");

        await page.route(POLA_ID, (route) =>
          route.request().method() === "DELETE"
            ? route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({ status: "error", message: PESAN_409 }),
              })
            : route.continue(),
        );
        await dialogHapus.getByRole("button", { name: "Hapus Pembelian" }).click();
        await expect(dialogHapus.getByRole("alert"), "penolakan tampil di dalam dialog").toContainText(PESAN_409);
        await expect(dialogHapus, "dialog bertahan saat ditolak").toBeVisible();
        await page.unroute(POLA_ID);

        const tHapus = page.waitForResponse((res) => res.request().method() === "DELETE" && POLA_ID.test(res.url()));
        await dialogHapus.getByRole("button", { name: "Hapus Pembelian" }).click();
        expect((await tHapus).status(), "DELETE pembelian").toBe(200);
        terhapus = true;
        await page.waitForURL("**" + r.url);
        await expect(page.getByRole("row").filter({ hasText: supplierBaru })).toHaveCount(0);
        expect(await stokBahan(page, auth, lokasi.id, bahanID), "stok pulih setelah dihapus lewat UI").toBeCloseTo(stokAwal);
      } finally {
        if (idPembelian && !terhapus) {
          const hapus = await api(page, auth, "DELETE", "/pembelianstok/" + idPembelian);
          expect.soft(hapus.status, `hapus sisa pembelian uji: ${hapus.pesan}`).toBe(200);
        }
      }
    });
  }

  test("form menahan isian kosong, jumlah di bawah 1, harga pecahan, dan bahan ganda, tanpa permintaan", async ({ page }) => {
    let terkirim = 0;
    page.on("request", (req) => {
      if (req.method() === "POST" && POLA_BUAT.test(req.url())) terkirim++;
    });
    await page.goto(BASIS + RUANG[0].url + "/catatPembelian");
    await expect(page.getByRole("heading", { name: "Catat Pembelian", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Simpan Pembelian" }).click();
    await expect(page.getByText("Supplier wajib diisi.")).toBeVisible();
    await expect(page.getByText("Akun kas wajib dipilih.")).toBeVisible();
    await expect(page.getByText("Keterangan wajib diisi.")).toBeVisible();
    await expect(page.getByText("Bahan baku wajib dipilih.")).toBeVisible();

    await page.locator("#pembelian-jumlah-0").fill("0,5");
    await page.locator("#pembelian-harga-0").fill("1500,5");
    await page.getByRole("button", { name: "Tambah Barang" }).click();
    await pilihAkun(page, "Bahan baku baris 1", BAHAN_FIXTURE);
    await pilihAkun(page, "Bahan baku baris 2", BAHAN_FIXTURE);
    await page.getByRole("button", { name: "Simpan Pembelian" }).click();

    await expect(page.getByText("Jumlah minimal 1.")).toBeVisible();
    await expect(page.getByText("Harga beli harus bilangan bulat, boleh 0.")).toBeVisible();
    await expect(page.getByText("Bahan ini sudah ada di baris lain.")).toBeVisible();
    expect(terkirim, "tidak ada POST selama isian belum sah").toBe(0);
  });
});