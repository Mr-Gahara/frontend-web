import { describe, expect, it } from "vitest";
import {
  AWALAN_KUNCI,
  SAKLAR_OTOMATIS,
  bolehTampilSendiri,
  jangkarBalon,
  kotakSama,
  kotakSorotan,
  potongKeLayar,
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

describe("kotak sorotan dipotong ke layar (JB9a)", () => {
  it("tidak berubah bila seluruhnya tampil", () => {
    const k = { top: 100, left: 20, width: 200, height: 60 };
    expect(potongKeLayar(k, 1280, 720)).toEqual(k);
  });

  it("dipotong di atas dan bawah bila lebih tinggi dari layar, menyisakan tepi cincin", () => {
    expect(potongKeLayar({ top: -686, left: 300, width: 600, height: 2093 }, 1280, 720)).toEqual({
      top: 3,
      left: 300,
      width: 600,
      height: 714,
    });
  });

  it("dipotong sebagian di atas, di bawah, dan di samping", () => {
    expect(potongKeLayar({ top: -40, left: 0, width: 100, height: 100 }, 1280, 720)).toEqual({ top: 3, left: 3, width: 97, height: 57 });
    expect(potongKeLayar({ top: 680, left: 1200, width: 200, height: 100 }, 1280, 720, 0)).toEqual({
      top: 680,
      left: 1200,
      width: 80,
      height: 40,
    });
  });

  it("dikembalikan apa adanya bila belum bersinggungan dengan layar", () => {
    const k = { top: 900, left: 20, width: 200, height: 60 };
    expect(potongKeLayar(k, 1280, 720)).toEqual(k);
    expect(potongKeLayar({ top: -200, left: 20, width: 200, height: 100 }, 1280, 720)).toEqual({ top: -200, left: 20, width: 200, height: 100 });
  });
});

describe("jangkar balon (JB9a)", () => {
  it("sama dengan sorotan bila target muat di layar", () => {
    const k = { top: 100, left: 20, width: 200, height: 60 };
    expect(jangkarBalon(k, k, 720)).toEqual({ kotak: k, diDalam: false });
    const pas = { top: 3, left: 20, width: 200, height: 714 };
    expect(jangkarBalon(pas, pas, 720)).toEqual({ kotak: pas, diDalam: false });
  });

  it("menjadi garis tepi atas bagian yang tampil bila target lebih tinggi dari ruang layar", () => {
    const asli = { top: -686, left: 300, width: 600, height: 2093 };
    const terpotong = potongKeLayar(asli, 1280, 720);
    expect(jangkarBalon(asli, terpotong, 720)).toEqual({
      kotak: { top: 3, left: 300, width: 600, height: 0 },
      diDalam: true,
    });
  });
});
