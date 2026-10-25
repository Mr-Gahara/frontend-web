import { test, expect, type Page } from "@playwright/test";
import { api, BASIS, bukaDenganAuth, login } from "../../../helpers/transfer-uji";
import { unik } from "../../../helpers/reservasi-uji";
import { daftarAkun, pilihAkun, type AkunKasUji } from "../../../helpers/akun-kas-uji";
import { formatRupiah } from "../../../../lib/format";

/*
 * Spec catat pembelian stok, tanpa respons sukses palsu (keputusan rancangan
 * butir 21 dan 23). Pembelian dicatat lewat UI di kedua ruang dengan bahan
 * fixture permanen "E2E Bahan Pak", lalu payload, detail, daftar, dan
 * pertambahan stok di lokasi ruang itu dibuktikan. Sampai hapus lewat UI
 * tersedia, pembelian uji dihapus lewat API di akhir, yang sekaligus
 * membuktikan stoknya pulih. Pengguna uji berperan Owner, sehingga jalur
 * tanggal terkunci bagi peran lain hanya teruji di unit test
 * (payloadBuatPembelian).
 */

type Auth = Parameters<typeof api>[1];
type Berid = { id?: string; _id?: string };

const BAHAN_FIXTURE = "E2E Bahan Pak";
const POLA_BUAT = /\/api\/pembelianstok(\?|$)/i;
const RUANG = [
  { ruang: "outlet", url: "/dashboard/outlet/inventaris/pembelianStok", tipe: "Outlet" },
  { ruang: "gudang", url: "/dashboard/gudang/pembelianStok", tipe: "Gudang" },
] as const;

const idDari = (x: Berid | string | null | undefined) =>
  typeof x === "string" ? x : String(x?.id ?? x?._id ?? "");

async function lokasiBertipe(page: Page, auth: Auth, tipe: string) {
  const baca = await api<(Berid & { tipe: string; nama: string })[]>(page, auth, "GET", "/location");
  expect(baca.status, "baca lokasi: " + baca.pesan).toBe(200);
  const lokasi = (baca.data ?? []).find((l) => l.tipe === tipe);
  expect(lokasi, "lokasi bertipe " + tipe).toBeTruthy();
  return { id: idDari(lokasi), nama: (lokasi as { nama: string }).nama };
}

async function idBahanFixture(page: Page, auth: Auth) {
  const baca = await api<(Berid & { namaBahan: string })[]>(page, auth, "GET", "/bahanbaku");
  expect(baca.status, "baca bahan baku: " + baca.pesan).toBe(200);
  const bahan = (baca.data ?? []).find((b) => b.namaBahan === BAHAN_FIXTURE);
  expect(bahan, "bahan fixture " + BAHAN_FIXTURE).toBeTruthy();
  return idDari(bahan);
}

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
    test(`${r.ruang}: catat lewat UI mengirim payload persis, membuka detail, dan menambah stok ${r.tipe}`, async ({ page }) => {
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
      } finally {
        if (idPembelian) {
          const hapus = await api(page, auth, "DELETE", "/pembelianstok/" + idPembelian);
          expect.soft(hapus.status, `hapus pembelian uji: ${hapus.pesan}`).toBe(200);
          expect
            .soft(await stokBahan(page, auth, lokasi.id, bahanID), "stok pulih setelah pembelian dihapus")
            .toBeCloseTo(stokAwal);
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