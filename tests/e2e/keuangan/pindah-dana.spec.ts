import { expect, test } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";
import { daftarAkun, saldoAkun, buatAkunUji, tutupAkunUji, pilihAkun, type AkunKasUji } from "../../helpers/akun-kas-uji";

/*
 * Spec Pindah Dana antar akun kas (keputusan DN1a sampai DN3a), tanpa respons
 * palsu. Transfer dibuat dan dibatalkan lewat UI: Rp1 dipindah dari akun
 * aktif yang sudah ada ke akun uji bersaldo 0, lalu dikembalikan lewat VOID,
 * sehingga saldo kedua akun pulih dan akun uji dapat dinonaktifkan. Akun uji
 * dibuat lewat API karena milik modul akun kas (keputusan rancangan butir
 * 23), dan ditutup di finally. Transfer tidak dapat dihapus, sehingga setiap
 * run meninggalkan satu transfer berstatus VOID.
 */

const URL_AKUN = "/dashboard/outlet/keuangan/akunkas";
const URL_PINDAH = URL_AKUN + "/pindahDana";
const POLA_TRANSFER = /\/api\/jurnaltransfer(\?|$)/i;
const POLA_TRANSFER_ID = /\/api\/jurnaltransfer\/[a-f0-9]{24}(\?|$)/i;

