import { expect, test, type Response } from "@playwright/test";
import { IZIN, IZIN_HALAMAN } from "../../../lib/auth/permissions";
import { fiturRute } from "../../../lib/auth/fitur-plan";
import { api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { gantiKePenggunaUji, siapkanPeranDanPengguna, type PeranUji } from "../../helpers/terkunci-uji";

/*
 * Syarat IZIN_HALAMAN dibuktikan dari permintaan nyata halaman (utang
 * pengujian: 44 entri diturunkan dari nama hook dan kontrak, bukan trace).
 * Satu peran uji diberi tepat izin syarat sebuah rute (alternatif pertama
 * untuk syarat berupa pilihan) ditambah izin dashboard ruangnya, yang
 * dituntut layout ruang; lalu rute itu dibuka. Syarat terbukti cukup bila
 * gerbang meloloskannya dan tidak satu pun permintaan API halaman dijawab
 * 403. Izin peran diganti lewat API dengan token Owner yang diambil sebelum
 * berpindah pengguna; backend membersihkan cache izin pengguna saat
 * perannya diubah (roleService), dan setiap goto memutar token lewat
 * pin-refresh.
 */

const PERAN_SYARAT: PeranUji = {
  nama: "E2E Syarat Rute",
  pin: "864253",
  deskripsi: "Peran uji e2e: izinnya diganti per rute untuk membuktikan syarat IZIN_HALAMAN",
  izin: (n) => n === IZIN.dashboardOutlet,
};

/**
 * Rute yang gerbangnya memeriksa lebih dari IZIN_HALAMAN, beserta alasannya:
 * diuji spec halamannya sendiri.
 */
const DIKECUALIKAN: Record<string, string> = {
  // Level Owner diperiksa halaman (bolehKelolaAkunToko, OA7); peran uji level 90.
  "/dashboard/outlet/pengaturan/akun": "level Owner",
};

/**
 * Sumber id nyata per rute ber-[id], dibaca sebagai Owner sebelum berpindah
 * pengguna, agar bagian halaman yang baru dipasang sesudah detail termuat
 * (misalnya form ubah) ikut tertelusuri. Tanpa data, id uji yang tidak ada.
 */
const ID_UJI = "6a0000000000000000000000";
const SUMBER_ID: Record<string, string> = {
  "/dashboard/outlet/penjualan/[id]": "/penjualan?page=1&limit=1",
  "/dashboard/outlet/penjualan/[id]/pembayaran": "/penjualan?page=1&limit=1&statusPenjualan=UNPAID",
  "/dashboard/outlet/keuangan/akunkas/[id]/ubah": "/akunkas",
  "/dashboard/outlet/keuangan/mesinKasir/[id]": "/sesikasir?page=1&limit=1&status=TUTUP",
  "/dashboard/outlet/keuangan/laporanTutupKasir/[id]": "/sesikasir/periode?page=1&limit=1&status=TUTUP",
  "/dashboard/outlet/reservasi/aset/[id]/edit": "/aset",
  "/dashboard/outlet/reservasi/tarif/[id]/edit": "/tarif",
  "/dashboard/outlet/reservasi/tipeAset/[id]/edit": "/tipeaset",
  "/dashboard/outlet/pengaturan/metodePembayaran/[id]": "/metodepembayaran",
  "/dashboard/outlet/pengaturan/roles/[id]/edit": "/role",
  "/dashboard/outlet/inventaris/produk/[id]/edit": "/produk?page=1&limit=1",
  "/dashboard/outlet/inventaris/bahanBaku/[id]/edit": "/bahanbaku",
  "/dashboard/outlet/inventaris/stockOpname/[id]": "/stockopname?page=1&limit=1&tipeLokasi=Outlet",
  "/dashboard/outlet/inventaris/stockAdjustment/[id]": "/stockopname/adjustments?page=1&limit=1&tipeLokasi=Outlet",
  "/dashboard/outlet/inventaris/pengajuanStok/[id]": "/pengajuanstok?page=1&limit=1",
  "/dashboard/outlet/inventaris/pengajuanStok/[id]/edit": "/pengajuanstok?page=1&limit=1&status=DRAFT",
  "/dashboard/outlet/inventaris/penerimaanBarang/[id]": "/transferstok?page=1&limit=1",
  "/dashboard/outlet/inventaris/pengirimanBarang/[id]": "/transferstok?page=1&limit=1",
  "/dashboard/outlet/inventaris/pengirimanBarang/[id]/edit": "/transferstok?page=1&limit=1&status=PENDING",
  "/dashboard/outlet/inventaris/pembelianStok/[id]": "/pembelianstok?page=1&limit=1",
  "/dashboard/gudang/stockOpname/[id]": "/stockopname?page=1&limit=1&tipeLokasi=Gudang",
  "/dashboard/gudang/stockAdjustment/[id]": "/stockopname/adjustments?page=1&limit=1&tipeLokasi=Gudang",
  "/dashboard/gudang/pengajuanStok/[id]": "/pengajuanstok?page=1&limit=1",
  "/dashboard/gudang/transferStok/[id]": "/transferstok?page=1&limit=1",
  "/dashboard/gudang/transferStok/[id]/edit": "/transferstok?page=1&limit=1&status=PENDING",
  "/dashboard/gudang/pembelianStok/[id]": "/pembelianstok?page=1&limit=1",
  "/dashboard/gudang/penerimaanStok/[id]": "/transferstok?page=1&limit=1",
};

const RUTE = Object.keys(IZIN_HALAMAN).filter(
  (r) => r.startsWith("/dashboard/") && IZIN_HALAMAN[r].length > 0 && !(r in DIKECUALIKAN),
);

const BERID_TERDAFTAR = Object.keys(IZIN_HALAMAN).filter((r) => r.includes("[id]") && !(r in DIKECUALIKAN));

/** Izin minimum sebuah rute: setiap syarat, alternatif pertama bila berupa pilihan, ditambah dashboard ruangnya. */
function izinMinimum(rute: string): string[] {
  const syarat = IZIN_HALAMAN[rute].map((s) => (typeof s === "string" ? s : s[0]));
  const ruang = rute.startsWith("/dashboard/gudang") ? IZIN.dashboardGudang : IZIN.dashboardOutlet;
  return [...new Set([...syarat, ruang])];
}

type PeranMentah = { _id?: string; id?: string; namaRole?: string; permissions?: { _id?: string; id?: string; nama?: string }[] };
const idDari = (x: { _id?: string; id?: string }) => x._id ?? x.id ?? "";

test("setiap rute statis dan ber-[id] terbuka tanpa 403 bagi pemegang tepat izin syaratnya", async ({ page }) => {
  test.setTimeout(900_000);
  await login(page);
  const idPeran = await siapkanPeranDanPengguna(page, PERAN_SYARAT);
  // Token Owner dibekukan tepat sebelum berpindah pengguna (berlaku 1 jam);
  // pin-refresh Owner berikutnya akan membuatnya tidak sah, dan penunggu
  // bukaDenganAuth kelak menangkap token pengguna uji.
  const tokenOwner = (await bukaDenganAuth(page, "/dashboard"))();
  const owner = () => tokenOwner;
  const peran = await api<PeranMentah[]>(page, owner, "GET", "/role");
  expect(peran.status, "baca role sebagai Owner: " + peran.pesan).toBe(200);
  const roleOwner = (peran.data ?? []).find((r) => /^owner$/i.test(r.namaRole ?? ""));
  const idIzin = new Map((roleOwner?.permissions ?? []).map((p) => [p.nama ?? "", idDari(p)]));

  const idNyata = new Map<string, string>();
  for (const [pola, sumber] of Object.entries(SUMBER_ID)) {
    const r = await api<{ _id?: string; id?: string; namaRole?: string }[]>(page, owner, "GET", sumber);
    const pertama = (r.data ?? []).find((x) => !/^owner$/i.test(x.namaRole ?? ""));
    if (r.status === 200 && pertama) idNyata.set(pola, idDari(pertama));
  }
  const tanpaData = BERID_TERDAFTAR.filter((p) => !idNyata.has(p));
  test.info().annotations.push({ type: "id uji", description: tanpaData.join(", ") || "-" });

  await gantiKePenggunaUji(page, PERAN_SYARAT);
  const cek = await api(page, owner, "GET", "/role");
  expect(cek.status, "token Owner tetap sah sesudah berpindah pengguna: " + cek.pesan).toBe(200);

  const salah: string[] = [];
  test.info().annotations.push({ type: "rute", description: String(RUTE.length) });
  for (const rute of RUTE) {
    const izin = izinMinimum(rute);
    const tanpaId = izin.filter((n) => !idIzin.has(n));
    if (tanpaId.length) {
      salah.push(`${rute}: izin tidak ada di seed (${tanpaId.join(", ")})`);
      continue;
    }
    const ubah = await api(page, owner, "PUT", "/role/" + idPeran, { permissions: izin.map((n) => idIzin.get(n)) });
    expect(ubah.status, `izin peran untuk ${rute}: ${ubah.pesan}`).toBe(200);

    const ditolak403: string[] = [];
    const catat = (r: Response) => {
      if (r.status() === 403 && r.url().includes("/api/")) ditolak403.push(new URL(r.url()).pathname.replace("/api", ""));
    };
    // Pencatat dipasang sesudah dokumen baru ter-commit, agar respons susulan
    // halaman sebelumnya tidak terhitung milik rute ini.
    const alamat = rute.replace("[id]", idNyata.get(rute) ?? ID_UJI);
    await page.goto(alamat, { waitUntil: "commit" });
    page.on("response", catat);
    await page.waitForLoadState("networkidle");
    page.off("response", catat);

    if ((await page.getByRole("heading", { name: "Akses ditolak" }).count()) > 0) salah.push(`${rute}: ditolak gerbang`);
    if (new URL(page.url()).pathname !== alamat) salah.push(`${rute}: dialihkan ke ${new URL(page.url()).pathname}`);
    if (ditolak403.length) salah.push(`${rute}: 403 ${[...new Set(ditolak403)].join(", ")} [izin: ${izin.join(", ")}]`);
    if (fiturRute(rute) && salah.at(-1)?.startsWith(rute)) salah[salah.length - 1] += ` (fitur ${fiturRute(rute)})`;
  }
  expect(salah, `${RUTE.length} rute`).toEqual([]);
});
