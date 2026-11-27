import { expect, test, type Page, type Response } from "@playwright/test";
import { saldoAkun } from "../../helpers/akun-kas-uji";
import { bukaPanelFilter, pilihanPanel, terapkanPanelFilter } from "../../helpers/filter-uji";
import { unik } from "../../helpers/reservasi-uji";
import {
  PERANGKAT_UJI,
  bersihkanMesinUji,
  bukaKasirLewatAplikasi,
  detailSesi,
  sesiBuka,
  siapkanLaciUji,
} from "../../helpers/sesi-kasir-uji";
import { api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import {
  LABEL_STATUS_PERIODE,
  URL_LAPORAN_TUTUP_KASIR,
  angkaStruk,
  judulLaporan,
  subjudulLaporan,
  teksSesiPeriode,
  waktuBaris,
  waktuStruk,
} from "../../../features/sesi-kasir/laporan";
import type { PeriodeKasir, PeriodeKasirDetail } from "../../../types/sesiKasir";

/*
 * Laporan Tutup Kasir (PW10, desain A; B375, B376): daftar periode dan
 * laporan bersusunan struk, dengan angka dari respons nyata. Sesi dibuka
 * lewat API aplikasi dan ditutup lewat API sebagai data milik Mesin Kasir
 * (keputusan rancangan butir 23); yang diuji di sini tampilan laporannya.
 */

const POLA_DAFTAR = /\/api\/sesikasir\/periode\?/i;
const tungguDaftar = (page: Page, syarat: (q: URLSearchParams) => boolean = () => true) =>
  page.waitForResponse(
    (r) => r.request().method() === "GET" && POLA_DAFTAR.test(r.url()) && syarat(new globalThis.URL(r.url()).searchParams),
  );
const isi = async <T>(r: Response) => ((await r.json()) as { data: T }).data;

async function detailPeriode(page: Page, auth: Auth, id: string): Promise<PeriodeKasirDetail> {
  const baca = await api<PeriodeKasirDetail>(page, auth, "GET", "/sesikasir/periode/" + id);
  expect(baca.status, "baca periode: " + baca.pesan).toBe(200);
  return baca.data;
}

const baris = (page: Page) => page.getByRole("row").filter({ has: page.getByRole("cell") });

test.describe("Laporan Tutup Kasir", () => {
  test("menu Laporan membuka daftar; setiap baris sama dengan respons, dan filter periode dikirim ke server", async ({
    page,
  }) => {
    await login(page);
    const tAwal = tungguDaftar(page);
    await bukaDenganAuth(page, URL_LAPORAN_TUTUP_KASIR);
    const awal = await tAwal;
    expect(awal.status()).toBe(200);
    const q = new globalThis.URL(awal.url()).searchParams;
    expect(q.get("page"), "halaman pertama").toBe("1");
    expect(q.get("limit"), "ukuran bawaan").toBe("10");
    expect(q.get("dari"), "tanpa periode bawaan").toBeNull();

    await expect(page.getByRole("link", { name: "Tutup Kasir", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Laporan Tutup Kasir", level: 2 })).toBeVisible();

    const data = await isi<PeriodeKasir[]>(awal);
    test.skip(data.length === 0, "belum ada periode laporan tutup kasir");
    await expect(baris(page)).toHaveCount(data.length);
    for (const [i, p] of data.entries()) {
      const b = baris(page).nth(i);
      await expect(b).toContainText(waktuBaris(p.dibukaPada));
      await expect(b).toContainText(p.ditutupPada ? waktuBaris(p.ditutupPada) : "Belum ditutup");
      await expect(b).toContainText(teksSesiPeriode(p));
      await expect(b).toContainText(LABEL_STATUS_PERIODE[p.status]);
      await expect(b.getByRole("link")).toHaveAttribute("href", `${URL_LAPORAN_TUTUP_KASIR}/${p.id}`);
    }

    // Filter: Hari ini dikirim sebagai dari dan sampai, lalu Atur ulang semua kembali tanpa periode.
    const kini = new Date();
    const hari = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}-${String(kini.getDate()).padStart(2, "0")}`;
    const panel = await bukaPanelFilter(page);
    await pilihanPanel(panel, "Periode cepat", "Hari ini").click();
    const tHariIni = tungguDaftar(page, (p) => p.get("dari") === hari && p.get("sampai") === hari && p.get("page") === "1");
    await terapkanPanelFilter(panel);
    expect((await tHariIni).status()).toBe(200);
    const pil = page.getByRole("group", { name: "Filter aktif" });
    await expect(pil.getByRole("button", { name: /^Hapus filter Dibuka Hari ini · / })).toBeVisible();
    // Kunci tanpa filter masih segar di cache (staleTime), sehingga dibuktikan dari tampilan.
    await pil.getByRole("button", { name: "Atur ulang semua" }).click();
    await expect(pil).toBeHidden();
    await expect(baris(page)).toHaveCount(data.length);
    await expect(baris(page).first()).toContainText(waktuBaris(data[0].dibukaPada));
  });

  test("periode berjalan: badge karamel, keterangan tanpa laporan, dan tautan dari rincian sesi; sesudah ditutup laporannya sama dengan respons", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page);
    const auth: Auth = await bukaDenganAuth(page, URL_LAPORAN_TUTUP_KASIR);
    const lain = (await sesiBuka(page, auth)).filter((s) => s.installationId !== PERANGKAT_UJI.installationId);
    test.skip(lain.length > 0, "mesin kasir lain masih buka, sehingga periode uji tidak tertutup oleh sesi uji");
    const laci = await siapkanLaciUji(page, auth);
    await bersihkanMesinUji(page, auth, laci.id);
    const nama = `E2E Kasir Laporan ${unik()}`;

    try {
      const pasang = await api(page, auth, "POST", "/sesikasir/perangkat", {
        installationId: PERANGKAT_UJI.installationId,
        namaPerangkat: nama,
        akunKasID: laci.id,
      });
      expect(pasang.status, "pasang mesin kasir uji: " + pasang.pesan).toBe(200);
      const saldo = await saldoAkun(page, auth, laci.id);
      const sesi = await bukaKasirLewatAplikasi(saldo);
      const periodeID = (await detailSesi(page, auth, sesi.id)).periodeKasirID;
      expect(periodeID, "sesi baru bergabung ke periode (B376)").toBeTruthy();

      // Daftar: periode berjalan paling atas, badge Berjalan berwarna lain dari Selesai.
      const tDaftar = tungguDaftar(page);
      await page.reload();
      const data = await isi<PeriodeKasir[]>(await tDaftar);
      expect(data[0]?.id, "periode berjalan terbaru di atas").toBe(periodeID);
      const badgeBerjalan = baris(page).first().getByText("Berjalan", { exact: true });
      await expect(badgeBerjalan).toBeVisible();
      const selesai = data.findIndex((p) => p.status === "TUTUP");
      if (selesai >= 0) {
        const warna = (l: ReturnType<Page["getByText"]>) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
        const badgeSelesai = baris(page).nth(selesai).getByText("Selesai", { exact: true });
        expect(await warna(badgeBerjalan), "Berjalan dan Selesai berbeda warna").not.toBe(await warna(badgeSelesai));
      }

      // Detail periode BUKA: keterangan, tanpa struk.
      await baris(page).first().getByRole("link").click();
      await expect(page).toHaveURL(new RegExp(`${URL_LAPORAN_TUTUP_KASIR}/${periodeID}$`));
      await expect(page.getByText("Laporan tersedia setelah semua mesin kasir di outlet ditutup.")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("article", { name: "Struk laporan tutup kasir" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Cetak struk" }), "periode BUKA tidak dicetak").toHaveCount(0);

      // Rincian sesi menautkan ke periodenya.
      await page.goto(`/dashboard/outlet/keuangan/mesinKasir/${sesi.id}`);
      await page.getByRole("link", { name: "Lihat laporan tutup kasir" }).click();
      await expect(page).toHaveURL(new RegExp(`${URL_LAPORAN_TUTUP_KASIR}/${periodeID}$`));

      // Sesi terakhir ditutup menutup periode; laporan dipotret backend.
      const tutup = await api(page, auth, "POST", `/sesikasir/${sesi.id}/tutup`, { nominal: saldo });
      expect(tutup.status, "tutup sesi uji: " + tutup.pesan).toBe(200);
      await page.reload();
      const struk = page.getByRole("article", { name: "Struk laporan tutup kasir" });
      await expect(struk).toBeVisible({ timeout: 20_000 });
      const periode = await detailPeriode(page, auth, periodeID as string);
      expect(periode.status).toBe("TUTUP");
      const lap = periode.laporan!;
      expect(lap, "laporan dipotret").toBeTruthy();

      await expect(page.getByText("Selesai", { exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: judulLaporan(periode.dibukaPada) })).toBeVisible();
      await expect(page.getByText(subjudulLaporan(periode, lap.outlet?.nama), { exact: true })).toBeVisible();

      const bagian = struk.getByRole("region", { name: "Transaksi penjualan" });
      await expect(bagian).toContainText(lap.kasir.join(", "));
      await expect(bagian).toContainText(waktuStruk(lap.dibukaPada));
      await expect(bagian).toContainText(waktuStruk(lap.ditutupPada));
      const nilai = async (label: string) =>
        struk.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).first().locator("dd");
      for (const [label, angka] of [
        ["Modal awal", lap.modalAwal],
        ["Total penerimaan kasir", lap.totalPenerimaanKasir],
        ["Total penerimaan invoice", lap.totalPenerimaanInvoice],
        ["Total penerimaan", lap.totalPenerimaan],
        ["Saldo akhir", lap.saldoAkhir],
        ["Transaksi selesai", lap.transaksiSelesai],
        ["Belum terbayar", lap.transaksiBelumTerbayar],
        ["Total sistem", lap.totalSistem],
        ["Tunai aktual", lap.tunaiAktual],
        ["Selisih", lap.selisih],
        ["Total produk terjual", lap.totalProdukTerjual],
      ] as const) {
        await expect(await nilai(label), label).toHaveText(angkaStruk(angka));
      }
      for (const m of lap.penerimaanPerMetode) {
        await expect(await nilai(m.namaMetodePembayaran), m.namaMetodePembayaran).toHaveText(angkaStruk(m.jumlah));
      }
    } finally {
      await bersihkanMesinUji(page, auth, laci.id);
    }
  });

  test("sesi sebelum periode tidak bertautan, dan laporan yang tidak ada menampilkan pesan", async ({ page }) => {
    await login(page);
    const auth = await bukaDenganAuth(page, URL_LAPORAN_TUTUP_KASIR);
    // Periode struk ada sejak backend AR48 (26 November 2026).
    const lama = await api<{ id: string; periodeKasirID: string | null }[]>(
      page,
      auth,
      "GET",
      "/sesikasir?status=TUTUP&sampai=2026-11-25&limit=1",
    );
    expect(lama.status).toBe(200);
    const sesi = (lama.data ?? []).find((s) => s.periodeKasirID === null);
    if (sesi) {
      await page.goto(`/dashboard/outlet/keuangan/mesinKasir/${sesi.id}`);
      await expect(page.getByText("Sesi ini dibuka sebelum laporan tutup kasir tersedia.")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole("link", { name: "Lihat laporan tutup kasir" })).toHaveCount(0);
    } else {
      test.info().annotations.push({ type: "dilewati sebagian", description: "tidak ada sesi tanpa periode" });
    }

    await page.goto(`${URL_LAPORAN_TUTUP_KASIR}/6a0000000000000000000000`);
    await expect(page.getByText("Laporan tutup kasir tidak ditemukan.")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("link", { name: "Kembali ke Laporan Tutup Kasir" }).click();
    await expect(page).toHaveURL(new RegExp(`${URL_LAPORAN_TUTUP_KASIR}$`));
  });

  test("cetak struk: tombol memanggil cetak browser, dan halaman cetak hanya struk di kertas 80 mm (PW11)", async ({
    page,
  }) => {
    await login(page);
    const tDaftar = tungguDaftar(page);
    const auth = await bukaDenganAuth(page, URL_LAPORAN_TUTUP_KASIR);
    const tutup = (await isi<PeriodeKasir[]>(await tDaftar)).find((p) => p.status === "TUTUP");
    test.skip(!tutup, "belum ada periode tertutup");
    const lap = (await detailPeriode(page, auth, tutup!.id)).laporan!;

    await page.goto(`${URL_LAPORAN_TUTUP_KASIR}/${tutup!.id}`);
    const tombol = page.getByRole("button", { name: "Cetak struk" });
    await expect(tombol).toBeVisible({ timeout: 20_000 });
    // Dialog cetak browser tidak dapat dikendalikan Playwright; window.print dicatat.
    await page.evaluate(() => {
      (window as unknown as { jumlahCetak: number }).jumlahCetak = 0;
      window.print = () => {
        (window as unknown as { jumlahCetak: number }).jumlahCetak += 1;
      };
    });
    await tombol.click();
    expect(await page.evaluate(() => (window as unknown as { jumlahCetak: number }).jumlahCetak)).toBe(1);

    // Di layar salinan cetak tersembunyi; saat cetak hanya salinan itu yang tampil.
    const cetak = page.getByRole("article", { name: "Struk cetak laporan tutup kasir" });
    await expect(cetak).toBeHidden();
    await page.emulateMedia({ media: "print" });
    await expect(cetak).toBeVisible();
    await expect(page.getByRole("article", { name: "Struk laporan tutup kasir" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Cetak struk" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Manajemen Keuangan" })).toBeHidden();
    const lebarArea = await page.locator("[data-area-cetak]").evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.abs(lebarArea - (80 / 25.4) * 96), "area cetak selebar 80 mm").toBeLessThan(1);
    await expect(cetak.getByRole("region", { name: "Transaksi penjualan" })).toContainText(waktuStruk(lap.ditutupPada));
    await expect(cetak).toContainText(angkaStruk(lap.totalProdukTerjual));

    // Ukuran kertas nyata dari @page: lebar 80 mm (226,77 pt), satu lembar setinggi isi.
    // page.pdf tidak memicu beforeprint seperti dialog cetak browser, sehingga dipicu di sini.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    const tinggiArea = await page.locator("[data-area-cetak]").evaluate((el) => el.getBoundingClientRect().height);
    const pdf = (await page.pdf({ preferCSSPageSize: true })).toString("latin1");
    const kotak = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(kotak.length, "satu lembar").toBe(1);
    expect(Math.abs(kotak[0][0] - (80 / 25.4) * 72), "lebar kertas 80 mm").toBeLessThan(1);
    // Tinggi kertas = tinggi struk dibulatkan ke atas per milimeter (px ke pt: 72/96).
    const tinggiPt = (Math.ceil(tinggiArea / (96 / 25.4)) * 72) / 25.4;
    expect(Math.abs(kotak[0][1] - tinggiPt), "tinggi kertas setinggi struk").toBeLessThan(1);
    await page.emulateMedia({ media: "screen" });
  });

  test("HP: daftar dan laporan tampil tanpa gulir ke samping", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const tDaftar = tungguDaftar(page);
    await bukaDenganAuth(page, URL_LAPORAN_TUTUP_KASIR);
    const data = await isi<PeriodeKasir[]>(await tDaftar);
    const tanpaGulir = async (konteks: string) => {
      const lebar = await page.evaluate(() => ({ isi: document.documentElement.scrollWidth, layar: window.innerWidth }));
      expect(lebar.isi, `${konteks}: lebar isi tidak melebihi layar`).toBeLessThanOrEqual(lebar.layar);
    };
    await expect(page.getByRole("heading", { name: "Laporan Tutup Kasir", level: 2 })).toBeVisible();
    await tanpaGulir("daftar laporan");
    const tutup = data.find((p) => p.status === "TUTUP");
    test.skip(!tutup, "belum ada periode tertutup");
    await page.goto(`${URL_LAPORAN_TUTUP_KASIR}/${tutup!.id}`);
    await expect(page.getByRole("article", { name: "Struk laporan tutup kasir" })).toBeVisible({ timeout: 20_000 });
    await tanpaGulir("laporan");
  });
});
