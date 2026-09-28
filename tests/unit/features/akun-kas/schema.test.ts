import { describe, expect, it } from "vitest";
import { skemaAkunKas } from "@/features/akun-kas/schema";

const SAH = {
  tipeAkun: "Kas Fisik",
  namaAkun: "Kas Laci Uji",
  nomorAkun: "KAS-UJI-01",
  keterangan: "",
  saldo: 0,
  status: "aktif",
};

describe("skemaAkunKas", () => {
  it("menerima isian sah dan mempertahankan saldo angka", () => {
    const hasil = skemaAkunKas.safeParse({ ...SAH, saldo: 150000 });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.saldo).toBe(150000);
  });

  it("mengubah saldo berupa teks angka menjadi number", () => {
    const hasil = skemaAkunKas.safeParse({ ...SAH, saldo: "2500" });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.saldo).toBe(2500);
  });

  it("menolak saldo negatif dengan pesannya", () => {
    const hasil = skemaAkunKas.safeParse({ ...SAH, saldo: -1 });
    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      expect(hasil.error.issues.map((i) => i.message)).toContain("Saldo tidak boleh negatif.");
    }
  });

  it("mewajibkan nama, nomor, dan tipe akun", () => {
    const hasil = skemaAkunKas.safeParse({ ...SAH, namaAkun: "", nomorAkun: "", tipeAkun: undefined });
    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      const pesan = hasil.error.issues.map((i) => i.message);
      expect(pesan).toContain("Nama Akun wajib diisi.");
      expect(pesan).toContain("Nomor Akun wajib diisi.");
      expect(pesan).toContain("Tipe akun wajib dipilih.");
    }
  });

  it("menolak nama dan nomor berisi spasi saja, dan memangkas isian sah (KU7a)", () => {
    const kosong = skemaAkunKas.safeParse({ ...SAH, namaAkun: "   ", nomorAkun: "  " });
    expect(kosong.success).toBe(false);
    if (!kosong.success) {
      const pesan = kosong.error.issues.map((i) => i.message);
      expect(pesan).toContain("Nama Akun wajib diisi.");
      expect(pesan).toContain("Nomor Akun wajib diisi.");
    }
    const sah = skemaAkunKas.safeParse({ ...SAH, namaAkun: "  Kas Laci  ", nomorAkun: " KAS-01 " });
    expect(sah.success).toBe(true);
    if (sah.success) {
      expect(sah.data.namaAkun).toBe("Kas Laci");
      expect(sah.data.nomorAkun).toBe("KAS-01");
    }
  });
});