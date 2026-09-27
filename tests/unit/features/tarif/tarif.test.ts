import { describe, expect, it } from "vitest";
import { NILAI_AWAL_TARIF, skemaTarif } from "@/features/tarif/schema";
import { nilaiAwalTarif, payloadTarif } from "@/features/tarif/payload";
import type { Tarif } from "@/types/tarif";

const sah = { ...NILAI_AWAL_TARIF, namaTarif: "Tarif Uji", harga: "100000" };

const pesanDi = (nilai: unknown, field: string) => {
  const hasil = skemaTarif.safeParse(nilai);
  if (hasil.success) return null;
  return hasil.error.issues.find((i) => i.path[0] === field)?.message ?? null;
};

const tarif: Tarif = {
  id: "t1",
  namaTarif: "Sore",
  basisPerhitungan: "per sesi",
  harga: 50000,
  durasiMinimum: 2,
  isActive: false,
  hariAktif: [1, 2],
  jamMulai: "15:00",
  jamSelesai: "18:00",
  prioritas: 3,
  dataAset: [
    { id: "a1", namaTipeAset: "Meja" },
    { id: "a2", namaTipeAset: "Ruang" },
  ],
  tenantID: "tenant",
};

describe("skemaTarif", () => {
  it("menerima isian sah dan membaca angka dari teks", () => {
    const hasil = skemaTarif.parse(sah);
    expect(hasil.harga).toBe(100000);
    expect(hasil.durasiMinimum).toBe(1);
    expect(hasil.prioritas).toBe(1);
  });

  it("menolak harga kosong atau berisi spasi saja (T3b)", () => {
    expect(pesanDi({ ...sah, harga: "" }, "harga")).toBe("Harga wajib diisi");
    expect(pesanDi({ ...sah, harga: "   " }, "harga")).toBe("Harga wajib diisi");
  });

  it("menerima harga 0 yang diketik, dari teks maupun angka", () => {
    expect(skemaTarif.parse({ ...sah, harga: "0" }).harga).toBe(0);
    expect(skemaTarif.parse({ ...sah, harga: 0 }).harga).toBe(0);
  });

  it("menolak harga negatif", () => {
    expect(pesanDi({ ...sah, harga: "-1" }, "harga")).toBe("Harga tidak boleh negatif");
  });

  it("menolak nama berisi spasi saja dan memangkas nama (T4a)", () => {
    expect(pesanDi({ ...sah, namaTarif: "   " }, "namaTarif")).toBe("Nama tarif wajib diisi");
    expect(skemaTarif.parse({ ...sah, namaTarif: "  Tarif Uji  " }).namaTarif).toBe("Tarif Uji");
  });

  it("menolak jam mulai yang tidak lebih awal dari jam selesai", () => {
    expect(pesanDi({ ...sah, jamMulai: "10:00", jamSelesai: "09:00" }, "jamMulai")).toBe(
      "Jam mulai harus lebih awal dari jam selesai",
    );
  });

  it("menolak jam yang bukan HH:mm", () => {
    expect(pesanDi({ ...sah, jamSelesai: "25:00" }, "jamSelesai")).toBe("Format harus HH:mm");
  });
});

describe("payloadTarif", () => {
  it("mengirim sepuluh field form dengan nama terpangkas", () => {
    const nilai = skemaTarif.parse({ ...sah, namaTarif: " Tarif Uji ", tipeAsetID: ["a1"] });
    expect(payloadTarif(nilai)).toEqual({
      namaTarif: "Tarif Uji",
      basisPerhitungan: "per jam",
      harga: 100000,
      durasiMinimum: 1,
      isActive: true,
      hariAktif: [0, 1, 2, 3, 4, 5, 6],
      jamMulai: "00:00",
      jamSelesai: "23:59",
      prioritas: 1,
      tipeAsetID: ["a1"],
    });
  });
});

describe("nilaiAwalTarif", () => {
  it("mengisi form dari tarif dan mengambil id tipe aset dari dataAset", () => {
    expect(nilaiAwalTarif(tarif)).toEqual({
      namaTarif: "Sore",
      basisPerhitungan: "per sesi",
      harga: 50000,
      durasiMinimum: 2,
      isActive: false,
      hariAktif: [1, 2],
      jamMulai: "15:00",
      jamSelesai: "18:00",
      prioritas: 3,
      tipeAsetID: ["a1", "a2"],
    });
  });

  it("memakai bawaan untuk jam kosong dan tanpa tipe aset", () => {
    const hasil = nilaiAwalTarif({ ...tarif, jamMulai: "", jamSelesai: "", dataAset: [] });
    expect(hasil.jamMulai).toBe("00:00");
    expect(hasil.jamSelesai).toBe("23:59");
    expect(hasil.tipeAsetID).toEqual([]);
  });
});