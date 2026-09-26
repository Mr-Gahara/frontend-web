import { test, expect, type Page, type Request, type Response } from "@playwright/test";
import { login, bukaDenganAuth, api, BASIS, JAWAB_GAGAL, type Auth } from "../../../helpers/transfer-uji";

/*
 * Spec tipe aset terhadap backend sungguhan (keputusan rancangan butir 21,
 * keputusan R1a). Data uji dibuat lewat API dengan nama unik per run dan
 * dihapus lewat API di finally. page.route hanya dipakai untuk menahan
 * permintaan lalu meneruskannya, atau menjawab gagal untuk satu method dan
 * path. Satu-satunya simulasi (daftar kosong) ditandai "// simulasi:".
 */

type TipeAsetMentah = {
  id: string;
  namaTipeAset: string;
  deskripsi: string | null;
  dataTarif: { id: string }[];
};

const URL_DAFTAR = BASIS + "/dashboard/outlet/reservasi/tipeAset";
const URL_BUAT = URL_DAFTAR + "/buatTipeAset";
const urlEdit = (id: string) => URL_DAFTAR + "/" + id + "/edit";
const POLA_DAFTAR = /\/api\/tipeaset(\?|$)/i;
const POLA_SATU = /\/api\/tipeaset\/[^/?]+(\?|$)/i;
const ID_TIDAK_ADA = "000000000000000000000000";

let urut = 0;
const unik = () => Date.now().toString(36) + (urut++).toString(36);
const namaUji = (label: string) => "E2E Tipe " + label + " " + unik();
const tunda = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cocok(method: string, pola: RegExp) {
  return (r: Response) => r.request().method() === method && pola.test(r.url());
}

async function buatTipe(page: Page, auth: Auth, nama: string, deskripsi?: string) {
  const r = await api<TipeAsetMentah>(
    page,
    auth,
    "POST",
    "/tipeaset",
    deskripsi ? { namaTipeAset: nama, deskripsi } : { namaTipeAset: nama },
  );
  expect(r.status, "buat tipe aset uji: " + r.pesan).toBeLessThan(300);
  expect(r.data?.id, "respons buat tipe aset harus membawa id").toBeTruthy();
  return r.data;
}

async function hapusTipe(page: Page, auth: Auth, id: string | undefined) {
  if (id) await api(page, auth, "DELETE", "/tipeaset/" + id);
}

const bacaTipe = (page: Page, auth: Auth, id: string) =>
  api<TipeAsetMentah>(page, auth, "GET", "/tipeaset/" + id);

/** Membuka daftar dan mengembalikan isi respons GET daftar halaman itu sendiri. */
async function bukaDaftar(page: Page): Promise<TipeAsetMentah[]> {
  await page.goto(URL_DAFTAR, { waitUntil: "commit" });
  const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
  expect(res.status()).toBe(200);
  return (await res.json()).data as TipeAsetMentah[];
}

const baris = (page: Page, nama: string) => page.getByRole("row").filter({ hasText: nama });

function pantauPermintaan(page: Page, method: string, pola: RegExp) {
  const tercatat: Request[] = [];
  const catat = (r: Request) => {
    if (r.method() === method && pola.test(r.url())) tercatat.push(r);
  };
  page.on("request", catat);
  return { jumlah: () => tercatat.length, lepas: () => page.off("request", catat) };
}

/** Menahan permintaan method itu sebentar lalu meneruskannya ke backend sungguhan. */
async function tahanLaluTeruskan(page: Page, method: string, pola: RegExp, ms = 1_500) {
  await page.route(pola, async (route) => {
    if (route.request().method() === method) await tunda(ms);
    await route.continue();
  });
}

