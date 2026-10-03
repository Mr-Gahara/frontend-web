import { describe, it, expect } from "vitest";
import { akunKasAktif, akunKasNonAktif } from "@/features/akun-kas/filter";
import type { AkunKas } from "@/types/akunKas";

const akun = (id: string, status: AkunKas["status"]) => ({ id, status }) as AkunKas;

describe("pemilahan akun kas", () => {
  const daftar = [akun("a", "aktif"), akun("b", "non-aktif"), akun("c", "aktif"), akun("d", "non-aktif")];

  it("aktif dan non-aktif terpisah, dengan urutan asal dipertahankan", () => {
    expect(akunKasAktif(daftar).map((a) => a.id)).toEqual(["a", "c"]);
    expect(akunKasNonAktif(daftar).map((a) => a.id)).toEqual(["b", "d"]);
  });

  it("setiap akun masuk tepat satu kelompok", () => {
    expect(akunKasAktif(daftar).length + akunKasNonAktif(daftar).length).toBe(daftar.length);
    expect(akunKasNonAktif([])).toEqual([]);
  });
});