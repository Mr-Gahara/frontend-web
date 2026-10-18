import { expect, test, type Request } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";
import { daftarAkun, pilihAkun, saldoAkun, type AkunKasUji } from "../../helpers/akun-kas-uji";
import { KATEGORI_FIXTURE, pastikanKategoriFixture } from "../../helpers/beban-uji";

/*
 * Spec pengeluaran (keputusan BO3a sampai BO7a), tanpa respons sukses palsu.
 * Beban Rp1 dicatat lewat UI dari akun kas aktif bersaldo dengan kategori
 * fixture tetap (RG7a), keterangannya diubah, lalu dibatalkan lewat UI,
 * sehingga saldo pulih. Beban tidak dapat dihapus, sehingga setiap run
 * meninggalkan satu beban berstatus Dibatalkan (BO7a). Pengguna uji berperan
 * Owner, sehingga jalur tanggal terkunci bagi peran lain hanya teruji di unit
 * test (payloadBuatBeban).
 */

const URL_PENGELUARAN = "/dashboard/outlet/pengeluaran";
const URL_CATAT = URL_PENGELUARAN + "/catatBeban";
const POLA_DAFTAR = /\/api\/bebanoperasional(\?|$)/i;
const POLA_ID = /\/api\/bebanoperasional\/[a-f0-9]{24}(\?|$)/i;

