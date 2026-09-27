import { describe, expect, it } from "vitest";
import { payloadBuatTipeAset, payloadUbahTipeAset } from "@/features/tipe-aset/payload";

describe("payload tipe aset", () => {
  it("buat: nama dipangkas dan deskripsi kosong tidak dikirim", () => {
    const hasil = payloadBuatTipeAset({ namaTipeAset: "  Meja VIP  ", deskripsi: "   " });
    expect(hasil).toEqual({ namaTipeAset: "Meja VIP" });
    expect(hasil).not.toHaveProperty("deskripsi");
  });

  it("buat: deskripsi terisi dikirim dalam keadaan dipangkas", () => {
    expect(payloadBuatTipeAset({ namaTipeAset: "Meja", deskripsi: " Ruang kaca " })).toEqual({
      namaTipeAset: "Meja",
      deskripsi: "Ruang kaca",
    });
  });

  it("ubah: deskripsi yang dikosongkan dikirim sebagai string kosong", () => {
    expect(payloadUbahTipeAset({ namaTipeAset: "Meja", deskripsi: "  " })).toEqual({
      namaTipeAset: "Meja",
      deskripsi: "",
    });
  });

  it("ubah: nama dan deskripsi dipangkas", () => {
    expect(payloadUbahTipeAset({ namaTipeAset: " Meja ", deskripsi: " Kaca " })).toEqual({
      namaTipeAset: "Meja",
      deskripsi: "Kaca",
    });
  });
});