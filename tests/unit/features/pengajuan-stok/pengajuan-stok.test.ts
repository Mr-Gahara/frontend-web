import { describe, expect, it } from "vitest";
import type { PengajuanStok } from "@/types/pengajuanStok";
import { cocokTab, saringPengajuan, statusServerTab } from "@/features/pengajuan-stok/filter";
import { tahapPengajuan } from "@/features/pengajuan-stok/tahap";
import { arahPengajuanValid } from "@/features/pengajuan-stok/arah";
import {
  bolehBuatSuratJalan,
  bolehSetujuiPengajuan,
  bolehTolakPengajuan,
  bolehUbahPengajuan,
  tabTerlihat,
  type TabPengajuan,
} from "@/features/pengajuan-stok/izin";
import { nilaiAwalPengajuan, susunPayloadPengajuan } from "@/features/pengajuan-stok/payload";
import { skemaPengajuan } from "@/features/pengajuan-stok/schema";
import { LABEL_TAHAP_PENGAJUAN, SLUG_TAB_PENGAJUAN, labelTabPengajuan } from "@/features/pengajuan-stok/tampilan";

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

  it("tab gabungan tampil bila salah satu statusnya boleh dilihat", () => {
    const GUDANG = ["SUBMITTED", "PERLU_SURAT_JALAN", "COMPLETED", "REJECTED", "ALL"] as const;
    expect(tabTerlihat(GUDANG, ["create-transfer-stok"])).toEqual(["SUBMITTED", "PERLU_SURAT_JALAN", "COMPLETED", "ALL"]);
    expect(tabTerlihat(["ALL", "DISETUJUI"], ["create-transfer-stok"])).toEqual(["ALL", "DISETUJUI"]);
  });
});

describe("tahapPengajuan", () => {
  it("APPROVED dan PENDING tanpa surat jalan perlu surat jalan", () => {
    expect(tahapPengajuan({ status: "APPROVED", transferStokID: null })).toBe("PERLU_SURAT_JALAN");
    expect(tahapPengajuan({ status: "PENDING", transferStokID: null })).toBe("PERLU_SURAT_JALAN");
  });

  it("APPROVED dan PENDING yang punya surat jalan sudah dibuatkan surat jalan", () => {
    expect(tahapPengajuan({ status: "APPROVED", transferStokID: "SJ-1" })).toBe("SURAT_JALAN_DIBUAT");
    expect(tahapPengajuan({ status: "PENDING", transferStokID: "SJ-2" })).toBe("SURAT_JALAN_DIBUAT");
  });

  it("status lain menjadi tahapnya sendiri", () => {
    for (const status of ["DRAFT", "SUBMITTED", "COMPLETED", "REJECTED"] as const) {
      expect(tahapPengajuan({ status, transferStokID: null })).toBe(status);
    }
  });
});

describe("tab pengajuan", () => {
  const denganSuratJalan = (p: PengajuanStok): PengajuanStok => ({ ...p, transferStokID: "SJ-" + p.id });
  const disetujui = pengajuan("REQ-010", "APPROVED", "Outlet Kota", "Gudang", "Outlet");
  const dibatalkan = pengajuan("REQ-011", "PENDING", "Outlet Kota", "Gudang", "Outlet");
  const disetujuiBerSJ = denganSuratJalan(pengajuan("REQ-012", "APPROVED", "Outlet Kota", "Gudang", "Outlet"));
  const dibatalkanBerSJ = denganSuratJalan(pengajuan("REQ-013", "PENDING", "Outlet Kota", "Gudang", "Outlet"));
  const diajukan = pengajuan("REQ-014", "SUBMITTED", "Outlet Kota", "Gudang", "Outlet");
  const SEMUA = [disetujui, dibatalkan, disetujuiBerSJ, dibatalkanBerSJ, diajukan];

  it("tab satu status mengirim statusnya; tab Semua dan tab gabungan tanpa status", () => {
    expect(statusServerTab("SUBMITTED")).toBe("SUBMITTED");
    expect(statusServerTab("ALL")).toBeUndefined();
    expect(statusServerTab("DISETUJUI")).toBeUndefined();
    expect(statusServerTab("PERLU_SURAT_JALAN")).toBeUndefined();
  });

  it("PERLU_SURAT_JALAN: APPROVED dan PENDING yang belum punya surat jalan", () => {
    expect(SEMUA.filter((p) => cocokTab(p, "PERLU_SURAT_JALAN"))).toEqual([disetujui, dibatalkan]);
  });

  it("DISETUJUI: APPROVED dan PENDING, dengan atau tanpa surat jalan", () => {
    expect(SEMUA.filter((p) => cocokTab(p, "DISETUJUI"))).toEqual([disetujui, dibatalkan, disetujuiBerSJ, dibatalkanBerSJ]);
  });

  it("tab satu status hanya statusnya, tab Semua seluruhnya", () => {
    expect(SEMUA.filter((p) => cocokTab(p, "SUBMITTED"))).toEqual([diajukan]);
    expect(SEMUA.filter((p) => cocokTab(p, "ALL"))).toEqual(SEMUA);
  });
});

