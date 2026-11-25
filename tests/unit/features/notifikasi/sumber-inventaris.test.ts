import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import type { RingkasanOutlet } from "@/features/notifikasi/api";
import { pemberitahuanInventaris, type DataInventaris } from "@/features/notifikasi/sumber-inventaris";
import { IZIN_HALAMAN } from "@/lib/auth/permissions";
import type { RingkasanDashboardGudang } from "@/types/dashboardGudang";

// Seluruh izin yang disebut IZIN_HALAMAN, ditambah izin aksi yang diperiksa sumber.
const SEMUA_IZIN = [
  ...new Set([
    ...Object.values(IZIN_HALAMAN).flatMap((s) => s.flat()),
    "approve-pengajuan-stok",
    "create-transfer-stok",
    "receive-transfer-stok",
    "review-stock-opname",
  ]),
];
const akses = (ubah: Partial<AksesTautan> = {}): AksesTautan => ({
  permissions: SEMUA_IZIN,
  plan: "pro",
  fiturSiap: { wms: true },
  ...ubah,
});

const arah = <K extends string>(nilai: Record<K, number>) => nilai;
const ringkasanOutlet = (ubah: Partial<{ menunggu: number; siapP: number; siapK: number; kirimP: number; kirimK: number; bahan: number }> = {}): RingkasanOutlet => {
  const n = { menunggu: 0, siapP: 0, siapK: 0, kirimP: 0, kirimK: 0, bahan: 0, ...ubah };
  return {
    outlet: { id: "o1", nama: "Outlet" },
    pengajuan: {
      draft: 0,
      menungguApproval: n.menunggu,
      disetujui: n.siapP + n.siapK,
      perArah: {
        permintaan: arah({ draft: 0, menungguApproval: n.menunggu, disetujui: n.siapP }),
        pengembalian: arah({ draft: 0, menungguApproval: 0, disetujui: n.siapK }),
      },
    },
    transfer: {
      sedangDikirim: n.kirimP + n.kirimK,
      sudahDiterima: 0,
      perArah: {
        permintaan: arah({ sedangDikirim: n.kirimP, sudahDiterima: 0 }),
        pengembalian: arah({ sedangDikirim: n.kirimK, sudahDiterima: 0 }),
      },
    },
    inventory: { stokKritis: n.bahan },
    produk: { stokKritis: 0 },
  };
};
const kosong: DataInventaris = { ringkasanOutlet: null, ringkasanGudang: null, stokKritisGudang: null, opnameMenunggu: { outlet: null, gudang: null } };

const id = (d: DataInventaris, a = akses()) => pemberitahuanInventaris(d, a).map((p) => p.id);

describe("pemberitahuanInventaris (LN4a)", () => {
  it("tidak ada kartu bila semua hitungan 0 atau belum termuat", () => {
    expect(id(kosong)).toEqual([]);
    expect(id({ ...kosong, ringkasanOutlet: ringkasanOutlet() })).toEqual([]);
  });

  it("ringkasan outlet: bahan minimum, persetujuan, surat jalan per arah, dan penerimaan per arah", () => {
    const d = { ...kosong, ringkasanOutlet: ringkasanOutlet({ bahan: 2, menunggu: 1, siapP: 3, siapK: 1, kirimP: 2, kirimK: 1 }) };
    const hasil = pemberitahuanInventaris(d, akses());
    expect(hasil.map((p) => [p.id, p.tingkat])).toEqual([
      ["bahan-minimum", "tindakan"],
      ["pengajuan-menunggu", "tindakan"],
      ["surat-jalan-permintaan", "info"],
      ["surat-jalan-pengembalian", "info"],
      ["terima-outlet", "info"],
      ["terima-gudang", "info"],
    ]);
    const tautan = Object.fromEntries(hasil.map((p) => [p.id, p.tautan[0]?.href]));
    expect(tautan).toEqual({
      "bahan-minimum": "/dashboard/outlet/inventaris/stok?tab=stok-kritis",
      "pengajuan-menunggu": "/dashboard/gudang/pengajuanStok?tab=perlu-tinjauan",
      "surat-jalan-permintaan": "/dashboard/gudang/pengajuanStok?tab=perlu-surat-jalan",
      "surat-jalan-pengembalian": "/dashboard/outlet/inventaris/pengajuanStok?tab=disetujui",
      "terima-outlet": "/dashboard/outlet/inventaris/penerimaanBarang",
      "terima-gudang": "/dashboard/gudang/penerimaanStok",
    });
    expect(hasil[0].isi).toBe("2 bahan di outlet mencapai stok minimum.");
  });

  it("kartu hanya bagi yang boleh mengerjakannya: tanpa izin setujui, buat surat jalan, atau terima", () => {
    const d = { ...kosong, ringkasanOutlet: ringkasanOutlet({ menunggu: 1, siapP: 1, kirimP: 1 }) };
    const tanpaAksi = SEMUA_IZIN.filter(
      (i) => !["approve-pengajuan-stok", "create-transfer-stok", "receive-transfer-stok"].includes(i),
    );
    expect(id(d, akses({ permissions: tanpaAksi }))).toEqual([]);
  });

  it("pengajuan dan surat jalan hanya selama fitur gudang aktif (plan dan setup)", () => {
    const d = { ...kosong, ringkasanOutlet: ringkasanOutlet({ bahan: 1, menunggu: 1, kirimP: 1 }) };
    expect(id(d, akses({ plan: "advanced", fiturSiap: {} }))).toEqual(["bahan-minimum"]);
    expect(id(d, akses({ fiturSiap: { wms: false } }))).toEqual(["bahan-minimum"]);
  });

  it("pengguna gudang saja (LN17a): ringkasan gudang tanpa penerimaan per arah", () => {
    const g: RingkasanDashboardGudang = {
      pengajuan: { menungguApproval: 2, siapDibuatSuratJalan: 1, siapDibuatSuratJalanPerArah: { permintaan: 1, pengembalian: 0 } },
      transfer: { suratJalanPending: 0, sedangDikirim: 4 },
      inventory: { stokKritis: 9 },
      jurnalTerbaru: [],
    };
    expect(id({ ...kosong, ringkasanGudang: g })).toEqual(["pengajuan-menunggu", "surat-jalan-permintaan"]);
  });

  it("stok gudang minimum dan opname per ruang; opname gudang hanya bila gudang aktif", () => {
    const d = { ...kosong, stokKritisGudang: 3, opnameMenunggu: { outlet: 1, gudang: 2 } };
    const hasil = pemberitahuanInventaris(d, akses());
    expect(hasil.map((p) => p.id)).toEqual(["gudang-minimum", "opname-outlet", "opname-gudang"]);
    expect(hasil[0].tautan[0].href).toBe("/dashboard/gudang/inventaris?tab=stok-kritis");
    expect(id(d, akses({ plan: "basic", fiturSiap: {} }))).toEqual(["opname-outlet"]);
    expect(id(d, akses({ permissions: SEMUA_IZIN.filter((i) => i !== "review-stock-opname") }))).toEqual([
      "gudang-minimum",
    ]);
  });
});