test.describe("E2E — Tipe Aset › Halaman Daftar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("merender judul, pencarian, total sesuai respons, dan tombol tambah", async ({ page }) => {
    const data = await bukaDaftar(page);
    await expect(page.getByRole("heading", { name: "Kategori Aset", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder(/cari kategori/i)).toBeVisible();
    await expect(page.getByText("Total: " + data.length + " Tipe")).toBeVisible();
    await expect(page.getByRole("button", { name: /tambah kategori/i })).toBeVisible();
  });

  test("menampilkan spinner selama daftar dimuat, lalu data dari backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Muat");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await tahanLaluTeruskan(page, "GET", POLA_DAFTAR);
      await page.goto(URL_DAFTAR);
      await expect(page.getByText("Memuat data...")).toBeVisible();
      await expect(baris(page, nama)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("Memuat data...")).toHaveCount(0);
      await page.unroute(POLA_DAFTAR);
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("menampilkan pesan galat saat daftar gagal dimuat", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    await page.goto(URL_DAFTAR);
    await expect(page.getByText("Gagal memuat data tipe aset.")).toBeVisible({ timeout: 20_000 });
    await page.unroute(POLA_DAFTAR);
  });

  test("menampilkan total 0 tanpa baris saat tenant belum punya tipe aset", async ({ page }) => {
    await page.route(POLA_DAFTAR, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const asli = await route.fetch();
      const body = await asli.json();
      // simulasi: tenant tanpa tipe aset hanya ada bila seluruh tipe aset tenant uji dihapus
      await route.fulfill({ status: asli.status(), json: { ...body, data: [] } });
    });
    const tDaftar = page.waitForResponse(cocok("GET", POLA_DAFTAR));
    await page.goto(URL_DAFTAR);
    await tDaftar;
    await expect(page.getByText("Memuat data...")).toHaveCount(0);
    await expect(page.getByText("Total: 0 Tipe")).toBeVisible();
    await expect(page.getByRole("button", { name: /^edit$/i })).toHaveCount(0);
    await expect(page.getByText("Tidak ada tipe aset yang cocok dengan pencarian.")).toHaveCount(0);
    await page.unroute(POLA_DAFTAR);
  });

  test("menampilkan nama, deskripsi atau penggantinya, dan jumlah tarif dari backend", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const namaA = namaUji("Deskripsi");
    const namaB = namaUji("Kosong");
    const deskripsi = "Deskripsi uji " + unik();
    let a: TipeAsetMentah | undefined;
    let b: TipeAsetMentah | undefined;
    try {
      a = await buatTipe(page, auth, namaA, deskripsi);
      b = await buatTipe(page, auth, namaB);
      const data = await bukaDaftar(page);
      const mentahA = data.find((x) => x.id === a?.id);
      expect(mentahA, "tipe aset uji harus ada di respons daftar").toBeTruthy();
      await expect(page.getByText("Total: " + data.length + " Tipe")).toBeVisible();
      await expect(baris(page, namaA)).toContainText(deskripsi);
      await expect(baris(page, namaA)).toContainText(
        (mentahA?.dataTarif.length ?? -1) + " Tarif Terhubung",
      );
      await expect(baris(page, namaB)).toContainText("Tidak ada deskripsi");
    } finally {
      await hapusTipe(page, auth, a?.id);
      await hapusTipe(page, auth, b?.id);
    }
  });

  test("pencarian menyaring di klien tanpa peka huruf dan menampilkan keadaan tanpa hasil", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Cari");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await bukaDaftar(page);
      const cari = page.getByPlaceholder(/cari kategori/i);
      const permintaan = pantauPermintaan(page, "GET", POLA_DAFTAR);
      await test.step("nama persis", async () => {
        await cari.fill(nama);
        await expect(baris(page, nama)).toBeVisible();
        await expect(page.getByText("Total: 1 Tipe")).toBeVisible();
      });
      await test.step("huruf besar", async () => {
        await cari.fill(nama.toUpperCase());
        await expect(baris(page, nama)).toBeVisible();
        await expect(page.getByText("Total: 1 Tipe")).toBeVisible();
      });
      await test.step("tanpa hasil", async () => {
        await cari.fill("tidak-ada-" + unik());
        await expect(page.getByText("Tidak ada tipe aset yang cocok dengan pencarian.")).toBeVisible();
        await expect(page.getByText("Total: 0 Tipe")).toBeVisible();
      });
      expect(permintaan.jumlah(), "pencarian tidak memanggil backend").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("tombol Tambah Kategori membuka halaman buat", async ({ page }) => {
    await bukaDaftar(page);
    await page.getByRole("button", { name: /tambah kategori/i }).click();
    await page.waitForURL("**/tipeAset/buatTipeAset");
  });

  test("tombol Edit membuka halaman edit dengan id dari backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Navigasi");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await bukaDaftar(page);
      await baris(page, nama).getByRole("button", { name: /edit/i }).click();
      await page.waitForURL(urlEdit(t.id));
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("hapus: dialog menyebut nama, dan Batal menutupnya tanpa menghapus", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Batal Hapus");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await bukaDaftar(page);
      const permintaan = pantauPermintaan(page, "DELETE", POLA_SATU);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText("Hapus Tipe Aset?");
      await expect(dialog).toContainText(nama);
      await dialog.getByRole("button", { name: "Batal", exact: true }).click();
      await expect(dialog).toBeHidden();
      expect(permintaan.jumlah(), "Batal tidak mengirim DELETE").toBe(0);
      permintaan.lepas();
      expect((await bacaTipe(page, auth, t.id)).status).toBe(200);
      await expect(baris(page, nama)).toBeVisible();
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("hapus: tombol menunggu selama permintaan berjalan, lalu data terhapus di backend", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Hapus");
    let t: TipeAsetMentah | undefined;
    let terhapus = false;
    try {
      t = await buatTipe(page, auth, nama);
      await bukaDaftar(page);
      await tahanLaluTeruskan(page, "DELETE", POLA_SATU);
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      const tHapus = page.waitForResponse(cocok("DELETE", POLA_SATU));
      await dialog.getByRole("button", { name: /ya, hapus tipe/i }).click();
      const menunggu = dialog.getByRole("button", { name: /menghapus/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      expect((await tHapus).status()).toBeLessThan(300);
      terhapus = true;
      await expect(dialog).toBeHidden();
      await expect(baris(page, nama)).toHaveCount(0);
      expect((await bacaTipe(page, auth, t.id)).status).toBe(404);
      await page.unroute(POLA_SATU);
    } finally {
      if (!terhapus) await hapusTipe(page, auth, t?.id);
    }
  });

  test("hapus gagal: dialog tetap terbuka, pesan tampil, dan data tetap ada", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Hapus Gagal");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await bukaDaftar(page);
      await page.route(POLA_SATU, (route) =>
        route.request().method() === "DELETE" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
      );
      await baris(page, nama).getByRole("button").last().click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("button", { name: /ya, hapus tipe/i }).click();
      await expect(page.getByText("Gagal", { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      await page.unroute(POLA_SATU);
      expect((await bacaTipe(page, auth, t.id)).status).toBe(200);
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });
});

test.describe("E2E — Tipe Aset › Halaman Buat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("merender form beserta tombolnya", async ({ page }) => {
    await page.goto(URL_BUAT);
    await expect(page.getByRole("heading", { name: /tambah kategori aset baru/i })).toBeVisible();
    await expect(page.getByPlaceholder(/meja billiard vip/i)).toBeVisible();
    await expect(page.getByPlaceholder(/catatan atau keterangan/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /simpan kategori aset/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Batal", exact: true })).toBeVisible();
  });

  test("tombol kembali dan Batal kembali ke daftar tanpa menyimpan", async ({ page }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    await page.getByRole("button", { name: /kembali ke daftar kategori aset/i }).click();
    await page.waitForURL("**/reservasi/tipeAset");
    await page.goto(URL_BUAT);
    await page.getByRole("button", { name: "Batal", exact: true }).click();
    await page.waitForURL("**/reservasi/tipeAset");
    expect(permintaan.jumlah(), "kembali dan Batal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("validasi: nama kosong dan satu karakter ditolak tanpa mengirim permintaan", async ({
    page,
  }) => {
    const permintaan = pantauPermintaan(page, "POST", POLA_DAFTAR);
    await page.goto(URL_BUAT);
    const simpan = page.getByRole("button", { name: /simpan kategori aset/i });
    await simpan.click();
    await expect(page.getByText("Nama Kategori Aset wajib diisi")).toBeVisible();
    await page.getByPlaceholder(/meja billiard vip/i).fill("A");
    await simpan.click();
    await expect(page.getByText("Nama Kategori Aset minimal 2 karakter")).toBeVisible();
    expect(permintaan.jumlah(), "validasi gagal tidak mengirim POST").toBe(0);
    permintaan.lepas();
  });

  test("berhasil tanpa deskripsi: nama dipangkas, deskripsi tidak dikirim, dan data tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_BUAT);
    const nama = namaUji("Buat");
    let id: string | undefined;
    try {
      await page.getByPlaceholder(/meja billiard vip/i).fill("  " + nama + "  ");
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan kategori aset/i }).click();
      const res = await tKirim;
      const payload = res.request().postDataJSON();
      expect(payload.namaTipeAset).toBe(nama);
      expect(payload).not.toHaveProperty("deskripsi");
      expect(res.status()).toBeLessThan(300);
      id = (await res.json()).data?.id;
      expect(id, "respons buat harus membawa id").toBeTruthy();
      await page.waitForURL("**/reservasi/tipeAset");
      await expect(baris(page, nama)).toBeVisible();
      const tersimpan = await bacaTipe(page, auth, id ?? "");
      expect(tersimpan.status).toBe(200);
      expect(tersimpan.data.namaTipeAset).toBe(nama);
      expect(tersimpan.data.deskripsi).toBeNull();
    } finally {
      await hapusTipe(page, auth, id);
    }
  });

  test("berhasil dengan deskripsi: tombol menunggu selama menyimpan, lalu deskripsi tersimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_BUAT);
    const nama = namaUji("Buat Deskripsi");
    const deskripsi = "Deskripsi uji " + unik();
    let id: string | undefined;
    try {
      await tahanLaluTeruskan(page, "POST", POLA_DAFTAR);
      await page.getByPlaceholder(/meja billiard vip/i).fill(nama);
      await page.getByPlaceholder(/catatan atau keterangan/i).fill(deskripsi);
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan kategori aset/i }).click();
      const menunggu = page.getByRole("button", { name: /menyimpan data/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      id = (await res.json()).data?.id;
      await page.waitForURL("**/reservasi/tipeAset");
      const tersimpan = await bacaTipe(page, auth, id ?? "");
      expect(tersimpan.status).toBe(200);
      expect(tersimpan.data.deskripsi).toBe(deskripsi);
      await page.unroute(POLA_DAFTAR);
    } finally {
      await hapusTipe(page, auth, id);
    }
  });

  test("gagal dari backend: pesan backend tampil, tetap di halaman buat, dan tidak ada data ganda", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_BUAT);
    const nama = namaUji("Duplikat");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await page.getByPlaceholder(/meja billiard vip/i).fill(nama);
      const tKirim = page.waitForResponse(cocok("POST", POLA_DAFTAR));
      await page.getByRole("button", { name: /simpan kategori aset/i }).click();
      const res = await tKirim;
      const body = await res.json();
      expect(res.status()).toBe(400);
      expect(body.message, "respons gagal harus membawa message").toBeTruthy();
      await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
      await expect(page.getByText(body.message).first()).toBeVisible();
      await expect(page).toHaveURL(/\/buatTipeAset$/);
      const daftar = await api<TipeAsetMentah[]>(page, auth, "GET", "/tipeaset");
      expect(daftar.data.filter((x) => x.namaTipeAset === nama)).toHaveLength(1);
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });
});

