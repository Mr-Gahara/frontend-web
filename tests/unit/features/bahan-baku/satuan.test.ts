import { describe, expect, it } from "vitest";
import { pilihanSatuan, satuanSah, teksJumlahBersatuan } from "@/features/bahan-baku/satuan";
import { rincianKemasan, teksStokDasar } from "@/features/inventaris/stok-terbaca";
import { bahanBakuSchema } from "@/features/bahan-baku/schema";

const skm = {
  satuan: "ml" as const,
  availableUnits: ["ml", "kaleng", "pak"],
  konversi: [
    { satuan: "kaleng", isi: 290 },
    { satuan: "pak", isi: 3480 },
  ],
};

describe("pilihanSatuan (P87)", () => {
  it("mengikuti availableUnits; kemasan diberi isi dalam satuan dasar", () => {
    expect(pilihanSatuan(skm)).toEqual([
      { nilai: "ml", label: "ml" },
      { nilai: "kaleng", label: "kaleng (290 ml)" },
      { nilai: "pak", label: "pak (3.480 ml)" },
    ]);
  });

  it("tanpa availableUnits hanya satuan dasar; tanpa bahan kosong", () => {
    expect(pilihanSatuan({ satuan: "kg" })).toEqual([{ nilai: "kg", label: "kg" }]);
    expect(pilihanSatuan(null)).toEqual([]);
  });

  it("satuan di luar pilihan kembali ke satuan dasar", () => {
    expect(satuanSah(skm, "kaleng")).toBe("kaleng");
    expect(satuanSah(skm, "dus")).toBe("ml");
  });
});

describe("teksJumlahBersatuan", () => {
  it("masukan kemasan di atas, jumlah dasar di bawah", () => {
    expect(teksJumlahBersatuan(580, "ml", { jumlah: 2, satuan: "kaleng" })).toEqual({ utama: "2 kaleng", dasar: "580 ml" });
  });

  it("masukan satuan dasar atau dokumen lama hanya satu baris", () => {
    expect(teksJumlahBersatuan(1500, "ml", { jumlah: 1500, satuan: "ml" })).toEqual({ utama: "1.500 ml", dasar: null });
    expect(teksJumlahBersatuan(2.5, "kg", { jumlah: null, satuan: null })).toEqual({ utama: "2,5 kg", dasar: null });
  });
});

describe("stok terbaca (B362)", () => {
  it("rincian kemasan bila backend mengirim satuan selain dasar", () => {
    const rincian = [
      { satuan: "pak", jumlah: 1 },
      { satuan: "kaleng", jumlah: 9 },
      { satuan: "ml", jumlah: 25 },
    ];
    expect(rincianKemasan(rincian, "ml")).toBe("1 pak 9 kaleng 25 ml");
    expect(teksStokDasar(6115, "ml")).toBe("6.115 ml");
  });

  it("tanpa kemasan atau tanpa stokTerbaca tetap satu baris", () => {
    expect(rincianKemasan([{ satuan: "kg", jumlah: 100 }], "kg")).toBeNull();
    expect(rincianKemasan(undefined, "kg")).toBeNull();
  });
});

describe("bahanBakuSchema konversi (B359)", () => {
  const dasar = { namaBahan: "Susu Kental Manis", satuan: "ml" as const };

  it("menerima kemasan sah dan menurunkan huruf namanya", () => {
    const hasil = bahanBakuSchema.safeParse({ ...dasar, konversi: [{ satuan: "Kaleng", isi: 290 }] });
    expect(hasil.success).toBe(true);
    expect(hasil.data?.konversi).toEqual([{ satuan: "kaleng", isi: 290 }]);
  });

  it("menolak nama satuan bawaan, satuan dasar, ganda, dan isi 0", () => {
    const hasil = bahanBakuSchema.safeParse({
      ...dasar,
      konversi: [
        { satuan: "liter", isi: 1 },
        { satuan: "ml", isi: 1 },
        { satuan: "kaleng", isi: 290 },
        { satuan: "kaleng", isi: 300 },
        { satuan: "pak", isi: 0 },
      ],
    });
    expect(hasil.success).toBe(false);
    const jalur = hasil.error!.issues.map((i) => i.path.join("."));
    expect(jalur).toEqual(expect.arrayContaining(["konversi.0.satuan", "konversi.1.satuan", "konversi.3.satuan", "konversi.4.isi"]));
    expect(jalur).not.toContain("konversi.2.satuan");
  });
});
