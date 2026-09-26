import { test, expect, type Page } from "@playwright/test";
import { login, bukaDenganAuth, api, BASIS, JAWAB_GAGAL, type Auth } from "../../../helpers/transfer-uji";
import {
  ID_TIDAK_ADA,
  unik,
  cocok,
  pantauPermintaan,
  tahanLaluTeruskan,
  buatTipeAset,
  buatAset,
  hapusLewatApi,
  type AsetMentah,
  type TipeAsetMentah,
} from "../../../helpers/reservasi-uji";

/*
 * Spec aset terhadap backend sungguhan (keputusan rancangan butir 21,
 * keputusan R1a). Setiap test membuat tipe aset dan aset uji lewat API dengan
 * nama unik, lalu menghapusnya di finally (aset dulu, baru tipe). Status
 * "Digunakan" hanya dapat dibuktikan lewat booking sungguhan dan diuji di
 * spec alur reservasi (keputusan R2b).
 */

const URL_DAFTAR = BASIS + "/dashboard/outlet/reservasi/aset";
const URL_BUAT = URL_DAFTAR + "/buatAset";
const urlEdit = (id: string) => URL_DAFTAR + "/" + id + "/edit";
const POLA_DAFTAR = /\/api\/aset(\?|$)/i;
const POLA_SATU = /\/api\/aset\/[^/?]+(\?|$)/i;

const namaAsetUji = (label: string) => "E2E Aset " + label + " " + unik();
const namaTipeUji = () => "E2E Tipe Aset " + unik();

const bacaAset = (page: Page, auth: Auth, id: string) =>
  api<AsetMentah>(page, auth, "GET", "/aset/" + id);

/** Membuka daftar dan mengembalikan isi respons GET daftar halaman itu sendiri. */
async function bukaDaftar(page: Page): Promise<AsetMentah[]> {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
  expect(res.status()).toBe(200);
  return (await res.json()).data as AsetMentah[];
}

const baris = (page: Page, nama: string) => page.getByRole("row").filter({ hasText: nama });

