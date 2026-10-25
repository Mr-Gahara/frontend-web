import { test, expect, type Page, type Response } from "@playwright/test";
import { ADA_IZIN_LINTAS } from "../../../helpers/lintas-outlet";
import { BASIS, api, bukaDenganAuth, login, tutupSuratJalanUji, type Auth } from "../../../helpers/transfer-uji";

/*
 * Alur pengembalian Outlet ke Gudang lewat UI (P8, AR1a sampai AR11a):
 * outlet membuat dan mengajukan, gudang menyetujui, outlet membuat dan
 * mengirim surat jalan, gudang menerima. Perpindahan stok dibuktikan dari
 * /inventory kedua lokasi: stok outlet berkurang saat dikirim, stok gudang
 * bertambah saat diterima, masing-masing sebesar qtyKirim surat jalan.
 *
 * Setiap run yang lolos memindahkan satu satuan bahan uji dari outlet ke
 * gudang secara permanen, karena surat jalan DIKIRIM tidak dapat dibatalkan
 * (P12). Bahan dipilih saat test berjalan: bahan yang ada di inventaris
 * kedua lokasi dengan stok outlet cukup; bila tidak ada, test dilewati.
 * Bila test berhenti di tengah, finally menutup surat jalan lewat
 * tutupSuratJalanUji, atau menolak pengajuan yang masih SUBMITTED.
 * Pengajuan yang berhenti di APPROVED tanpa surat jalan tidak dapat ditutup
 * dan tertinggal di tab Semua gudang (AR6a).
 */

const URL_OUTLET = BASIS + "/dashboard/outlet/inventaris/pengajuanStok";
const URL_GUDANG = BASIS + "/dashboard/gudang/pengajuanStok";
const URL_PENERIMAAN_GUDANG = BASIS + "/dashboard/gudang/penerimaanStok";
const POLA_POST_PENGAJUAN = /\/api\/pengajuanstok(\?|$)/i;
const POLA_POST_TRANSFER = /\/api\/transferstok(\?|$)/i;
const ALASAN = "Uji e2e alur pengembalian";

type LokasiUji = { id?: string; _id?: string; nama: string | null; tipe: string | null };
type InventoryUji = { item: { id: string; nama: string | null } | null; stok: number };
type SuratJalanUji = { status: string; nomorTransfer: string; items: { qtyKirim: number }[] };
type DibuatUji = { id?: string; _id?: string };

function patchAksi(aksi: string) {
  const pola = new RegExp("/api/(pengajuanstok|transferstok)/[^/]+/" + aksi + "(\\?|$)", "i");
  return (r: Response) => r.request().method() === "PATCH" && pola.test(r.url());
}

async function stok(page: Page, auth: Auth, lokasiID: string, bahanID: string): Promise<number> {
  const r = await api<InventoryUji[]>(page, auth, "GET", `/inventory?locationID=${lokasiID}`);
  expect(r.status, `baca stok: ${r.pesan}`).toBe(200);
  return r.data.find((i) => i.item?.id === bahanID)?.stok ?? 0;
}

