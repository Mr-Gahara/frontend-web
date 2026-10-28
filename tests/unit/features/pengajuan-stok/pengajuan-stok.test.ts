import { describe, expect, it } from "vitest";
import type { PengajuanStok } from "@/types/pengajuanStok";
import { STATUS_TANPA_DRAF, paramHalamanPengajuan } from "@/features/pengajuan-stok/filter";
import { tahapPengajuan } from "@/features/pengajuan-stok/tahap";
import { arahLokasi, arahPengajuanValid, peranRuang } from "@/features/pengajuan-stok/arah";
import {
  bolehBuatSuratJalan,
  bolehSetujuiPengajuan,
  bolehTolakPengajuan,
  bolehUbahPengajuan,
  tabTerlihat,
  type TabPengajuan,
} from "@/features/pengajuan-stok/izin";
import { lokasiMenurutArah, nilaiAwalPengajuan, sisiMenurutDokumen, susunPayloadPengajuan } from "@/features/pengajuan-stok/payload";
import { skemaPengajuan } from "@/features/pengajuan-stok/schema";
import { LABEL_ARAH_PENGAJUAN, LABEL_TAHAP_PENGAJUAN, SLUG_TAB_PENGAJUAN, labelTabPengajuan, labelTahapPengajuan } from "@/features/pengajuan-stok/tampilan";

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
  it("kedua arah Gudang dan Outlet valid (P8)", () => {
    expect(arahPengajuanValid(DATA[1])).toBe(true);
    expect(arahPengajuanValid(DATA[3])).toBe(true);
  });

  it("pasangan sesama tipe dan lokasi yang tidak termuat tidak valid", () => {
    expect(arahPengajuanValid(pengajuan("REQ-020", "SUBMITTED", "Gudang Dua", "Gudang", "Gudang"))).toBe(false);
    expect(arahPengajuanValid({ dariLokasi: null, keLokasi: DATA[1].keLokasi })).toBe(false);
  });
});

