import { describe, expect, it } from "vitest";
import { identitasPanel, MEREK } from "@/features/auth/identitas";

describe("identitasPanel", () => {
  it("menampilkan nama toko dan email akun", () => {
    expect(
      identitasPanel({ email: "toko@gmail.com", daftarTenant: [{ namaToko: "Kopi Senja" }] }),
    ).toEqual({ judul: "Kopi Senja", email: "toko@gmail.com" });
  });

  it("memakai merek selama data belum termuat atau gagal", () => {
    expect(identitasPanel(undefined)).toEqual({ judul: MEREK, email: null });
  });

  it("memakai merek bila nama toko kosong, tanpa email", () => {
    expect(identitasPanel({ email: "toko@gmail.com", daftarTenant: [{ namaToko: "  " }] })).toEqual({
      judul: MEREK,
      email: null,
    });
    expect(identitasPanel({ email: "toko@gmail.com", daftarTenant: [] })).toEqual({ judul: MEREK, email: null });
  });

  it("menampilkan nama toko tanpa email bila email tidak dikirim", () => {
    expect(identitasPanel({ daftarTenant: [{ namaToko: "Kopi Senja " }] })).toEqual({
      judul: "Kopi Senja",
      email: null,
    });
  });
});
