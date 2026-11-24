import { expect, test } from "@playwright/test";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";
import { masukBacaSaja } from "../../helpers/terkunci-uji";
import { bukaPanelFilter, terapkanPanelFilter } from "../../helpers/filter-uji";
import { daftarAkun, saldoAkun, akunUjiTetap, tutupAkunUji, pilihAkun, type AkunKasUji } from "../../helpers/akun-kas-uji";

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
const URL_MUTASI = "/dashboard/outlet/keuangan/mutasiArusKas";
const POLA_MUTASI = /\/api\/akunkas\/mutasi(\?|$)/i;

test.describe("pindah dana", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  })
  test("penolakan backend 409: akun tujuan dinonaktifkan sesudah form dibuka, dan pembatalan yang menguras saldo tujuan", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    let auth = await bukaDenganAuth(page, URL_AKUN);
    const lawan = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!lawan, "tidak ada akun kas aktif bersaldo untuk mengisi akun uji");
    const SUMBER = "E2E Pindah Sumber Tetap";
    const TUJUAN = "E2E Pindah Tujuan Ditolak Tetap";
    const sumber = await akunUjiTetap(page, auth, SUMBER);
    const tujuan = await akunUjiTetap(page, auth, TUJUAN);
    const isi = await api(page, auth, "POST", "/jurnaltransfer", {
      kasSumberID: (lawan as AkunKasUji).id,
      kasTujuanID: sumber.id,
      jumlah: 1,
      keterangan: "E2E isi sumber ditolak " + unik(),
    });
    expect(isi.status, `isi akun sumber: ${isi.pesan}`).toBe(201);

    const isiForm = async (keterangan: string) => {
      await page.goto(URL_PINDAH);
      await expect(page.getByRole("heading", { name: "Pindah Dana", exact: true })).toBeVisible({ timeout: 15_000 });
      await pilihAkun(page, "Akun Sumber", SUMBER);
      await pilihAkun(page, "Akun Tujuan", TUJUAN);
      await page.getByLabel("Jumlah (Rp)").fill("1");
      await page.getByLabel("Keterangan", { exact: true }).fill(keterangan);
    };
    try {
      await test.step("saldo sumber berkurang sesudah form dibuka", async () => {
        await isiForm("E2E saldo sumber kurang " + unik());
        const kuras = await api(page, auth, "POST", "/jurnaltransfer", {
          kasSumberID: sumber.id,
          kasTujuanID: (lawan as AkunKasUji).id,
          jumlah: 1,
          keterangan: "E2E kuras sumber " + unik(),
        });
        expect(kuras.status, `kuras sumber: ${kuras.pesan}`).toBe(201);
        const t = page.waitForResponse((r) => POLA_TRANSFER.test(r.url()) && r.request().method() === "POST");
        await page.getByRole("button", { name: "Pindahkan Dana" }).click();
        expect((await t).status()).toBe(409);
        await expect(page.getByText("Saldo akun kas sumber tidak mencukupi (saldo Rp 0).").first()).toBeVisible();
        const isiLagi = await api(page, auth, "POST", "/jurnaltransfer", {
          kasSumberID: (lawan as AkunKasUji).id,
          kasTujuanID: sumber.id,
          jumlah: 1,
          keterangan: "E2E isi ulang sumber " + unik(),
        });
        expect(isiLagi.status, `isi ulang sumber: ${isiLagi.pesan}`).toBe(201);
      });

      await test.step("akun tujuan dinonaktifkan sesudah form dibuka", async () => {
        await isiForm("E2E tujuan nonaktif " + unik());
        const tutup = await api(page, auth, "PUT", "/akunkas/" + tujuan.id, { status: "non-aktif" });
        expect(tutup.status, `nonaktifkan tujuan: ${tutup.pesan}`).toBe(200);
        const t = page.waitForResponse((r) => POLA_TRANSFER.test(r.url()) && r.request().method() === "POST");
        await page.getByRole("button", { name: "Pindahkan Dana" }).click();
        expect((await t).status()).toBe(409);
        await expect(page.getByText("Akun kas tujuan sudah nonaktif.").first()).toBeVisible();
        expect(await saldoAkun(page, auth, sumber.id), "saldo sumber tidak berubah").toBe(1);
        const buka = await api(page, auth, "PUT", "/akunkas/" + tujuan.id, { status: "aktif" });
        expect(buka.status, `aktifkan tujuan: ${buka.pesan}`).toBe(200);
      });

      await test.step("pembatalan ditolak karena saldo tujuan sudah terpakai", async () => {
        const keterangan = "E2E batal ditolak " + unik();
        await isiForm(keterangan);
        const t = page.waitForResponse((r) => POLA_TRANSFER.test(r.url()) && r.request().method() === "POST");
        await page.getByRole("button", { name: "Pindahkan Dana" }).click();
        expect((await t).status(), "transfer sumber ke tujuan").toBe(201);
        const keluar = await api(page, auth, "POST", "/jurnaltransfer", {
          kasSumberID: tujuan.id,
          kasTujuanID: (lawan as AkunKasUji).id,
          jumlah: 1,
          keterangan: "E2E saldo tujuan terpakai " + unik(),
        });
        expect(keluar.status, `pakai saldo tujuan: ${keluar.pesan}`).toBe(201);
        auth = await bukaDenganAuth(page, URL_PINDAH);
        const baris = page.getByRole("row").filter({ hasText: keterangan });
        await baris.getByRole("button", { name: "Aksi transfer" }).click();
        await page.getByRole("menuitem", { name: "Batalkan transfer" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel(/Alasan pembatalan/).fill("E2E batal ditolak");
        const tBatal = page.waitForResponse((r) => POLA_TRANSFER_ID.test(r.url()) && r.request().method() === "PUT");
        await dialog.getByRole("button", { name: "Batalkan Transfer" }).click();
        expect((await tBatal).status(), "VOID ditolak").toBe(409);
        // Pesan 409 pembatalan disusun web, menyebut kedua kemungkinan.
        await expect(
          dialog.getByText("Saldo akun kas tujuan tidak cukup untuk membatalkan transfer ini, atau akunnya sudah nonaktif."),
        ).toBeVisible();
        await expect(dialog, "dialog bertahan saat gagal").toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(baris, "transfer tetap Aktif").toContainText("Aktif");
      });
    } finally {
      const buka = await api(page, auth, "PUT", "/akunkas/" + tujuan.id, { status: "aktif" });
      expect.soft(buka.status, `aktifkan tujuan: ${buka.pesan}`).toBe(200);
    }
  });
