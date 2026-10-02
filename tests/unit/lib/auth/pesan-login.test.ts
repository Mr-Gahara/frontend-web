import { describe, expect, it } from "vitest";
import { ambilPesanLogin, titipPesanLogin } from "@/lib/auth/pesan-login";

describe("pesan login sekali pakai", () => {
  it("kosong bila tidak ada yang dititipkan", () => {
    expect(ambilPesanLogin()).toBeNull();
  });

  it("pesan titipan diambil sekali, lalu kosong", () => {
    const pesan = { judul: "PIN Berhasil Diubah", deskripsi: "Silakan login kembali." };
    titipPesanLogin(pesan);
    expect(ambilPesanLogin()).toEqual(pesan);
    expect(ambilPesanLogin()).toBeNull();
  });
});