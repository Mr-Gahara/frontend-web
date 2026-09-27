import { test, expect, type Page } from "@playwright/test";
import { login, bukaDenganAuth, api, BASIS, JAWAB_GAGAL, type Auth } from "../../../helpers/transfer-uji";
import {
  ID_TIDAK_ADA,
  unik,
  cocok,
  pantauPermintaan,
  tahanLaluTeruskan,
  buatTipeAset,
  hapusLewatApi,
  type TipeAsetMentah,
} from "../../../helpers/reservasi-uji";

/*
 * Spec tarif terhadap backend sungguhan (keputusan rancangan butir 21,
 * keputusan R1a). Tarif dan tipe aset uji dibuat lewat API dengan nama unik
 * dan dihapus di finally (tarif dulu, baru tipe aset). Hapus tarif lewat API
 * tidak diperiksa statusnya, karena backend menghapus datanya lalu menjawab
 * 500 (tarifService.delete memakai payload yang tidak terdefinisi).
 */

type TarifMentah = {
  id: string;
  namaTarif: string;
  basisPerhitungan: "per jam" | "per sesi";
  harga: number;
  durasiMinimum: number;
  isActive: boolean;
  hariAktif: number[];
  jamMulai: string;
  jamSelesai: string;
  prioritas: number;
  dataAset: { id: string; namaTipeAset: string }[];
};

type TarifBaru = {
  namaTarif: string;
  basisPerhitungan: "per jam" | "per sesi";
  harga: number;
  durasiMinimum: number;
  isActive?: boolean;
  hariAktif?: number[];
  jamMulai?: string;
  jamSelesai?: string;
  prioritas?: number;
  tipeAsetID?: string[];
};

const URL_DAFTAR = BASIS + "/dashboard/outlet/reservasi/tarif";
const URL_BUAT = URL_DAFTAR + "/buatTarif";
const urlEdit = (id: string) => URL_DAFTAR + "/" + id + "/edit";
const POLA_DAFTAR = /\/api\/tarif(\?|$)/i;
const POLA_SATU = /\/api\/tarif\/[^/?]+(\?|$)/i;
const POLA_NONAKTIF = /non ?aktif|tidak aktif/i;

const namaTarifUji = (label: string) => "E2E Tarif " + label + " " + unik();
const namaTipeUji = () => "E2E Tipe Tarif " + unik();

async function buatTarif(page: Page, auth: Auth, data: TarifBaru) {
  const r = await api<TarifMentah>(page, auth, "POST", "/tarif", data);
  expect(r.status, "buat tarif uji: " + r.pesan).toBeLessThan(300);
  expect(r.data?.id, "respons buat tarif harus membawa id").toBeTruthy();
  return r.data;
}

const bacaTarif = (page: Page, auth: Auth, id: string) =>
  api<TarifMentah>(page, auth, "GET", "/tarif/" + id);

/** Membuka daftar dan mengembalikan isi respons GET daftar halaman itu sendiri. */
async function bukaDaftar(page: Page): Promise<TarifMentah[]> {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
  expect(res.status()).toBe(200);
  return (await res.json()).data as TarifMentah[];
}

const baris = (page: Page, nama: string) => page.getByRole("row").filter({ hasText: nama });

