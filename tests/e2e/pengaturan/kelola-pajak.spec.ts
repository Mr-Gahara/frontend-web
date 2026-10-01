import { expect, test, type Page, type Request } from "@playwright/test";
import { JAWAB_GAGAL, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { cocok, unik } from "../../helpers/reservasi-uji";
import { normalizeId } from "../../../lib/api/normalize";
import {
  NAMA_PRODUK_UJI,
  POLA_BUAT,
  POLA_DAFTAR,
  POLA_DETAIL,
  POLA_PASANG,
  POLA_RELASI,
  URL_PAJAK,
  barisPajak,
  buatLewatUi,
  cari,
  hapusPajakUji,
  isian,
  isiFormPajak,
  lepasSemuaRelasi,
  pastikanProdukUji,
  pemicu,
  pilihOpsi,
  relasiProduk,
  wajib,
  type PajakItem,
} from "../../helpers/pajak-uji";

/**
 * Spec migrasi pengaturan pajak (submodul pajak, keputusan PO6a sampai
 * PO9a). Setiap operasi berjalan lewat UI; API hanya membaca bukti,
 * menyiapkan produk uji, dan membersihkan sisa run yang gagal. Pajak per
 * transaksi hanya diuji lewat POST yang dijawab gagal, agar PPN tenant uji
 * tidak dinonaktifkan backend (PO10a). Perilaku yang tidak berubah dijaga
 * spec pembanding pajak.spec.ts.
 */

/** Menghitung permintaan satu method dan pola URL; lepas() menghentikannya. */
function hitungPermintaan(page: Page, method: string, pola: RegExp) {
  let jumlah = 0;
  const dengar = (r: Request) => {
    if (r.method() === method && pola.test(r.url())) jumlah++;
  };
  page.on("request", dengar);
  return { jumlah: () => jumlah, lepas: () => page.off("request", dengar) };
}

test.describe("E2E — Kelola pajak", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("form menolak isian tidak sah dengan pesan per isian, tanpa POST (PO8a)", async ({ page }) => {
    await bukaDenganAuth(page, URL_PAJAK);
    const pantau = hitungPermintaan(page, "POST", POLA_BUAT);
    try {
      await page.getByRole("button", { name: "Tambah Pajak" }).click();
      const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
      await isian(dialog, "Nama Pajak").fill("   ");
      await dialog.getByRole("button", { name: "Simpan" }).click();
      await expect(dialog.getByText("Nama Pajak wajib diisi.")).toBeVisible();
      await expect(dialog.getByText("Tarif wajib diisi.")).toBeVisible();

      await isian(dialog, "Nama Pajak").fill("E2E PJK " + unik());
      await isian(dialog, "Tarif (%)").fill("101");
      await dialog.getByRole("button", { name: "Simpan" }).click();
      await expect(dialog.getByText("Tarif harus antara 0 sampai 100.")).toBeVisible();

      await dialog.getByRole("combobox", { name: "Prioritas" }).click();
      await expect(page.getByRole("option")).toHaveText(["1", "2"]);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeVisible();
      expect(pantau.jumlah(), "tidak ada POST selama isian tidak sah").toBe(0);
    } finally {
      pantau.lepas();
    }
  });

  test("buat, ubah nama saja, lalu hapus yang sempat gagal (PO8a, butir 15, PO9a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const nama = "E2E PJK " + unik();
    const namaBaru = nama + " Ubah";
    let id: string | undefined;
    try {
      await test.step("buat dengan tarif 0, prioritas 2, dan Inklusif; nama dipangkas", async () => {
        await page.getByRole("button", { name: "Tambah Pajak" }).click();
        const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
        await isiFormPajak(dialog, { nama: "  " + nama + "  ", tarif: "0", prioritas: "2", model: "Inklusif" });
        const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_BUAT.test(r.url()));
        const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
        await dialog.getByRole("button", { name: "Simpan" }).click();
        expect((await tKirim).postDataJSON()).toEqual({
          namaPajak: nama,
          tarifPajak: 0,
          tipePajak: true,
          modelPerhitungan: 1,
          prioritas: 2,
          statusPajak: true,
        });
        const jawab = await tJawab;
        expect(jawab.status()).toBe(201);
        id = (normalizeId(((await jawab.json()) as { data: PajakItem }).data) as PajakItem).id;
        await expect(dialog).toBeHidden();
        await cari(page, nama);
        const baris = barisPajak(page, nama);
        await expect(baris).toContainText("0%");
        await expect(baris).toContainText("Inklusif");
        await expect(baris.getByRole("cell", { name: "2", exact: true })).toBeVisible();
      });

      await test.step("ubah nama saja: simpan nonaktif sebelum ada perubahan, payload nama dan tipePajak", async () => {
        await page.getByRole("button", { name: `Aksi ${nama}` }).click();
        await page.getByRole("menuitem", { name: "Edit" }).click();
        const dialog = page.getByRole("dialog", { name: "Edit Pajak" });
        const simpan = dialog.getByRole("button", { name: "Simpan" });
        await expect(dialog.getByRole("combobox", { name: "Prioritas" })).toContainText("2");
        await expect(simpan).toBeDisabled();
        await isian(dialog, "Nama Pajak").fill(namaBaru);
        await expect(simpan).toBeEnabled();
        const tKirim = page.waitForRequest((r) => r.method() === "PUT" && POLA_DETAIL.test(r.url()));
        const tJawab = page.waitForResponse(cocok("PUT", POLA_DETAIL));
        await simpan.click();
        expect((await tKirim).postDataJSON()).toEqual({ tipePajak: true, namaPajak: namaBaru });
        expect((await tJawab).status()).toBe(200);
        await expect(dialog).toBeHidden();
        await cari(page, namaBaru);
        await expect(barisPajak(page, namaBaru)).toHaveCount(1);
      });

      await test.step("hapus: gagal lalu berhasil, dialog bertahan saat gagal", async () => {
        await page.getByRole("button", { name: `Aksi ${namaBaru}` }).click();
        await page.getByRole("menuitem", { name: "Hapus" }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toContainText("Produk yang memakai pajak ini akan dilepas");
        await page.route(POLA_DETAIL, (route) =>
          route.request().method() === "DELETE" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
        );
        try {
          const tGagal = page.waitForResponse(cocok("DELETE", POLA_DETAIL));
          await dialog.getByRole("button", { name: "Lanjutkan" }).click();
          expect((await tGagal).status()).toBe(500);
          await expect(dialog).toBeVisible();
          await expect(dialog.getByText("uji", { exact: true })).toBeVisible();
        } finally {
          await page.unroute(POLA_DETAIL);
        }
        const tJawab = page.waitForResponse(cocok("DELETE", POLA_DETAIL));
        await dialog.getByRole("button", { name: "Lanjutkan" }).click();
        expect((await tJawab).status()).toBe(200);
        await expect(dialog).toBeHidden();
        await expect(barisPajak(page, namaBaru)).toHaveCount(0);
        expect((await api(page, auth, "GET", "/pajak/" + id)).status, "pajak terhapus").toBe(404);
        id = undefined;
      });
    } finally {
      await hapusPajakUji(page, auth, id);
    }
  });

  test("pajak per transaksi aktif memperingatkan pajak yang akan dinonaktifkan; POST dijawab gagal (PO7a, PO10a)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const semua = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");
    const aktif = semua.filter((p) => !p.tipePajak && p.statusPajak);
    expect(aktif.length, "tenant uji punya pajak per transaksi aktif").toBeGreaterThan(0);
    const nama = "E2E PJK " + unik();
    await page.getByRole("button", { name: "Tambah Pajak" }).click();
    const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
    await isiFormPajak(dialog, { nama, tarif: "5", tipe: "Per Transaksi" });
    const peringatan = dialog.getByText(/akan menonaktifkan/);
    await expect(peringatan).toBeVisible();
    for (const p of aktif) await expect(peringatan).toContainText(p.namaPajak);
    await pilihOpsi(dialog, "Status", "Non-Aktif");
    await expect(peringatan).toHaveCount(0);
    await pilihOpsi(dialog, "Status", "Aktif");
    await expect(peringatan).toBeVisible();

    await page.route(POLA_BUAT, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    try {
      const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_BUAT.test(r.url()));
      await dialog.getByRole("button", { name: "Simpan" }).click();
      expect((await tKirim).postDataJSON()).toMatchObject({ namaPajak: nama, tipePajak: false, statusPajak: true });
      await expect(dialog.getByText("uji", { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
    } finally {
      await page.unroute(POLA_BUAT);
    }
    const sesudah = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");
    const idAktif = (d: PajakItem[]) => d.filter((p) => !p.tipePajak && p.statusPajak).map((p) => p.id).sort();
    expect(idAktif(sesudah), "pajak per transaksi aktif tidak berubah").toEqual(idAktif(semua));
    expect(sesudah.some((p) => p.namaPajak === nama), "tidak ada pajak tersimpan").toBe(false);
  });

  test("pajak per produk: data terpasang benar, pajak nonaktif tidak ditawarkan, dan ganti lewat konfirmasi (PO6a)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const produk = await pastikanProdukUji(page, auth);
    await lepasSemuaRelasi(page, auth, produk.id);
    const akhiran = unik();
    const namaA = "E2E PJK A " + akhiran;
    const namaB = "E2E PJK B " + akhiran;
    const namaC = "E2E PJK C " + akhiran;
    const id: { a?: string; b?: string; c?: string } = {};
    const opsi = (nama: string, tarif: number) => page.getByRole("option", { name: `${nama} (${tarif}%)`, exact: true });
    try {
      await page.reload();
      await buatLewatUi(page, namaA, "5", (x) => {
        id.a = x;
      });
      await buatLewatUi(page, namaB, "7", (x) => {
        id.b = x;
      }, { model: "Inklusif" });
      await buatLewatUi(page, namaC, "9", (x) => {
        id.c = x;
      }, { status: "Non-Aktif" });
      const semua = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");

      await page.getByRole("tab", { name: "Pajak per Produk" }).click();
      await pemicu(page, "Pilih produk").click();
      const tRelasi = page.waitForResponse(cocok("GET", POLA_RELASI));
      await page.getByRole("option", { name: NAMA_PRODUK_UJI, exact: true }).click();
      expect((await tRelasi).status()).toBe(200);
      await expect(page.getByText("Belum ada pajak untuk produk ini.")).toBeVisible();

      await pemicu(page, "Pilih pajak").click();
      await expect(opsi(namaA, 5)).toBeVisible();
      await expect(opsi(namaB, 7)).toBeVisible();
      await expect(opsi(namaC, 9)).toHaveCount(0);
      for (const p of semua.filter((x) => !x.tipePajak)) await expect(opsi(p.namaPajak, p.tarifPajak)).toHaveCount(0);
      await opsi(namaA, 5).click();
      const tPasang = page.waitForResponse(cocok("POST", POLA_PASANG));
      await page.getByRole("button", { name: "Assign" }).click();
      expect((await tPasang).status()).toBe(201);
      const baris = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Lepas" }) });
      await expect(baris).toContainText(namaA);
      await expect(baris).toContainText("5%");
      await expect(baris).toContainText("Add-on (Eksklusif)");

      await pemicu(page, "Pilih pajak").click();
      await expect(opsi(namaA, 5)).toHaveCount(0);
      await opsi(namaB, 7).click();
      await page.getByRole("button", { name: "Assign" }).click();
      const konfirmasi = page.getByRole("alertdialog");
      await expect(konfirmasi).toContainText(`Ganti pajak ${NAMA_PRODUK_UJI}?`);
      await expect(konfirmasi).toContainText(namaA);
      await expect(konfirmasi).toContainText(namaB);
      const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_PASANG.test(r.url()));
      await konfirmasi.getByRole("button", { name: "Ganti" }).click();
      expect((await tKirim).postDataJSON()).toEqual({ produkID: produk.id, pajakID: id.b });
      await expect(konfirmasi).toBeHidden();
      await expect(baris).toContainText(namaB);
      await expect(baris).toContainText("7%");
      await expect(baris).toContainText("Inklusif");
      expect((await relasiProduk(page, auth, produk.id)).map((r) => r.pajak.id)).toEqual([id.b]);

      const tLepas = page.waitForResponse(cocok("DELETE", POLA_RELASI));
      await page.getByRole("button", { name: "Lepas" }).click();
      expect((await tLepas).status()).toBe(200);
      await expect(page.getByText("Belum ada pajak untuk produk ini.")).toBeVisible();
      expect(await relasiProduk(page, auth, produk.id)).toEqual([]);
    } finally {
      for (const x of [id.a, id.b, id.c]) await hapusPajakUji(page, auth, x);
    }
  });

  test("daftar pajak yang gagal dimuat menampilkan pesan dan dapat dicoba lagi", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_PAJAK);
    const pesan = page.getByRole("alert").filter({ hasText: "Gagal memuat pajak" });
    await expect(pesan).toBeVisible({ timeout: 20_000 });
    await expect(pesan).toContainText("uji");
    await page.unroute(POLA_DAFTAR);
    const tMuat = page.waitForResponse(cocok("GET", POLA_DAFTAR));
    await pesan.getByRole("button", { name: "Coba Lagi" }).click();
    expect((await tMuat).status()).toBe(200);
    await expect(page.getByPlaceholder("Cari nama pajak...")).toBeVisible();
  });
});