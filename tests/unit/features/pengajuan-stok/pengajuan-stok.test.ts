import { describe, expect, it } from "vitest";
import type { PengajuanStok } from "@/types/pengajuanStok";
import { saringPengajuan } from "@/features/pengajuan-stok/filter";
import { arahPengajuanValid } from "@/features/pengajuan-stok/arah";
import {
  bolehBuatSuratJalan,
  bolehSetujuiPengajuan,
  bolehTolakPengajuan,
  bolehUbahPengajuan,
  tabTerlihat,
} from "@/features/pengajuan-stok/izin";
import { nilaiAwalPengajuan, susunPayloadPengajuan } from "@/features/pengajuan-stok/payload";
import { skemaPengajuan } from "@/features/pengajuan-stok/schema";

function pengajuan(nomor: string, status: PengajuanStok["status"], peminta: string, tipeDari: string, tipeKe: string): PengajuanStok {
  return {
    id: nomor,
    tenantID: null,
    nomorPengajuan: nomor,
    jenisPengajuan: "PERMINTAAN",
    status,
    dariLokasi: { id: "a-" + nomor, nama: "Gudang Utama", tipe: tipeDari },
    keLokasi: { id: "k-" + nomor, nama: peminta, tipe: tipeKe },
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
  pengajuan("REQ-001", "DRAFT", "Outlet Kota", "Gudang", "Outlet"),
  pengajuan("REQ-002", "SUBMITTED", "Outlet Kota", "Gudang", "Outlet"),
  pengajuan("REQ-003", "APPROVED", "Outlet Barat", "Gudang", "Outlet"),
  pengajuan("REQ-004", "SUBMITTED", "Outlet Timur", "Outlet", "Gudang"),
];

describe("arahPengajuanValid", () => {
  it("hanya gudang asal ke outlet peminta yang valid", () => {
    expect(arahPengajuanValid(DATA[1])).toBe(true);
    expect(arahPengajuanValid(DATA[3])).toBe(false);
    expect(arahPengajuanValid({ dariLokasi: null, keLokasi: DATA[1].keLokasi })).toBe(false);
  });
});

describe("saringPengajuan", () => {
  it("outlet: pengajuan berarah benar, pencarian nomor", () => {
    expect(saringPengajuan(DATA, "outlet", "").map((p) => p.nomorPengajuan)).toEqual(["REQ-001", "REQ-002", "REQ-003"]);
    expect(saringPengajuan(DATA, "outlet", "req-003").map((p) => p.nomorPengajuan)).toEqual(["REQ-003"]);
    expect(saringPengajuan(DATA, "outlet", "Outlet Barat")).toEqual([]);
  });

  it("gudang: pengajuan berarah benar tanpa draf", () => {
    expect(saringPengajuan(DATA, "gudang", "").map((p) => p.nomorPengajuan)).toEqual(["REQ-002", "REQ-003"]);
  });

  it("gudang: pencarian nomor atau nama outlet peminta", () => {
    expect(saringPengajuan(DATA, "gudang", "barat").map((p) => p.nomorPengajuan)).toEqual(["REQ-003"]);
    expect(saringPengajuan(DATA, "gudang", "req-002").map((p) => p.nomorPengajuan)).toEqual(["REQ-002"]);
    expect(saringPengajuan(DATA, "gudang", "timur")).toEqual([]);
  });
});

describe("susunPayloadPengajuan", () => {
  it("mengirim baris valid saja, satuan bawaan pcs, dan tanggal sebagai ISO", () => {
    const payload = susunPayloadPengajuan({
      keLocationID: "o1",
      dariLocationID: "g1",
      catatan: "",
      tanggalKebutuhan: new Date("2026-09-25T00:00:00.000Z"),
      items: [
        { bahanBakuID: "b1", jumlah: "2", satuan: "kg" },
        { bahanBakuID: "", jumlah: "5", satuan: "" },
        { bahanBakuID: "b2", jumlah: "0", satuan: "ml" },
        { bahanBakuID: "b3", jumlah: "1", satuan: "" },
      ],
    });
    expect(payload).toEqual({
      dariLocationID: "g1",
      keLocationID: "o1",
      catatan: "",
      tanggalKebutuhan: "2026-09-25T00:00:00.000Z",
      items: [
        { bahanBakuID: "b1", jumlah: 2, satuan: "kg" },
        { bahanBakuID: "b3", jumlah: 1, satuan: "pcs" },
      ],
    });
  });
});

describe("nilaiAwalPengajuan", () => {
  it("kosong untuk buat, dengan satu baris kosong", () => {
    expect(nilaiAwalPengajuan()).toEqual({
      keLocationID: "",
      dariLocationID: "",
      tanggalKebutuhan: undefined,
      catatan: "",
      items: [{ bahanBakuID: "", jumlah: "", satuan: "" }],
    });
  });

  it("diisi dari dokumen untuk edit, dengan arah lokasi yang sama", () => {
    const dokumen = {
      ...DATA[1],
      catatan: "segera",
      tanggalKebutuhan: "2026-09-25T00:00:00.000Z",
      items: [{ bahanBaku: { id: "b1", namaBahan: "Susu", satuan: "ml" }, jumlah: 900, satuan: "ml" }],
    };
    expect(nilaiAwalPengajuan(dokumen)).toEqual({
      keLocationID: "k-REQ-002",
      dariLocationID: "a-REQ-002",
      tanggalKebutuhan: new Date("2026-09-25T00:00:00.000Z"),
      catatan: "segera",
      items: [{ bahanBakuID: "b1", jumlah: "900", satuan: "ml" }],
    });
  });
});

describe("skemaPengajuan", () => {
  it("mewajibkan kedua lokasi dan minimal satu baris valid", () => {
    const kosong = nilaiAwalPengajuan();
    const barisValid = [{ bahanBakuID: "b1", jumlah: "1", satuan: "kg" }];
    expect(skemaPengajuan.safeParse({ ...kosong, keLocationID: "o1", dariLocationID: "g1" }).success).toBe(false);
    expect(skemaPengajuan.safeParse({ ...kosong, items: barisValid }).success).toBe(false);
    expect(
      skemaPengajuan.safeParse({ ...kosong, keLocationID: "o1", dariLocationID: "g1", items: barisValid }).success,
    ).toBe(true);
  });
});

describe("izin aksi pengajuan", () => {
  it("memisahkan izin ubah, setujui, tolak, dan surat jalan", () => {
    expect(bolehUbahPengajuan(["update-pengajuan-stok"])).toBe(true);
    expect(bolehUbahPengajuan(["approve-pengajuan-stok"])).toBe(false);
    expect(bolehSetujuiPengajuan(["approve-pengajuan-stok"])).toBe(true);
    expect(bolehTolakPengajuan(["reject-pengajuan-stok"])).toBe(true);
    expect(bolehTolakPengajuan(["approve-pengajuan-stok"])).toBe(false);
    expect(bolehBuatSuratJalan(["create-transfer-stok"])).toBe(true);
    expect(bolehBuatSuratJalan([])).toBe(false);
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