test.describe("E2E — Tarif › Halaman Daftar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("merender pencarian, tombol tambah, dan enam kolom kepala tabel", async ({ page }) => {
    await bukaDaftar(page);
    await expect(page.getByPlaceholder(/cari nama tarif/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /tambah tarif/i })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveCount(6);
  });

  test("menampilkan harga rupiah, basis, durasi, hari, jam, prioritas, dan status dari backend", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const namaA = namaTarifUji("Hari Kerja");
    const namaB = namaTarifUji("Setiap Hari");
    let a: TarifMentah | undefined;
    let b: TarifMentah | undefined;
    try {
      a = await buatTarif(page, auth, {
        namaTarif: namaA,
        basisPerhitungan: "per jam",
        harga: 150000,
        durasiMinimum: 2,
        isActive: true,
        hariAktif: [1, 2, 3, 4, 5],
        jamMulai: "08:00",
        jamSelesai: "17:00",
        prioritas: 3,
      });
      b = await buatTarif(page, auth, {
        namaTarif: namaB,
        basisPerhitungan: "per sesi",
        harga: 250000,
        durasiMinimum: 1,
        isActive: false,
        hariAktif: [0, 1, 2, 3, 4, 5, 6],
        jamMulai: "00:00",
        jamSelesai: "23:59",
        prioritas: 1,
      });
      await bukaDaftar(page);
      const barisA = baris(page, namaA);
      await expect(barisA).toContainText(/Rp\s?150\.000/);
      await expect(barisA).toContainText("per jam");
      await expect(barisA).toContainText("Min. 2 Jam");
      await expect(barisA).toContainText("Sen, Sel, Rab, Kam, Jum");
      await expect(barisA).toContainText("08:00 - 17:00");
      await expect(barisA).toContainText("Prioritas: 3");
      await expect(barisA).not.toContainText(POLA_NONAKTIF);
      const barisB = baris(page, namaB);
      await expect(barisB).toContainText(/Rp\s?250\.000/);
      await expect(barisB).toContainText("per sesi");
      await expect(barisB).toContainText("Min. 1 Sesi");
      await expect(barisB).toContainText("Setiap Hari");
      await expect(barisB).toContainText("00:00 - 23:59");
      await expect(barisB).toContainText(POLA_NONAKTIF);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", a?.id);
      await hapusLewatApi(page, auth, "/tarif", b?.id);
    }
  });

  test("pencarian menyaring di klien tanpa memanggil backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Cari");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await bukaDaftar(page);
      const permintaan = pantauPermintaan(page, "GET", POLA_DAFTAR);
      await page.getByPlaceholder(/cari nama tarif/i).fill(nama);
      await expect(baris(page, nama)).toBeVisible();
      await expect(page.getByRole("button", { name: /^edit$/i })).toHaveCount(1);
      expect(permintaan.jumlah(), "pencarian tidak memanggil backend").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("pencarian tanpa hasil menampilkan keadaan kosong khusus pencarian", async ({ page }) => {
    await bukaDaftar(page);
    await page.getByPlaceholder(/cari nama tarif/i).fill("tidak-ada-" + unik());
    await expect(page.getByText("Tidak ada tarif yang cocok.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^edit$/i })).toHaveCount(0);
  });

  test("hapus: Batal menutup dialog tanpa mengirim DELETE", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Batal Hapus");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await bukaDaftar(page);
      const permintaan = pantauPermintaan(page, "DELETE", POLA_SATU);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText("Hapus Tarif?");
      await dialog.getByRole("button", { name: "Batal", exact: true }).click();
      await expect(dialog).toBeHidden();
      expect(permintaan.jumlah(), "Batal tidak mengirim DELETE").toBe(0);
      permintaan.lepas();
      expect((await bacaTarif(page, auth, t.id)).status).toBe(200);
      await expect(baris(page, nama)).toBeVisible();
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("hapus: tombol menunggu selama permintaan berjalan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Hapus Muat");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await bukaDaftar(page);
      await tahanLaluTeruskan(page, "DELETE", POLA_SATU);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      const tHapus = page.waitForResponse(cocok("DELETE", POLA_SATU));
      await dialog.getByRole("button", { name: /ya, hapus tarif/i }).click();
      const menunggu = dialog.getByRole("button", { name: /menghapus/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      await tHapus;
      await page.unroute(POLA_SATU);
      // Tarif terhapus di backend apa pun status DELETE-nya; status yang benar
      // diuji di skenario "hapus berhasil" (fixme, menunggu backend).
      expect((await bacaTarif(page, auth, t.id)).status).toBe(404);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("hapus berhasil: backend menjawab sukses, toast sukses tampil, dan tarif hilang", async ({
    page,
  }) => {
    // Backend menghapus tarif lalu menjawab 500, karena tarifService.delete
    // memakai payload yang tidak terdefinisi. Badan test ini membuktikan
    // perilaku benar dan berjalan kembali setelah backend diperbaiki.
    test.fixme(true, "Menunggu backend: DELETE /tarif/:id menjawab 500 setelah tarif terhapus");
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Hapus");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await bukaDaftar(page);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      const tHapus = page.waitForResponse(cocok("DELETE", POLA_SATU));
      await dialog.getByRole("button", { name: /ya, hapus tarif/i }).click();
      const res = await tHapus;
      expect(res.status(), "DELETE /tarif/:id harus menjawab sukses").toBeLessThan(300);
      await expect(page.getByText("Tarif Berhasil Dihapus")).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect(baris(page, nama)).toHaveCount(0);
      expect((await bacaTarif(page, auth, t.id)).status).toBe(404);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });
});

test.describe("E2E — Tarif › Halaman Buat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("validasi: jam mulai harus lebih awal dari jam selesai, tanpa mengirim permintaan", async ({
    page,
  }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.locator('input[name="namaTarif"]').fill(namaTarifUji("Jam Terbalik"));
    await page.locator('input[name="harga"]').fill("100000");
    await page.locator('input[name="durasiMinimum"]').fill("1");
    const jam = page.locator('input[placeholder="00"]');
    await jam.nth(0).fill("20");
    await jam.nth(1).fill("00");
    await jam.nth(2).fill("08");
    await jam.nth(3).fill("00");
    await page.getByRole("button", { name: /simpan tarif/i }).click();
    await expect(page.getByText("Jam mulai harus lebih awal dari jam selesai")).toBeVisible();
    expect(permintaan.jumlah(), "validasi gagal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("berhasil: tarif per sesi akhir pekan untuk satu tipe aset terkirim dan tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Akhir Pekan");
    let tipe: TipeAsetMentah | undefined;
    let id: string | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      await page.goto(URL_BUAT);
      await page.locator('input[name="namaTarif"]').fill(nama);
      await page.locator('input[name="prioritas"]').fill("5");
      await page.locator('select[name="basisPerhitungan"]').selectOption("per sesi");
      await page.locator('input[name="harga"]').fill("250000");
      await page.locator('input[name="durasiMinimum"]').fill("2");
      for (const hari of ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]) {
        await page.getByText(hari, { exact: true }).click();
      }
      const jam = page.locator('input[placeholder="00"]');
      await jam.nth(0).fill("20");
      await jam.nth(1).fill("00");
      await jam.nth(2).fill("23");
      await jam.nth(3).fill("59");
      await page.getByText(tipe.namaTipeAset, { exact: true }).click();
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan tarif/i }).click();
      const res = await tKirim;
      const payload = res.request().postDataJSON();
      expect(payload.namaTarif).toBe(nama);
      expect(payload.basisPerhitungan).toBe("per sesi");
      expect(payload.harga).toBe(250000);
      expect(payload.durasiMinimum).toBe(2);
      expect(payload.prioritas).toBe(5);
      expect([...payload.hariAktif].sort()).toEqual([0, 6]);
      expect(payload.jamMulai).toBe("20:00");
      expect(payload.jamSelesai).toBe("23:59");
      expect(payload.tipeAsetID).toEqual([tipe.id]);
      expect(res.status()).toBeLessThan(300);
      id = (await res.json()).data?.id;
      expect(id, "respons buat harus membawa id").toBeTruthy();
      await page.waitForURL("**/reservasi/tarif");
      await expect(baris(page, nama)).toBeVisible();
      const tersimpan = await bacaTarif(page, auth, id ?? "");
      expect(tersimpan.status).toBe(200);
      expect(tersimpan.data.basisPerhitungan).toBe("per sesi");
      expect(tersimpan.data.harga).toBe(250000);
      expect([...tersimpan.data.hariAktif].sort()).toEqual([0, 6]);
      expect(tersimpan.data.jamMulai).toBe("20:00");
      expect(tersimpan.data.jamSelesai).toBe("23:59");
      expect(tersimpan.data.dataAset.map((x) => x.id)).toEqual([tipe.id]);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });
});

