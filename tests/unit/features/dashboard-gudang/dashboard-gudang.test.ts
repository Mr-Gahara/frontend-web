import { describe, expect, it } from "vitest";
import { IZIN } from "@/lib/auth/permissions";
import { panelDashboardGudang, urlBoleh } from "@/features/dashboard-gudang/izin";
import {
  TAUTAN_DASHBOARD_GUDANG,
  hitungAntreanPengajuan,
  jurnalTerbaruGudang,
  stokKritis,
} from "@/features/dashboard-gudang/ringkasan";
import type { Inventory } from "@/types/inventory";
import type { JurnalStok } from "@/types/jurnalStok";
import type { PengajuanStok } from "@/types/pengajuanStok";

function pengajuan(
  nomor: string,
  status: PengajuanStok["status"],
  opsi: { terbalik?: boolean; suratJalan?: boolean } = {},
): PengajuanStok {
  return {
    id: nomor,
    tenantID: null,
    nomorPengajuan: nomor,
    jenisPengajuan: "PERMINTAAN",
    status,
    dariLokasi: { id: "g", nama: "Gudang Utama", tipe: opsi.terbalik ? "Outlet" : "Gudang" },
    keLokasi: { id: "o", nama: "Outlet Kota", tipe: opsi.terbalik ? "Gudang" : "Outlet" },
    dimintaOleh: null,
    disetujuiOleh: null,
    ditolakOleh: null,
    items: [],
    catatan: null,
    catatanPenolakan: null,
    tanggalKebutuhan: null,
    tanggalApprove: null,
    tanggalReject: null,
    transferStokID: opsi.suratJalan ? "SJ-" + nomor : null,
    createdAt: "2026-10-19T00:00:00.000Z",
    updatedAt: "2026-10-19T00:00:00.000Z",
  };
}

function inventori(id: string, nama: string, stok: number, stokMinimum: number, isStokKritis: boolean): Inventory {
  return {
    id,
    tenantID: "t",
    item: { tipeItem: "BAHAN_BAKU", id: "b-" + id, nama, satuan: "gram" },
    lokasi: { id: "g", nama: "Gudang Utama", tipe: "Gudang" },
    stok,
    stokMinimum,
    isStokKritis,
    createdAt: "2026-10-19T00:00:00.000Z",
    updatedAt: "2026-10-19T00:00:00.000Z",
  };
}

function jurnal(id: string, tanggal: string, tipeLokasi: string): JurnalStok {
  return {
    id,
    bahanBakuID: { id: "b", namaBahan: "Susu", satuan: "liter" },
    tanggal,
    tipeKoreksi: "Keluar",
    jumlah: 1,
    alasan: "Transfer Gudang",
    dicatatOleh: null,
    locationID: { id: "l-" + tipeLokasi, nama: tipeLokasi, tipe: tipeLokasi },
    tenantID: "t",
    createdAt: tanggal,
    updatedAt: tanggal,
  };
}

describe("hitungAntreanPengajuan", () => {
  it("sama dengan isi tab gudang: tanpa draf, tanpa arah terbalik, tanpa yang sudah punya surat jalan", () => {
    const hasil = hitungAntreanPengajuan([
      pengajuan("A", "SUBMITTED"),
      pengajuan("B", "SUBMITTED", { terbalik: true }),
      pengajuan("C", "DRAFT"),
      pengajuan("D", "APPROVED"),
      pengajuan("E", "PENDING"),
      pengajuan("F", "APPROVED", { suratJalan: true }),
      pengajuan("G", "COMPLETED"),
    ]);
    expect(hasil).toEqual({ perluTinjauan: 1, perluSuratJalan: 2 });
  });

  it("daftar kosong menghasilkan nol", () => {
    expect(hitungAntreanPengajuan([])).toEqual({ perluTinjauan: 0, perluSuratJalan: 0 });
  });
});

