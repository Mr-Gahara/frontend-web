import ExcelJS from "exceljs";
import { expect, test, type Page } from "@playwright/test";
import { saldoAkun } from "../../helpers/akun-kas-uji";
import { NAMA_PRODUK, batalkanPenjualanUji, bayarLewatApi, detailPenjualan, siapkanFixture, simpanLewatApi } from "../../helpers/penjualan-uji";
import { siapkanFixtureBooking, unik } from "../../helpers/reservasi-uji";
import {
  PERANGKAT_UJI,
  bersihkanMesinUji,
  bukaKasirLewatAplikasi,
  detailSesi,
  sesiAplikasi,
  sesiBuka,
  siapkanLaciUji,
  tungguBatasHitungan,
} from "../../helpers/sesi-kasir-uji";
import { masukKasirBukaTutup } from "../../helpers/terkunci-uji";
import { api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { PENGGUNA_UJI, masukUlang } from "../../helpers/masuk-uji";
import { URL_LAPORAN_TUTUP_KASIR, angkaStruk } from "../../../features/sesi-kasir/laporan";
import type { LaporanPeriodeKasir, PeriodeKasirDetail } from "../../../types/sesiKasir";

/*
 * Struk laporan tutup kasir dengan transaksi nyata (PW13, kriteria selesai MVP
 * di referensi/rencana-struk-tutup-kasir.md). Sesi dibuka lewat aplikasi uji;
 * penjualan tunai, non-tunai, dan yang belum dibayar dibuat dari aplikasi
 * (bersesi, B373 dan B374); satu pembayaran invoice dari web (tanpa sesi);
 * kasir ditutup dari web. Harapan laporan disusun dari transaksi yang dibuat
 * spec ini, lalu angka di layar, cetak, dan unduhan dibandingkan dengan
 * laporan backend. Sesudah dibersihkan (VOID), laporan tetap sama karena
 * dipotret saat tutup (keputusan 5).
 */

type Metode = { id: string; namaPembayaran: string; kategori: "tunai" | "non-tunai"; isActive: boolean; akunKas: unknown };
type Penjualan = { id: string; totalTagihan: number; statusPenjualan: string; sesiKasirID?: string | null };

const URL_MESIN = "/dashboard/outlet/keuangan/mesinKasir";
const POLA_TUTUP = /\/api\/sesikasir\/[0-9a-f]{24}\/tutup$/i;

async function laporan(page: Page, auth: Auth, id: string): Promise<PeriodeKasirDetail> {
  const r = await api<PeriodeKasirDetail>(page, auth, "GET", "/sesikasir/periode/" + id);
  expect(r.status, "baca periode: " + r.pesan).toBe(200);
  return r.data;
}

test("struk tutup kasir dari transaksi nyata: tunai, non-tunai, belum dibayar, dan invoice web; layar, cetak, dan unduhan sama dengan laporan; kasir tanpa read-sesi-kasir tidak mengunduh", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await login(page);
  const auth: Auth = await bukaDenganAuth(page, URL_MESIN);
  const lain = (await sesiBuka(page, auth)).filter((s) => s.installationId !== PERANGKAT_UJI.installationId);
  test.skip(lain.length > 0, "mesin kasir lain masih buka, sehingga periode uji tidak hanya berisi sesi uji");

  const laci = await siapkanLaciUji(page, auth);
  await bersihkanMesinUji(page, auth, laci.id);
  const fx = await siapkanFixture(page, auth, 20);
  // Pelanggan uji tetap (dibuat sekali); penjualan mewajibkan pelangganID.
  const { pelangganId } = await siapkanFixtureBooking(page, auth);
  const metode = (await api<Metode[]>(page, auth, "GET", "/metodepembayaran")).data;
  const tunai = metode.find((m) => m.isActive && m.akunKas && m.kategori === "tunai");
  const nonTunai = metode.find((m) => m.isActive && m.akunKas && m.kategori === "non-tunai");
  test.skip(!tunai || !nonTunai, "butuh metode tunai dan non-tunai aktif");

  const nama = `E2E Kasir Struk ${unik()}`;
  const penjualanUji: string[] = [];
  const app = await sesiAplikasi();
  try {
    const pasang = await api(page, auth, "POST", "/sesikasir/perangkat", {
      installationId: PERANGKAT_UJI.installationId,
      namaPerangkat: nama,
      akunKasID: laci.id,
    });
    expect(pasang.status, "pasang mesin kasir uji: " + pasang.pesan).toBe(200);

    // Batas jendela invoice: periode sebelumnya di outlet ditutup tepat sebelum periode uji,
    // sehingga pembayaran tanpa sesi dari spec lain tidak masuk.
    const pembatas = await bukaKasirLewatAplikasi(await saldoAkun(page, auth, laci.id));
    const nominalPembatas = await saldoAkun(page, auth, laci.id);
    let tutupPembatas = await api(page, auth, "POST", `/sesikasir/${pembatas.id}/tutup`, { nominal: nominalPembatas });
    if (tutupPembatas.status === 429) {
      // Batas hitungan 10 per menit per pengguna (tungguBatasHitungan).
      await tungguBatasHitungan({});
      tutupPembatas = await api(page, auth, "POST", `/sesikasir/${pembatas.id}/tutup`, { nominal: nominalPembatas });
    }
    expect(tutupPembatas.status, "tutup sesi pembatas: " + tutupPembatas.pesan).toBe(200);

    const modal = await saldoAkun(page, auth, laci.id);
    const sesi = await bukaKasirLewatAplikasi(modal);

    // Transaksi POS dari aplikasi: tunai lunas (2), non-tunai lunas (1), belum dibayar (1).
    const jualApp = async (jumlah: number) => {
      const r = await app.kirim<Penjualan>("POST", "/penjualan", {
        pelangganID: pelangganId,
        jenisTransaksi: "POS",
        jenisPenjualan: "takeaway",
        tanggalTransaksi: new Date().toISOString(),
        itemPenjualan: [{ produkID: fx.produkId, jumlah }],
        simpanDraft: false,
      });
      expect(r.status, "penjualan dari aplikasi: " + r.pesan).toBe(201);
      penjualanUji.push(r.data.id);
      return detailPenjualan(page, auth, r.data.id) as Promise<unknown> as Promise<Penjualan>;
    };
    const bayarApp = async (p: Penjualan, m: Metode) => {
      const r = await app.kirim("POST", "/pembayaran", {
        penjualanID: p.id,
        metodePembayaranID: m.id,
        jumlahBayar: p.totalTagihan,
        tanggalBayar: new Date().toISOString(),
      });
      expect(r.status, `bayar ${m.namaPembayaran} dari aplikasi: ${r.pesan}`).toBe(201);
    };
    const pTunai = await jualApp(2);
    await bayarApp(pTunai, tunai!);
    const pNonTunai = await jualApp(1);
    await bayarApp(pNonTunai, nonTunai!);
    const pBelum = await jualApp(1);
    for (const p of [pTunai, pNonTunai, pBelum]) {
      expect((await detailPenjualan(page, auth, p.id) as unknown as Penjualan).sesiKasirID, "penjualan aplikasi bersesi").toBe(sesi.id);
    }

    // Invoice dari web: penjualan web tanpa sesi, dibayar dari web.
    const draft = await api<Penjualan>(page, auth, "POST", "/penjualan", {
      pelangganID: pelangganId,
      jenisTransaksi: "INVOICE",
      jenisPenjualan: "takeaway",
      tanggalTransaksi: new Date().toISOString(),
      itemPenjualan: [{ produkID: fx.produkId, jumlah: 1 }],
      simpanDraft: true,
    });
    expect(draft.status, "draft penjualan web: " + draft.pesan).toBe(201);
    penjualanUji.push(draft.data.id);
    await simpanLewatApi(page, auth, draft.data.id, fx);
    const pWeb = (await detailPenjualan(page, auth, draft.data.id)) as unknown as Penjualan;
    await bayarLewatApi(page, auth, pWeb.id, nonTunai!.id, pWeb.totalTagihan, "E2E invoice struk");
    expect(pWeb.sesiKasirID ?? null, "penjualan web tanpa sesi").toBeNull();

    // Tutup dari web: hitungan sama dengan uang di laci; respons memuat periode TUTUP.
    const laciAkhir = await saldoAkun(page, auth, laci.id);
    expect(laciAkhir, "tunai masuk ke laci sesi").toBe(modal + pTunai.totalTagihan);
    await page.goto(URL_MESIN);
    const kartu = page.getByRole("article", { name: `Kasir buka: ${nama}` });
    await expect(kartu).toBeVisible({ timeout: 20_000 });
    await kartu.getByRole("button", { name: "Tutup kasir dari web" }).click();
    const dialog = page.getByRole("dialog", { name: `Tutup kasir ${nama}?` });
    await dialog.getByLabel("Uang yang dihitung di laci").fill(String(laciAkhir));
    const tTutup = page.waitForResponse((r) => POLA_TUTUP.test(r.url()) && r.request().method() === "POST");
    await dialog.getByRole("button", { name: "Tutup kasir", exact: true }).click();
    const tutup = await tTutup;
    expect(tutup.status()).toBe(200);
    const periode = ((await tutup.json()) as { data: { periode: { id: string; status: string } } }).data.periode;
    expect(periode.status, "sesi terakhir menutup periode (B376)").toBe("TUTUP");
    expect((await detailSesi(page, auth, sesi.id)).periodeKasirID).toBe(periode.id);

    // Laporan backend sama dengan transaksi yang dibuat spec ini.
    const lap = (await laporan(page, auth, periode.id)).laporan as LaporanPeriodeKasir;
    expect(lap, "laporan dipotret").toBeTruthy();
    const kasirTunai = pTunai.totalTagihan;
    const kasirNonTunai = pNonTunai.totalTagihan;
    expect(lap.kasir).toEqual([PENGGUNA_UJI.nama]);
    expect(lap.jumlahSesi).toBe(1);
    expect(lap.modalAwal).toBe(modal);
    expect(lap.penerimaanPerMetode).toEqual(
      [
        { namaMetodePembayaran: tunai!.namaPembayaran, jumlah: kasirTunai },
        { namaMetodePembayaran: nonTunai!.namaPembayaran, jumlah: kasirNonTunai },
      ]
        .sort((a, b) => a.namaMetodePembayaran.localeCompare(b.namaMetodePembayaran, "id"))
        .map((m) => expect.objectContaining(m)),
    );
    expect(lap.totalPenerimaanKasir).toBe(kasirTunai + kasirNonTunai);
    expect(lap.totalPenerimaanInvoice, "pembayaran web tanpa sesi").toBe(pWeb.totalTagihan);
    expect(lap.totalPenerimaan).toBe(kasirTunai + kasirNonTunai + pWeb.totalTagihan);
    expect(lap.saldoAkhir, "penjualan bersesi yang lunas").toBe(kasirTunai + kasirNonTunai);
    expect(lap.transaksiSelesai).toBe(2);
    expect(lap.transaksiBelumTerbayar).toBe(1);
    expect(lap.totalSistem).toBe(laciAkhir);
    expect(lap.tunaiAktual).toBe(laciAkhir);
    expect(lap.selisih).toBe(0);
    // Produk dari penjualan bersesi, termasuk yang belum dibayar (keputusan 7); invoice web tidak.
    expect(lap.produkTerjual).toEqual([expect.objectContaining({ produkID: fx.produkId, namaProduk: NAMA_PRODUK, jumlah: 4 })]);
    expect(lap.totalProdukTerjual).toBe(4);

    // Layar: setiap angka struk sama dengan laporan.
    await page.goto(`${URL_LAPORAN_TUTUP_KASIR}/${periode.id}`);
    const struk = page.getByRole("article", { name: "Struk laporan tutup kasir" });
    await expect(struk).toBeVisible({ timeout: 20_000 });
    const nilai = (s: typeof struk, label: string) =>
      s.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).first().locator("dd");
    const harapan: [string, number][] = [
      ["Modal awal", lap.modalAwal],
      [tunai!.namaPembayaran, kasirTunai],
      [nonTunai!.namaPembayaran, kasirNonTunai],
      ["Total penerimaan kasir", lap.totalPenerimaanKasir],
      ["Total penerimaan invoice", lap.totalPenerimaanInvoice],
      ["Total penerimaan", lap.totalPenerimaan],
      ["Saldo akhir", lap.saldoAkhir],
      ["Transaksi selesai", 2],
      ["Belum terbayar", 1],
      ["Total sistem", lap.totalSistem],
      ["Tunai aktual", lap.tunaiAktual],
      ["Selisih", 0],
      [NAMA_PRODUK, 4],
      ["Total produk terjual", 4],
    ];
    for (const [label, angka] of harapan) await expect(nilai(struk, label), label).toHaveText(angkaStruk(angka));

    // Cetak: salinan cetak memuat angka yang sama.
    await page.emulateMedia({ media: "print" });
    const cetak = page.getByRole("article", { name: "Struk cetak laporan tutup kasir" });
    await expect(cetak).toBeVisible();
    for (const [label, angka] of harapan) await expect(nilai(cetak, label), `cetak ${label}`).toHaveText(angkaStruk(angka));
    await page.emulateMedia({ media: "screen" });

    // Unduh Excel: baris per metode, produk, dan total sama dengan laporan.
    const tBerkas = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh" }).click();
    await page.getByRole("menuitem", { name: "Excel", exact: true }).click();
    const buku = new ExcelJS.Workbook();
    await buku.xlsx.readFile(await (await tBerkas).path());
    const baris = new Map<string, unknown>();
    buku.worksheets[0].eachRow((r) => {
      const [label, isi] = (r.values as unknown[]).slice(1);
      if (typeof label === "string" && !baris.has(label)) baris.set(label, isi);
    });
    for (const [label, angka] of harapan) expect(baris.get(label), `Excel ${label}`).toBe(angka);

    // Izin: kasir pemegang buka-tutup-kasir tanpa read-sesi-kasir tidak mengunduh.
    await masukKasirBukaTutup(page);
    const kasir = await bukaDenganAuth(page, "/dashboard");
    const tolak = await api(page, kasir, "GET", `/sesikasir/periode/${periode.id}?format=pdf`);
    expect(tolak.status, "unduh tanpa read-sesi-kasir").toBe(403);
    expect(tolak.pesan).toContain("read-sesi-kasir");
    await masukUlang(page);
    const authOwner = await bukaDenganAuth(page, URL_LAPORAN_TUTUP_KASIR);

    // Pembersihan VOID sesudah tutup tidak mengubah laporan (keputusan 5).
    for (const id of penjualanUji) await batalkanPenjualanUji(page, authOwner, id);
    expect((await laporan(page, authOwner, periode.id)).laporan, "laporan dipotret saat tutup").toEqual(lap);
  } finally {
    await app.tutup();
    await masukUlang(page);
    const akhir = await bukaDenganAuth(page, URL_MESIN);
    for (const id of penjualanUji) await batalkanPenjualanUji(page, akhir, id);
    await bersihkanMesinUji(page, akhir, laci.id);
  }
});
