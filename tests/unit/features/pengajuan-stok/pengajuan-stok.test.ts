import { describe, expect, it } from "vitest";
import type { PengajuanStok } from "@/types/pengajuanStok";
import { saringPengajuan } from "@/features/pengajuan-stok/filter";
import { tabTerlihat } from "@/features/pengajuan-stok/izin";

function pengajuan(nomor: string, status: PengajuanStok["status"], asal: string, tipeAsal: string, tipeTujuan: string): PengajuanStok {
  return {
    id: nomor,
    tenantID: null,
    nomorPengajuan: nomor,
    jenisPengajuan: "PERMINTAAN",
    status,
    dariLokasi: { id: "a-" + nomor, nama: asal, tipe: tipeAsal },
    keLokasi: { id: "k-" + nomor, nama: "Gudang Utama", tipe: tipeTujuan },
    dimintaOleh: null,
    disetujuiOleh: null,
    ditolakOleh: null,
    items: [],
    catatan: null,
    catatanPenolakan: null,
    tanggalKebutuhan: null,
    tanggalApprove: null,
    tanggalReject: null,
    transferStokID: null,
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
  };
}

const DATA = [
  pengajuan("REQ-001", "DRAFT", "Outlet Kota", "Outlet", "Gudang"),
  pengajuan("REQ-002", "SUBMITTED", "Outlet Kota", "Outlet", "Gudang"),
  pengajuan("REQ-003", "APPROVED", "Outlet Barat", "Outlet", "Gudang"),
  pengajuan("REQ-004", "SUBMITTED", "Gudang Cadangan", "Gudang", "Outlet"),
];

describe("saringPengajuan", () => {
  it("outlet: hanya pengajuan dari outlet, pencarian nomor", () => {
    expect(saringPengajuan(DATA, "outlet", "").map((p) => p.nomorPengajuan)).toEqual(["REQ-001", "REQ-002", "REQ-003"]);
    expect(saringPengajuan(DATA, "outlet", "req-003").map((p) => p.nomorPengajuan)).toEqual(["REQ-003"]);
    expect(saringPengajuan(DATA, "outlet", "Outlet Barat")).toEqual([]);
  });

  it("gudang: hanya pengajuan ke gudang, tanpa draf", () => {
    expect(saringPengajuan(DATA, "gudang", "").map((p) => p.nomorPengajuan)).toEqual(["REQ-002", "REQ-003"]);
  });

  it("gudang: pencarian nomor atau nama outlet asal", () => {
    expect(saringPengajuan(DATA, "gudang", "barat").map((p) => p.nomorPengajuan)).toEqual(["REQ-003"]);
    expect(saringPengajuan(DATA, "gudang", "req-002").map((p) => p.nomorPengajuan)).toEqual(["REQ-002"]);
  });
});

describe("tabTerlihat", () => {
  const TAB = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"] as const;

  it("petugas transfer tanpa izin setujui tidak melihat tab draf dan ditolak", () => {
    expect(tabTerlihat(TAB, ["create-transfer-stok"])).toEqual(["ALL", "SUBMITTED", "APPROVED", "COMPLETED"]);
  });

  it("pemegang izin setujui, atau tanpa izin transfer, melihat semua tab", () => {
    expect(tabTerlihat(TAB, ["create-transfer-stok", "approve-pengajuan-stok"])).toEqual([...TAB]);
    expect(tabTerlihat(TAB, ["read-pengajuan-stok"])).toEqual([...TAB]);
  });
});