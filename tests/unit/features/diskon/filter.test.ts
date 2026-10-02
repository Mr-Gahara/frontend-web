import { describe, expect, it } from "vitest";
import { pilihDiskon } from "@/features/diskon/filter";
import { ATURAN_DISKON_KOSONG } from "@/features/diskon/tampilan";
import type { Diskon } from "@/types/diskon";

function diskon(id: string, bisaDigabung: boolean): Diskon {
  return {
    id,
    namaDiskon: "Diskon " + id,
    cakupan: "Item",
    tipe: "persen",
    nilai: 10,
    bisaDigabung,
    status: "Aktif",
    ...ATURAN_DISKON_KOSONG,
    tenantID: "t",
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
  };
}

const gabungA = diskon("a", true);
const gabungB = diskon("b", true);
const tunggal = diskon("t", false);
const tersedia = [gabungA, gabungB, tunggal];

describe("pilihDiskon (keputusan R7b)", () => {
  it("menambahkan diskon yang dapat digabung", () => {
    expect(pilihDiskon(["a"], "b", tersedia)).toEqual(["a", "b"]);
  });

  it("melepas diskon yang diklik ulang", () => {
    expect(pilihDiskon(["a", "b"], "a", tersedia)).toEqual(["b"]);
  });

  it("diskon yang tidak dapat digabung menggantikan seluruh pilihan", () => {
    expect(pilihDiskon(["a", "b"], "t", tersedia)).toEqual(["t"]);
  });

  it("diskon yang dapat digabung menggantikan pilihan yang memuat diskon tidak dapat digabung", () => {
    expect(pilihDiskon(["t"], "a", tersedia)).toEqual(["a"]);
  });

  it("mengabaikan id yang tidak ada di daftar tersedia", () => {
    expect(pilihDiskon(["a"], "x", tersedia)).toEqual(["a"]);
  });
});