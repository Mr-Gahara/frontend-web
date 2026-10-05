import { describe, expect, it } from "vitest";
import { buatSkemaRole, type NilaiFormRole } from "@/features/role/schema";
import {
  adaPerubahanRole,
  payloadBuatRole,
  payloadPerbaruiRole,
} from "@/features/role/payload";
import type { NilaiAwalRole } from "@/features/role/nilai-awal";
import type { Permission } from "@/types/role";

const SAH: NilaiFormRole = {
  namaRole: "Kasir Depan",
  deskripsi: "",
  level: "10",
  izin: ["read-akun"],
};

const pesan = (levelPengguna: number, nilai: Partial<NilaiFormRole>): string | undefined => {
  const hasil = buatSkemaRole(levelPengguna).safeParse({ ...SAH, ...nilai });
  return hasil.success ? undefined : hasil.error.issues[0]?.message;
};

describe("buatSkemaRole", () => {
  it("menerima isian sah dan memangkas nama serta deskripsi", () => {
    const hasil = buatSkemaRole(50).safeParse({
      ...SAH,
      namaRole: "  Kasir Depan  ",
      deskripsi: "  Shift pagi ",
    });
    expect(hasil.success).toBe(true);
    if (hasil.success) {
      expect(hasil.data.namaRole).toBe("Kasir Depan");
      expect(hasil.data.deskripsi).toBe("Shift pagi");
    }
  });

  it("menolak nama kosong atau berisi spasi saja dengan pesan wajib", () => {
    expect(pesan(50, { namaRole: "" })).toBe("Nama posisi wajib diisi.");
    expect(pesan(50, { namaRole: "   " })).toBe("Nama posisi wajib diisi.");
  });

  it("menolak nama di bawah 3 karakter setelah dipangkas", () => {
    expect(pesan(50, { namaRole: " ab " })).toBe("Nama posisi minimal 3 karakter.");
  });

  it("menolak nama di atas 50 karakter", () => {
    expect(pesan(50, { namaRole: "a".repeat(51) })).toBe("Nama posisi maksimal 50 karakter.");
    expect(pesan(50, { namaRole: "a".repeat(50) })).toBeUndefined();
  });

  it("menolak deskripsi di atas 255 karakter", () => {
    expect(pesan(50, { deskripsi: "a".repeat(256) })).toBe("Deskripsi maksimal 255 karakter.");
    expect(pesan(50, { deskripsi: "a".repeat(255) })).toBeUndefined();
  });

  it("menolak level kosong, desimal, nol, negatif, dan bukan angka", () => {
    const bulat = "Level harus berupa bilangan bulat lebih besar dari 0.";
    expect(pesan(50, { level: "" })).toBe("Level wajib diisi.");
    expect(pesan(50, { level: "1.5" })).toBe(bulat);
    expect(pesan(50, { level: "0" })).toBe(bulat);
    expect(pesan(50, { level: "-3" })).toBe(bulat);
    expect(pesan(50, { level: "abc" })).toBe(bulat);
  });

  it("menolak level setara atau melebihi level pengguna", () => {
    const batas = "Level harus lebih rendah dari level Anda saat ini (50).";
    expect(pesan(50, { level: "50" })).toBe(batas);
    expect(pesan(50, { level: "80" })).toBe(batas);
    expect(pesan(50, { level: "49" })).toBeUndefined();
  });

  it("tidak memeriksa batas atas bila level pengguna tidak diketahui (RL3a)", () => {
    expect(pesan(0, { level: "80" })).toBeUndefined();
    expect(pesan(0, { level: "1.5" })).toBe(
      "Level harus berupa bilangan bulat lebih besar dari 0.",
    );
  });

  it("menolak form tanpa wewenang", () => {
    expect(pesan(50, { izin: [] })).toBe("Silakan pilih minimal 1 hak akses untuk posisi ini.");
  });
});

const izin = (id: string, nama: string): Permission => ({ id, nama, grup: "Uji" });
const SEMUA: Permission[] = [
  izin("p1", "read-akun"),
  izin("p2", "read-tenant"),
  izin("p3", "read-produk"),
  izin("p9", "update-permission"),
];

const AWAL: NilaiAwalRole = {
  namaRole: "Kasir Depan",
  deskripsi: "Shift pagi",
  level: "10",
  izinTerpilih: ["read-akun", "read-tenant"],
  izinTersembunyi: ["update-permission"],
};

const NILAI: NilaiFormRole = {
  namaRole: "Kasir Depan",
  deskripsi: "Shift pagi",
  level: "10",
  izin: ["read-akun", "read-tenant"],
};

describe("payloadBuatRole", () => {
  it("mengirim nama, level sebagai angka, dan id wewenang termasuk yang tersembunyi", () => {
    expect(payloadBuatRole({ ...NILAI, deskripsi: "" }, ["update-permission"], SEMUA)).toEqual({
      namaRole: "Kasir Depan",
      level: 10,
      permissions: ["p1", "p2", "p9"],
    });
  });

  it("membuang nama wewenang tanpa padanan id dan menyertakan deskripsi yang diisi", () => {
    const payload = payloadBuatRole({ ...NILAI, izin: ["read-akun", "izin-tidak-ada"] }, [], SEMUA);
    expect(payload.permissions).toEqual(["p1"]);
    expect(payload.deskripsi).toBe("Shift pagi");
  });
});

describe("payloadPerbaruiRole", () => {
  it("kosong bila tidak ada yang berubah, termasuk spasi di tepi dan urutan wewenang", () => {
    const payload = payloadPerbaruiRole(
      AWAL,
      { ...NILAI, namaRole: " Kasir Depan ", izin: ["read-tenant", "read-akun"] },
      SEMUA,
    );
    expect(payload).toEqual({});
    expect(adaPerubahanRole(payload)).toBe(false);
  });

  it("hanya mengirim nama bila hanya nama yang berubah", () => {
    const payload = payloadPerbaruiRole(AWAL, { ...NILAI, namaRole: "Kasir Belakang" }, SEMUA);
    expect(payload).toEqual({ namaRole: "Kasir Belakang" });
    expect(adaPerubahanRole(payload)).toBe(true);
  });

  it("mengirim deskripsi yang dikosongkan sebagai teks kosong", () => {
    expect(payloadPerbaruiRole(AWAL, { ...NILAI, deskripsi: "" }, SEMUA)).toEqual({ deskripsi: "" });
  });

  it("mengirim level sebagai angka bila berubah", () => {
    expect(payloadPerbaruiRole(AWAL, { ...NILAI, level: "20" }, SEMUA)).toEqual({ level: 20 });
  });

  it("mengirim seluruh id wewenang, termasuk yang tersembunyi, bila susunannya berubah", () => {
    expect(
      payloadPerbaruiRole(AWAL, { ...NILAI, izin: ["read-akun", "read-produk"] }, SEMUA),
    ).toEqual({ permissions: ["p1", "p3", "p9"] });
  });
});