import { describe, expect, it } from "vitest";
import {
  ApiError,
  isApiError,
  isConflict,
  isForbidden,
  isNotFound,
  isRateLimited,
  isUnauthorized,
  pesanError,
} from "@/lib/api/error";

describe("ApiError", () => {
  it("membawa status, pesan, daftar errors, dan code", () => {
    const e = new ApiError(400, "Data tidak valid.", ["nama wajib diisi"], "VALIDASI");

    expect(e.status).toBe(400);
    expect(e.message).toBe("Data tidak valid.");
    expect(e.errors).toEqual(["nama wajib diisi"]);
    expect(e.code).toBe("VALIDASI");
    expect(e).toBeInstanceOf(Error);
  });

  it("pesan siap tampil memakai daftar errors bila tersedia", () => {
    const e = new ApiError(400, "Data tidak valid.", ["nama wajib", "pin minimal 6 digit"]);

    expect(e.pesan).toBe("nama wajib, pin minimal 6 digit");
  });

  it("pesan siap tampil jatuh ke message bila errors kosong", () => {
    expect(new ApiError(409, "Email sudah terdaftar.").pesan).toBe("Email sudah terdaftar.");
  });
});

describe("helper status", () => {
  const kasus: Array<[number, (e: unknown) => boolean, string]> = [
    [401, isUnauthorized, "isUnauthorized"],
    [403, isForbidden, "isForbidden"],
    [404, isNotFound, "isNotFound"],
    [409, isConflict, "isConflict"],
    [429, isRateLimited, "isRateLimited"],
  ];

  for (const [status, fn, nama] of kasus) {
    it(`${nama} hanya benar untuk status ${status}`, () => {
      expect(fn(new ApiError(status, "pesan"))).toBe(true);
      expect(fn(new ApiError(500, "pesan"))).toBe(false);
      expect(fn(new Error("bukan ApiError"))).toBe(false);
    });
  }

  it("isApiError membedakan ApiError dari Error biasa", () => {
    expect(isApiError(new ApiError(400, "x"))).toBe(true);
    expect(isApiError(new Error("x"))).toBe(false);
    expect(isApiError("x")).toBe(false);
  });
});

describe("pesanError", () => {
  it("mengambil daftar errors dari ApiError", () => {
    expect(pesanError(new ApiError(400, "Tidak valid.", ["satuan tidak dikenal"]))).toBe(
      "satuan tidak dikenal",
    );
  });

  it("mengambil message dari Error biasa", () => {
    expect(pesanError(new Error("jaringan putus"))).toBe("jaringan putus");
  });

  it("memakai fallback untuk nilai yang bukan Error", () => {
    expect(pesanError(null, "Terjadi kesalahan.")).toBe("Terjadi kesalahan.");
    expect(pesanError(new Error(""), "Terjadi kesalahan.")).toBe("Terjadi kesalahan.");
  });
});