test.describe("Alur pengembalian Outlet ke Gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("buat, ajukan, setujui, kirim dari outlet, terima di gudang; stok berpindah", async ({ page }) => {
    test.setTimeout(180_000);
    const auth = await bukaDenganAuth(page, URL_OUTLET);

    const lokasi = await api<LokasiUji[]>(page, auth, "GET", "/location");
    expect(lokasi.status, `daftar lokasi: ${lokasi.pesan}`).toBe(200);
    const idDari = (l: LokasiUji) => l.id ?? l._id ?? "";
    const outlet = lokasi.data.find((l) => l.tipe === "Outlet");
    const gudang = lokasi.data.find((l) => l.tipe === "Gudang");
    test.skip(!outlet || !gudang, "Tenant uji tidak punya outlet dan gudang.");
    const idOutlet = idDari(outlet!);
    const idGudang = idDari(gudang!);

    const invOutlet = await api<InventoryUji[]>(page, auth, "GET", `/inventory?locationID=${idOutlet}`);
    const invGudang = await api<InventoryUji[]>(page, auth, "GET", `/inventory?locationID=${idGudang}`);
    expect(invOutlet.status).toBe(200);
    expect(invGudang.status).toBe(200);
    const adaDiGudang = new Set(invGudang.data.map((i) => i.item?.id));
    const bahan = invOutlet.data.find((i) => i.item?.id && i.item.nama && i.stok >= 1 && adaDiGudang.has(i.item.id))?.item;
    test.skip(!bahan, "Tidak ada bahan di inventaris outlet dan gudang dengan stok outlet cukup.");

    let idPengajuan = "";
    let idSuratJalan = "";
    let nomorSuratJalan = "";
    let qty = 0;
    let outletSebelum = 0;
    let gudangSebelum = 0;

    try {
      await test.step("outlet membuat pengembalian", async () => {
        await page.goto(URL_OUTLET + "/buatPengajuan");
        await page.getByRole("button", { name: /kembalikan ke gudang/i }).click();
        if (ADA_IZIN_LINTAS) {
          await page.getByText("Pilih Outlet Anda...", { exact: true }).click();
          await page.getByRole("option", { name: outlet!.nama ?? "", exact: true }).click();
        }
        await page.getByText("Pilih Gudang...", { exact: true }).click();
        await page.getByRole("option", { name: gudang!.nama ?? "", exact: true }).click();
        if ((await page.getByText("Pilih...", { exact: true }).count()) === 0) {
          await page.getByRole("button", { name: /tambah baris/i }).click();
        }
        await page.getByText("Pilih...", { exact: true }).first().click();
        await page.getByRole("option", { name: bahan!.nama ?? "", exact: true }).click();
        await page.getByPlaceholder("0").first().fill("1");

        const tPost = page.waitForResponse((r) => r.request().method() === "POST" && POLA_POST_PENGAJUAN.test(r.url()));
        await page.getByRole("button", { name: "Simpan sebagai Draft" }).click();
        const res = await tPost;
        expect(res.status()).toBe(201);
        const data = ((await res.json()) as { data: DibuatUji }).data;
        idPengajuan = data.id ?? data._id ?? "";
        expect(idPengajuan).toBeTruthy();
        const payload = res.request().postDataJSON() as { dariLocationID: string; keLocationID: string };
        expect(payload.dariLocationID, "asal pengembalian adalah outlet").toBe(idOutlet);
        expect(payload.keLocationID, "tujuan pengembalian adalah gudang").toBe(idGudang);
      });

      await test.step("outlet mengajukan", async () => {
        await page.goto(`${URL_OUTLET}/${idPengajuan}`);
        await page.getByRole("button", { name: /ajukan ke gudang/i }).click();
        const t = page.waitForResponse(patchAksi("submit"));
        await page.getByRole("alertdialog").getByRole("button", { name: "Ya, Ajukan Sekarang" }).click();
        expect((await t).status()).toBe(200);
      });

      await test.step("gudang menyetujui; surat jalan bukan tugas gudang", async () => {
        await page.goto(`${URL_GUDANG}/${idPengajuan}`);
        await page.getByRole("button", { name: "Setujui Pengembalian" }).click();
        const t = page.waitForResponse(patchAksi("approve"));
        await page.getByRole("alertdialog").getByRole("button", { name: /^ya,/i }).click();
        const res = await t;
        expect(res.status(), "setujui pengembalian").toBe(200);
        await expect(page.getByText("Menunggu Surat Jalan Outlet", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Buat Surat Jalan" })).toHaveCount(0);
      });

      await test.step("outlet membuat surat jalan pengembalian", async () => {
        await page.goto(`${URL_OUTLET}/${idPengajuan}`);
        const tPost = page.waitForResponse((r) => r.request().method() === "POST" && POLA_POST_TRANSFER.test(r.url()));
        await page.getByRole("button", { name: "Buat Surat Jalan" }).click();
        const res = await tPost;
        expect(res.status()).toBe(201);
        const data = ((await res.json()) as { data: DibuatUji }).data;
        idSuratJalan = data.id ?? data._id ?? "";
        expect(idSuratJalan).toBeTruthy();
        await page.waitForURL(new RegExp(`/dashboard/outlet/inventaris/pengirimanBarang/${idSuratJalan}$`));
        const sj = await api<SuratJalanUji>(page, auth, "GET", `/transferstok/${idSuratJalan}`);
        expect(sj.status).toBe(200);
        nomorSuratJalan = sj.data.nomorTransfer;
        qty = sj.data.items.reduce((n, i) => n + i.qtyKirim, 0);
        expect(qty).toBeGreaterThan(0);
      });

      await test.step("outlet mengirim; stok outlet berkurang, stok gudang belum berubah", async () => {
        outletSebelum = await stok(page, auth, idOutlet, bahan!.id);
        gudangSebelum = await stok(page, auth, idGudang, bahan!.id);
        await page.getByRole("button", { name: /kirim barang sekarang/i }).click();
        const t = page.waitForResponse(patchAksi("kirim"));
        await page.getByRole("alertdialog").getByRole("button", { name: "Ya, Kirim Sekarang" }).click();
        expect((await t).status()).toBe(200);
        expect(await stok(page, auth, idOutlet, bahan!.id), "stok outlet berkurang sebesar qtyKirim").toBe(outletSebelum - qty);
        expect(await stok(page, auth, idGudang, bahan!.id), "stok gudang belum berubah sebelum diterima").toBe(gudangSebelum);
      });

      await test.step("gudang menerima di Penerimaan Stok; stok gudang bertambah", async () => {
        await page.goto(URL_PENERIMAAN_GUDANG);
        await expect(page.getByText(nomorSuratJalan).first()).toBeVisible();
        await page.goto(`${URL_PENERIMAAN_GUDANG}/${idSuratJalan}`);
        await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
        const t = page.waitForResponse(patchAksi("terima"));
        await page.getByRole("alertdialog").getByRole("button", { name: /^ya,/i }).click();
        expect((await t).status()).toBe(200);
        expect(await stok(page, auth, idGudang, bahan!.id), "stok gudang bertambah sebesar qtyKirim").toBe(gudangSebelum + qty);
        const sj = await api<SuratJalanUji>(page, auth, "GET", `/transferstok/${idSuratJalan}`);
        expect(sj.data.status).toBe("DITERIMA");
      });
    } finally {
      if (idSuratJalan) {
        const sj = await api<SuratJalanUji>(page, auth, "GET", `/transferstok/${idSuratJalan}`);
        if (sj.data?.status === "PENDING" || sj.data?.status === "DIKIRIM") await tutupSuratJalanUji(page, auth, idSuratJalan);
      } else if (idPengajuan) {
        const p = await api<{ status: string }>(page, auth, "GET", `/pengajuanstok/${idPengajuan}`);
        if (p.data?.status === "SUBMITTED") {
          const tolak = await api(page, auth, "PATCH", `/pengajuanstok/${idPengajuan}/reject`, { alasan: ALASAN });
          expect.soft(tolak.status, `tolak pengajuan sisa: ${tolak.pesan}`).toBe(200);
        }
      }
    }
  });
});