describe("label tab dan tahap pengajuan", () => {
  const TAHAP = ["DRAFT", "SUBMITTED", "PERLU_SURAT_JALAN", "SURAT_JALAN_DIBUAT", "COMPLETED", "REJECTED"] as const;

  it("setiap tahap berlabel di kedua ruang, tanpa kode status mentah", () => {
    for (const ruang of ["outlet", "gudang"] as const) {
      for (const tahap of TAHAP) {
        const label = LABEL_TAHAP_PENGAJUAN[ruang][tahap];
        expect(label).toBeTruthy();
        expect(label).not.toBe(tahap);
        expect(label).not.toBe(label.toUpperCase());
      }
    }
  });

  it("tab outlet berlabel bahasa awam sesuai urutan tab", () => {
    const tab: TabPengajuan[] = ["ALL", "DRAFT", "SUBMITTED", "DISETUJUI", "REJECTED", "COMPLETED"];
    expect(tab.map((t) => labelTabPengajuan("outlet", t))).toEqual([
      "Semua",
      "Draft",
      "Menunggu Persetujuan",
      "Disetujui",
      "Ditolak",
      "Selesai",
    ]);
  });

  it("tab gudang berlabel bahasa awam sesuai urutan tab", () => {
    const tab: TabPengajuan[] = ["SUBMITTED", "PERLU_SURAT_JALAN", "COMPLETED", "REJECTED", "ALL"];
    expect(tab.map((t) => labelTabPengajuan("gudang", t))).toEqual([
      "Perlu Disetujui",
      "Perlu Surat Jalan",
      "Selesai",
      "Ditolak",
      "Semua",
    ]);
  });

  it("label tab sama dengan badge tahap yang dicakupnya", () => {
    expect(labelTabPengajuan("outlet", "DISETUJUI")).toBe(LABEL_TAHAP_PENGAJUAN.outlet.PERLU_SURAT_JALAN);
    expect(labelTabPengajuan("outlet", "SUBMITTED")).toBe(LABEL_TAHAP_PENGAJUAN.outlet.SUBMITTED);
    expect(labelTabPengajuan("gudang", "SUBMITTED")).toBe(LABEL_TAHAP_PENGAJUAN.gudang.SUBMITTED);
    expect(labelTabPengajuan("gudang", "PERLU_SURAT_JALAN")).toBe(LABEL_TAHAP_PENGAJUAN.gudang.PERLU_SURAT_JALAN);
    expect(labelTabPengajuan("outlet", "APPROVED")).toBe("Disetujui");
    expect(labelTabPengajuan("gudang", "PENDING")).toBe("Disetujui");
  });

  it("slug ?tab= tidak berubah walau label diganti", () => {
    expect(SLUG_TAB_PENGAJUAN).toEqual({
      outlet: { ALL: "semua", DRAFT: "draf", SUBMITTED: "menunggu", DISETUJUI: "disetujui", REJECTED: "ditolak", COMPLETED: "selesai" },
      gudang: { SUBMITTED: "perlu-tinjauan", PERLU_SURAT_JALAN: "perlu-surat-jalan", COMPLETED: "selesai", REJECTED: "ditolak", ALL: "semua" },
    });
  });
});
