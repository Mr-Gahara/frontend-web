import { expect, test, type Page, type Response } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { cocok, unik } from "../../helpers/reservasi-uji";
import { buatAkunUji, daftarAkun, pilihAkun, saldoAkun, tutupAkunUji, type AkunKasUji } from "../../helpers/akun-kas-uji";
import { LABEL_JENIS, teksJumlahMutasi } from "../../../features/akun-kas/mutasi";
import { formatRupiah } from "../../../lib/format";

/*
 * Menutup akun kas bersaldo sebagai satu alur (kontrak/temuan.md butir 81):
 * akun yang masih bersaldo ditolak dinonaktifkan, saldonya dipindah lewat
 * Pindah Dana, lalu akun dinonaktifkan. Buku mutasi akun uji sesudahnya
 * berisi empat baris yang pasti, sehingga tampilan mutasi transfer dan
 * pembatalannya diperiksa tanpa bergantung pada data bulan berjalan.
 * Seluruh operasi yang diuji lewat UI, tanpa respons palsu. Akun uji dibuat
 * lewat API. Setiap run meninggalkan satu akun uji non-aktif, dua transfer
 * AKTIF, dan satu transfer VOID, masing-masing Rp1; saldo akun sumber pulih.
 */

const URL_AKUN = "/dashboard/outlet/keuangan/akunkas";
const URL_PINDAH = URL_AKUN + "/pindahDana";
const URL_MUTASI = "/dashboard/outlet/keuangan/mutasiArusKas";
const urlUbah = (id: string) => `${URL_AKUN}/${id}/ubah`;
const POLA_AKUN_ID = /\/api\/akunkas\/[a-f0-9]{24}(\?|$)/i;
const POLA_TRANSFER = /\/api\/jurnaltransfer(\?|$)/i;
const POLA_TRANSFER_ID = /\/api\/jurnaltransfer\/[a-f0-9]{24}(\?|$)/i;
const POLA_MUTASI = /\/api\/akunkas\/mutasi(\?|$)/i;
const POLA_RINGKASAN = /\/api\/akunkas\/[0-9a-f]{24}\/ringkasan(\?|$)/i;

type BarisMutasi = Parameters<typeof teksJumlahMutasi>[0] & {
  jenis: keyof typeof LABEL_JENIS;
  saldoSesudah: number;
};

/** Rupiah seperti yang ditampilkan halaman (formatRupiah); spasi tak-putus diganti spasi biasa. */
const rupiah = (nilai: number) => formatRupiah(nilai).replace(/\u00a0/g, " ");

