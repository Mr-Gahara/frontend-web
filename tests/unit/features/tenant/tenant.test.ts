import { describe, expect, it } from "vitest";
import { skemaTenant } from "@/features/tenant/schema";
import { nilaiAwalTenant, payloadPerbaruiTenant } from "@/features/tenant/payload";
import type { Tenant } from "@/types/tenant";

const tenant: Tenant = {
  id: "64f000000000000000000001",
  namaToko: "Toko Uji",
  status: "aktif",
  alamat: "Jl. Khatulistiwa No. 1",
  kota: null,
  kodePos: null,
  nomorTelepon: "0812000000",
  emailBisnis: null,
  logoUrl: null,
  footerStruk: null,
  idNPWP: null,
  persenPajak: 0,
  tipePajak: "Sudah Termasuk (Inclusive)",
  isSetupComplete: true,
  absensiLokasiAktif: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const isian = (ubah: Partial<ReturnType<typeof nilaiAwalTenant>> = {}) => ({
  ...nilaiAwalTenant(tenant),
  ...ubah,
});

describe("skemaTenant", () => {
  it("menolak nama toko berisi spasi saja", () => {
    const hasil = skemaTenant.safeParse(isian({ namaToko: "   " }));
    expect(hasil.success).toBe(false);
  });

  it("menolak nama toko yang kurang dari 3 karakter setelah dipangkas", () => {
    const hasil = skemaTenant.safeParse(isian({ namaToko: " ab " }));
    expect(hasil.success).toBe(false);
  });

  it("memangkas setiap isian", () => {
    const hasil = skemaTenant.parse(isian({ namaToko: "  Toko Baru  ", kota: " Pontianak " }));
    expect(hasil.namaToko).toBe("Toko Baru");
    expect(hasil.kota).toBe("Pontianak");
  });

  it("menerima email kosong dan menolak email yang salah bentuk", () => {
    expect(skemaTenant.safeParse(isian({ emailBisnis: "" })).success).toBe(true);
    expect(skemaTenant.safeParse(isian({ emailBisnis: "toko@contoh.id" })).success).toBe(true);
    expect(skemaTenant.safeParse(isian({ emailBisnis: "toko-contoh" })).success).toBe(false);
  });
});

describe("nilaiAwalTenant", () => {
  it("mengubah field null menjadi teks kosong", () => {
    expect(nilaiAwalTenant(tenant)).toEqual({
      namaToko: "Toko Uji",
      alamat: "Jl. Khatulistiwa No. 1",
      kota: "",
      kodePos: "",
      nomorTelepon: "0812000000",
      emailBisnis: "",
      footerStruk: "",
      idNPWP: "",
    });
  });
});

describe("payloadPerbaruiTenant", () => {
  it("kosong bila tidak ada yang berubah", () => {
    expect(payloadPerbaruiTenant(isian(), tenant)).toEqual({});
  });

  it("hanya memuat field yang berubah", () => {
    const payload = payloadPerbaruiTenant(isian({ namaToko: "Toko Baru", kota: "Pontianak" }), tenant);
    expect(payload).toEqual({ namaToko: "Toko Baru", kota: "Pontianak" });
  });

  it("mengirim teks kosong untuk field yang dikosongkan", () => {
    expect(payloadPerbaruiTenant(isian({ alamat: "" }), tenant)).toEqual({ alamat: "" });
  });
});