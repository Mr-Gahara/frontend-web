import { describe, expect, it } from "vitest";
import {
  DAFTAR_PLAN,
  bolehLihatLangganan,
  langgananContoh,
  persenTerpakai,
  sisaHari,
  tautanWhatsapp,
} from "@/features/langganan/data";

const HARI = 86_400_000;
const kini = new Date("2026-11-03T05:00:00Z");

describe("sisaHari", () => {
  it("membulatkan ke atas dan tidak pernah negatif", () => {
    expect(sisaHari(new Date(kini.getTime() + 12 * HARI), kini)).toBe(12);
    expect(sisaHari(new Date(kini.getTime() + 1), kini)).toBe(1);
    expect(sisaHari(new Date(kini.getTime() - HARI), kini)).toBe(0);
  });
});

describe("persenTerpakai", () => {
  const mulai = new Date(kini.getTime() - 7 * HARI);
  const berakhir = new Date(kini.getTime() + 7 * HARI);
  it("menghitung bagian yang sudah terpakai", () => {
    expect(persenTerpakai(mulai, berakhir, kini)).toBe(50);
  });
  it("dibatasi 0 sampai 100", () => {
    expect(persenTerpakai(mulai, berakhir, new Date(mulai.getTime() - HARI))).toBe(0);
    expect(persenTerpakai(mulai, berakhir, new Date(berakhir.getTime() + HARI))).toBe(100);
    expect(persenTerpakai(berakhir, mulai, kini)).toBe(100);
  });
});

describe("tautanWhatsapp", () => {
  it("null selama nomor belum diisi", () => {
    expect(tautanWhatsapp("", "Kopi Senja", "Basic")).toBeNull();
    expect(tautanWhatsapp(" - ", "Kopi Senja", "Basic")).toBeNull();
  });
  it("membentuk tautan wa.me dari angka saja, dengan pesan berisi toko dan plan", () => {
    const t = tautanWhatsapp("+62 812-3456", "Kopi Senja", "Basic");
    expect(t).toMatch(/^https:\/\/wa\.me\/628123456\?text=/);
    expect(decodeURIComponent(t!.split("text=")[1])).toContain("toko Kopi Senja (plan Basic)");
  });
});

describe("bolehLihatLangganan", () => {
  it("hanya Owner", () => {
    expect(bolehLihatLangganan("Owner")).toBe(true);
    expect(bolehLihatLangganan("Kasir")).toBe(false);
    expect(bolehLihatLangganan("")).toBe(false);
  });
});

describe("data plan dan contoh", () => {
  it("fitur yang tidak termasuk berkurang dari Basic ke Pro", () => {
    expect(DAFTAR_PLAN.map((p) => p.fitur.filter((f) => !f.ada).length)).toEqual([2, 1, 0]);
  });
  it("data contoh masa percobaan Basic 14 hari yang belum berakhir", () => {
    const d = langgananContoh(kini);
    expect(d.plan).toBe("basic");
    expect(d.percobaan).toBe(true);
    expect((d.berakhir.getTime() - d.mulai.getTime()) / HARI).toBe(14);
    expect(sisaHari(d.berakhir, kini)).toBe(12);
  });
});