describe("stokKritis", () => {
  it("hanya isStokKritis dari backend, urut dari yang paling mendesak lalu nama", () => {
    const hasil = stokKritis([
      inventori("1", "Gula", 40, 50, true),
      inventori("2", "Kopi", 0, 100, true),
      inventori("3", "Susu", 500, 100, false),
      inventori("4", "Cup", 10, 50, true),
      inventori("5", "Air", 0, 20, true),
    ]);
    expect(hasil.total).toBe(4);
    expect(hasil.baris.map((b) => b.nama)).toEqual(["Air", "Kopi", "Cup", "Gula"]);
    expect(hasil.baris.map((b) => b.isi)).toEqual([0, 0, 0.2, 0.8]);
    expect(hasil.baris.map((b) => b.habis)).toEqual([true, true, false, false]);
  });

  it("batang dibatasi 0 sampai 1, dan baris dibatasi tanpa mengubah total", () => {
    const daftar = Array.from({ length: 7 }, (_, i) => inventori(String(i), "Barang " + i, i, 5, true));
    daftar.push(inventori("x", "Minus", -3, 5, true), inventori("y", "Pas", 5, 5, true));
    const hasil = stokKritis(daftar, 3);
    expect(hasil.total).toBe(9);
    expect(hasil.baris).toHaveLength(3);
    expect(hasil.baris[0]).toMatchObject({ nama: "Barang 0", isi: 0, habis: true });
    expect(hasil.baris.find((b) => b.nama === "Minus")?.isi ?? 0).toBe(0);
    expect(stokKritis(daftar).baris.every((b) => b.isi >= 0 && b.isi <= 1)).toBe(true);
  });

  it("barang yang datanya terhapus tampil sebagai tanda strip", () => {
    const tanpaItem = { ...inventori("z", "", 0, 5, true), item: null };
    expect(stokKritis([tanpaItem]).baris[0]).toMatchObject({ nama: "-", satuan: "" });
  });
});

describe("jurnalTerbaruGudang", () => {
  it("hanya lokasi bertipe Gudang, terbaru dulu, paling banyak lima", () => {
    const daftar = [
      jurnal("o1", "2026-10-19T10:00:00.000Z", "Outlet"),
      ...Array.from({ length: 6 }, (_, i) => jurnal("g" + i, `2026-10-1${i}T08:00:00.000Z`, "Gudang")),
    ];
    const hasil = jurnalTerbaruGudang(daftar);
    expect(hasil.map((j) => j.id)).toEqual(["g5", "g4", "g3", "g2", "g1"]);
  });
});

describe("TAUTAN_DASHBOARD_GUDANG", () => {
  it("menuju tab yang angkanya sama dengan kartu", () => {
    expect(TAUTAN_DASHBOARD_GUDANG.perluTinjauan.url).toBe("/dashboard/gudang/pengajuanStok?tab=perlu-tinjauan");
    expect(TAUTAN_DASHBOARD_GUDANG.perluSuratJalan.url).toBe("/dashboard/gudang/pengajuanStok?tab=perlu-surat-jalan");
    expect(TAUTAN_DASHBOARD_GUDANG.suratJalanDraf.url).toBe("/dashboard/gudang/transferStok?tab=draf");
    expect(TAUTAN_DASHBOARD_GUDANG.sedangDikirim.url).toBe("/dashboard/gudang/pengirimanStok");
  });
});

describe("izin panel dashboard gudang", () => {
  const SEMUA = Object.values(IZIN);

  it("pemegang seluruh izin melihat semua panel dan semua tautan", () => {
    expect(panelDashboardGudang(SEMUA)).toEqual({ pengajuan: true, pengiriman: true, stokKritis: true, jurnal: true });
    for (const t of Object.values(TAUTAN_DASHBOARD_GUDANG)) expect(urlBoleh(t, SEMUA)).toBe(t.url);
  });

  it("panel mengikuti izin endpoint masing-masing", () => {
    expect(panelDashboardGudang([IZIN.dashboardGudang, IZIN.jurnalStok])).toEqual({
      pengajuan: false,
      pengiriman: true,
      stokKritis: false,
      jurnal: true,
    });
    expect(panelDashboardGudang([IZIN.location, IZIN.inventoryGudang]).stokKritis).toBe(true);
    expect(panelDashboardGudang([IZIN.inventory]).stokKritis).toBe(false);
    expect(panelDashboardGudang([])).toEqual({ pengajuan: false, pengiriman: false, stokKritis: false, jurnal: false });
  });

  it("tautan hilang bila gerbang halaman tujuannya tidak terpenuhi", () => {
    expect(urlBoleh(TAUTAN_DASHBOARD_GUDANG.suratJalanDraf, [IZIN.dashboardGudang])).toBeNull();
    expect(urlBoleh(TAUTAN_DASHBOARD_GUDANG.sedangDikirim, [IZIN.transferStok])).toBe("/dashboard/gudang/pengirimanStok");
    expect(urlBoleh(TAUTAN_DASHBOARD_GUDANG.inventaris, [IZIN.location, IZIN.inventoryGudang])).toBeNull();
    expect(
      urlBoleh(TAUTAN_DASHBOARD_GUDANG.inventaris, [IZIN.location, IZIN.inventoryGudang, IZIN.bahan]),
    ).toBe("/dashboard/gudang/inventaris");
  });
});