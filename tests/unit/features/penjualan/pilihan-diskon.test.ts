import { describe, expect, it } from "vitest";
import { toggleDiskonSelection } from "@/features/penjualan/pilihan-diskon";
import type { Diskon } from "@/types/diskon";

const diskon = (id: string, bisaDigabung: boolean) => ({ id, bisaDigabung }) as Diskon;
const DAFTAR = [diskon("g1", true), diskon("g2", true), diskon("t1", false), diskon("t2", false)];

describe("toggleDiskonSelection", () => {
  it("memilih yang sudah terpilih melepasnya", () => {
    expect(toggleDiskonSelection(["g1", "g2"], "g1", DAFTAR)).toEqual(["g2"]);
  });
  it("diskon yang bisa digabung ditambahkan ke pilihan yang bisa digabung", () => {
    expect(toggleDiskonSelection(["g1"], "g2", DAFTAR)).toEqual(["g1", "g2"]);
  });
  it("diskon yang tidak bisa digabung menggantikan seluruh pilihan", () => {
    expect(toggleDiskonSelection(["g1", "g2"], "t1", DAFTAR)).toEqual(["t1"]);
  });
  it("pilihan yang memuat diskon tidak bisa digabung diganti diskon baru", () => {
    expect(toggleDiskonSelection(["t1"], "g1", DAFTAR)).toEqual(["g1"]);
  });
  it("id yang tidak ada di daftar tidak mengubah pilihan", () => {
    expect(toggleDiskonSelection(["g1"], "x", DAFTAR)).toEqual(["g1"]);
  });
});