test.describe("E2E — Tarif › Halaman Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("id 'undefined' menampilkan halaman ID tidak valid tanpa crash", async ({ page }) => {
    await page.goto(URL_DAFTAR + "/undefined/edit");
    await expect(page.getByText("ID Tarif Tidak Valid")).toBeVisible();
  });

  test("form terisi dari data backend, lalu nama dan harga baru tersimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Ubah");
    const namaBaru = namaTarifUji("Diubah");
    let tipe: TipeAsetMentah | undefined;
    let t: TarifMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 150000,
        durasiMinimum: 2,
        isActive: true,
        hariAktif: [1, 2, 3, 4, 5],
        jamMulai: "08:00",
        jamSelesai: "17:00",
        prioritas: 3,
        tipeAsetID: [tipe.id],
      });
      await page.goto(urlEdit(t.id));
      const inputNama = page.locator('input[name="namaTarif"]');
      await expect(inputNama).toHaveValue(nama, { timeout: 10_000 });
      // Harga di halaman edit dirender lewat Controller tanpa atribut name.
      const inputHarga = page.locator('input[inputmode="numeric"][placeholder="0"]');
      await expect(inputHarga).toHaveValue(/150\.?000/);
      await expect(page.locator('input[name="durasiMinimum"]')).toHaveValue("2");
      await expect(page.locator('input[name="prioritas"]')).toHaveValue("3");
      await expect(page.getByRole("combobox").filter({ hasText: "Per Jam" })).toBeVisible();
      await expect(page.getByRole("checkbox", { name: "Senin" })).toBeChecked();
      await expect(page.getByRole("checkbox", { name: "Minggu" })).not.toBeChecked();
      const jam = page.locator('input[placeholder="00"]');
      await expect(jam.nth(0)).toHaveValue("08");
      await expect(jam.nth(2)).toHaveValue("17");
      await inputNama.fill(namaBaru);
      await inputHarga.fill("175000");
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      const res = await tKirim;
      const payload = res.request().postDataJSON();
      expect(payload.namaTarif).toBe(namaBaru);
      expect(payload.harga).toBe(175000);
      expect(payload.tipeAsetID).toEqual([tipe.id]);
      expect(res.status()).toBeLessThan(300);
      const tersimpan = await bacaTarif(page, auth, t.id);
      expect(tersimpan.data.namaTarif).toBe(namaBaru);
      expect(tersimpan.data.harga).toBe(175000);
      expect(tersimpan.data.dataAset.map((x) => x.id)).toEqual([tipe.id]);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("Batal kembali ke daftar tanpa menyimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Batal");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      await expect(page.locator('input[name="namaTarif"]')).toHaveValue(nama, { timeout: 10_000 });
      await page.getByRole("button", { name: "Batal", exact: true }).click();
      await page.waitForURL("**/reservasi/tarif");
      expect(permintaan.jumlah(), "Batal tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });
});
const URL_TIPE_ASET = BASIS + "/dashboard/outlet/reservasi/tipeAset";
const POLA_DAFTAR_TIPE = /\/api\/tipeaset(\?|$)/i;

