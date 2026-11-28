import { expect, test, type Page } from "@playwright/test";
import { akunUjiTetap, daftarAkun, saldoAkun, tutupAkunUji } from "../../helpers/akun-kas-uji";
import { formatRupiah } from "../../../lib/format";
import {
  batalkanBooking,
  bersihkanSisaBooking,
  buatBooking,
  siapkanFixtureBooking,
  unik,
} from "../../helpers/reservasi-uji";
import { bukaPanelFilter, pilihanPanel, terapkanPanelFilter } from "../../helpers/filter-uji";
import { dariLonceng } from "../../helpers/lonceng-uji";
import { IZIN } from "../../../lib/auth/permissions";
import {
  PENGGUNA_KASIR_OUTLET,
  masukBacaSaja,
  masukKasirOutlet,
  masukSebagai,
  siapkanKasirOutlet,
} from "../../helpers/terkunci-uji";
import {
  NAMA_LACI_UJI,
  PERANGKAT_KASIR_OUTLET,
  PERANGKAT_UJI,
  bersihkanMesinUji,
  bukaKasirLewatAplikasi,
  daftarMesin,
  detailSesi,
  loginAplikasi,
  siapkanLaciUji,
} from "../../helpers/sesi-kasir-uji";
import { api, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";

/*
 * Alur nyata Mesin Kasir (inti/status.md, daftar periksa penyambungan nomor
 * 5): mesin kasir ditambah, diubah, dan dilepas lewat UI; sesi dibuka lewat
 * API aplikasi sebagai data milik modul lain (keputusan rancangan butir 23),
 * lalu ditutup dari web dengan hitung buta.
 */

const URL = "/dashboard/outlet/keuangan/mesinKasir";
const POLA_PERANGKAT = /\/api\/sesikasir\/perangkat(\/[0-9a-f]{24})?$/i;
const POLA_TUTUP = /\/api\/sesikasir\/[0-9a-f]{24}\/tutup$/i;
const SELISIH = 1_000;

const tunggu = (page: Page, pola: RegExp, method: string) =>
  page.waitForResponse((r) => pola.test(r.url()) && r.request().method() === method);

/** Isian Rupiah di dialog tutup menerima angka polos. */
const teksAngka = (n: number) => String(n);

test.describe("Mesin Kasir", () => {
  test("tambah mesin kasir, kasir dibuka dari aplikasi, ditutup dari web dengan catatan, lalu dilepas", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page);
    const auth: Auth = await bukaDenganAuth(page, URL);
    const laci = await siapkanLaciUji(page, auth);
    await bersihkanMesinUji(page, auth, laci.id);
    const nama = `E2E Kasir ${unik()}`;
    const namaUbah = `${nama} Ubah`;

    try {
      await page.reload();
      await expect(page.getByRole("link", { name: "Mesin Kasir", exact: true })).toHaveAttribute("aria-current", "page", {
        timeout: 20_000,
      });

      // Tambah lewat UI: perangkat trusted, laci Kas Fisik uji, dan nama.
      await page.getByRole("button", { name: "Tambah mesin kasir" }).first().click();
      const tambah = page.getByRole("dialog", { name: "Tambah mesin kasir" });
      const radio = tambah.getByRole("radio", { name: new RegExp(PERANGKAT_UJI.nama) });
      await expect(radio).toHaveCount(1);
      await radio.check();
      await tambah.getByLabel("Nama mesin kasir").fill(nama);
      await tambah.getByRole("combobox", { name: "Laci uang" }).click();
      await page.getByRole("option", { name: new RegExp("^" + NAMA_LACI_UJI) }).click();
      const tSimpan = tunggu(page, POLA_PERANGKAT, "POST");
      await tambah.getByRole("button", { name: "Simpan" }).click();
      expect((await tSimpan).status()).toBe(200);
      await expect(page.getByText("Mesin kasir disimpan")).toBeVisible();
      await expect(page.getByRole("button", { name: `Aksi ${nama}` })).toBeVisible();

      const mesin = (await daftarMesin(page, auth)).find((m) => m.installationId === PERANGKAT_UJI.installationId);
      expect(mesin?.namaPerangkat).toBe(nama);
      expect(mesin?.akunKasID).toBe(laci.id);

      // Kasir dibuka dari aplikasi tanpa selisih.
      const saldoAwal = await saldoAkun(page, auth, laci.id);
      const sesi = await bukaKasirLewatAplikasi(saldoAwal);
      await page.reload();
      const kartu = page.getByRole("article", { name: `Kasir buka: ${nama}` });
      await expect(kartu).toBeVisible({ timeout: 20_000 });

      // Selama kasir buka: berhenti nonaktif, laci terkunci, nama tetap dapat diubah (MK9).
      await page.getByRole("button", { name: `Aksi ${nama}` }).click();
      await expect(page.getByRole("menuitem", { name: "Berhenti jadi mesin kasir" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await page.getByRole("menuitem", { name: "Ubah nama dan laci" }).click();
      const ubah = page.getByRole("dialog", { name: "Ubah mesin kasir" });
      await expect(ubah.getByRole("combobox", { name: "Laci uang" })).toBeDisabled();
      await ubah.getByLabel("Nama mesin kasir").fill(namaUbah);
      const tUbah = tunggu(page, POLA_PERANGKAT, "POST");
      await ubah.getByRole("button", { name: "Simpan" }).click();
      expect((await tUbah).status()).toBe(200);
      await expect(page.getByRole("article", { name: `Kasir buka: ${namaUbah}` })).toBeVisible();

      // Tutup dari web: hitungan berbeda tanpa catatan ditolak, lalu dengan catatan.
      await page
        .getByRole("article", { name: `Kasir buka: ${namaUbah}` })
        .getByRole("button", { name: "Tutup kasir dari web" })
        .click();
      const tutup = page.getByRole("dialog", { name: `Tutup kasir ${namaUbah}?` });
      await tutup.getByLabel("Uang yang dihitung di laci").fill(teksAngka(saldoAwal + SELISIH));
      const tTolak = tunggu(page, POLA_TUTUP, "POST");
      await tutup.getByRole("button", { name: "Tutup kasir", exact: true }).click();
      expect((await tTolak).status()).toBe(400);
      await expect(tutup.getByRole("alert")).toContainText(
        "Hitungan berbeda dengan catatan sistem. Tulis catatan penyebabnya, lalu tutup lagi.",
      );
      await tutup.getByLabel(/Catatan/).fill("E2E selisih uji");
      const tTutup = tunggu(page, POLA_TUTUP, "POST");
      await tutup.getByRole("button", { name: "Tutup kasir", exact: true }).click();
      expect((await tTutup).status()).toBe(200);
      await expect(page.getByText("Kasir ditutup")).toBeVisible();
      await expect(page.getByRole("article", { name: `Kasir buka: ${namaUbah}` })).toHaveCount(0);

      const tertutup = await detailSesi(page, auth, sesi.id);
      expect(tertutup.status).toBe("TUTUP");
      expect(tertutup.selisihTutup).toBe(SELISIH);
      expect(tertutup.catatanTutup).toBe("E2E selisih uji");
      // B336 dan MK5b: asal penutupan tercatat dan ditulis di riwayat.
      expect(tertutup.ditutupDari).toBe("web");
      expect(tertutup.namaPerangkat).toBe(namaUbah);
      await expect(
        page.getByRole("link", { name: new RegExp(namaUbah) }).first().getByText(/ditutup (.+ )?dari web/).first(),
      ).toBeVisible({ timeout: 20_000 });
      expect(await saldoAkun(page, auth, laci.id)).toBe(saldoAwal + SELISIH);

      // Riwayat memuat sesi itu, dan rinciannya terbuka di rute final.
      await page.getByRole("link", { name: new RegExp(namaUbah) }).first().click();
      await expect(page).toHaveURL(new RegExp(`${URL}/${sesi.id}$`));
      await expect(page.getByRole("heading", { level: 1, name: new RegExp("^" + namaUbah + ", ") })).toBeVisible({
        timeout: 20_000,
      });
      await page.getByRole("link", { name: "Kembali ke Mesin Kasir" }).click();
      await expect(page).toHaveURL(new RegExp(URL + "$"));

      // Berhenti jadi mesin kasir; riwayatnya tetap, dengan nama mesin yang dilepas.
      await page.getByRole("button", { name: `Aksi ${namaUbah}` }).click();
      await page.getByRole("menuitem", { name: "Berhenti jadi mesin kasir" }).click();
      const konfirmasi = page.getByRole("alertdialog", { name: `${namaUbah} berhenti jadi mesin kasir?` });
      const tHapus = tunggu(page, POLA_PERANGKAT, "DELETE");
      await konfirmasi.getByRole("button", { name: "Berhenti" }).click();
      expect((await tHapus).status()).toBe(200);
      await expect(page.getByText("Mesin kasir dilepas")).toBeVisible();
      await expect(page.getByRole("button", { name: `Aksi ${namaUbah}` })).toHaveCount(0);
      expect((await daftarMesin(page, auth)).some((m) => m.installationId === PERANGKAT_UJI.installationId)).toBe(
        false,
      );

      // Tanpa mesin kasir lain, langkah tambah naik ke atas, tetapi riwayat yang
      // sudah ada tetap tampil (keputusan pemilik proyek, 7 November 2026).
      if ((await daftarMesin(page, auth)).length === 0) {
        await expect(page.getByRole("heading", { name: "Belum ada mesin kasir", level: 2 })).toBeVisible();
        await expect(page.getByText("Riwayat tampil di sini setelah kasir pertama ditutup.")).toHaveCount(0);
        await expect(page.getByRole("link", { name: /Mesin kasir yang sudah dilepas/ }).first()).toBeVisible();
      }
    } finally {
      await bersihkanMesinUji(page, auth, laci.id);
    }
  });

  test("laci dikosongkan saat buka di aplikasi: rincian web menampilkan yang dipindah, dan Pindah Dana-nya tanpa Batalkan, bertaut ke sesinya (PW09, PW15, B371, B386)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page);
    const auth: Auth = await bukaDenganAuth(page, URL);
    const laci = await siapkanLaciUji(page, auth);
    await bersihkanMesinUji(page, auth, laci.id);
    // Akun tujuan tetap: saldonya dikosongkan setiap run oleh akunUjiTetap.
    const tujuan = await akunUjiTetap(page, auth, "E2E Tujuan Laci Tetap", {
      keterangan: "E2E tujuan pindah dana buka kasir",
    });
    const nama = `E2E Kasir Kosong ${unik()}`;

    try {
      // Mesin kasir disiapkan lewat API: tambahnya diuji lewat UI di skenario alur.
      const pasang = await api(page, auth, "POST", "/sesikasir/perangkat", {
        installationId: PERANGKAT_UJI.installationId,
        namaPerangkat: nama,
        akunKasID: laci.id,
      });
      expect(pasang.status, "pasang mesin kasir uji: " + pasang.pesan).toBe(200);

      // Seluruh isi laci dipindah dan modal dibiarkan kosong. Laci kosong dari run
      // sebelumnya tetap memindah Rp1, sehingga hitungannya lebih Rp1 dan wajib catatan.
      const saldoLaci = await saldoAkun(page, auth, laci.id);
      const jumlah = Math.max(saldoLaci, 1);
      const sesi = await bukaKasirLewatAplikasi(undefined, {
        pindahDana: { akunKasTujuanID: tujuan.id, jumlah },
        ...(saldoLaci === 0 ? { catatan: "E2E laci kosong dipindah Rp1" } : {}),
      });

      const detail = await detailSesi(page, auth, sesi.id);
      expect(detail.nominalBuka, "modal kosong tersimpan 0").toBe(0);
      expect(detail.saldoSistemBuka).toBe(saldoLaci);
      expect(detail.selisihBuka, "selisih = modal + dipindah - sistem").toBe(jumlah - saldoLaci);
      expect(detail.pindahDanaBuka?.jumlah).toBe(jumlah);
      expect(detail.pindahDanaBuka?.akunKasTujuanID).toBe(tujuan.id);
      expect(detail.periodeKasirID, "sesi baru bergabung ke periode struk (B376)").toBeTruthy();
      expect(await saldoAkun(page, auth, laci.id), "laci dikosongkan").toBe(0);
      expect(await saldoAkun(page, auth, tujuan.id), "isi laci masuk akun tujuan").toBe(jumlah);

      // Rincian web: lima baris berurutan, angka dari respons.
      await page.goto(`${URL}/${sesi.id}`);
      const kartu = page.locator("section").filter({ has: page.getByRole("heading", { name: "Saat kasir dibuka" }) });
      await expect(kartu.getByRole("term")).toHaveText(
        [
          "Uang di laci menurut sistem",
          "Uang yang dihitung kasir",
          `Dipindah ke ${tujuan.namaAkun}`,
          "Modal awal di laci",
          "Selisih",
        ],
        { timeout: 20_000 },
      );
      await expect(kartu.getByRole("definition").first()).toHaveText(formatRupiah(saldoLaci));
      await expect(kartu.getByRole("definition").nth(1)).toHaveText(formatRupiah(jumlah));
      await expect(kartu.getByRole("definition").nth(2)).toHaveText(formatRupiah(jumlah));
      await expect(kartu.getByRole("definition").nth(3)).toHaveText(formatRupiah(0));
      await expect(kartu.getByRole("definition").nth(4)).toHaveText(saldoLaci === 0 ? `Lebih ${formatRupiah(1)}` : "Pas");

      // Pindah Dana buka kasir (B386, PW15): respons membawa asalnya, riwayat
      // menandainya tanpa Batalkan, dan rincian bertaut ke sesi kasirnya.
      const idJurnal = String(detail.pindahDanaBuka?.jurnalTransferID);
      const jurnal = await api<{ asal: string; sesiKasirID: string | null; status: string }>(
        page,
        auth,
        "GET",
        `/jurnaltransfer/${idJurnal}`,
      );
      expect(jurnal.data.asal, "asal jurnal buka kasir").toBe("buka-kasir");
      expect(jurnal.data.sesiKasirID, "sesi yang mencatatnya").toBe(sesi.id);
      // Aturan backend tetap: VOID-nya ditolak 409 (B371), sehingga menyembunyikan
      // Batalkan bukan sekadar tampilan.
      const void409 = await api(page, auth, "PUT", `/jurnaltransfer/${idJurnal}`, {
        status: "VOID",
        catatan: "E2E batal pindah dana buka kasir",
      });
      expect(void409.status, "VOID pindah dana buka kasir").toBe(409);

      await page.goto("/dashboard/outlet/keuangan/akunkas/pindahDana");
      const baris = page
        .getByRole("row")
        .filter({ hasText: "Laci dikosongkan saat buka kasir" })
        .filter({ hasText: tujuan.namaAkun })
        .first();
      await expect(baris).toContainText(formatRupiah(jumlah), { timeout: 20_000 });
      await expect(baris, "transfer tetap Aktif").toContainText("Aktif");
      await expect(baris).toContainText("Dari buka kasir");
      await expect(baris.getByRole("button", { name: "Aksi transfer" }), "tanpa menu Batalkan").toHaveCount(0);
      expect(await saldoAkun(page, auth, tujuan.id), "saldo tujuan tidak kembali ke laci").toBe(jumlah);

      await page.goto(`/dashboard/outlet/keuangan/akunkas/pindahDana?transfer=${idJurnal}`);
      const rincian = page.getByRole("dialog");
      await expect(rincian.getByRole("term").filter({ hasText: /^Asal$/ })).toBeVisible({ timeout: 20_000 });
      const tautanAsal = rincian.getByRole("link", { name: "Buka kasir" });
      await expect(tautanAsal).toHaveAttribute("href", `/dashboard/outlet/keuangan/mesinKasir/${sesi.id}`);
      await tautanAsal.click();
      await expect(page).toHaveURL(new RegExp(`/mesinKasir/${sesi.id}$`), { timeout: 20_000 });
      await expect(page.getByRole("heading", { name: "Saat kasir dibuka" })).toBeVisible({ timeout: 20_000 });
    } finally {
      await bersihkanMesinUji(page, auth, laci.id);
      // Batas 10 akun kas aktif: akun tujuan dikosongkan lalu dinonaktifkan agar tidak
      // memakan jatah spec lain. Pindah Dana buka kasir tidak dapat di-VOID, sehingga
      // saldonya dipindah ke akun aktif bukan uji.
      const semua = await daftarAkun(page, auth);
      const sisa = Number(semua.find((a) => a.id === tujuan.id)?.saldo ?? 0);
      const penampung = semua.find((a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E"));
      if (sisa > 0 && penampung) {
        const kosong = await api(page, auth, "POST", "/jurnaltransfer", {
          kasSumberID: tujuan.id,
          kasTujuanID: penampung.id,
          jumlah: sisa,
          keterangan: "E2E pengosongan akun uji tetap E2E Tujuan Laci Tetap",
        });
        expect.soft(kosong.status, "kosongkan akun tujuan laci: " + kosong.pesan).toBe(201);
      }
      await tutupAkunUji(page, auth, tujuan.id);
    }
  });

  test("HP: halaman dan rincian sesi tampil tanpa gulir ke samping", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.goto(URL);
    await expect(page.getByRole("heading", { name: "Riwayat buka-tutup kasir" })).toBeVisible({ timeout: 20_000 });
    const tanpaGulir = async (konteks: string) => {
      const lebar = await page.evaluate(() => ({ isi: document.documentElement.scrollWidth, layar: window.innerWidth }));
      expect(lebar.isi, `${konteks}: lebar isi tidak melebihi layar`).toBeLessThanOrEqual(lebar.layar);
    };
    await tanpaGulir("halaman Mesin Kasir");

    // Rincian dari baris riwayat pertama; spec di atas meninggalkan sesi tertutup di riwayat.
    await expect(page.getByLabel("Memuat riwayat")).toHaveCount(0, { timeout: 20_000 });
    const baris = page.locator(`a[href^="${URL}/"]`).first();
    test.skip((await baris.count()) === 0, "Riwayat tujuh hari terakhir kosong");
    await baris.click();
    await expect(page.getByRole("link", { name: "Kembali ke Mesin Kasir" })).toBeVisible({ timeout: 20_000 });
    await tanpaGulir("rincian sesi");
  });

  test("riwayat: periode dari panel filter dikirim lewat Terapkan, bawaan tujuh hari tidak dihitung, dan Atur ulang semua kembali (FL1a, FL11a)", async ({ page }) => {
    await login(page);
    const kini = new Date();
    const hari = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}-${String(kini.getDate()).padStart(2, "0")}`;
    await page.goto(URL);
    await expect(page.getByRole("button", { name: "Filter lainnya", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("group", { name: "Filter aktif" })).toBeHidden();
    const panel = await bukaPanelFilter(page);
    await expect(pilihanPanel(panel, "Periode cepat", "7 hari"), "bawaan tujuh hari").toHaveAttribute("aria-pressed", "true");
    await pilihanPanel(panel, "Periode cepat", "Hari ini").click();
    const tHariIni = page.waitForResponse((r) => {
      if (r.request().method() !== "GET" || !/\/api\/sesikasir\?/i.test(r.url())) return false;
      const q = new globalThis.URL(r.url()).searchParams;
      return q.get("status") === "TUTUP" && q.get("dari") === hari && q.get("sampai") === hari;
    });
    await terapkanPanelFilter(panel);
    expect((await tHariIni).status()).toBe(200);
    const pil = page.getByRole("group", { name: "Filter aktif" });
    await expect(pil.getByRole("button", { name: /^Hapus filter Hari ini · / })).toBeVisible();
    await pil.getByRole("button", { name: "Atur ulang semua" }).click();
    await expect(pil).toBeHidden();
  });
});

test.describe("Mesin Kasir: pengguna baca-saja", () => {
  test("tanpa kelola-perangkat-kasir: tambah, ubah, dan lepas mesin tidak tersedia, dan daftar mesin tidak diminta", async ({
    page,
  }) => {
    await login(page);
    await masukBacaSaja(page);
    let mintaMesin = 0;
    page.on("request", (r) => {
      if (r.method() === "GET" && /\/api\/sesikasir\/perangkat(-toko)?(\?|$)/i.test(r.url())) mintaMesin += 1;
    });
    const tKasirBuka = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/sesikasir\?/i.test(r.url()) && !dariLonceng(r.url()),
    );
    await page.goto(URL, { waitUntil: "commit" });
    const kasirBuka = await tKasirBuka;
    expect(kasirBuka.status(), "sesi kasir dibaca pemegang read-sesi-kasir").toBe(200);
    // K-19 dan B335: tanpa kelola-perangkat-kasir installationId null, nama mesin tetap terbaca.
    for (const s of ((await kasirBuka.json()).data ?? []) as Record<string, unknown>[]) {
      expect(s.installationId, "installationId disembunyikan").toBeNull();
      expect(s, "namaPerangkat dikirim").toHaveProperty("namaPerangkat");
    }
    await expect(page.getByRole("link", { name: "Mesin Kasir", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Tambah mesin kasir" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Aksi / })).toHaveCount(0);
    expect(mintaMesin, "GET /sesikasir/perangkat dan perangkat-toko tidak dikirim tanpa izin kelola").toBe(0);
  });
});

test.describe("Mesin Kasir: kelola tanpa sebagian izin baca (MK11a)", () => {
  test("rincian Pindah Dana buka kasir tanpa read-sesi-kasir: asal tampil sebagai teks tanpa tautan (PW15)", async ({
    page,
  }) => {
    await login(page);
    const auth: Auth = await bukaDenganAuth(page, "/dashboard/outlet/keuangan/akunkas/pindahDana");
    // Skenario laci dikosongkan di atas selalu mencatat satu Pindah Dana buka kasir.
    const daftar = await api<{ id: string; asal: string }[]>(page, auth, "GET", "/jurnaltransfer?page=1&limit=50");
    const jurnal = daftar.data.find((t) => t.asal === "buka-kasir");
    expect(jurnal, "ada Pindah Dana buka kasir di 50 transfer terbaru").toBeTruthy();
    await masukSebagai(page, {
      nama: "E2E Pindah Dana Tanpa Sesi Kasir",
      pin: "864290",
      deskripsi: "Peran uji e2e: izin baca Owner tanpa sesi kasir",
      izin: (n) => n.startsWith("read-") && n !== IZIN.sesiKasir,
    });
    await page.goto(`/dashboard/outlet/keuangan/akunkas/pindahDana?transfer=${jurnal!.id}`);
    const rincian = page.getByRole("dialog");
    await expect(rincian.getByRole("term").filter({ hasText: /^Asal$/ })).toBeVisible({ timeout: 20_000 });
    await expect(rincian.getByRole("definition").filter({ hasText: /^Buka kasir$/ })).toBeVisible();
    await expect(rincian.getByRole("link", { name: "Buka kasir" }), "tanpa tautan ke sesi kasir").toHaveCount(0);
  });

  test("kelola-perangkat-kasir tanpa read-akunkas: halaman tampil seperti tanpa izin kelola", async ({ page }) => {
    await login(page);
    await masukSebagai(page, {
      nama: "E2E Kelola Kasir Tanpa Akun",
      pin: "864235",
      deskripsi: "Peran uji e2e: izin baca Owner tanpa akun kas, ditambah kelola mesin kasir",
      izin: (n) => (n.startsWith("read-") && n !== IZIN.akunKas) || n === IZIN.kelolaPerangkatKasir,
    });
    let mintaMesin = 0;
    page.on("request", (r) => {
      if (r.method() === "GET" && /\/api\/sesikasir\/perangkat(-toko)?(\?|$)/i.test(r.url())) mintaMesin += 1;
    });
    const tKasirBuka = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/sesikasir\?/i.test(r.url()) && !dariLonceng(r.url()),
    );
    await page.goto(URL, { waitUntil: "commit" });
    expect((await tKasirBuka).status(), "sesi kasir tetap dibaca").toBe(200);
    // Jangkar positif sebelum memeriksa ketiadaan (pengguna uji berpindah halaman).
    await expect(page.getByRole("link", { name: "Mesin Kasir", exact: true })).toHaveAttribute("aria-current", "page", {
      timeout: 20_000,
    });
    await expect(page.locator("#judul-kasir-buka")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Tambah mesin kasir" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Aksi / })).toHaveCount(0);
    expect(mintaMesin, "daftar mesin dan perangkat tidak diminta tanpa read-akunkas").toBe(0);
  });

  test("kelola-perangkat-kasir dan read-akunkas tanpa read-pengguna: daftar mesin dan pilihan perangkat tetap terbuka (MK3b)", async ({
    page,
  }) => {
    await login(page);
    await masukSebagai(page, {
      nama: "E2E Kelola Kasir Tanpa Pengguna",
      pin: "864236",
      deskripsi: "Peran uji e2e: izin baca Owner tanpa pengguna, ditambah kelola mesin kasir",
      izin: (n) => (n.startsWith("read-") && n !== IZIN.pengguna) || n === IZIN.kelolaPerangkatKasir,
    });
    const tMesin = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/sesikasir\/perangkat(\?|$)/i.test(r.url()),
    );
    await page.goto(URL, { waitUntil: "commit" });
    expect((await tMesin).status(), "daftar mesin kasir").toBe(200);
    const tPerangkat = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/sesikasir\/perangkat-toko(\?|$)/i.test(r.url()),
    );
    await page.getByRole("button", { name: "Tambah mesin kasir" }).first().click();
    expect((await tPerangkat).status(), "perangkat se-toko tanpa read-pengguna").toBe(200);
    await expect(page.getByRole("dialog", { name: "Tambah mesin kasir" })).toBeVisible();
    await page.keyboard.press("Escape");
  });
});

type PerangkatTokoMentah = { installationId: string; deviceName: string | null; pengguna: { id: string; nama: string }[] };
type PenggunaLokasi = { id?: string; _id?: string; locationID?: string | null };

test.describe("Mesin Kasir: staf berlokasi kerja", () => {
  test("B346: pilihan perangkat staf berlokasi kerja Outlet hanya perangkat yang dipakai pengguna di outlet itu", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page);
    await siapkanKasirOutlet(page);
    // Perangkat pertama staf uji otomatis TRUSTED saat login aplikasi, lalu menetap.
    await loginAplikasi(PENGGUNA_KASIR_OUTLET, PERANGKAT_KASIR_OUTLET);

    // Harapan dihitung dari daftar Owner (tanpa saringan) dan lokasi kerja pemakainya.
    const auth: Auth = await bukaDenganAuth(page, URL);
    const semua = await api<PerangkatTokoMentah[]>(page, auth, "GET", "/sesikasir/perangkat-toko");
    expect(semua.status, "perangkat toko Owner: " + semua.pesan).toBe(200);
    const outlet = await api<{ id?: string; _id?: string } | null>(page, auth, "GET", "/location/current");
    const idOutlet = String(outlet.data?.id ?? outlet.data?._id ?? "");
    expect(idOutlet, "outlet tenant uji").not.toBe("");
    const pengguna = await api<PenggunaLokasi[]>(page, auth, "GET", "/pengguna");
    expect(pengguna.status, "daftar pengguna: " + pengguna.pesan).toBe(200);
    const diOutlet = new Set(
      (pengguna.data ?? []).filter((p) => String(p.locationID ?? "") === idOutlet).map((p) => String(p.id ?? p._id)),
    );
    const harapan = semua.data
      .filter((d) => d.pengguna.some((u) => diOutlet.has(String(u.id))))
      .map((d) => d.installationId)
      .sort();
    expect(harapan, "perangkat staf uji termasuk").toContain(PERANGKAT_KASIR_OUTLET.installationId);
    expect(harapan, "perangkat Owner tanpa lokasi kerja tidak termasuk").not.toContain(PERANGKAT_UJI.installationId);
    expect(semua.data.length, "daftar Owner lebih banyak, sehingga saringan terbukti").toBeGreaterThan(harapan.length);

    await masukKasirOutlet(page);
    const tPerangkat = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/sesikasir\/perangkat-toko(\?|$)/i.test(r.url()),
    );
    await page.goto(URL, { waitUntil: "commit" });
    await expect(page.getByRole("link", { name: "Mesin Kasir", exact: true })).toHaveAttribute("aria-current", "page", {
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Tambah mesin kasir" }).first().click();
    const jawab = await tPerangkat;
    expect(jawab.status(), "perangkat toko staf berlokasi").toBe(200);
    const milikStaf = ((await jawab.json()).data as PerangkatTokoMentah[]).map((d) => d.installationId).sort();
    expect(milikStaf, "B346: disaring menurut lokasi kerja").toEqual(harapan);

    const tambah = page.getByRole("dialog", { name: "Tambah mesin kasir" });
    await expect(tambah.getByRole("radio")).toHaveCount(harapan.length);
    await expect(tambah.getByRole("radio", { name: new RegExp(PERANGKAT_KASIR_OUTLET.nama) })).toHaveCount(1);
    await expect(tambah.getByRole("radio", { name: new RegExp(PERANGKAT_UJI.nama) })).toHaveCount(0);
  });
});

/*
 * Keadaan Mesin Kasir di luar alur utama (utang pengujian sejak spec
 * pratinjau dihapus, b74f30a). Galat dijawab route.fulfill gagal; keadaan
 * kosong yang tidak dapat dibuat di data uji disimulasikan dari respons nyata.
 */
test.describe("Mesin Kasir: keadaan memuat, gagal, dan kosong", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("gagal dimuat di ketiga bagian menampilkan pesan, lalu Coba lagi memuatnya", async ({ page }) => {
    const POLA = /\/api\/sesikasir(\/perangkat)?(\?|$)/i;
    await page.route(POLA, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL);
    await expect(page.getByText("Kasir yang buka gagal dimuat")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Riwayat gagal dimuat")).toBeVisible();
    await expect(page.getByText("Daftar mesin kasir gagal dimuat")).toBeVisible();
    await page.unroute(POLA);
    for (const judul of ["Kasir yang buka gagal dimuat", "Riwayat gagal dimuat"]) {
      await page.getByRole("alert").filter({ hasText: judul }).getByRole("button", { name: "Coba lagi" }).click();
      await expect(page.getByText(judul)).toHaveCount(0, { timeout: 15_000 });
    }
    await page.getByText("Daftar mesin kasir gagal dimuat").locator("..").getByRole("button").click();
    await expect(page.getByText("Daftar mesin kasir gagal dimuat")).toHaveCount(0, { timeout: 15_000 });
  });

  test("memuat: kerangka tampil selama riwayat ditahan, lalu berganti isi", async ({ page }) => {
    let lepas = () => {};
    const ditahan = new Promise<void>((r) => (lepas = r));
    const POLA = /\/api\/sesikasir\?/i;
    await page.route(POLA, async (route) => {
      if (route.request().method() === "GET") await ditahan;
      await route.continue();
    });
    await page.goto(URL);
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Riwayat gagal dimuat")).toHaveCount(0);
    lepas();
    // Penanda isi dari riwayat yang ditahan, bukan #judul-kasir-buka: tanpa mesin
    // kasir sama sekali bagian itu sengaja diganti langkah tambah mesin
    // (susunan-mesin-kasir.tsx), sehingga ada tidaknya bergantung data toko uji.
    const riwayat = page.locator('section[aria-labelledby="judul-riwayat"]');
    await expect(
      riwayat.getByRole("heading", { level: 3 }).or(riwayat.getByText(/^Belum ada kasir yang ditutup/)).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 20_000 });
    await page.unroute(POLA);
  });

  test("form tambah tanpa perangkat dan tanpa laci bebas menampilkan keterangan, bukan pilihan kosong", async ({ page }) => {
    await page.route(/\/api\/sesikasir\/perangkat-toko(\?|$)/i, async (route) => {
      const asli = await route.fetch();
      const body = await asli.json();
      // simulasi: toko uji selalu punya perangkat login aplikasi, sehingga daftar perangkat kosong disusun dari respons nyata
      await route.fulfill({ response: asli, json: { ...body, data: [] } });
    });
    await page.route(/\/api\/akunkas(\?|$)/i, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const asli = await route.fetch();
      const body = await asli.json();
      // simulasi: akun Kas Fisik tidak dapat dihapus, sehingga keadaan tanpa laci disusun dengan membuang akun Kas Fisik dari respons nyata
      const data = (body.data ?? []).filter((a: { tipeAkun?: string }) => a.tipeAkun !== "Kas Fisik");
      await route.fulfill({ response: asli, json: { ...body, data } });
    });
    await page.goto(URL);
    await page.getByRole("button", { name: "Tambah mesin kasir" }).first().click({ timeout: 20_000 });
    const dialog = page.getByRole("dialog", { name: "Tambah mesin kasir" });
    await expect(dialog.getByText(/Belum ada perangkat yang bisa dipilih/)).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByRole("radio")).toHaveCount(0);
    await expect(dialog.getByText(/Semua laci Kas Fisik sudah dipakai mesin lain/)).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Buat akun Kas Fisik baru" })).toHaveAttribute(
      "href",
      "/dashboard/outlet/keuangan/akunkas/buatAkunKas",
    );
  });

  for (const [nama, lebar, sejajar] of [
    ["desktop 1280 px: panel mesin kasir di samping riwayat", 1280, true],
    ["HP 390 px: panel mesin kasir di bawah riwayat", 390, false],
  ] as const) {
    test(`susunan ${nama}`, async ({ page }) => {
      await page.setViewportSize({ width: lebar, height: 900 });
      // Panel samping hanya tampil bila toko punya mesin kasir, sedangkan mesin
      // uji dilepas di akhir spec alur; daftar mesin diisi satu mesin contoh.
      await page.route(/\/api\/sesikasir\/perangkat(\?|$)/i, async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        const asli = await route.fetch();
        const body = await asli.json();
        const contoh = {
          id: "0".repeat(23) + "1",
          tenantID: null,
          installationId: "E2E-SUSUNAN-DEVICE",
          namaPerangkat: "E2E Mesin Susunan",
          akunKasID: null,
          akunKas: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // simulasi: tata letak panel diuji dengan satu mesin contoh, tanpa aksi yang menulis data
        await route.fulfill({ response: asli, json: { ...body, data: (body.data ?? []).length ? body.data : [contoh] } });
      });
      await page.goto(URL);
      const panel = page.locator('section[aria-labelledby="judul-mesin-kasir"]');
      const riwayat = page.locator('section[aria-labelledby="judul-riwayat"]');
      await expect(panel).toBeVisible({ timeout: 20_000 });
      await expect(riwayat).toBeVisible();
      const kp = (await panel.boundingBox())!;
      const kr = (await riwayat.boundingBox())!;
      if (sejajar) expect(kp.x, "panel di kanan riwayat").toBeGreaterThan(kr.x + kr.width / 2);
      else expect(kp.y > kr.y || kp.y + kp.height < kr.y, "panel bertumpuk, tidak bersisian").toBe(true);
      const lebarHalaman = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(lebarHalaman, "tanpa gulir ke samping").toBeLessThanOrEqual(lebar);
      await page.unrouteAll({ behavior: "ignoreErrors" });
    });
  }
});

test.describe("Mesin Kasir: riwayat berhalaman", () => {
  test("Muat hari sebelumnya meminta halaman berikutnya dengan filter yang sama dan menambah barisnya", async ({ page }) => {
    await login(page);
    const POLA = /\/api\/sesikasir\?/i;
    const riwayat = (halaman: string) => (r: { request(): { method(): string }; url(): string }) =>
      r.request().method() === "GET" &&
      POLA.test(r.url()) &&
      new globalThis.URL(r.url()).searchParams.get("page") === halaman &&
      new globalThis.URL(r.url()).searchParams.has("status") &&
      !dariLonceng(r.url());
    const tPertama = page.waitForResponse(riwayat("1"));
    await page.goto(URL, { waitUntil: "commit" });
    const pertama = await tPertama;
    const isi = (await pertama.json()) as { data: unknown[]; pagination: { totalPages: number } };
    test.skip(isi.pagination.totalPages < 2, "riwayat tujuh hari terakhir belum lebih dari satu halaman");
    const tombol = page.getByRole("button", { name: "Muat hari sebelumnya" });
    await expect(tombol).toBeVisible({ timeout: 20_000 });
    const tKedua = page.waitForResponse(riwayat("2"));
    await tombol.click();
    const kedua = await tKedua;
    expect(kedua.status()).toBe(200);
    const q1 = new globalThis.URL(pertama.url()).searchParams;
    const q2 = new globalThis.URL(kedua.url()).searchParams;
    for (const k of ["dari", "sampai", "limit", "status"]) expect(q2.get(k), `${k} sama`).toBe(q1.get(k));
    const isiKedua = (await kedua.json()) as { data: { id: string }[] };
    expect(isiKedua.data.length).toBeGreaterThan(0);
    await expect(page.locator(`a[href$="/${isiKedua.data[0].id}"]`).first(), "baris halaman kedua tampil").toBeVisible();
  });

  test("metode tunai yang akun kasnya laci mesin kasir dinonaktifkan di form pembayaran web, beserta keterangannya (PB15a)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page);
    const auth: Auth = await bukaDenganAuth(page, URL);
    const laci = await siapkanLaciUji(page, auth);
    await bersihkanMesinUji(page, auth, laci.id);
    const NAMA_METODE = "E2E Metode Laci Tetap";
    type Metode = { id: string; namaPembayaran: string; isActive: boolean };
    let metodeId = "";
    let penjualanId: string | undefined;
    try {
      // Mesin kasir (modul ini) dan metode tunai berakun laci (modul metode
      // pembayaran) disiapkan lewat API; yang diuji form pembayaran.
      const mesin = await api(page, auth, "POST", "/sesikasir/perangkat", {
        installationId: PERANGKAT_UJI.installationId,
        akunKasID: laci.id,
        namaPerangkat: `E2E Kasir Laci ${unik()}`,
      });
      expect(mesin.status, "petakan mesin kasir uji: " + mesin.pesan).toBeLessThan(300);
      const semua = await api<Metode[]>(page, auth, "GET", "/metodepembayaran?showAll=true");
      const ada = (semua.data ?? []).find((m) => m.namaPembayaran === NAMA_METODE);
      const siap = ada
        ? await api<Metode>(page, auth, "PUT", "/metodepembayaran/" + ada.id, { isActive: true })
        : await api<Metode>(page, auth, "POST", "/metodepembayaran", {
            namaPembayaran: NAMA_METODE,
            kategori: "tunai",
            akunKasID: laci.id,
            isActive: true,
          });
      expect(siap.status, "aktifkan metode laci uji: " + siap.pesan).toBeLessThan(300);
      metodeId = ada?.id ?? siap.data.id;

      // Penjualan belum dibayar dari booking uji (alur reservasi).
      const fx = await siapkanFixtureBooking(page, auth);
      await bersihkanSisaBooking(page, auth, fx);
      const mulai = new Date(Date.now() + 9 * 60 * 60 * 1000);
      mulai.setSeconds(0, 0);
      const b = await buatBooking(page, auth, fx, mulai, new Date(mulai.getTime() + 60 * 60 * 1000));
      penjualanId = b.dataPenjualan?.id;

      await page.goto(`/dashboard/outlet/penjualan/${penjualanId}/pembayaran`);
      await page.getByRole("combobox").filter({ hasText: "Pilih metode..." }).click({ timeout: 20_000 });
      const opsiLaci = page.getByRole("option", { name: new RegExp(NAMA_METODE) });
      await expect(opsiLaci).toHaveAttribute("aria-disabled", "true");
      await expect(opsiLaci).toContainText(
        "Laci mesin kasir. Buka kasir di perangkatnya lalu terima tunai di sana, atau pilih metode lain.",
      );
      // Metode tunai lain (laci bukan mesin kasir) tetap dapat dipilih.
      await expect(page.getByRole("option", { name: /^Tunai/ }).first()).not.toHaveAttribute("aria-disabled", "true");
      await page.keyboard.press("Escape");
    } finally {
      await batalkanBooking(page, auth, penjualanId);
      if (metodeId) {
        const off = await api(page, auth, "PUT", "/metodepembayaran/" + metodeId, { isActive: false });
        expect.soft(off.status, "nonaktifkan metode laci uji: " + off.pesan).toBe(200);
      }
      await bersihkanMesinUji(page, auth, laci.id);
    }
  });
});
