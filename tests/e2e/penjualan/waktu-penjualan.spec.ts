import { expect, test, type Page } from "@playwright/test";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { normalizeId } from "@/lib/api/normalize";
import { bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { pantauPermintaan } from "../../helpers/reservasi-uji";
import { hapusDraft, isiIsianPenjualan, siapkanFixture } from "../../helpers/penjualan-uji";

/*
 * Input tanggal dan jam transaksi di buat penjualan (keputusan K-TW1, K-TW4,
 * dan K-TW5): PilihTanggal dengan kalender kostum dan InputWaktu. Sebelumnya
 * jam "99" menggeser transaksi beberapa hari dan jam berhuruf melempar
 * RangeError tanpa pesan. Tanggal dan jam yang belum disentuh kasir
 * mengikuti jam berjalan dan dikirim sebagai waktu simpan (keputusan
 * pemilik proyek, 26 Oktober 2026); diuji dengan page.clock, dan POST-nya
 * dijawab gagal lewat route.fulfill sehingga tidak ada penjualan tersimpan.
 */

/** Jam browser dipasang pukul 23:58 kemarin; payload POST ditangkap lalu dijawab gagal. */
async function mulaiSebelumTengahMalam(page: Page) {
  const kini = new Date();
  const sebelum = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate() - 1, 23, 58, 0);
  const tengahMalam = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate(), 0, 0, 0);
  await page.clock.install({ time: sebelum });
  await page.route(POLA_POST, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ status: "error", message: "E2E penjualan ditahan" }),
        })
      : route.continue(),
  );
  return { sebelum, tengahMalam };
}

async function kirimDanBacaWaktu(page: Page) {
  await page.getByLabel(/keterangan/i).press("Enter");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  const tPost = page.waitForRequest((r) => r.method() === "POST" && POLA_POST.test(r.url()));
  await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
  return new Date((await tPost).postDataJSON().tanggalTransaksi as string).getTime();
}

const URL_DAFTAR = "/dashboard/outlet/penjualan";
const POLA_POST = /\/api\/penjualan(\?|$)/i;

test.describe("E2E — Penjualan › Tanggal dan jam transaksi", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("jam transaksi yang dikosongkan menahan simpan dengan pesan, tanpa dialog maupun POST (keputusan K-TW5a)", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixture(page, auth, 10);
    await isiIsianPenjualan(page, 1);
    const kirim = pantauPermintaan(page, "POST", POLA_POST);
    const jam = page.getByRole("textbox", { name: "Jam Transaksi (jam)" });
    await jam.fill("");
    await page.getByLabel(/keterangan/i).press("Enter");
    await expect(page.getByText("Jam transaksi wajib diisi lengkap.")).toBeVisible();
    await expect(jam).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(kirim.jumlah(), "jam kosong tidak mengirim POST").toBe(0);
    kirim.lepas();
  });

  test("tanggal dari kalender kostum dan jam yang diisi terkirim sebagai tanggalTransaksi yang tepat", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixture(page, auth, 10);
    let id: string | undefined;
    try {
      await isiIsianPenjualan(page, 1);
      const sekarang = new Date();
      const harapan = new Date(sekarang.getFullYear(), sekarang.getMonth() - 1, 15, 8, 30, 0, 0);
      const tombolTanggal = page.getByRole("button", { name: /^Tanggal Transaksi, / });
      await tombolTanggal.click();
      await page.getByRole("button", { name: /previous month/i }).click();
      await page.getByRole("grid").getByText("15", { exact: true }).click();
      await expect(page.getByRole("grid")).toHaveCount(0);
      await expect(tombolTanggal).toContainText(format(harapan, "dd MMMM yyyy", { locale: localeID }));
      await page.getByRole("textbox", { name: "Jam Transaksi (jam)" }).fill("08");
      await page.getByRole("textbox", { name: "Jam Transaksi (menit)" }).fill("30");
      await page.getByLabel(/keterangan/i).press("Enter");
      await expect(page.getByRole("alertdialog")).toBeVisible();
      const tunggu = page.waitForResponse((r) => r.request().method() === "POST" && POLA_POST.test(r.url()));
      await page.getByRole("button", { name: /ya, lanjutkan/i }).click();
      const res = await tunggu;
      expect(res.request().postDataJSON().tanggalTransaksi, "tanggalTransaksi di payload").toBe(harapan.toISOString());
      const body = await res.json().catch(() => ({}));
      expect(res.status(), `POST /penjualan: ${JSON.stringify(body).slice(0, 200)}`).toBe(201);
      id = (normalizeId(body.data) as unknown as { id: string }).id;
    } finally {
      if (id) await hapusDraft(page, auth, id);
    }
  });

  test("tanggal dan jam yang tidak diubah ikut berganti lewat tengah malam, dan dikirim sebagai waktu simpan", async ({
    page,
  }) => {
    const { sebelum, tengahMalam } = await mulaiSebelumTengahMalam(page);
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixture(page, auth, 10);
    await isiIsianPenjualan(page, 1);
    const tombolTanggal = page.getByRole("button", { name: /^Tanggal Transaksi, / });
    await expect(tombolTanggal).toContainText(format(sebelum, "dd MMMM yyyy", { locale: localeID }));

    await page.clock.runFor(150_000);
    await expect(tombolTanggal, "tanggal ikut berganti").toContainText(
      format(tengahMalam, "dd MMMM yyyy", { locale: localeID }),
    );
    const waktu = await kirimDanBacaWaktu(page);
    expect(waktu, "waktu simpan sesudah tengah malam").toBeGreaterThanOrEqual(tengahMalam.getTime());
    expect(waktu, "waktu simpan, bukan waktu layar dibuka").toBeLessThan(tengahMalam.getTime() + 5 * 60_000);
  });

  test("jam yang diubah kasir dikunci dan tidak ikut bergeser lewat tengah malam", async ({ page }) => {
    const { sebelum } = await mulaiSebelumTengahMalam(page);
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    await siapkanFixture(page, auth, 10);
    await isiIsianPenjualan(page, 1);
    await page.getByRole("textbox", { name: "Jam Transaksi (jam)" }).fill("21");
    await page.getByRole("textbox", { name: "Jam Transaksi (menit)" }).fill("15");

    await page.clock.runFor(150_000);
    await expect(page.getByRole("button", { name: /^Tanggal Transaksi, / })).toContainText(
      format(sebelum, "dd MMMM yyyy", { locale: localeID }),
    );
    const harapan = new Date(sebelum.getFullYear(), sebelum.getMonth(), sebelum.getDate(), 21, 15, 0, 0);
    expect(await kirimDanBacaWaktu(page), "tanggal dan jam pilihan kasir").toBe(harapan.getTime());
  });
});