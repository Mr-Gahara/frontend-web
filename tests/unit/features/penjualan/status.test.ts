import { describe, expect, it } from "vitest";
import { aksiPenjualan, IZIN_PENJUALAN } from "@/features/penjualan/izin";
import { TAMPILAN_STATUS_PENJUALAN } from "@/features/penjualan/tampilan";
import type { Penjualan } from "@/types/penjualan";

type Dasar = Pick<Penjualan, "statusPenjualan" | "sisaTagihan" | "totalDibayar" | "jenisTransaksi">;

const SEMUA_IZIN = Object.values(IZIN_PENJUALAN);

function jual(ubah: Partial<Dasar>): Dasar {
  return { statusPenjualan: "UNPAID", sisaTagihan: 10000, totalDibayar: 0, jenisTransaksi: "INVOICE", ...ubah };
}

const TANPA_AKSI = { finalisasi: false, bayar: false, void: false, hapus: false };

describe("aksiPenjualan", () => {
  it("DRAFT: finalisasi, void, dan hapus, tetapi belum dapat dibayar", () => {
    expect(aksiPenjualan(jual({ statusPenjualan: "DRAFT" }), SEMUA_IZIN)).toEqual({
      finalisasi: true,
      bayar: false,
      void: true,
      hapus: true,
    });
  });

  it("DRAFT POS tidak difinalisasi dari web, sama dengan halaman lama", () => {
    expect(aksiPenjualan(jual({ statusPenjualan: "DRAFT", jenisTransaksi: "POS" }), SEMUA_IZIN).finalisasi).toBe(false);
  });

  it("UNPAID tanpa pembayaran: dapat dibayar dan di-void", () => {
    expect(aksiPenjualan(jual({}), SEMUA_IZIN)).toEqual({ finalisasi: false, bayar: true, void: true, hapus: false });
  });

  it("PARTIAL: hanya dapat dibayar; void menunggu pembayarannya dibatalkan", () => {
    expect(aksiPenjualan(jual({ statusPenjualan: "PARTIAL", totalDibayar: 4000, sisaTagihan: 6000 }), SEMUA_IZIN)).toEqual({
      finalisasi: false,
      bayar: true,
      void: false,
      hapus: false,
    });
  });

  it("PAID dan VOID: tanpa aksi", () => {
    expect(aksiPenjualan(jual({ statusPenjualan: "PAID", totalDibayar: 10000, sisaTagihan: 0 }), SEMUA_IZIN)).toEqual(TANPA_AKSI);
    expect(aksiPenjualan(jual({ statusPenjualan: "VOID" }), SEMUA_IZIN)).toEqual(TANPA_AKSI);
  });

  it("aksi mengikuti izin endpoint-nya (keputusan rancangan butir 14)", () => {
    expect(aksiPenjualan(jual({ statusPenjualan: "DRAFT" }), [])).toEqual(TANPA_AKSI);
    expect(aksiPenjualan(jual({}), [IZIN_PENJUALAN.bayar])).toEqual({ ...TANPA_AKSI, bayar: true });
    expect(aksiPenjualan(jual({ statusPenjualan: "DRAFT" }), [IZIN_PENJUALAN.hapus])).toEqual({ ...TANPA_AKSI, hapus: true });
  });
});

describe("TAMPILAN_STATUS_PENJUALAN", () => {
  it("satu label untuk kelima status backend", () => {
    const label = Object.fromEntries(Object.entries(TAMPILAN_STATUS_PENJUALAN).map(([k, v]) => [k, v.label]));
    expect(label).toEqual({ DRAFT: "Draft", UNPAID: "Belum Bayar", PARTIAL: "Sebagian", PAID: "Lunas", VOID: "Batal" });
  });
});