function hariIniLokal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test.describe("pengeluaran", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catat, ubah keterangan, lalu batalkan lewat UI: payload persis, saldo berkurang dan pulih (BO3a, BO5a, BO6a, BO7a)", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PENGELUARAN);
    const idKategori = await pastikanKategoriFixture(page, auth);
    const sumber = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!sumber, "tidak ada akun kas aktif bersaldo");
    const akun = sumber as AkunKasUji;
    const saldoAwal = akun.saldo;
    const keterangan = "E2E beban " + unik();
    const keteranganBaru = keterangan + " ubah";
    const alasan = "E2E batal " + unik();
    let idBeban: string | undefined;
    let dibatalkan = false;

    try {
      await page.getByRole("link", { name: "Catat Beban" }).click();
      await page.waitForURL("**" + URL_CATAT);
      await expect(page.getByRole("heading", { name: "Catat Beban", exact: true })).toBeVisible();

      await pilihAkun(page, "Akun Kas", akun.namaAkun);
      await pilihAkun(page, "Kategori", KATEGORI_FIXTURE);
      await page.getByLabel("Jumlah (Rp)").fill("1");
      await expect(
        page.getByRole("button", { name: /^Tanggal Beban, / }),
        "Owner memilih tanggal (BO5a)",
      ).toBeVisible();
      await page.getByLabel("Keterangan", { exact: true }).fill(keterangan);

      const tBuat = page.waitForResponse(
        (r) => r.request().method() === "POST" && POLA_DAFTAR.test(r.url()),
      );
      await page.getByRole("button", { name: "Simpan Beban" }).click();
      const buat = await tBuat;
      expect(buat.status(), "POST /bebanoperasional").toBe(201);
      expect(buat.request().postDataJSON()).toEqual({
        akunKasID: akun.id,
        kategoriBebanID: idKategori,
        jumlah: 1,
        tanggal: hariIniLokal(),
        keterangan,
      });
      idBeban = ((await buat.json()) as { data: { id: string } }).data.id;
      expect(idBeban, "id beban dari respons").toBeTruthy();
      await page.waitForURL("**" + URL_PENGELUARAN);
      expect(await saldoAkun(page, auth, akun.id), "saldo berkurang").toBe(saldoAwal - 1);

      const baris = page.getByRole("row").filter({ hasText: keterangan });
      await expect(baris).toHaveCount(1);
      await expect(baris).toContainText("Aktif");

      await page.getByRole("button", { name: "Aksi " + keterangan, exact: true }).click();
      await page.getByRole("menuitem", { name: "Ubah" }).click();
      const dialogUbah = page.getByRole("dialog");
      await expect(dialogUbah.getByLabel("Keterangan")).toHaveValue(keterangan);
      await expect(dialogUbah.getByRole("button", { name: "Simpan" })).toBeDisabled();
      await dialogUbah.getByLabel("Keterangan").fill(keteranganBaru);
      const tUbah = page.waitForResponse(
        (r) => r.request().method() === "PUT" && POLA_ID.test(r.url()),
      );
      await dialogUbah.getByRole("button", { name: "Simpan" }).click();
      const ubah = await tUbah;
      expect(ubah.status(), "PUT ubah beban").toBe(200);
      expect(ubah.request().postDataJSON(), "hanya keterangan (BO6a)").toEqual({ keterangan: keteranganBaru });
      await expect(dialogUbah).toBeHidden();
      await expect(baris).toContainText(keteranganBaru);

      await page.getByRole("button", { name: "Aksi " + keteranganBaru, exact: true }).click();
      await page.getByRole("menuitem", { name: "Batalkan" }).click();
      const dialogBatal = page.getByRole("dialog");
      await expect(dialogBatal).toContainText(akun.namaAkun);
      await dialogBatal.getByLabel("Alasan pembatalan").fill(alasan);
      const tBatal = page.waitForResponse(
        (r) => r.request().method() === "PUT" && POLA_ID.test(r.url()),
      );
      await dialogBatal.getByRole("button", { name: "Batalkan Beban" }).click();
      const batal = await tBatal;
      expect(batal.status(), "PUT VOID beban").toBe(200);
      expect(batal.request().postDataJSON()).toEqual({ status: "VOID", alasanVoid: alasan });
      dibatalkan = true;
      await expect(dialogBatal).toBeHidden();
      await expect(baris).toContainText("Dibatalkan");
      expect(await saldoAkun(page, auth, akun.id), "saldo pulih").toBe(saldoAwal);

      await page.getByRole("button", { name: "Aksi " + keteranganBaru, exact: true }).click();
      await expect(
        page.getByRole("menuitem", { name: "Batalkan" }),
        "beban yang dibatalkan tidak ditawarkan batal lagi",
      ).toHaveCount(0);
      await page.getByRole("menuitem", { name: "Lihat rincian" }).click();
      const rincian = page.getByRole("dialog");
      await expect(rincian).toContainText(alasan);
      await expect(rincian).toContainText(akun.namaAkun);
      await expect(rincian).toContainText(KATEGORI_FIXTURE);
    } finally {
      if (idBeban && !dibatalkan) {
        const void_ = await api(page, auth, "PUT", "/bebanoperasional/" + idBeban, {
          status: "VOID",
          alasanVoid: "E2E pembersihan",
        });
        expect.soft(void_.status, `batalkan beban uji: ${void_.pesan}`).toBe(200);
      }
    }
  });

  test("form menahan isian kosong dan jumlah di atas saldo, tanpa permintaan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PENGELUARAN);
    await pastikanKategoriFixture(page, auth);
    const tersedia = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!tersedia, "tidak ada akun kas aktif");
    const akun = tersedia as AkunKasUji;
    let terkirim = 0;
    const hitung = (req: Request) => {
      if (POLA_DAFTAR.test(req.url()) && req.method() === "POST") terkirim++;
    };

    try {
      page.on("request", hitung);
      await page.getByRole("link", { name: "Catat Beban" }).click();
      await page.waitForURL("**" + URL_CATAT);
      await expect(page.getByRole("heading", { name: "Catat Beban", exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Simpan Beban" }).click();
      const utama = page.getByRole("main");
      await expect(utama.getByText("Akun kas wajib dipilih.")).toBeVisible();
      await expect(utama.getByText("Kategori wajib dipilih.")).toBeVisible();
      await expect(utama.getByText("Jumlah wajib diisi.")).toBeVisible();
      await expect(utama.getByText("Keterangan wajib diisi.")).toBeVisible();

      await pilihAkun(page, "Akun Kas", akun.namaAkun);
      await expect(utama.getByText(/Saldo tersedia/)).toBeVisible();
      await pilihAkun(page, "Kategori", KATEGORI_FIXTURE);
      await page.getByLabel("Jumlah (Rp)").fill(String(akun.saldo + 1));
      await page.getByLabel("Keterangan", { exact: true }).fill("E2E saldo kurang");
      await page.getByRole("button", { name: "Simpan Beban" }).click();
      await expect(utama.getByText("Jumlah melebihi saldo akun kas.")).toBeVisible();
      expect(terkirim, "tidak ada POST /bebanoperasional").toBe(0);
    } finally {
      page.off("request", hitung);
    }
  });

  test("daftar yang gagal dimuat tampil sebagai pesan tanpa tabel (TB15a)", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ status: "error", message: "E2E galat daftar beban" }),
          })
        : route.continue(),
    );
    await page.goto(URL_PENGELUARAN);
    const utama = page.getByRole("main");
    await expect(utama.getByRole("alert").filter({ hasText: "E2E galat daftar beban" })).toBeVisible({
      timeout: 20000,
    });
    await expect(utama.locator("table")).toHaveCount(0);
    await page.unroute(POLA_DAFTAR);
  });
});
