import { describe, expect, it } from "vitest";
import {
  AWALAN_KUNCI,
  SAKLAR_OTOMATIS,
  bolehTampilSendiri,
  kotakSama,
  kotakSorotan,
  sudahDilihat,
  tandaiDilihat,
  type Penyimpanan,
} from "@/lib/panduan";

function memori(awal: Record<string, string> = {}): Penyimpanan & { isi: Record<string, string> } {
  const isi = { ...awal };
  return { isi, getItem: (k) => isi[k] ?? null, setItem: (k, v) => void (isi[k] = v) };
}

const rusak: Penyimpanan = {
  getItem: () => {
    throw new Error("ditolak");
  },
  setItem: () => {
    throw new Error("penuh");
  },
};

describe("catatan tur sudah dilihat", () => {
  it("tur baru tampil sendiri, lalu tidak lagi sesudah ditandai", () => {
    const s = memori();
    expect(bolehTampilSendiri(s, "setup.kategori")).toBe(true);
    tandaiDilihat(s, "setup.kategori");
    expect(s.isi[AWALAN_KUNCI + "setup.kategori"]).toBe("dilihat");
    expect(sudahDilihat(s, "setup.kategori")).toBe(true);
    expect(bolehTampilSendiri(s, "setup.kategori")).toBe(false);
  });

  it("kunci lain tidak ikut tertandai", () => {
    const s = memori();
    tandaiDilihat(s, "dashboard.1");
    expect(bolehTampilSendiri(s, "dashboard.2")).toBe(true);
  });

  it("saklar uji mematikan tampil sendiri tanpa menandai apa pun", () => {
    const s = memori({ [SAKLAR_OTOMATIS]: "mati" });
    expect(bolehTampilSendiri(s, "setup.kategori")).toBe(false);
    expect(sudahDilihat(s, "setup.kategori")).toBe(false);
  });

  it("tanpa penyimpanan atau penyimpanan yang menolak, tidak melempar galat", () => {
    expect(bolehTampilSendiri(null, "x")).toBe(false);
    expect(() => tandaiDilihat(rusak, "x")).not.toThrow();
    expect(sudahDilihat(rusak, "x")).toBe(false);
    expect(bolehTampilSendiri(rusak, "x")).toBe(true);
  });
});

describe("kotak sorotan", () => {
  it("melebar sesuai jarak di keempat sisi", () => {
    expect(kotakSorotan({ top: 100, left: 20, width: 200, height: 48 })).toEqual({ top: 94, left: 14, width: 212, height: 60 });
    expect(kotakSorotan({ top: 0, left: 0, width: 10, height: 10 }, 0)).toEqual({ top: 0, left: 0, width: 10, height: 10 });
  });

  it("membandingkan kotak per piksel bulat", () => {
    const a = { top: 10.2, left: 5, width: 100, height: 40 };
    expect(kotakSama(a, { ...a, top: 10.4 })).toBe(true);
    expect(kotakSama(a, { ...a, top: 11 })).toBe(false);
    expect(kotakSama(null, null)).toBe(true);
    expect(kotakSama(a, null)).toBe(false);
  });
});