test.describe("E2E — Tarif › Daftar: tipe aset, keadaan, navigasi, dan hapus gagal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("kolom tipe aset menampilkan tipe yang terhubung, atau Semua Aset bila tidak ada", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const namaA = namaTarifUji("Bertipe");
    const namaB = namaTarifUji("Tanpa Tipe");
    let tipe: TipeAsetMentah | undefined;
    let a: TarifMentah | undefined;
    let b: TarifMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      a = await buatTarif(page, auth, {
        namaTarif: namaA,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
        tipeAsetID: [tipe.id],
      });
      b = await buatTarif(page, auth, {
        namaTarif: namaB,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      const data = await bukaDaftar(page);
      expect(data.find((x) => x.id === a?.id)?.dataAset.map((x) => x.id)).toEqual([tipe.id]);
      await expect(baris(page, namaA)).toContainText(tipe.namaTipeAset);
      await expect(baris(page, namaA)).not.toContainText("Semua Aset");
      await expect(baris(page, namaB)).toContainText("Semua Aset");
    } finally {
      await hapusLewatApi(page, auth, "/tarif", a?.id);
      await hapusLewatApi(page, auth, "/tarif", b?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("setelah tarif dilepas dari tipe aset, daftar tipe aset menampilkan jumlah tarif terbaru", async ({
    page,
  }) => {
    // tarifService.update memakai $addToSet untuk tipeAsetID, sehingga tipe aset
    // tidak dapat dilepas maupun diganti, dan membersihkan cache tipe aset dengan
    // payload.tenantID yang undefined. Badan test ini membuktikan perilaku benar.
    test.fixme(true, "Menunggu backend: ubah tarif tidak dapat melepas tipe aset");
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Lepas Tipe");
    let tipe: TipeAsetMentah | undefined;
    let t: TarifMentah | undefined;
    try {
      tipe = await buatTipeAset(page, auth, namaTipeUji());
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
        tipeAsetID: [tipe.id],
      });
      await page.goto(URL_TIPE_ASET);
      const barisTipe = page.getByRole("row").filter({ hasText: tipe.namaTipeAset });
      await expect(barisTipe).toContainText("1 Tarif Terhubung", { timeout: 10_000 });
      await page.goto(urlEdit(t.id));
      await expect(page.locator('input[name="namaTarif"]')).toHaveValue(nama, { timeout: 10_000 });
      const pilihanTipe = page.getByRole("checkbox", { name: tipe.namaTipeAset });
      await expect(pilihanTipe).toBeChecked();
      await page.getByText(tipe.namaTipeAset, { exact: true }).click();
      await expect(pilihanTipe).not.toBeChecked();
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      expect(res.request().postDataJSON().tipeAsetID).toEqual([]);
      expect((await bacaTarif(page, auth, t.id)).data.dataAset).toEqual([]);
      await page.goto(URL_TIPE_ASET, { waitUntil: "commit" });
      const resTipe = await page.waitForResponse(cocok("GET", POLA_DAFTAR_TIPE));
      const dataTipe = (await resTipe.json()).data as TipeAsetMentah[];
      expect(
        dataTipe.find((x) => x.id === tipe?.id)?.dataTarif.length,
        "daftar tipe aset harus dibaca ulang setelah tarif diubah",
      ).toBe(0);
      await expect(barisTipe).toContainText("0 Tarif Terhubung");
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
      await hapusLewatApi(page, auth, "/tipeaset", tipe?.id);
    }
  });

  test("menampilkan spinner selama daftar dimuat, lalu data dari backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Muat");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await tahanLaluTeruskan(page, "GET", POLA_DAFTAR);
      await page.goto(URL_DAFTAR);
      await expect(page.getByText("Memuat data tarif...")).toBeVisible();
      await expect(baris(page, nama)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("Memuat data tarif...")).toHaveCount(0);
      await page.unroute(POLA_DAFTAR);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("menampilkan pesan galat saat daftar gagal dimuat", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_DAFTAR);
    await expect(page.getByText("Gagal memuat data tarif. Pastikan server terhubung.")).toBeVisible({
      timeout: 20_000,
    });
    await page.unroute(POLA_DAFTAR);
  });

  test("tombol Tambah Tarif membuka halaman buat, dan tombol Edit membuka halaman edit tarif itu", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Navigasi");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await bukaDaftar(page);
      await page.getByRole("button", { name: /tambah tarif/i }).click();
      await page.waitForURL("**/tarif/buatTarif");
      await bukaDaftar(page);
      await baris(page, nama).getByRole("button", { name: /edit/i }).click();
      await page.waitForURL(urlEdit(t.id));
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("hapus gagal: pesan tampil, dialog tetap terbuka, dan tarif tetap ada", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Hapus Gagal");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await bukaDaftar(page);
      await page.route(POLA_SATU, (route) =>
        route.request().method() === "DELETE" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("button", { name: /ya, hapus tarif/i }).click();
      await expect(page.getByText("Gagal Menghapus")).toBeVisible();
      await expect(dialog, "dialog hapus bertahan saat gagal (keputusan Fase 0)").toBeVisible();
      await page.unroute(POLA_SATU);
      expect((await bacaTarif(page, auth, t.id)).status).toBe(200);
    } finally {
      await page.unroute(POLA_SATU);
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });
});