;

  test("pindah lewat UI lalu batalkan: payload persis, saldo berpindah dan pulih (DN1a, DN2a, DN3a)", async ({ page }) => {
    let auth = await bukaDenganAuth(page, URL_AKUN);
    const sumber = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!sumber, "tidak ada akun kas aktif bersaldo untuk menjadi sumber");
    const akunSumber = sumber as AkunKasUji;
    const saldoSumberAwal = akunSumber.saldo;
    const namaTujuan = "E2E Pindah Tujuan Tetap";
    const keterangan = "E2E pindah dana " + unik();
    const alasan = "E2E batal " + unik();
    let idTujuan: string | undefined;
    let idTransfer: string | undefined;
    let dibatalkan = false;

    try {
      idTujuan = (await akunUjiTetap(page, auth, namaTujuan)).id;
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

      // Aksi baris di menu titik tiga (CV17a).
      await baris.getByRole("button", { name: "Aksi transfer" }).click();
      await page.getByRole("menuitem", { name: "Batalkan transfer" }).click();
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
      await expect(baris.getByRole("button", { name: "Aksi transfer" })).toHaveCount(0);

      expect(await saldoAkun(page, auth, idTujuan), "saldo tujuan pulih").toBe(0);
      expect(await saldoAkun(page, auth, akunSumber.id), "saldo sumber pulih").toBe(saldoSumberAwal);

      // Rincian mutasi transfer bertaut ke rincian transfernya di Pindah Dana
      // (pemilik proyek, 20 November 2026). Mutasi terbaru di halaman pertama.
      const tMutasi = page.waitForResponse(
        (r) => r.request().method() === "GET" && POLA_MUTASI.test(r.url()) && new URL(r.url()).searchParams.get("page") === "1",
      );
      await page.goto(URL_MUTASI);
      const mutasi = (await (await tMutasi).json()) as {
        data: { jenis: string; referensi: { tipe: string | null; id: string | null } }[];
      };
      const i = mutasi.data.findIndex((m) => m.jenis === "VOID_TRANSFER_MASUK" && m.referensi.id === idTransfer);
      expect(i, "mutasi pembatalan transfer uji ada di halaman pertama").toBeGreaterThanOrEqual(0);
      await expect(page.locator("tbody tr")).toHaveCount(mutasi.data.length, { timeout: 15_000 });
      await page.locator("tbody tr").nth(i).getByRole("button", { name: "Buka menu" }).click();
      await page.getByRole("menuitem", { name: "Lihat detail" }).click();
      const rincianMutasi = page.getByRole("dialog");
      await expect(rincianMutasi).toContainText("Transfer terkait");
      const tDetail = page.waitForResponse(
        (r) => r.request().method() === "GET" && POLA_TRANSFER_ID.test(r.url()),
      );
      await rincianMutasi.getByRole("link", { name: "Lihat transfer" }).click();
      await page.waitForURL(new RegExp(`/pindahDana\\?transfer=${idTransfer}$`));
      const detail = await tDetail;
      expect(detail.status(), "GET /jurnaltransfer/:id").toBe(200);
      expect(new URL(detail.url()).pathname).toBe(`/api/jurnaltransfer/${idTransfer}`);
      const rincian = page.getByRole("dialog");
      await expect(rincian.getByRole("heading", { name: "Rincian Transfer" })).toBeVisible();
      await expect(rincian).toContainText(akunSumber.namaAkun);
      await expect(rincian).toContainText(namaTujuan);
      await expect(rincian).toContainText(keterangan);
      await expect(rincian).toContainText("Dibatalkan");
      await expect(rincian).toContainText(alasan);
      await page.keyboard.press("Escape");
      await expect(rincian).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`${URL_PINDAH}$`));
    } finally {
      if (idTransfer && !dibatalkan) {
        const void_ = await api(page, auth, "PUT", "/jurnaltransfer/" + idTransfer, { status: "VOID" });
        expect.soft(void_.status, `batalkan transfer uji: ${void_.pesan}`).toBe(200);
      }
      await tutupAkunUji(page, auth, idTujuan);
    }
  });

  test("riwayat: periode dari panel dikirim sebagai tanggal YYYY-MM-DD, dan Atur ulang semua mengosongkannya (NZ3a, FL1a)", async ({ page }) => {
    const daftarTransfer = (syarat: (q: URLSearchParams) => boolean) =>
      page.waitForResponse(
        (r) => r.request().method() === "GET" && POLA_TRANSFER.test(r.url()) && syarat(new URL(r.url()).searchParams),
      );
    const total = async (r: Awaited<ReturnType<typeof daftarTransfer>>) =>
      ((await r.json()) as { pagination: { total: number } }).pagination.total;
    const tampilTotal = async (n: number) => {
      if (n === 0) await expect(page.getByText("Belum ada transfer pada filter ini.")).toBeVisible();
      else await expect(page.getByText(`${n} total data`)).toBeVisible();
    };

    await page.goto(URL_PINDAH, { waitUntil: "commit" });
    const awal = await daftarTransfer((q) => !q.has("dari") && !q.has("sampai"));
    expect(awal.status()).toBe(200);
    const totalAwal = await total(awal);
    const pil = page.getByRole("group", { name: "Filter aktif" });
    await expect(pil, "tanpa filter tidak ada pil aktif").toBeHidden();

    const kini = new Date();
    const awalan = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}-`;
    // "Sampai" diisi lebih dulu, karena "dari" tidak boleh melewati "sampai".
    const panel = await bukaPanelFilter(page);
    await panel.getByRole("button", { name: /^Transfer sampai, / }).click();
    await page.getByRole("grid").getByText("20", { exact: true }).click();
    await expect(page.getByRole("grid")).toHaveCount(0);
    await panel.getByRole("button", { name: /^Transfer dari, / }).click();
    await page.getByRole("grid").getByText("15", { exact: true }).click();
    await expect(page.getByRole("grid")).toHaveCount(0);
    const tPeriode = daftarTransfer((q) => q.get("dari") === awalan + "15" && q.get("sampai") === awalan + "20");
    await terapkanPanelFilter(panel);
    const resPeriode = await tPeriode;
    expect(resPeriode.status()).toBe(200);
    const totalPeriode = await total(resPeriode);
    expect(totalPeriode).toBeLessThanOrEqual(totalAwal);
    await tampilTotal(totalPeriode);
    await expect(pil.getByRole("button", { name: /^Hapus filter 15 – 20 / })).toBeVisible();

    await pil.getByRole("button", { name: "Atur ulang semua" }).click();
    await expect(pil).toBeHidden();
    await tampilTotal(totalAwal);
  });

  test("riwayat: periode hari ini hanya memuat transfer hari ini, dan setiap baris respons tampil di tabel", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_AKUN);
    const lawan = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && a.saldo >= 1 && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!lawan, "tidak ada akun kas aktif bersaldo");
    // Satu transfer hari ini sebagai isi periode yang pasti ada.
    const akun = await akunUjiTetap(page, auth, "E2E Pindah Riwayat Tetap");
    const keterangan = "E2E riwayat periode " + unik();
    const buat = await api(page, auth, "POST", "/jurnaltransfer", {
      kasSumberID: (lawan as AkunKasUji).id,
      kasTujuanID: akun.id,
      jumlah: 1,
      keterangan,
    });
    expect(buat.status, `transfer hari ini: ${buat.pesan}`).toBe(201);

    const kini = new Date();
    const hariIni = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}-${String(kini.getDate()).padStart(2, "0")}`;
    const dataDay = `${kini.getMonth() + 1}/${kini.getDate()}/${kini.getFullYear()}`;
    await page.goto(URL_PINDAH);
    await expect(page.getByRole("heading", { name: "Pindah Dana", exact: true })).toBeVisible({ timeout: 15_000 });
    const panel = await bukaPanelFilter(page);
    await panel.getByRole("button", { name: /^Transfer sampai, / }).click();
    await page.getByRole("grid").locator(`button[data-day="${dataDay}"]`).click();
    await panel.getByRole("button", { name: /^Transfer dari, / }).click();
    await page.getByRole("grid").locator(`button[data-day="${dataDay}"]`).click();
    const tPeriode = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        POLA_TRANSFER.test(r.url()) &&
        new URL(r.url()).searchParams.get("dari") === hariIni &&
        new URL(r.url()).searchParams.get("sampai") === hariIni,
    );
    await terapkanPanelFilter(panel);
    const res = await tPeriode;
    expect(res.status()).toBe(200);
    const isi = (await res.json()) as { data: { tanggal: string; keterangan?: string }[] };
    expect(isi.data.length, "transfer hari ini ada di periode").toBeGreaterThan(0);
    for (const t of isi.data) {
      const d = new Date(t.tanggal);
      const lokal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      expect(lokal, `tanggal transfer ${t.keterangan ?? ""}`).toBe(hariIni);
    }
    await expect(page.locator("tbody tr")).toHaveCount(isi.data.length, { timeout: 15_000 });
    await expect(page.getByRole("row").filter({ hasText: keterangan })).toHaveCount(1);
  });

  test("kurang dari dua akun kas aktif: form diganti keterangan, riwayat tetap tampil", async ({ page }) => {
    const POLA_AKUN = /\/api\/akunkas(\?|$)/i;
    await page.route(POLA_AKUN, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const asli = await route.fetch();
      const body = await asli.json();
      const aktif = (body.data ?? []).filter((a: { status?: string }) => a.status === "aktif");
      const lain = (body.data ?? []).filter((a: { status?: string }) => a.status !== "aktif");
      // simulasi: tenant uji selalu punya beberapa akun aktif, dan akun Kas Kecil dipakai metode Tunai sehingga tidak dapat dinonaktifkan; daftar akun nyata disaring menjadi satu akun aktif
      await route.fulfill({ response: asli, json: { ...body, data: [...aktif.slice(0, 1), ...lain] } });
    });
    try {
      const tRiwayat = page.waitForResponse((r) => r.request().method() === "GET" && POLA_TRANSFER.test(r.url()));
      await page.goto(URL_PINDAH);
      expect((await tRiwayat).status()).toBe(200);
      await expect(page.getByText("Butuh dua akun kas aktif")).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByText("Pindah Dana memerlukan sedikitnya dua akun kas aktif: satu sumber dan satu tujuan."),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Pindahkan Dana" })).toHaveCount(0);
      await expect(page.locator("tbody tr").first(), "riwayat tetap tampil").toBeVisible();
    } finally {
      await page.unroute(POLA_AKUN);
    }
  });

  test("form menahan isian kosong dan jumlah di atas saldo, tanpa permintaan", async ({ page }) => {
    let auth = await bukaDenganAuth(page, URL_AKUN);
    const tujuan = (await daftarAkun(page, auth)).find(
      (a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E"),
    );
    test.skip(!tujuan, "tidak ada akun kas aktif lain untuk menjadi tujuan");
    const akunTujuan = tujuan as AkunKasUji;
    const namaSumber = "E2E Pindah Sumber Tetap";
    let idSumber: string | undefined;
    let terkirim = 0;
    const hitung = (req: { url(): string; method(): string }) => {
      if (POLA_TRANSFER.test(req.url()) && req.method() === "POST") terkirim++;
    };

    try {
      idSumber = (await akunUjiTetap(page, auth, namaSumber)).id;
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

test.describe("pindah dana: pengguna baca-saja", () => {
  test("riwayat tampil tanpa form Pindahkan Dana dan tanpa Batalkan", async ({ page }) => {
    await login(page);
    await masukBacaSaja(page);
    const tRiwayat = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/jurnaltransfer(\?|$)/i.test(r.url()),
    );
    await page.goto(URL_PINDAH, { waitUntil: "commit" });
    const riwayat = await tRiwayat;
    expect(riwayat.status(), "riwayat dibaca pemegang izin baca").toBe(200);
    const isi = (await riwayat.json()) as { data?: { status?: string }[] };
    await expect(page.getByRole("heading", { name: "Pindah Dana", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Filter lainnya", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pindahkan Dana" })).toHaveCount(0);
    // Batalkan hanya untuk baris AKTIF; tanpa baris AKTIF pemeriksaan ini tidak membedakan.
    if ((isi.data ?? []).some((t) => t.status === "AKTIF")) {
      await expect(page.getByRole("cell", { name: "Aktif", exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Aksi transfer" })).toHaveCount(0);
  });
});