test.describe("E2E — Tipe Aset › Halaman Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("id 'undefined' menampilkan halaman ID tidak valid, dan tombol kembali ke daftar", async ({
    page,
  }) => {
    await page.goto(URL_DAFTAR + "/undefined/edit");
    await expect(page.getByText("ID Tipe Aset Tidak Valid")).toBeVisible();
    await page.getByRole("button", { name: /kembali/i }).click();
    await page.waitForURL("**/reservasi/tipeAset");
  });

  test("menampilkan spinner selama data dimuat, lalu form terisi data backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Isi Form");
    const deskripsi = "Deskripsi uji " + unik();
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama, deskripsi);
      await tahanLaluTeruskan(page, "GET", POLA_SATU);
      await page.goto(urlEdit(t.id));
      await expect(page.getByText("Memuat data tipe aset...")).toBeVisible();
      await expect(page.getByPlaceholder(/meja billiard vip/i)).toHaveValue(nama, { timeout: 10_000 });
      await expect(page.getByPlaceholder(/catatan atau keterangan/i)).toHaveValue(deskripsi);
      await page.unroute(POLA_SATU);
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("id yang tidak ada menampilkan Data Tidak Ditemukan, dan tombol kembali ke daftar", async ({
    page,
  }) => {
    const tBaca = page.waitForResponse(cocok("GET", POLA_SATU));
    await page.goto(urlEdit(ID_TIDAK_ADA));
    expect((await tBaca).status()).toBe(404);
    await expect(page.getByText("Data Tidak Ditemukan")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /kembali/i }).click();
    await page.waitForURL("**/reservasi/tipeAset");
  });

  test("tombol Kembali ke Daftar Tipe Aset dan Batal kembali ke daftar tanpa menyimpan", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Kembali");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      await expect(page.getByPlaceholder(/meja billiard vip/i)).toHaveValue(nama);
      await page.getByRole("button", { name: /kembali ke daftar tipe aset/i }).click();
      await page.waitForURL("**/reservasi/tipeAset");
      await page.goto(urlEdit(t.id));
      await expect(page.getByPlaceholder(/meja billiard vip/i)).toHaveValue(nama);
      await page.getByRole("button", { name: "Batal", exact: true }).click();
      await page.waitForURL("**/reservasi/tipeAset");
      expect(permintaan.jumlah(), "kembali dan Batal tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("validasi: nama kosong ditolak tanpa mengirim permintaan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Validasi");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      const permintaan = pantauPermintaan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      const input = page.getByPlaceholder(/meja billiard vip/i);
      await expect(input).toHaveValue(nama);
      await input.fill("");
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      await expect(page.getByText("Nama Tipe Aset wajib diisi")).toBeVisible();
      expect(permintaan.jumlah(), "validasi gagal tidak mengirim PUT").toBe(0);
      permintaan.lepas();
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("berhasil: tombol menunggu selama menyimpan, lalu nama baru tersimpan dan kembali ke daftar", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Ubah");
    const namaBaru = namaUji("Diubah");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama);
      await tahanLaluTeruskan(page, "PUT", POLA_SATU);
      await page.goto(urlEdit(t.id));
      const input = page.getByPlaceholder(/meja billiard vip/i);
      await expect(input).toHaveValue(nama);
      await input.fill(namaBaru);
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      const menunggu = page.getByRole("button", { name: /menyimpan perubahan/i });
      await expect(menunggu).toBeVisible();
      await expect(menunggu).toBeDisabled();
      const res = await tKirim;
      expect(res.status()).toBeLessThan(300);
      expect(res.request().postDataJSON().namaTipeAset).toBe(namaBaru);
      await page.waitForURL("**/reservasi/tipeAset");
      await expect(baris(page, namaBaru)).toBeVisible();
      const tersimpan = await bacaTipe(page, auth, t.id);
      expect(tersimpan.data.namaTipeAset).toBe(namaBaru);
      await page.unroute(POLA_SATU);
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("mengosongkan deskripsi menghapus deskripsi di backend", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const nama = namaUji("Kosongkan");
    let t: TipeAsetMentah | undefined;
    try {
      t = await buatTipe(page, auth, nama, "Deskripsi uji " + unik());
      await page.goto(urlEdit(t.id));
      const deskripsi = page.getByPlaceholder(/catatan atau keterangan/i);
      await expect(deskripsi).not.toHaveValue("");
      await deskripsi.fill("");
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      expect((await tKirim).status()).toBeLessThan(300);
      await page.waitForURL("**/reservasi/tipeAset");
      const tersimpan = await bacaTipe(page, auth, t.id);
      expect(tersimpan.data.deskripsi, "deskripsi yang dikosongkan harus terhapus").toBeNull();
    } finally {
      await hapusTipe(page, auth, t?.id);
    }
  });

  test("gagal dari backend: pesan backend tampil, tetap di halaman edit, dan data tidak berubah", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, URL_DAFTAR);
    const namaA = namaUji("Asal");
    const namaB = namaUji("Pemilik");
    let a: TipeAsetMentah | undefined;
    let b: TipeAsetMentah | undefined;
    try {
      a = await buatTipe(page, auth, namaA);
      b = await buatTipe(page, auth, namaB);
      await page.goto(urlEdit(a.id));
      const input = page.getByPlaceholder(/meja billiard vip/i);
      await expect(input).toHaveValue(namaA);
      await input.fill(namaB);
      const tKirim = page.waitForResponse(cocok("PUT", POLA_SATU));
      await page.getByRole("button", { name: /simpan perubahan/i }).click();
      const res = await tKirim;
      const body = await res.json();
      expect(res.status()).toBe(400);
      expect(body.message, "respons gagal harus membawa message").toBeTruthy();
      await expect(page.getByText("Gagal Memperbarui")).toBeVisible();
      await expect(page.getByText(body.message).first()).toBeVisible();
      await expect(page).toHaveURL(/\/edit$/);
      expect((await bacaTipe(page, auth, a.id)).data.namaTipeAset).toBe(namaA);
    } finally {
      await hapusTipe(page, auth, a?.id);
      await hapusTipe(page, auth, b?.id);
    }
  });
});