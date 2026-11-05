import { describe, expect, it } from "vitest";
import {
  indeksAwal,
  langkahDariStatus,
  ownerTerdaftar,
  selesaiPerLangkah,
  setupTuntas,
  type KunciLangkahServer,
  type StatusSetup,
} from "@/features/setup/status";

const URUTAN: KunciLangkahServer[] = [
  "namaToko", "owner", "outlet", "kategoriProduk", "produk", "bahanBaku", "pajak", "tipeAset", "aset", "tarif", "gudang",
];

/** Status dengan langkah selesai yang disebut; bahan baku wajib bila ada resep. */
function status(
  selesai: KunciLangkahServer[],
  ubah: Partial<StatusSetup> & { bahanWajib?: boolean } = {},
): StatusSetup {
  const { bahanWajib = false, ...sisa } = ubah;
  return {
    adaToko: selesai.includes("namaToko"),
    plan: "basic",
    inti: { selesai: false, selesaiPada: null },
    fitur: {
      "sesi-booking": { termasukPlan: false, selesai: false, selesaiPada: null },
      wms: { termasukPlan: false, selesai: false, selesaiPada: null },
    },
    langkah: URUTAN.map((kunci) => ({
      kunci,
      bagian: "inti",
      wajibUntuk: ["basic", "advanced", "pro"],
      wajib: kunci === "bahanBaku" ? bahanWajib : true,
      selesai: selesai.includes(kunci) || (kunci === "bahanBaku" && !bahanWajib),
    })),
    ...sisa,
  };
}

describe("status setup", () => {
  it("akun baru mulai dari nama toko", () => {
    expect(indeksAwal(status([]))).toBe(0);
  });

  it("bahan baku tanpa resep tetap disinggahi sampai produk selesai", () => {
    const s = status(["namaToko", "owner", "outlet", "kategoriProduk"]);
    expect(selesaiPerLangkah(s).bahanBaku).toBe(false);
    expect(langkahDariStatus(s)[indeksAwal(s)].kunci).toBe("bahanBaku");
    const sesudahProduk = status(["namaToko", "owner", "outlet", "kategoriProduk", "produk"]);
    expect(selesaiPerLangkah(sesudahProduk).bahanBaku).toBe(true);
    expect(langkahDariStatus(sesudahProduk)[indeksAwal(sesudahProduk)].kunci).toBe("pajak");
  });

  it("bahan baku wajib (ada resep) mengikuti status server", () => {
    const s = status(["namaToko", "owner", "outlet", "kategoriProduk", "produk"], { bahanWajib: true });
    expect(langkahDariStatus(s)[indeksAwal(s)].kunci).toBe("bahanBaku");
  });

  it("booking selesai hanya bila tipe aset, aset, dan tarif selesai", () => {
    const inti: KunciLangkahServer[] = ["namaToko", "owner", "outlet", "kategoriProduk", "produk", "pajak"];
    const pro = { plan: "pro" as const };
    expect(selesaiPerLangkah(status([...inti, "tipeAset", "aset"], pro)).booking).toBe(false);
    const s = status([...inti, "tipeAset", "aset", "tarif"], pro);
    expect(selesaiPerLangkah(s).booking).toBe(true);
    expect(langkahDariStatus(s)[indeksAwal(s)].kunci).toBe("gudang");
  });

  it("langkah mengikuti plan, dan admin dibaca Basic", () => {
    expect(langkahDariStatus(status([], { plan: "advanced" })).map((l) => l.kunci)).toContain("booking");
    expect(langkahDariStatus(status([], { plan: null })).map((l) => l.kunci)).not.toContain("booking");
  });

  it("tuntas memakai selesai per bagian, termasuk fitur yang termasuk plan", () => {
    const fitur = (booking: boolean) => ({
      "sesi-booking": { termasukPlan: true, selesai: booking, selesaiPada: null },
      wms: { termasukPlan: false, selesai: false, selesaiPada: null },
    });
    const inti = { selesai: true, selesaiPada: "2026-11-05T00:00:00.000Z" };
    expect(setupTuntas(status([], { inti, fitur: fitur(false) }))).toBe(false);
    expect(setupTuntas(status([], { inti, fitur: fitur(true) }))).toBe(true);
  });

  it("Owner terdaftar dibaca dari langkah owner", () => {
    expect(ownerTerdaftar(status(["namaToko"]))).toBe(false);
    expect(ownerTerdaftar(status(["namaToko", "owner"]))).toBe(true);
  });
});
