import { test, expect, Page, Request } from "@playwright/test";

/*
 * Spec penerimaan barang outlet (keputusan pemilik proyek K3 pilihan B,
 * 21 September 2026). Setiap test menyiapkan surat jalan sendiri lewat API:
 * dibuat dari pengajuan APPROVED atau PENDING berarah benar tanpa surat
 * jalan, lalu dikirim. Stok gudang terpotong saat kirim dan dikembalikan
 * backend saat surat jalan dibatalkan dari DIKIRIM di akhir test, sehingga
 * setiap run menambah satu surat jalan BATAL dan dua entri jurnal gudang,
 * sedangkan pengajuannya kembali ke PENDING dan dapat dipakai lagi.
 *
 * Terima hanya diuji jalur gagalnya: PATCH terima selalu dijawab gagal lewat
 * page.route, karena terima yang berhasil menambah stok outlet secara
 * permanen. Isi payload dibaca dari permintaan yang tertahan itu.
 *
 * Bila test berhenti sebelum blok finally, surat jalan tertinggal DIKIRIM;
 * batalkan lewat PATCH /api/transferstok/:id/batal.
 */

const BASIS = "http://localhost:3000";
const URL_DAFTAR = BASIS + "/dashboard/outlet/inventaris/penerimaanBarang";
const POLA_TERIMA = /\/api\/transferstok\/[^/]+\/terima(\?|$)/i;
const ALASAN = "Uji e2e penerimaan";
const JAWAB_GAGAL = {
  status: 500,
  contentType: "application/json",
  body: JSON.stringify({ status: "error", message: "uji" }),
};

type ItemTransfer = {
  bahanBaku: { id: string; namaBahan: string | null; satuan: string | null } | null;
  qtyKirim: number;
};

type TransferMentah = {
  id: string;
  nomorTransfer: string;
  status: string;
  items: ItemTransfer[];
};

type PengajuanMentah = {
  id: string;
  transferStokID: string | null;
  dariLokasi: { tipe?: string } | null;
  keLokasi: { tipe?: string } | null;
};

type ItemTerima = {
  bahanBakuID: string;
  qtyKirim: number;
  qtyTerima: number;
  catatanItem?: string | null;
};