describe("susunPayloadPengajuan", () => {
  it("mengirim baris valid saja, satuan bawaan pcs, dan tanggal sebagai ISO", () => {
    const payload = susunPayloadPengajuan({
      arah: "GUDANG_KE_OUTLET",
      outletID: "o1",
      gudangID: "g1",
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

  it("pengembalian mengirim outlet sebagai asal dan gudang sebagai tujuan", () => {
    const payload = susunPayloadPengajuan({
      arah: "OUTLET_KE_GUDANG",
      outletID: "o1",
      gudangID: "g1",
      catatan: "",
      tanggalKebutuhan: undefined,
      items: [{ bahanBakuID: "b1", jumlah: "2", satuan: "kg" }],
    });
    expect(payload.dariLocationID).toBe("o1");
    expect(payload.keLocationID).toBe("g1");
  });
});

describe("nilaiAwalPengajuan", () => {
  it("kosong untuk buat, dengan satu baris kosong", () => {
    expect(nilaiAwalPengajuan()).toEqual({
      arah: "GUDANG_KE_OUTLET",
      outletID: "",
      gudangID: "",
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
      arah: "GUDANG_KE_OUTLET",
      outletID: "k-REQ-002",
      gudangID: "a-REQ-002",
      tanggalKebutuhan: new Date("2026-09-25T00:00:00.000Z"),
      catatan: "segera",
      items: [{ bahanBakuID: "b1", jumlah: "900", satuan: "ml" }],
    });
  });

  it("revisi pengembalian membaca outlet dari asal dan gudang dari tujuan", () => {
    const awal = nilaiAwalPengajuan(DATA[3]);
    expect(awal.arah).toBe("OUTLET_KE_GUDANG");
    expect(awal.outletID).toBe("a-REQ-004");
    expect(awal.gudangID).toBe("k-REQ-004");
  });

  it("dokumen berarah tidak sah memakai pemetaan permintaan", () => {
    const awal = nilaiAwalPengajuan(pengajuan("REQ-009", "DRAFT", "Gudang Dua", "Gudang", "Gudang"));
    expect(awal).toMatchObject({ arah: "GUDANG_KE_OUTLET", outletID: "k-REQ-009", gudangID: "a-REQ-009" });
  });
});

describe("skemaPengajuan", () => {
  it("mewajibkan kedua lokasi dan minimal satu baris valid", () => {
    const kosong = nilaiAwalPengajuan();
    const barisValid = [{ bahanBakuID: "b1", jumlah: "1", satuan: "kg" }];
    expect(skemaPengajuan.safeParse({ ...kosong, outletID: "o1", gudangID: "g1" }).success).toBe(false);
    expect(skemaPengajuan.safeParse({ ...kosong, items: barisValid }).success).toBe(false);
    expect(
      skemaPengajuan.safeParse({ ...kosong, outletID: "o1", gudangID: "g1", items: barisValid }).success,
    ).toBe(true);
  });

  it("hanya menerima kedua arah P8", () => {
    const sah = { ...nilaiAwalPengajuan(), outletID: "o1", gudangID: "g1", items: [{ bahanBakuID: "b1", jumlah: "1", satuan: "kg" }] };
    expect(skemaPengajuan.safeParse({ ...sah, arah: "OUTLET_KE_GUDANG" }).success).toBe(true);
    expect(skemaPengajuan.safeParse({ ...sah, arah: "GUDANG_KE_GUDANG" }).success).toBe(false);
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

describe("paramHalamanPengajuan", () => {
  const dasar = { arah: "SEMUA" as const, lingkup: {}, cari: "", statusTerlihat: null };

  it("tab satu status dan tab gabungan mengirim statusnya, dipisah koma (B110)", () => {
    expect(paramHalamanPengajuan({ ...dasar, ruang: "gudang", tab: "SUBMITTED" }, 1, 10)).toEqual({
      page: "1",
      limit: "10",
      status: "SUBMITTED",
    });
    expect(paramHalamanPengajuan({ ...dasar, ruang: "outlet", tab: "DISETUJUI" }, 2, 20)).toEqual({
      page: "2",
      limit: "20",
      status: "APPROVED,PENDING",
    });
  });

  it("tab Semua: outlet tanpa status, gudang seluruh status selain draf yang boleh dilihat", () => {
    expect(paramHalamanPengajuan({ ...dasar, ruang: "outlet", tab: "ALL" }, 1, 10)).toEqual({ page: "1", limit: "10" });
    expect(paramHalamanPengajuan({ ...dasar, ruang: "gudang", tab: "ALL" }, 1, 10)?.status).toBe(STATUS_TANPA_DRAF.join(","));
    expect(STATUS_TANPA_DRAF).not.toContain("DRAFT");
    const petugas = paramHalamanPengajuan(
      { ...dasar, ruang: "gudang", tab: "ALL", statusTerlihat: ["SUBMITTED", "APPROVED", "PENDING", "COMPLETED"] },
      1,
      10,
    );
    expect(petugas?.status).toBe("SUBMITTED,APPROVED,PENDING,COMPLETED");
  });

  it("Perlu Surat Jalan gudang: belum bersurat jalan dan hanya permintaan (AR6a)", () => {
    expect(paramHalamanPengajuan({ ...dasar, ruang: "gudang", tab: "PERLU_SURAT_JALAN" }, 1, 10)).toEqual({
      page: "1",
      limit: "10",
      status: "APPROVED,PENDING",
      suratJalan: "belum",
      dariTipeLokasi: "Gudang",
    });
  });

  it("filter arah dikirim sebagai tipe lokasi asal; yang bertentangan dengan Perlu Surat Jalan tidak diminta", () => {
    expect(paramHalamanPengajuan({ ...dasar, ruang: "outlet", tab: "ALL", arah: "OUTLET_KE_GUDANG" }, 1, 10)?.dariTipeLokasi).toBe(
      "Outlet",
    );
    expect(
      paramHalamanPengajuan({ ...dasar, ruang: "gudang", tab: "PERLU_SURAT_JALAN", arah: "GUDANG_KE_OUTLET" }, 1, 10)
        ?.dariTipeLokasi,
    ).toBe("Gudang");
    expect(paramHalamanPengajuan({ ...dasar, ruang: "gudang", tab: "PERLU_SURAT_JALAN", arah: "OUTLET_KE_GUDANG" }, 1, 10)).toBeNull();
  });

  it("satu lokasi dikirim sebagai locationID, dan pencarian dipangkas", () => {
    expect(
      paramHalamanPengajuan({ ...dasar, ruang: "outlet", tab: "ALL", lingkup: { locationID: "lok-1" }, cari: " REQ-0 " }, 1, 10),
    ).toEqual({ page: "1", limit: "10", locationID: "lok-1", cari: "REQ-0" });
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

describe("arahLokasi", () => {
  it("membaca arah dari tipe asal dan tujuan (P8)", () => {
    expect(arahLokasi({ tipe: "Gudang" }, { tipe: "Outlet" })).toBe("GUDANG_KE_OUTLET");
    expect(arahLokasi({ tipe: "Outlet" }, { tipe: "Gudang" })).toBe("OUTLET_KE_GUDANG");
  });

  it("null untuk pasangan sesama tipe atau lokasi yang tidak termuat", () => {
    expect(arahLokasi({ tipe: "Gudang" }, { tipe: "Gudang" })).toBeNull();
    expect(arahLokasi({ tipe: "Outlet" }, { tipe: "Outlet" })).toBeNull();
    expect(arahLokasi(null, { tipe: "Outlet" })).toBeNull();
    expect(arahLokasi({ tipe: null }, { tipe: "Gudang" })).toBeNull();
  });
});

describe("peranRuang", () => {
  it("ruang asal barang adalah pengirim, ruang tujuan penerima", () => {
    expect(peranRuang("GUDANG_KE_OUTLET", "gudang")).toBe("pengirim");
    expect(peranRuang("GUDANG_KE_OUTLET", "outlet")).toBe("penerima");
    expect(peranRuang("OUTLET_KE_GUDANG", "outlet")).toBe("pengirim");
    expect(peranRuang("OUTLET_KE_GUDANG", "gudang")).toBe("penerima");
  });
});

describe("lokasiMenurutArah dan sisiMenurutDokumen", () => {
  const sisi = { outletID: "o1", gudangID: "g1" };

  it("permintaan: gudang asal, outlet tujuan", () => {
    expect(lokasiMenurutArah("GUDANG_KE_OUTLET", sisi)).toEqual({ dariLocationID: "g1", keLocationID: "o1" });
  });

  it("pengembalian: outlet asal, gudang tujuan", () => {
    expect(lokasiMenurutArah("OUTLET_KE_GUDANG", sisi)).toEqual({ dariLocationID: "o1", keLocationID: "g1" });
  });

  it("membaca sisi outlet dan gudang dari dokumen kedua arah", () => {
    expect(sisiMenurutDokumen(DATA[1])).toEqual({ arah: "GUDANG_KE_OUTLET", outletID: "k-REQ-002", gudangID: "a-REQ-002" });
    expect(sisiMenurutDokumen(DATA[3])).toEqual({ arah: "OUTLET_KE_GUDANG", outletID: "a-REQ-004", gudangID: "k-REQ-004" });
  });

  it("null untuk dokumen berarah tidak sah", () => {
    expect(sisiMenurutDokumen({ dariLokasi: null, keLokasi: DATA[1].keLokasi })).toBeNull();
  });

  it("sisi dokumen dipetakan balik ke lokasi yang sama", () => {
    for (const p of [DATA[1], DATA[3]]) {
      const s = sisiMenurutDokumen(p);
      expect(s).not.toBeNull();
      if (!s) return;
      expect(lokasiMenurutArah(s.arah, s)).toEqual({ dariLocationID: p.dariLokasi?.id, keLocationID: p.keLokasi?.id });
    }
  });
});

describe("label arah pengajuan", () => {
  it("permintaan dan pengembalian", () => {
    expect(LABEL_ARAH_PENGAJUAN).toEqual({ GUDANG_KE_OUTLET: "Permintaan", OUTLET_KE_GUDANG: "Pengembalian" });
  });
});

describe("labelTahapPengajuan", () => {
  it("pengembalian disetujui di gudang menunggu surat jalan outlet (AR6a)", () => {
    const kembali = pengajuan("REQ-030", "APPROVED", "Outlet Kota", "Outlet", "Gudang");
    expect(labelTahapPengajuan("gudang", kembali)).toBe("Menunggu Surat Jalan Outlet");
    expect(labelTahapPengajuan("outlet", kembali)).toBe("Disetujui");
  });

  it("permintaan mengikuti label tahap per ruang", () => {
    const minta = pengajuan("REQ-031", "APPROVED", "Outlet Kota", "Gudang", "Outlet");
    expect(labelTahapPengajuan("gudang", minta)).toBe("Perlu Surat Jalan");
    expect(labelTahapPengajuan("outlet", minta)).toBe("Disetujui");
  });
});