test.describe("E2E — Aset › Halaman Daftar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("merender judul, pencarian, tombol tambah, kepala tabel, dan total sesuai respons", async ({
    page,
  }) => {
    const data = await bukaDaftar(page);
    await expect(page.getByRole("heading", { name: "Manajemen Aset", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder(/cari nama aset/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /tambah/i })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveCount(4);
    await expect(page.getByText("Total: " + data.length + " Aset")).toBeVisible();
  });

  test("menampilkan nama, tipe, dan badge status sesuai data backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const namaTersedia = namaAsetUji("Tersedia");
    const namaPerbaikan = namaAsetUji("Perbaikan");
    let tipe: TipeAsetMentah | undefined;
    let a: AsetMentah | undefined;
    let b: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      a = await buatAset(page, auth, { namaAset: namaTersedia, tipeAsetID: tipe.id });
      b = await buatAset(page, auth, {
        namaAset: namaPerbaikan,
        tipeAsetID: tipe.id,
        status: "perbaikan",
      });
      const data = await bukaDaftar(page);
      expect(data.find((x) => x.id === a?.id)?.status).toBe("tersedia");
      expect(data.find((x) => x.id === b?.id)?.status).toBe("perbaikan");
      await expect(page.getByText("Total: " + data.length + " Aset")).toBeVisible();
      await expect(baris(page, namaTersedia)).toContainText(tipe.namaTipeAset);
      await expect(baris(page, namaTersedia)).toContainText("ID: " + a.id.substring(0, 8));
      await expect(baris(page, namaTersedia)).toContainText("Tersedia");
      await expect(baris(page, namaPerbaikan)).toContainText(tipe.namaTipeAset);
      await expect(baris(page, namaPerbaikan)).toContainText("Perbaikan");
    } finally {
      await hapusLewatApi(page, auth, "/aset", a?.id);
      await hapusLewatApi(page, auth, "/aset", b?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("aset yang tipe asetnya sudah dihapus tampil sebagai Tipe Tidak Diketahui", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Yatim");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      // Backend tidak memeriksa pemakaian saat tipe aset dihapus, sehingga
      // aset uji tetap ada dan menunjuk ke tipe yang sudah tidak ada.
      const hapusTipe = await api(page, auth, "DELETE", "/tipeaset/" + tipe.id);
      expect(hapusTipe.status, "hapus tipe aset uji: " + hapusTipe.pesan).toBeLessThan(300);
      tipe = undefined;
      const data = await bukaDaftar(page);
      expect(data.find((x) => x.id === aset?.id)?.dataAset ?? null).toBeNull();
      await expect(baris(page, nama)).toContainText("Tipe Tidak Diketahui");
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("pencarian menyaring di klien tanpa memanggil backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Cari");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      const permintaan = pantauPermintaan(page, "GET", POLA_DAFTAR);
      await page.getByPlaceholder(/cari nama aset/i).fill(nama);
      await expect(baris(page, nama)).toBeVisible();
      await expect(page.getByText("Total: 1 Aset")).toBeVisible();
      expect(permintaan.jumlah(), "pencarian tidak memanggil backend").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("hapus: tombol menunggu selama permintaan berjalan, lalu data terhapus di backend", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Hapus");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    let terhapus = false;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      await tahanLaluTeruskan(page, "DELETE", POLA_SATU);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText("Hapus Data Aset?");
      const tHapus = page.waitForResponse(cocok("DELETE", POLA_SATU));
      await dialog.getByRole("button", { name: /ya, hapus aset/i }).click();
      const menunggu = dialog.getByRole("button", { name: /menghapus/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      expect((await tHapus).status()).toBeLessThan(300);
      terhapus = true;
      await expect(dialog).toBeHidden();
      await expect(baris(page, nama)).toHaveCount(0);
      expect((await bacaAset(page, auth, aset.id)).status).toBe(404);
      await page.unroute(POLA_SATU);
    } finally {
      if (!terhapus) await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});

test.describe("E2E — Aset › Halaman Buat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("validasi: form kosong menampilkan kedua pesan tanpa mengirim permintaan", async ({
    page,
  }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.getByRole("button", { name: /simpan aset baru/i }).click();
    await expect(page.getByText("Nama aset wajib diisi")).toBeVisible();
    await expect(page.getByText("Kategori / Tipe aset wajib dipilih")).toBeVisible();
    expect(permintaan.jumlah(), "validasi gagal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("berhasil: nama, tipe, dan status perbaikan terkirim lalu tersimpan di backend", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Buat");
    let tipe: TipeAsetMentah | undefined;
    let id: string | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      await page.goto(URL_BUAT);
      await page.getByPlaceholder(/meja billiard 01/i).fill(nama);
      await page.getByRole("combobox").filter({ hasText: "Pilih kategori tipe aset" }).click();
      await page.getByRole("option", { name: tipe.namaTipeAset }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: /tersedia \(siap|pilih status/i })
        .click();
      await page.getByRole("option", { name: /dalam perbaikan/i }).click();
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan aset baru/i }).click();
      const res = await tKirim;
      const payload = res.request().postDataJSON();
      expect(payload.namaAset).toBe(nama);
      expect(payload.tipeAsetID).toBe(tipe.id);
      expect(payload.status).toBe("perbaikan");
      expect(res.status()).toBeLessThan(300);
      id = (await res.json()).data?.id;
      expect(id, "respons buat harus membawa id").toBeTruthy();
      await page.waitForURL("**/reservasi/aset");
      await expect(baris(page, nama)).toContainText("Perbaikan");
      const tersimpan = await bacaAset(page, auth, id ?? "");
      expect(tersimpan.status).toBe(200);
      expect(tersimpan.data.namaAset).toBe(nama);
      expect(tersimpan.data.status).toBe("perbaikan");
      expect(tersimpan.data.dataAset?.id).toBe(tipe.id);
    } finally {
      await hapusLewatApi(page, auth, "/aset", id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});

test.describe("E2E — Aset › Halaman Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("id yang tidak ada menampilkan Data Tidak Ditemukan, bukan spinner tanpa akhir", async ({
    page,
  }) => {
    const tBaca = page.waitForResponse(cocok("GET", POLA_SATU));
    await page.goto(urlEdit(ID_TIDAK_ADA));
    expect((await tBaca).status()).toBe(404);
    await expect(page.getByText("Data Tidak Ditemukan")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Memuat data aset...")).toHaveCount(0);
  });

  test("form terisi nama, tipe, dan status dari data backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Isi Form");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await page.goto(urlEdit(aset.id));
      await expect(page.getByPlaceholder(/meja billiard 01/i)).toHaveValue(nama, { timeout: 10_000 });
      await expect(page.getByRole("combobox").filter({ hasText: tipe.namaTipeAset })).toBeVisible();
      await expect(
        page.getByRole("combobox").filter({ hasText: /tersedia \(siap\s+disewa\)/i }),
      ).toBeVisible();
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("berhasil: nama baru tersimpan di backend dan kembali ke daftar", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Ubah");
    const namaBaru = namaAsetUji("Diubah");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await page.goto(urlEdit(aset.id));
      const input = page.getByPlaceholder(/meja billiard 01/i);
      await expect(input).toHaveValue(nama, { timeout: 10_000 });
      await input.fill(namaBaru);
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      expect(res.request().postDataJSON().namaAset).toBe(namaBaru);
      await page.waitForURL("**/reservasi/aset");
      await expect(baris(page, namaBaru)).toBeVisible();
      const tersimpan = await bacaAset(page, auth, aset.id);
      expect(tersimpan.data.namaAset).toBe(namaBaru);
      expect(tersimpan.data.dataAset?.id).toBe(tipe.id);
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});
test.describe("E2E — Aset › Daftar: keadaan, navigasi, dan hapus", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("menampilkan spinner selama daftar dimuat, lalu data dari backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Muat");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await tahanLaluTeruskan(page, "GET", POLA_DAFTAR);
      await page.goto(URL_DAFTAR);
      await expect(page.getByText("Memuat data...")).toBeVisible();
      await expect(baris(page, nama)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("Memuat data...")).toHaveCount(0);
      await page.unroute(POLA_DAFTAR);
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("menampilkan pesan galat saat daftar gagal dimuat", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_DAFTAR);
    await expect(page.getByText("Gagal memuat data aset.")).toBeVisible({ timeout: 20_000 });
    await page.unroute(POLA_DAFTAR);
  });

  test("pencarian tidak peka huruf dan menampilkan keadaan tanpa hasil", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Huruf");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      const cari = page.getByPlaceholder(/cari nama aset/i);
      await test.step("huruf besar", async () => {
        await cari.fill(nama.toUpperCase());
        await expect(baris(page, nama)).toBeVisible();
        await expect(page.getByText("Total: 1 Aset")).toBeVisible();
      });
      await test.step("tanpa hasil", async () => {
        await cari.fill("tidak-ada-" + unik());
        await expect(page.getByText("Tidak ada aset yang cocok dengan pencarian.")).toBeVisible();
        await expect(page.getByText("Total: 0 Aset")).toBeVisible();
      });
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("tombol tambah membuka halaman buat, dan tombol Edit membuka halaman edit aset itu", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Navigasi");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      await page.getByRole("button", { name: /tambah/i }).click();
      await page.waitForURL("**/aset/buatAset");
      await bukaDaftar(page);
      await baris(page, nama).getByRole("button", { name: /edit/i }).click();
      await page.waitForURL(urlEdit(aset.id));
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("hapus: Batal menutup dialog tanpa mengirim DELETE", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Batal Hapus");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      const permintaan = pantauPermintaan(page, "DELETE", POLA_SATU);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText("Hapus Data Aset?");
      await dialog.getByRole("button", { name: "Batal", exact: true }).click();
      await expect(dialog).toBeHidden();
      expect(permintaan.jumlah(), "Batal tidak mengirim DELETE").toBe(0);
      permintaan.lepas();
      expect((await bacaAset(page, auth, aset.id)).status).toBe(200);
      await expect(baris(page, nama)).toBeVisible();
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("hapus gagal: dialog tetap terbuka, pesan tampil, dan data tetap ada", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Hapus Gagal");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      await page.route(POLA_SATU, (route) =>
        route.request().method() === "DELETE" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("button", { name: /ya, hapus aset/i }).click();
      await expect(page.getByText("Gagal", { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      await page.unroute(POLA_SATU);
      expect((await bacaAset(page, auth, aset.id)).status).toBe(200);
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("setelah tipe asetnya dihapus, daftar yang dimuat ulang menampilkan Tipe Tidak Diketahui", async ({
    page,
  }) => {
    // Daftar aset di-cache 60 detik dan hapus tipe aset tidak membersihkannya,
    // sehingga aset tetap menampilkan tipe yang sudah terhapus. Badan test ini
    // membuktikan perilaku benar dan berjalan kembali setelah backend diperbaiki.
    test.fixme(true, "Menunggu backend membersihkan cache daftar aset saat tipe aset dihapus");
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Cache");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await bukaDaftar(page);
      await expect(baris(page, nama)).toContainText(tipe.namaTipeAset);
      const hapusTipe = await api(page, auth, "DELETE", "/tipeaset/" + tipe.id);
      expect(hapusTipe.status, "hapus tipe aset uji: " + hapusTipe.pesan).toBeLessThan(300);
      tipe = undefined;
      const data = await bukaDaftar(page);
      expect(
        data.find((x) => x.id === aset?.id)?.dataAset ?? null,
        "daftar aset harus dibaca ulang setelah tipe asetnya dihapus",
      ).toBeNull();
      await expect(baris(page, nama)).toContainText("Tipe Tidak Diketahui");
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});

test.describe("E2E — Aset › Buat: navigasi, memuat, dan gagal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tombol Kembali ke Daftar Aset dan Batal kembali ke daftar tanpa menyimpan", async ({
    page,
  }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.getByRole("button", { name: /kembali ke daftar aset/i }).click();
    await page.waitForURL("**/reservasi/aset");
    await page.goto(URL_BUAT);
    await page.getByRole("button", { name: "Batal", exact: true }).click();
    await page.waitForURL("**/reservasi/aset");
    expect(permintaan.jumlah(), "kembali dan Batal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("tombol menunggu selama menyimpan, lalu aset tersimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Buat Muat");
    let tipe: TipeAsetMentah | undefined;
    let id: string | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      await page.goto(URL_BUAT);
      await page.getByPlaceholder(/meja billiard 01/i).fill(nama);
      await page.getByRole("combobox").filter({ hasText: "Pilih kategori tipe aset" }).click();
      await page.getByRole("option", { name: tipe.namaTipeAset }).click();
      await tahanLaluTeruskan(page, "POST", POLA_DAFTAR);
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan aset baru/i }).click();
      const menunggu = page.getByRole("button", { name: /menyimpan data/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      id = (await res.json()).data?.id;
      await page.waitForURL("**/reservasi/aset");
      expect((await bacaAset(page, auth, id ?? "")).status).toBe(200);
      await page.unroute(POLA_DAFTAR);
    } finally {
      await hapusLewatApi(page, auth, "/aset", id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("simpan gagal: pesan tampil, tetap di halaman buat, dan tidak ada aset tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Buat Gagal");
    let tipe: TipeAsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      await page.goto(URL_BUAT);
      await page.getByPlaceholder(/meja billiard 01/i).fill(nama);
      await page.getByRole("combobox").filter({ hasText: "Pilih kategori tipe aset" }).click();
      await page.getByRole("option", { name: tipe.namaTipeAset }).click();
      await page.route(POLA_DAFTAR, (route) =>
        route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await page.getByRole("button", { name: /simpan aset baru/i }).click();
      await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
      await expect(page).toHaveURL(/\/buatAset$/);
      await page.unroute(POLA_DAFTAR);
      const daftar = await api<AsetMentah[]>(page, auth, "GET", "/aset");
      expect(daftar.data.filter((x) => x.namaAset === nama)).toHaveLength(0);
    } finally {
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});

test.describe("E2E — Aset › Edit: guard, navigasi, validasi, dan gagal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("id 'undefined' menampilkan halaman ID tidak valid, dan tombol kembali ke daftar", async ({
    page,
  }) => {
    await page.goto(URL_DAFTAR + "/undefined/edit");
    await expect(page.getByText("ID Aset Tidak Valid")).toBeVisible();
    await page.getByRole("button", { name: /kembali/i }).click();
    await page.waitForURL("**/reservasi/aset");
  });

  test("tombol kembali di halaman Data Tidak Ditemukan kembali ke daftar", async ({ page }) => {
    await page.goto(urlEdit(ID_TIDAK_ADA));
    await expect(page.getByText("Data Tidak Ditemukan")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /kembali/i }).click();
    await page.waitForURL("**/reservasi/aset");
  });

  test("tombol kembali dan Batal kembali ke daftar tanpa menyimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Kembali");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(aset.id));
      await expect(page.getByPlaceholder(/meja billiard 01/i)).toHaveValue(nama, { timeout: 10_000 });
      await page.getByRole("button", { name: /kembali/i }).click();
      await page.waitForURL("**/reservasi/aset");
      await page.goto(urlEdit(aset.id));
      await expect(page.getByPlaceholder(/meja billiard 01/i)).toHaveValue(nama, { timeout: 10_000 });
      await page.getByRole("button", { name: "Batal", exact: true }).click();
      await page.waitForURL("**/reservasi/aset");
      expect(permintaan.jumlah(), "kembali dan Batal tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("validasi: nama kosong ditolak tanpa mengirim permintaan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Validasi");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(aset.id));
      const input = page.getByPlaceholder(/meja billiard 01/i);
      await expect(input).toHaveValue(nama, { timeout: 10_000 });
      await input.fill("");
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(page.getByText("Nama aset wajib diisi")).toBeVisible();
      expect(permintaan.jumlah(), "validasi gagal tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("ubah tipe dan status: tombol menunggu selama menyimpan, lalu keduanya tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Ubah Tipe");
    let tipeA: TipeAsetMentah | undefined;
    let tipeB: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipeA = await buatTipeAset(page, auth, namaTipeUji());
      tipeB = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipeA.id });
      await page.goto(urlEdit(aset.id));
      await expect(page.getByPlaceholder(/meja billiard 01/i)).toHaveValue(nama, { timeout: 10_000 });
      await page.getByRole("combobox").filter({ hasText: tipeA.namaTipeAset }).click();
      await page.getByRole("option", { name: tipeB.namaTipeAset }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: /tersedia \(siap/i })
        .click();
      await page.getByRole("option", { name: /dalam perbaikan/i }).click();
      await tahanLaluTeruskan(page, "PUT", POLA_SATU);
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      const menunggu = page.getByRole("button", { name: /menyimpan perubahan/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      const payload = res.request().postDataJSON();
      expect(payload.tipeAsetID).toBe(tipeB.id);
      expect(payload.status).toBe("perbaikan");
      await page.waitForURL("**/reservasi/aset");
      await expect(baris(page, nama)).toContainText(tipeB.namaTipeAset);
      await expect(baris(page, nama)).toContainText("Perbaikan");
      const tersimpan = await bacaAset(page, auth, aset.id);
      expect(tersimpan.data.dataAset?.id).toBe(tipeB.id);
      expect(tersimpan.data.status).toBe("perbaikan");
      await page.unroute(POLA_SATU);
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipeA?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipeB?.id);
    }
  });

  test("opsi status Sewa Aktif tidak dapat dipilih", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Opsi");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await page.goto(urlEdit(aset.id));
      await expect(page.getByPlaceholder(/meja billiard 01/i)).toHaveValue(nama, { timeout: 10_000 });
      await page
        .getByRole("combobox")
        .filter({ hasText: /tersedia \(siap/i })
        .click();
      await expect(page.getByRole("option", { name: /sewa aktif/i })).toBeDisabled();
      await page.keyboard.press("Escape");
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("simpan gagal: pesan tampil, tetap di halaman edit, dan data tidak berubah", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaAsetUji("Ubah Gagal");
    let tipe: TipeAsetMentah | undefined;
    let aset: AsetMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      aset = await buatAset(page, auth, { namaAset: nama, tipeAsetID: tipe.id });
      await page.goto(urlEdit(aset.id));
      const input = page.getByPlaceholder(/meja billiard 01/i);
      await expect(input).toHaveValue(nama, { timeout: 10_000 });
      await input.fill(namaAsetUji("Tidak Tersimpan"));
      await page.route(POLA_SATU, (route) =>
        route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(page.getByText("Gagal Memperbarui")).toBeVisible();
      await expect(page).toHaveURL(/\/edit$/);
      await page.unroute(POLA_SATU);
      expect((await bacaAset(page, auth, aset.id)).data.namaAset).toBe(nama);
    } finally {
      await hapusLewatApi(page, auth, "/aset", aset?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});
