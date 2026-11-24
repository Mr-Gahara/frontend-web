import { describe, expect, it } from "vitest";
import { aksiPengguna, tawarkanEdit } from "@/features/pengguna/izin";

describe("aksiPengguna (butir 14)", () => {
  it("baca-saja tidak mendapat aksi apa pun", () => {
    expect(aksiPengguna(["read-pengguna", "read-role"])).toEqual({ buat: false, ubah: false, hapus: false });
  });

  it("setiap aksi mengikuti izinnya sendiri", () => {
    expect(aksiPengguna(["create-pengguna"])).toEqual({ buat: true, ubah: false, hapus: false });
    expect(aksiPengguna(["update-pengguna"])).toEqual({ buat: false, ubah: true, hapus: false });
    expect(aksiPengguna(["delete-pengguna"])).toEqual({ buat: false, ubah: false, hapus: true });
  });

  it("Edit ditawarkan pada baris diri sendiri walau tanpa update-pengguna", () => {
    const bacaSaja = aksiPengguna(["read-pengguna"]);
    expect(tawarkanEdit(bacaSaja, true)).toBe(true);
    expect(tawarkanEdit(bacaSaja, false)).toBe(false);
    expect(tawarkanEdit(aksiPengguna(["update-pengguna"]), false)).toBe(true);
  });
});