test.describe("E2E — Tarif › Buat: batal, memuat, gagal, dan validasi", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Batal kembali ke daftar tanpa menyimpan", async ({ page }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.getByRole("button", { name: "Batal", exact: true }).click();
    await page.waitForURL("**/reservasi/tarif");
    expect(permintaan.jumlah(), "Batal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("tombol simpan nonaktif selama menyimpan, lalu tarif tersimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Buat Muat");
    let id: string | undefined;
    try {
      await page.goto(URL_BUAT);
      await page.locator('input[name="namaTarif"]').fill(nama);
      await page.locator('input[name="harga"]').fill("100000");
      await page.locator('input[name="durasiMinimum"]').fill("1");
      await tahanLaluTeruskan(page, "POST", POLA_DAFTAR);
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      const simpan = page.locator('button[type="submit"]');
      await simpan.click();
      await expect(simpan).toBeDisabled();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      id = (await res.json()).data?.id;
      await page.waitForURL("**/reservasi/tarif");
      expect((await bacaTarif(page, auth, id ?? "")).status).toBe(200);
      await page.unroute(POLA_DAFTAR);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", id);
    }
  });

  test("simpan gagal: pesan tampil, tetap di halaman buat, dan tidak ada tarif tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Buat Gagal");
    await page.goto(URL_BUAT);
    await page.locator('input[name="namaTarif"]').fill(nama);
    await page.locator('input[name="harga"]').fill("100000");
    await page.locator('input[name="durasiMinimum"]').fill("1");
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.getByRole("button", { name: /simpan tarif/i }).click();
    await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
    await expect(page).toHaveURL(/\/buatTarif$/);
    await page.unroute(POLA_DAFTAR);
    const daftar = await api<TarifMentah[]>(page, auth, "GET", "/tarif");
    expect(daftar.data.filter((x) => x.namaTarif === nama)).toHaveLength(0);
  });

  test("validasi: nama kosong ditolak tanpa mengirim permintaan", async ({ page }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.locator('input[name="harga"]').fill("100000");
    await page.locator('input[name="durasiMinimum"]').fill("1");
    await page.getByRole("button", { name: /simpan tarif/i }).click();
    await expect(page.getByText("Nama tarif wajib diisi")).toBeVisible();
    expect(permintaan.jumlah(), "validasi gagal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("validasi: harga kosong ditolak tanpa mengirim permintaan", async ({ page }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.locator('input[name="namaTarif"]').fill(namaTarifUji("Harga Kosong"));
    await page.locator('input[name="durasiMinimum"]').fill("1");
    await expect(page.locator('input[name="harga"]')).toHaveValue("");
    await page.getByRole("button", { name: /simpan tarif/i }).click();
    await expect(page.getByText("Harga wajib diisi")).toBeVisible();
    expect(permintaan.jumlah(), "harga kosong tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("validasi: nama berisi spasi saja ditolak tanpa mengirim permintaan", async ({ page }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.locator('input[name="namaTarif"]').fill("   ");
    await page.locator('input[name="harga"]').fill("100000");
    await page.locator('input[name="durasiMinimum"]').fill("1");
    await page.getByRole("button", { name: /simpan tarif/i }).click();
    await expect(page.getByText("Nama tarif wajib diisi")).toBeVisible();
    expect(permintaan.jumlah(), "nama berisi spasi saja tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("harga 0 yang diketik terkirim sebagai 0 dengan nama terpangkas, lalu tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Harga Nol");
    let id: string | undefined;
    try {
      await page.goto(URL_BUAT);
      await page.locator('input[name="namaTarif"]').fill("  " + nama + "  ");
      await page.locator('input[name="harga"]').fill("0");
      await page.locator('input[name="durasiMinimum"]').fill("1");
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan tarif/i }).click();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      const kiriman = res.request().postDataJSON();
      expect(kiriman.harga, "harga 0 terkirim sebagai angka 0").toBe(0);
      expect(kiriman.namaTarif, "nama terkirim tanpa spasi di tepi").toBe(nama);
      id = (await res.json()).data?.id;
      await page.waitForURL("**/reservasi/tarif");
      const daftar = await api<TarifMentah[]>(page, auth, "GET", "/tarif");
      expect(daftar.data.find((x) => x.namaTarif === nama)?.harga).toBe(0);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", id);
    }
  });
});

