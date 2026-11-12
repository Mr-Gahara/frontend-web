import { describe, expect, it } from "vitest";
import { pengingatLangganan } from "@/features/langganan/pengingat";
import type { LanggananToko } from "@/types/langganan";

const kini = new Date("2026-11-12T03:00:00.000Z"); // 12 November 10.00 WIB
const langganan = (aksesBerakhirPada: string | null, ubah: Partial<LanggananToko> = {}): LanggananToko => ({
  plan: "advanced",
  status: "aktif",
  aksesBerakhirPada,
  masaTenggangHari: 7,
  ...ubah,
});

describe("pengingatLangganan (desain C, ambang 7 hari)", () => {
  it("tanpa pengingat untuk akses tanpa batas, lebih dari 7 hari, atau akun nonaktif", () => {
    expect(pengingatLangganan(langganan(null), kini)).toBeNull();
    expect(pengingatLangganan(langganan("2026-11-20T17:00:00.000Z"), kini)).toBeNull();
    expect(pengingatLangganan(langganan("2026-11-10T17:00:00.000Z", { status: "non-aktif" }), kini)).toBeNull();
  });
  it("hampir habis mulai 7 hari sebelum berakhir, dengan bilah bila awal masa berlaku diketahui", () => {
    const p = pengingatLangganan(langganan("2026-11-17T03:00:00.000Z"), kini, new Date("2026-10-17T03:00:00.000Z"));
    expect(p).toMatchObject({ jenis: "hampir-habis", judul: "Langganan segera berakhir" });
    expect(p?.isi).toBe("Plan Advanced berakhir 17 November 2026, 5 hari lagi. Perpanjang lewat admin Tachyon.");
    expect(p?.persen).toBe(84);
    expect(pengingatLangganan(langganan("2026-11-19T03:00:00.000Z"), kini)?.persen).toBeNull();
  });
  it("masa tenggang menyebut tanggal akun dibekukan dan bagian tenggang yang lewat", () => {
    const p = pengingatLangganan(langganan("2026-11-10T03:00:00.000Z"), kini);
    expect(p).toMatchObject({ jenis: "tenggang", judul: "Masa tenggang langganan", persen: 29 });
    expect(p?.isi).toBe(
      "Masa akses plan Advanced berakhir 10 November 2026. Akun dibekukan 17 November 2026, 5 hari lagi, bila belum diperpanjang.",
    );
  });
  it("sisa dibulatkan ke atas; 'hari ini' setelah batas beku lewat sebelum cron, dan masaTenggangHari kosong memakai 7 hari", () => {
    expect(pengingatLangganan(langganan("2026-11-12T10:00:00.000Z"), kini)?.isi).toContain("1 hari lagi");
    const p = pengingatLangganan(langganan("2026-11-05T02:00:00.000Z", { masaTenggangHari: null }), kini);
    expect(p?.isi).toContain("Akun dibekukan 12 November 2026, hari ini");
  });
});
