import { describe, expect, it } from "vitest";
import { diskonAktif } from "@/features/diskon/filter";
import { ATURAN_DISKON_KOSONG, syaratPemakaian } from "@/features/diskon/tampilan";
import type { Diskon } from "@/types/diskon";

const diskon = (ubah: Partial<Diskon> = {}): Diskon => ({
  id: "a",
  namaDiskon: "Promo",
  cakupan: "Global",
  tipe: "persen",
  nilai: 10,
  bisaDigabung: false,
  status: "Aktif",
  ...ATURAN_DISKON_KOSONG,
  tenantID: "t",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...ubah,
});

describe("diskonAktif (keputusan PD4a)", () => {
  it("tidak menawarkan diskon Aktif yang tidak sedang berlaku", () => {
    const daftar = [
      diskon({ id: "berlaku" }),
      diskon({ id: "belum", sedangBerlaku: false }),
      diskon({ id: "nonaktif", status: "Non-Aktif", sedangBerlaku: false }),
      diskon({ id: "item", cakupan: "Item" }),
    ];
    expect(diskonAktif(daftar, "Global").map((d) => d.id)).toEqual(["berlaku"]);
    expect(diskonAktif(daftar, "Item").map((d) => d.id)).toEqual(["item"]);
  });
});

describe("syaratPemakaian", () => {
  it("kosong untuk diskon tanpa syarat", () => {
    expect(syaratPemakaian(diskon())).toEqual([]);
  });

  it("memuat syarat yang bergantung pada transaksi, tanpa masa dan jam berlaku", () => {
    expect(
      syaratPemakaian(
        diskon({
          minimalBelanja: 500,
          produkIDs: ["p1"],
          kuotaPerPelanggan: 2,
          khususMember: true,
          jamMulai: "10:00",
          jamSelesai: "14:00",
          kuota: 10,
          sisaKuota: 10,
        }),
      ),
    ).toEqual([
      "Minimal belanja Rp 500",
      "1 produk tertentu",
      "Maksimal 2 kali per pelanggan",
      "Khusus member",
    ]);
  });
});