test.describe("E2E — Tarif › Edit: guard, navigasi, validasi, basis, dan gagal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tombol kembali di halaman ID tidak valid kembali ke daftar", async ({ page }) => {
    await page.goto(URL_DAFTAR + "/undefined/edit");
    await expect(page.getByText("ID Tarif Tidak Valid")).toBeVisible();
    await page.getByRole("button", { name: /kembali/i }).click();
    await page.waitForURL("**/reservasi/tarif");
  });

  test("id yang tidak ada menampilkan Data Tidak Ditemukan, dan tombol kembali ke daftar", async ({
    page,
  }) => {
    const tBaca = page.waitForResponse(cocok("GET", POLA_SATU));
    await page.goto(urlEdit(ID_TIDAK_ADA));
    expect((await tBaca).status()).toBe(404);
    await expect(page.getByText("Data Tidak Ditemukan")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /kembali/i }).click();
    await page.waitForURL("**/reservasi/tarif");
  });

  test("tombol Kembali ke Daftar Tarif kembali tanpa menyimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Kembali");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      await expect(page.locator('input[name="namaTarif"]')).toHaveValue(nama, { timeout: 10_000 });
      await page.getByRole("button", { name: /kembali ke daftar tarif/i }).click();
      await page.waitForURL("**/reservasi/tarif");
      expect(permintaan.jumlah(), "kembali tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("validasi: nama berisi spasi saja ditolak tanpa mengirim permintaan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Validasi Spasi");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      const input = page.locator('input[name="namaTarif"]');
      await expect(input).toHaveValue(nama, { timeout: 10_000 });
      await input.fill("   ");
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(page.getByText("Nama tarif wajib diisi")).toBeVisible();
      expect(permintaan.jumlah(), "nama berisi spasi saja tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("validasi: nama kosong ditolak tanpa mengirim permintaan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Validasi");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      const input = page.locator('input[name="namaTarif"]');
      await expect(input).toHaveValue(nama, { timeout: 10_000 });
      await input.fill("");
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(page.getByText("Nama tarif wajib diisi")).toBeVisible();
      expect(permintaan.jumlah(), "validasi gagal tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("ubah basis ke per sesi dan nonaktifkan: tombol nonaktif selama menyimpan, lalu tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Ubah Basis");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
        isActive: true,
      });
      await page.goto(urlEdit(t.id));
      await expect(page.locator('input[name="namaTarif"]')).toHaveValue(nama, { timeout: 10_000 });
      await page.getByRole("combobox").filter({ hasText: "Per Jam" }).click();
      await page.getByRole("option", { name: "Per Sesi" }).click();
      await page.getByText("Aktifkan Tarif Ini", { exact: true }).click();
      await tahanLaluTeruskan(page, "PUT", POLA_SATU);
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      const simpan = page.locator('button[type="submit"]');
      await simpan.click();
      await expect(simpan).toBeDisabled();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      const payload = res.request().postDataJSON();
      expect(payload.basisPerhitungan).toBe("per sesi");
      expect(payload.isActive).toBe(false);
      await page.waitForURL("**/reservasi/tarif");
      await expect(baris(page, nama)).toContainText("per sesi");
      await expect(baris(page, nama)).toContainText(POLA_NONAKTIF);
      const tersimpan = await bacaTarif(page, auth, t.id);
      expect(tersimpan.data.basisPerhitungan).toBe("per sesi");
      expect(tersimpan.data.isActive).toBe(false);
      await page.unroute(POLA_SATU);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });

  test("simpan gagal: pesan tampil, tetap di halaman edit, dan data tidak berubah", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaTarifUji("Ubah Gagal");
    let t: TarifMentah | undefined;
    try {
      t = await buatTarif(page, auth, {
        namaTarif: nama,
        basisPerhitungan: "per jam",
        harga: 100000,
        durasiMinimum: 1,
      });
      await page.goto(urlEdit(t.id));
      const input = page.locator('input[name="namaTarif"]');
      await expect(input).toHaveValue(nama, { timeout: 10_000 });
      await input.fill(namaTarifUji("Tidak Tersimpan"));
      await page.route(POLA_SATU, (route) =>
        route.request().method() === "PUT" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(page.getByText("Gagal Memperbarui")).toBeVisible();
      await expect(page).toHaveURL(/\/edit$/);
      await page.unroute(POLA_SATU);
      expect((await bacaTarif(page, auth, t.id)).data.namaTarif).toBe(nama);
    } finally {
      await hapusLewatApi(page, auth, "/tarif", t?.id);
    }
  });
});
