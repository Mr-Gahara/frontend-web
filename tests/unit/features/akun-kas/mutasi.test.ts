import { describe, it, expect } from "vitest";
import {
  ARAH_JENIS,
  LABEL_JENIS,
  akhirHari,
  awalHari,
  filterAwalMutasi,
  filterServerMutasi,
  gantiArah,
  namaAkunMutasi,
  paramPeriodeMutasi,
  pilihanJenis,
  tanggalTransaksiBerbeda,
  teksJumlahMutasi,
  type FilterMutasi,
} from "@/features/akun-kas/mutasi";
import { formatRupiah } from "@/lib/format";
import type { AkunKas } from "@/types/akunKas";

const SEKARANG = new Date(2026, 9, 3, 15, 30);

const filter = (ubah: Partial<FilterMutasi> = {}): FilterMutasi => ({
  ...filterAwalMutasi(SEKARANG),
  ...ubah,
});

describe("periode mutasi", () => {
  it("filter awal: tanggal 1 bulan berjalan sampai hari ini, tanpa filter lain (MK3a)", () => {
    expect(filterAwalMutasi(SEKARANG)).toEqual({
      akunKasID: "",
      dari: new Date(2026, 9, 1),
      sampai: new Date(2026, 9, 3),
      arah: "",
      jenis: "",
    });
  });

  it("awal dan akhir hari memakai jam lokal", () => {
    expect(awalHari(SEKARANG)).toEqual(new Date(2026, 9, 3, 0, 0, 0, 0));
    expect(akhirHari(SEKARANG)).toEqual(new Date(2026, 9, 3, 23, 59, 59, 999));
  });

  it("batas periode dikirim sebagai ISO utuh dari awal dan akhir hari lokal", () => {
    expect(paramPeriodeMutasi(filter())).toEqual({
      dari: new Date(2026, 9, 1, 0, 0, 0, 0).toISOString(),
      sampai: new Date(2026, 9, 3, 23, 59, 59, 999).toISOString(),
    });
  });
});

describe("filterServerMutasi", () => {
  it("filter awal hanya mengirim periode", () => {
    expect(Object.keys(filterServerMutasi(filter())).sort()).toEqual(["dari", "sampai"]);
  });

  it("akun, arah, dan jenis dikirim bila diisi", () => {
    const params = filterServerMutasi(filter({ akunKasID: "k1", arah: "KELUAR", jenis: "VOID_PEMBAYARAN" }));
    expect(params.akunKasID).toBe("k1");
    expect(params.arah).toBe("KELUAR");
    expect(params.jenis).toBe("VOID_PEMBAYARAN");
  });

  it("tanpa tanggal tidak mengirim batas periode", () => {
    expect(filterServerMutasi(filter({ dari: undefined, sampai: undefined }))).toEqual({});
  });
});

describe("arah dan jenis", () => {
  it("setiap jenis punya arah dan label", () => {
    expect(Object.keys(LABEL_JENIS).sort()).toEqual(Object.keys(ARAH_JENIS).sort());
    expect(Object.keys(ARAH_JENIS)).toHaveLength(9);
  });

  it("pilihan jenis mengikuti arah", () => {
    expect(pilihanJenis("")).toHaveLength(9);
    expect(pilihanJenis("KELUAR")).toEqual([
      "VOID_PEMBAYARAN",
      "BEBAN",
      "TRANSFER_KELUAR",
      "VOID_TRANSFER_MASUK",
    ]);
  });

  it("mengganti arah mengosongkan jenis yang tidak searah", () => {
    expect(gantiArah(filter({ jenis: "PEMBAYARAN" }), "KELUAR").jenis).toBe("");
  });

  it("mengganti arah mempertahankan jenis yang searah, dan arah kosong mempertahankan apa pun", () => {
    expect(gantiArah(filter({ jenis: "PEMBAYARAN" }), "MASUK").jenis).toBe("PEMBAYARAN");
    expect(gantiArah(filter({ arah: "MASUK", jenis: "PEMBAYARAN" }), "")).toMatchObject({
      arah: "",
      jenis: "PEMBAYARAN",
    });
  });
});

describe("tampilan baris mutasi", () => {
  it("nama akun dicocokkan dari daftar, dengan cadangan bila tidak ada", () => {
    const daftar = [{ id: "k1", namaAkun: "Kas Kecil" }] as AkunKas[];
    expect(namaAkunMutasi("k1", daftar)).toBe("Kas Kecil");
    expect(namaAkunMutasi("k2", daftar)).toBe("Akun tidak dikenal");
    expect(namaAkunMutasi("k1", undefined)).toBe("Akun tidak dikenal");
  });

  it("jumlah bertanda menurut arah", () => {
    expect(teksJumlahMutasi({ arah: "MASUK", jumlah: 5500 })).toBe(`+ ${formatRupiah(5500)}`);
    expect(teksJumlahMutasi({ arah: "KELUAR", jumlah: 5500 })).toBe(`- ${formatRupiah(5500)}`);
  });

  it("tanggal transaksi berbeda hanya bila harinya lain dari waktu dicatat", () => {
    const dicatat = new Date(2026, 9, 3, 10, 0).toISOString();
    expect(tanggalTransaksiBerbeda({ tanggal: new Date(2026, 9, 3, 8, 0).toISOString(), createdAt: dicatat })).toBe(false);
    expect(tanggalTransaksiBerbeda({ tanggal: new Date(2026, 9, 1, 8, 0).toISOString(), createdAt: dicatat })).toBe(true);
  });
});