/** Memindahkan Rp1 lewat form Pindah Dana yang sedang terbuka, dan mengembalikan id transfernya. */
async function pindahkanSatuRupiah(page: Page, sumber: string, tujuan: string, keterangan: string) {
  await pilihAkun(page, "Akun Sumber", sumber);
  await pilihAkun(page, "Akun Tujuan", tujuan);
  await page.getByLabel("Jumlah (Rp)").fill("1");
  await page.getByLabel("Keterangan", { exact: true }).fill(keterangan);
  const tunggu = page.waitForResponse((r) => POLA_TRANSFER.test(r.url()) && r.request().method() === "POST");
  await page.getByRole("button", { name: "Pindahkan Dana" }).click();
  const respons = await tunggu;
  const body = await respons.json().catch(() => ({}));
  expect(respons.status(), `POST /jurnaltransfer: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
  await expect(page.getByLabel("Jumlah (Rp)"), "form dikosongkan setelah berhasil").toHaveValue("");
  return String(body.data.id);
}

/** Menekan Nonaktifkan di halaman ubah yang sedang terbuka, dan mengembalikan respons PUT-nya. */
async function tekanNonaktifkan(page: Page) {
  await page.getByRole("button", { name: "Nonaktifkan Akun" }).click();
  const dialog = page.getByRole("dialog");
  const tunggu = page.waitForResponse(cocok("PUT", POLA_AKUN_ID));
  await dialog.getByRole("button", { name: "Nonaktifkan", exact: true }).click();
  return { dialog, respons: await tunggu };
}

test.describe("tutup akun kas bersaldo", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("akun bersaldo ditolak, dikosongkan lewat Pindah Dana, ditutup, dan buku mutasinya sesuai", async ({ page }) => {
    test.slow();
    let auth = await bukaDenganAuth(page, URL_AKUN);
    const sumber = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && Number(a.saldo) >= 1 && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!sumber, "tidak ada akun kas aktif bersaldo untuk meminjamkan saldo");
    const akunSumber = sumber as AkunKasUji;
    const saldoSumberAwal = Number(akunSumber.saldo);
    const nama = "E2E Tutup Bersaldo " + unik();
    const tanda = unik();
    let id: string | undefined;
    let ditutup = false;

    try {
      id = (await buatAkunUji(page, auth, nama, "E2E tutup akun bersaldo")).id;
      const idAkun = id;

      await test.step("pindah Rp1 ke akun uji lalu batalkan, kemudian pindah Rp1 lagi", async () => {
        auth = await bukaDenganAuth(page, URL_PINDAH);
        const keteranganBatal = "E2E tutup dibatalkan " + tanda;
        await pindahkanSatuRupiah(page, akunSumber.namaAkun, nama, keteranganBatal);
        const baris = page.getByRole("row").filter({ hasText: keteranganBatal });
        await baris.getByRole("button", { name: "Batalkan" }).click();
        const dialog = page.getByRole("dialog");
        const tungguBatal = page.waitForResponse(
          (r) => POLA_TRANSFER_ID.test(r.url()) && r.request().method() === "PUT",
        );
        await dialog.getByRole("button", { name: "Batalkan Transfer" }).click();
        expect((await tungguBatal).status(), "PUT /jurnaltransfer/:id").toBe(200);
        await expect(dialog).toBeHidden();
        expect(await saldoAkun(page, auth, idAkun), "saldo akun uji setelah pembatalan").toBe(0);

        await pindahkanSatuRupiah(page, akunSumber.namaAkun, nama, "E2E tutup masuk " + tanda);
        expect(await saldoAkun(page, auth, idAkun), "saldo akun uji terisi").toBe(1);
      });

      await test.step("nonaktifkan ditolak 409 selama akun masih bersaldo", async () => {
        auth = await bukaDenganAuth(page, urlUbah(idAkun));
        const { dialog, respons } = await tekanNonaktifkan(page);
        expect(respons.status()).toBe(409);
        const pesan = String((await respons.json().catch(() => ({}))).message ?? "");
        expect(pesan, "penolakan menyebut saldo").toMatch(/saldo/i);
        await expect(dialog.getByRole("alert")).toHaveText(pesan);
        await expect(dialog).toBeVisible();
        const tetap = (await daftarAkun(page, auth)).find((a) => a.id === idAkun);
        expect(tetap?.status).toBe("aktif");
      });

      await test.step("saldo dipindah keluar lewat Pindah Dana", async () => {
        auth = await bukaDenganAuth(page, URL_PINDAH);
        await pindahkanSatuRupiah(page, nama, akunSumber.namaAkun, "E2E tutup keluar " + tanda);
        expect(await saldoAkun(page, auth, idAkun), "saldo akun uji kosong").toBe(0);
        expect(Number(await saldoAkun(page, auth, akunSumber.id)), "saldo sumber pulih").toBe(saldoSumberAwal);
      });

      await test.step("nonaktifkan berhasil, dan akun pindah ke bagian lipat", async () => {
        auth = await bukaDenganAuth(page, urlUbah(idAkun));
        const { respons } = await tekanNonaktifkan(page);
        const body = await respons.json().catch(() => ({}));
        expect(respons.status(), `nonaktifkan: ${JSON.stringify(body).slice(0, 200)}`).toBe(200);
        ditutup = true;
        await page.waitForURL(/\/keuangan\/akunkas$/);
        await page.getByRole("button", { name: /^Akun non-aktif \(\d+\)$/ }).click();
        const baris = page.locator("#daftar-akun-non-aktif").getByRole("listitem").filter({ hasText: nama });
        await expect(baris).toHaveCount(1);
      });

      await test.step("buku mutasi akun uji: empat baris transfer dengan label dan jumlahnya", async () => {
        const mutasiAkun = (r: Response) =>
          r.request().method() === "GET" &&
          POLA_MUTASI.test(r.url()) &&
          new URL(r.url()).searchParams.get("akunKasID") === idAkun;
        await page.goto(URL_MUTASI);
        await expect(page.getByRole("heading", { name: "Laporan Mutasi Arus Kas" })).toBeVisible();
        const tMutasi = page.waitForResponse(mutasiAkun);
        const tRingkasan = page.waitForResponse(
          (r) => r.request().method() === "GET" && POLA_RINGKASAN.test(r.url()) && r.url().includes(idAkun),
        );
        await page.getByRole("combobox", { name: "Akun kas", exact: true }).click();
        await page.getByRole("option", { name: nama, exact: true }).click();
        const resMutasi = await tMutasi;
        expect(resMutasi.status()).toBe(200);
        const mutasi = ((await resMutasi.json()) as { data: BarisMutasi[] }).data;
        const resRingkasan = await tRingkasan;
        expect(resRingkasan.status()).toBe(200);
        const ringkasan = ((await resRingkasan.json()) as {
          data: { totalMasuk: number; totalKeluar: number; saldoAkhirPeriode: number };
        }).data;

        expect(mutasi.map((m) => m.jenis).sort(), "jenis mutasi akun uji").toEqual([
          "TRANSFER_KELUAR",
          "TRANSFER_MASUK",
          "TRANSFER_MASUK",
          "VOID_TRANSFER_MASUK",
        ]);
        expect(mutasi[0].jenis, "mutasi terbaru adalah transfer keluar").toBe("TRANSFER_KELUAR");
        expect(mutasi[0].saldoSesudah, "saldo sesudah mutasi terakhir").toBe(0);

        const baris = page.locator("tbody tr");
        await expect(baris).toHaveCount(mutasi.length);
        for (const [i, m] of mutasi.entries()) {
          await expect(baris.nth(i), `baris ${i + 1}: label jenis`).toContainText(LABEL_JENIS[m.jenis]);
          await expect(baris.nth(i), `baris ${i + 1}: jumlah`).toContainText(teksJumlahMutasi(m));
        }

        expect(ringkasan.saldoAkhirPeriode, "saldo akhir periode akun uji").toBe(0);
        const kartu = page.getByRole("region", { name: `Ringkasan ${nama}` });
        await expect(kartu).toBeVisible({ timeout: 15_000 });
        await expect(kartu).toContainText(rupiah(ringkasan.totalMasuk));
        await expect(kartu).toContainText(rupiah(ringkasan.totalKeluar));
        await expect(kartu).toContainText(rupiah(ringkasan.saldoAkhirPeriode));
      });
    } finally {
      if (id && !ditutup) {
        const baca = await api<AkunKasUji[]>(page, auth, "GET", "/akunkas");
        const sisa = Number((baca.data ?? []).find((a) => a.id === id)?.saldo ?? 0);
        if (sisa > 0) {
          const balik = await api(page, auth, "POST", "/jurnaltransfer", {
            kasSumberID: id,
            kasTujuanID: akunSumber.id,
            jumlah: sisa,
            keterangan: "E2E pemulihan saldo akun uji " + tanda,
          });
          expect.soft(balik.status, `pulihkan saldo akun uji: ${balik.pesan}`).toBe(201);
        }
        await tutupAkunUji(page, auth, id);
      }
    }
  });
});