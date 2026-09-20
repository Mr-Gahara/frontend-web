import { describe, expect, it } from "vitest";
import type { JurnalStok } from "@/types/jurnalStok";
import { dalamLingkup, saringJurnal } from "@/features/jurnal-stok/filter";
import { formatWaktuJurnal } from "@/features/jurnal-stok/tampilan";
import { lokasiTunggal } from "@/features/inventaris/lokasi";

function buat(sebagian: Partial<JurnalStok> & { id: string }): JurnalStok {
  return {
    bahanBakuID: { id: "b1", namaBahan: "Gula Pasir", satuan: "gram" },
    tanggal: "2026-09-10T06:45:25.678Z",
    tipeKoreksi: "Keluar",
    jumlah: 30,
    alasan: "Lainnya",
    keterangan: null,
    dicatatOleh: { id: "p1", nama: "Ridho" },
    locationID: { id: "outlet-1", nama: "Outlet Pontianak Kota", tipe: "Outlet" },
    tenantID: "t1",
    createdAt: "2026-09-10T06:45:25.679Z",
    updatedAt: "2026-09-10T06:45:25.679Z",
    ...sebagian,
  };
}

const tanpaKriteria = { cari: "", arah: "ALL", alasan: "ALL" } as const;
const outlet1 = { lokasiID: "outlet-1" };
const gudangA = { id: "gudang-1", nama: "Gudang A", tipe: "Gudang" };

describe("dalamLingkup", () => {
  it("mencocokkan lokasi aktif dan menolak lokasi lain atau lokasi kosong", () => {
    expect(dalamLingkup(buat({ id: "a" }), outlet1)).toBe(true);
    expect(dalamLingkup(buat({ id: "b", locationID: gudangA }), outlet1)).toBe(false);
    expect(dalamLingkup(buat({ id: "c", locationID: null }), outlet1)).toBe(false);
  });

  it("mencocokkan tipe lokasi untuk lingkup gudang", () => {
    const lingkup = { tipeLokasi: "Gudang" };
    expect(dalamLingkup(buat({ id: "a", locationID: gudangA }), lingkup)).toBe(true);
    expect(dalamLingkup(buat({ id: "b" }), lingkup)).toBe(false);
  });
});

describe("saringJurnal", () => {
  it("hanya menyisakan jurnal di dalam lingkup", () => {
    const hasil = saringJurnal(
      [buat({ id: "a" }), buat({ id: "b", locationID: gudangA })],
      outlet1,
      tanpaKriteria,
    );
    expect(hasil.map((j) => j.id)).toEqual(["a"]);
  });

  it("mencari nama barang tanpa membedakan huruf besar kecil dan spasi tepi", () => {
    const daftar = [buat({ id: "a" })];
    expect(saringJurnal(daftar, outlet1, { ...tanpaKriteria, cari: "  gula " })).toHaveLength(1);
    expect(saringJurnal(daftar, outlet1, { ...tanpaKriteria, cari: "kopi" })).toHaveLength(0);
  });

  it("menyembunyikan jurnal tanpa bahan baku hanya saat pencarian terisi", () => {
    const daftar = [buat({ id: "a", bahanBakuID: null })];
    expect(saringJurnal(daftar, outlet1, tanpaKriteria)).toHaveLength(1);
    expect(saringJurnal(daftar, outlet1, { ...tanpaKriteria, cari: "gula" })).toHaveLength(0);
  });

  it("menyaring berdasarkan arah dan alasan", () => {
    const daftar = [
      buat({ id: "a", tipeKoreksi: "Masuk", alasan: "Transfer Gudang" }),
      buat({ id: "b", tipeKoreksi: "Keluar", alasan: "Lainnya" }),
    ];
    expect(
      saringJurnal(daftar, outlet1, { ...tanpaKriteria, arah: "Masuk" }).map((j) => j.id),
    ).toEqual(["a"]);
    expect(
      saringJurnal(daftar, outlet1, { ...tanpaKriteria, alasan: "Lainnya" }).map((j) => j.id),
    ).toEqual(["b"]);
  });

  it("mengurutkan dari yang terbaru tanpa mengubah array masukan", () => {
    const daftar = [
      buat({ id: "lama", tanggal: "2026-09-01T00:00:00.000Z" }),
      buat({ id: "baru", tanggal: "2026-09-10T00:00:00.000Z" }),
    ];
    const hasil = saringJurnal(daftar, outlet1, tanpaKriteria);
    expect(hasil.map((j) => j.id)).toEqual(["baru", "lama"]);
    expect(daftar.map((j) => j.id)).toEqual(["lama", "baru"]);
  });
});

describe("formatWaktuJurnal", () => {
  it("memisahkan tanggal dan jam, dan memberi strip untuk nilai kosong", () => {
    expect(formatWaktuJurnal(null)).toEqual({ tanggal: "-", jam: "-" });
    const waktu = formatWaktuJurnal("2026-09-10T06:45:25.678Z");
    expect(waktu.tanggal).toMatch(/^\d{2} \S+ 2026$/);
    expect(waktu.jam).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("lokasiTunggal", () => {
  it("menerima objek atau array dan menolak bentuk tanpa id", () => {
    const lokasi = { id: "outlet-1", nama: "Outlet Pontianak Kota", tipe: "Outlet" };
    expect(lokasiTunggal(lokasi)).toBe(lokasi);
    expect(lokasiTunggal([lokasi])).toBe(lokasi);
    expect(lokasiTunggal([])).toBeNull();
    expect(lokasiTunggal(null)).toBeNull();
    expect(lokasiTunggal({ nama: "tanpa id" })).toBeNull();
  });
});