async function login(page: Page) {
  await page.goto(BASIS + "/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

/** Mencari access token (JWT) di mana pun di dalam isi respons. */
function cariToken(o: unknown): string | null {
  if (typeof o === "string" && /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(o)) return o;
  if (o && typeof o === "object") {
    for (const v of Object.values(o)) {
      const t = cariToken(v);
      if (t) return t;
    }
  }
  return null;
}

type Auth = () => string;

/**
 * Membuka halaman dan mengembalikan pembaca access token yang selalu terbaru.
 * Setiap navigasi penuh (goto, reload) memulihkan sesi lewat pin-refresh, dan
 * token sebelum refresh itu dijawab 401 "Sesi tidak valid" (trace 21
 * September 2026). Karena itu token awal diambil dari respons pin-refresh
 * pemuatan halaman ini, lalu diganti setiap kali halaman melakukan
 * pin-refresh lagi. Token dari permintaan pertama yang membawa Authorization
 * tidak dipakai, karena bisa milik halaman sebelumnya.
 */
async function bukaDenganAuth(page: Page, url: string): Promise<Auth> {
  const polaRefresh = /\/api\/pengguna\/pin-refresh(\?|$)/i;
  const tRefresh = page.waitForResponse((r) => polaRefresh.test(r.url()) && r.status() === 200);
  await page.goto(url);
  const awal = cariToken(await (await tRefresh).json());
  expect(awal, "respons pin-refresh harus membawa access token").toBeTruthy();
  let token = "Bearer " + awal;
  page.on("response", async (r) => {
    if (!polaRefresh.test(r.url()) || r.status() !== 200) return;
    const baru = cariToken(await r.json().catch(() => null));
    if (baru) token = "Bearer " + baru;
  });
  return () => token;
}

async function api<T>(
  page: Page,
  auth: Auth,
  method: "GET" | "POST" | "PATCH",
  path: string,
  data?: object,
): Promise<{ status: number; data: T; pesan: string }> {
  const res = await page.request.fetch(BASIS + "/api" + path, {
    method,
    headers: { Authorization: auth() },
    data,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), data: body.data as T, pesan: String(body.message ?? "") };
}

/**
 * Membuat surat jalan dari pengajuan yang layak lalu mengirimnya. Hanya
 * penolakan stok kurang (400 saat membuat, sebelum dokumen tercipta) yang
 * membuat pengajuan dilewati. Kegagalan lain menggagalkan test beserta
 * status dan pesan backend, dan surat jalan yang sudah tercipta dibatalkan
 * lebih dulu agar stok gudang tidak tertahan.
 */
async function siapkanSuratJalan(page: Page, auth: Auth): Promise<TransferMentah | null> {
  for (const status of ["APPROVED", "PENDING"]) {
    const daftar = await api<PengajuanMentah[]>(page, auth, "GET", "/pengajuanstok?status=" + status);
    expect(daftar.status, `GET pengajuan ${status}: ${daftar.pesan}`).toBe(200);
    for (const p of daftar.data ?? []) {
      if (p.transferStokID || p.dariLokasi?.tipe !== "Gudang" || p.keLokasi?.tipe !== "Outlet") continue;
      const buat = await api<{ id: string }>(page, auth, "POST", "/transferstok", {
        pengajuanStokID: p.id,
        tanggalKirim: new Date().toISOString(),
      });
      if (buat.status === 400 && /tidak mencukupi/i.test(buat.pesan)) continue;
      expect(buat.status, `buat surat jalan: ${buat.pesan}`).toBe(201);
      const id = buat.data.id;
      const kirim = await api(page, auth, "PATCH", `/transferstok/${id}/kirim`, {});
      const detail = kirim.status === 200 ? await api<TransferMentah>(page, auth, "GET", `/transferstok/${id}`) : null;
      if (kirim.status !== 200 || detail?.status !== 200) {
        await api(page, auth, "PATCH", `/transferstok/${id}/batal`, {});
      }
      expect(kirim.status, `kirim surat jalan: ${kirim.pesan}`).toBe(200);
      expect(detail?.status, `detail surat jalan: ${detail?.pesan}`).toBe(200);
      return detail!.data;
    }
  }
  return null;
}

/**
 * Dipanggil dari blok finally, sehingga pemeriksaannya lunak: pengecualian
 * yang dilempar di finally menggantikan kegagalan asli test, dan penyebab
 * sebenarnya hilang dari laporan.
 */
async function batalkan(page: Page, auth: Auth, id: string) {
  const res = await api(page, auth, "PATCH", `/transferstok/${id}/batal`, {});
  expect.soft(res.status, `surat jalan uji ${id} harus dibatalkan agar stok gudang kembali: ${res.pesan}`).toBe(200);
}

test.describe("Penerimaan barang outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("detail menampilkan barang, terima gagal mengirim seluruh item, dan jumlah 0 ditahan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const sj = await siapkanSuratJalan(page, auth);
    test.skip(!sj, "Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup");
    const transfer = sj!;

    const terkirim: ItemTerima[][] = [];
    const catat = (r: Request) => {
      if (r.method() === "PATCH" && POLA_TERIMA.test(r.url())) terkirim.push(r.postDataJSON()?.items ?? []);
    };
    await page.route(POLA_TERIMA, (route) => route.fulfill(JAWAB_GAGAL));
    page.on("request", catat);

    try {
      await test.step("nama barang tampil dari bahanBaku", async () => {
        await page.goto(`${URL_DAFTAR}/${transfer.id}`);
        await expect(page.getByRole("button", { name: /konfirmasi terima barang/i })).toBeVisible();
        for (const item of transfer.items) {
          const nama = item.bahanBaku?.namaBahan;
          if (!nama) continue;
          await expect.soft(page.getByText(nama, { exact: true }).first(), "nama barang dari bahanBaku.namaBahan").toBeVisible();
        }
      });

      await test.step("terima gagal: seluruh item terkirim, pesan tampil, dialog bertahan", async () => {
        await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        const tGagal = page.waitForResponse((r) => r.request().method() === "PATCH" && POLA_TERIMA.test(r.url()));
        await dialog.getByRole("button", { name: /ya, selesaikan inbound/i }).click();
        expect((await tGagal).status()).toBe(500);
        await expect(page.getByText("Gagal Memproses Penerimaan")).toBeVisible();
        expect.soft(terkirim.at(-1) ?? [], "payload terima harus membawa seluruh item surat jalan").toEqual(
          transfer.items.map((item) =>
            expect.objectContaining({
              bahanBakuID: item.bahanBaku?.id,
              qtyKirim: item.qtyKirim,
              qtyTerima: item.qtyKirim,
            }),
          ),
        );
        await expect.soft(dialog, "dialog harus tetap terbuka saat gagal (keputusan Fase 0)").toBeVisible();
      });

      await test.step("jumlah diterima 0 ditahan tanpa PATCH", async () => {
        await page.reload();
        const jumlah = page.getByRole("spinbutton");
        await expect(jumlah).toHaveCount(transfer.items.length);
        const sebelum = terkirim.length;
        await jumlah.first().fill("0");
        await page.getByPlaceholder(/bungkus pecah/i).first().fill(ALASAN);
        await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
        await page.getByRole("alertdialog").getByRole("button", { name: /ya, selesaikan inbound/i }).click();
        await expect.soft(page.getByText(/belum dapat diproses/i).first(), "pesan penahanan jumlah 0").toBeVisible();
        expect.soft(terkirim.length - sebelum, "jumlah 0 tidak boleh mengirim PATCH terima selama backend memakai ||").toBe(0);
      });
    } finally {
      page.off("request", catat);
      await page.unroute(POLA_TERIMA);
      await batalkan(page, auth, transfer.id);
    }
  });

  test.fixme("jumlah diterima 0 terkirim apa adanya setelah backend berhenti memakai qtyTerima || qtyKirim", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const sj = await siapkanSuratJalan(page, auth);
    test.skip(!sj, "Tidak ada pengajuan APPROVED atau PENDING berarah benar tanpa surat jalan dengan stok gudang cukup");
    const transfer = sj!;

    await page.route(POLA_TERIMA, (route) => route.fulfill(JAWAB_GAGAL));
    try {
      await page.goto(`${URL_DAFTAR}/${transfer.id}`);
      await page.getByRole("spinbutton").first().fill("0");
      await page.getByPlaceholder(/bungkus pecah/i).first().fill(ALASAN);
      await page.getByRole("button", { name: /konfirmasi terima barang/i }).click();
      const tKirim = page.waitForRequest((r) => r.method() === "PATCH" && POLA_TERIMA.test(r.url()));
      await page.getByRole("alertdialog").getByRole("button", { name: /ya, selesaikan inbound/i }).click();
      const items: ItemTerima[] = (await tKirim).postDataJSON()?.items ?? [];
      expect(items[0]).toEqual(
        expect.objectContaining({
          bahanBakuID: transfer.items[0].bahanBaku?.id,
          qtyKirim: transfer.items[0].qtyKirim,
          qtyTerima: 0,
          catatanItem: ALASAN,
        }),
      );
    } finally {
      await page.unroute(POLA_TERIMA);
      await batalkan(page, auth, transfer.id);
    }
  });
});