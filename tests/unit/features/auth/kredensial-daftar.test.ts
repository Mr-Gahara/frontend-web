import { describe, expect, it } from "vitest";
import { ambilKredensial, lihatKredensial, titipKredensial } from "@/features/auth/kredensial-daftar";

describe("kredensial titipan daftar", () => {
  it("diambil sekali untuk email yang sama, tanpa peka huruf besar dan spasi", () => {
    titipKredensial({ email: "Pemilik@Toko.id", password: "Rahasia123" });
    expect(ambilKredensial(" pemilik@toko.id ")).toEqual({ email: "Pemilik@Toko.id", password: "Rahasia123" });
    expect(ambilKredensial("pemilik@toko.id")).toBeNull();
  });

  it("email lain tidak mendapat password titipan, dan titipannya ikut dibuang", () => {
    titipKredensial({ email: "a@toko.id", password: "Rahasia123" });
    expect(ambilKredensial("b@toko.id")).toBeNull();
    expect(ambilKredensial("a@toko.id")).toBeNull();
  });

  it("dilihat berulang tanpa dikosongkan, agar kode salah dapat diulang dengan password yang sama (B248)", () => {
    titipKredensial({ email: "c@toko.id", password: "Rahasia123" });
    expect(lihatKredensial("C@toko.id")?.password).toBe("Rahasia123");
    expect(lihatKredensial("c@toko.id")?.password).toBe("Rahasia123");
    expect(lihatKredensial("d@toko.id")).toBeNull();
    expect(ambilKredensial("c@toko.id")?.password).toBe("Rahasia123");
    expect(lihatKredensial("c@toko.id")).toBeNull();
  });
});