test.describe("pindah dana", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("pindah lewat UI lalu batalkan: payload persis, saldo berpindah dan pulih (DN1a, DN2a, DN3a)", async ({ page }) => {
    let auth = await bukaDenganAuth(page, URL_AKUN);
    const sumber = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!sumber, "tidak ada akun kas aktif bersaldo untuk menjadi sumber");
    const akunSumber = sumber as AkunKasUji;
    const saldoSumberAwal = akunSumber.saldo;
    const namaTujuan = "E2E Pindah Tujuan " + unik();
    const keterangan = "E2E pindah dana " + unik();
    const alasan = "E2E batal " + unik();
    let idTujuan: string | undefined;
    let idTransfer: string | undefined;
    let dibatalkan = false;

    try {
      idTujuan = (await buatAkunUji(page, auth, namaTujuan)).id;
      auth = await bukaDenganAuth(page, URL_AKUN);

      await page.getByRole("link", { name: "Pindah Dana" }).click();
      await page.waitForURL("**" + URL_PINDAH);
      await expect(page.getByRole("heading", { name: "Pindah Dana", exact: true })).toBeVisible();

      await pilihAkun(page, "Akun Sumber", akunSumber.namaAkun);
      await pilihAkun(page, "Akun Tujuan", namaTujuan);
      await page.getByLabel("Jumlah (Rp)").fill("1");
      await page.getByLabel("Keterangan", { exact: true }).fill(keterangan);

      const tungguBuat = page.waitForResponse(
        (r) => POLA_TRANSFER.test(r.url()) && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Pindahkan Dana" }).click();
      const buat = await tungguBuat;
      expect(buat.status(), "POST /jurnaltransfer").toBe(201);
      expect(buat.request().postDataJSON()).toEqual({
        kasSumberID: akunSumber.id,
        kasTujuanID: idTujuan,
        jumlah: 1,
        keterangan,
      });
      idTransfer = (await buat.json()).data.id;
      expect(idTransfer, "id transfer dari respons").toBeTruthy();

      expect(await saldoAkun(page, auth, idTujuan), "saldo tujuan bertambah").toBe(1);
      expect(await saldoAkun(page, auth, akunSumber.id), "saldo sumber berkurang").toBe(
        saldoSumberAwal - 1,
      );

      const baris = page.getByRole("row").filter({ hasText: keterangan });
      await expect(baris).toHaveCount(1);
      await expect(baris).toContainText(akunSumber.namaAkun);
      await expect(baris).toContainText(namaTujuan);
      await expect(baris).toContainText("Aktif");
      await expect(page.getByLabel("Jumlah (Rp)"), "form dikosongkan setelah berhasil").toHaveValue("");

      await baris.getByRole("button", { name: "Batalkan" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText(namaTujuan);
      await dialog.getByLabel(/Alasan pembatalan/).fill(alasan);
      const tungguBatal = page.waitForResponse(
        (r) => POLA_TRANSFER_ID.test(r.url()) && r.request().method() === "PUT",
      );
      await dialog.getByRole("button", { name: "Batalkan Transfer" }).click();
      const batal = await tungguBatal;
      expect(batal.status(), "PUT /jurnaltransfer/:id").toBe(200);
      expect(batal.request().postDataJSON()).toEqual({ status: "VOID", catatan: alasan });
      dibatalkan = true;
      await expect(dialog).toBeHidden();

      await expect(baris).toContainText("Dibatalkan");
      await expect(baris).toContainText("Alasan batal: " + alasan);
      await expect(baris.getByRole("button", { name: "Batalkan" })).toHaveCount(0);

      expect(await saldoAkun(page, auth, idTujuan), "saldo tujuan pulih").toBe(0);
      expect(await saldoAkun(page, auth, akunSumber.id), "saldo sumber pulih").toBe(saldoSumberAwal);
    } finally {
      if (idTransfer && !dibatalkan) {
        const void_ = await api(page, auth, "PUT", "/jurnaltransfer/" + idTransfer, { status: "VOID" });
        expect.soft(void_.status, `batalkan transfer uji: ${void_.pesan}`).toBe(200);
      }
      await tutupAkunUji(page, auth, idTujuan);
    }
  });

  test("form menahan isian kosong dan jumlah di atas saldo, tanpa permintaan", async ({ page }) => {
    let auth = await bukaDenganAuth(page, URL_AKUN);
    const tujuan = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!tujuan, "tidak ada akun kas aktif lain untuk menjadi tujuan");
    const akunTujuan = tujuan as AkunKasUji;
    const namaSumber = "E2E Pindah Sumber " + unik();
    let idSumber: string | undefined;
    let terkirim = 0;
    const hitung = (req: { url(): string; method(): string }) => {
      if (POLA_TRANSFER.test(req.url()) && req.method() === "POST") terkirim++;
    };

    try {
      idSumber = (await buatAkunUji(page, auth, namaSumber)).id;
      auth = await bukaDenganAuth(page, URL_PINDAH);
      await expect(page.getByRole("heading", { name: "Pindah Dana", exact: true })).toBeVisible();
      page.on("request", hitung);

      const kirim = page.getByRole("button", { name: "Pindahkan Dana" });
      await kirim.click();
      const utama = page.getByRole("main");
      await expect(utama.getByText("Akun sumber wajib dipilih.")).toBeVisible();
      await expect(utama.getByText("Akun tujuan wajib dipilih.")).toBeVisible();
      await expect(utama.getByText("Jumlah wajib diisi.")).toBeVisible();
      await expect(utama.getByText("Keterangan wajib diisi.")).toBeVisible();

      await pilihAkun(page, "Akun Sumber", namaSumber);
      await expect(utama.getByText(/Saldo tersedia/)).toBeVisible();

      await page.getByRole("combobox", { name: "Akun Tujuan" }).click();
      await expect(
        page.getByRole("option", { name: namaSumber, exact: true }),
        "akun sumber tidak ditawarkan sebagai tujuan",
      ).toHaveCount(0);
      await page.getByRole("option", { name: akunTujuan.namaAkun, exact: true }).click();

      await page.getByLabel("Jumlah (Rp)").fill("1");
      await page.getByLabel("Keterangan", { exact: true }).fill("E2E saldo kurang");
      await kirim.click();
      await expect(utama.getByText("Jumlah melebihi saldo akun sumber.")).toBeVisible();
      expect(terkirim, "tidak ada POST /jurnaltransfer").toBe(0);
    } finally {
      page.off("request", hitung);
      await tutupAkunUji(page, auth, idSumber);
    }
  });
});