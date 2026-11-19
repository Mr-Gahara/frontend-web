import { describe, it, expect } from "vitest";
import { labelPilPeriode, labelRentang, periodeCepatTerpilih, rentangPeriodeCepat } from "@/lib/filter";

const t = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const HARI_INI = t(2026, 11, 19);

describe("rentangPeriodeCepat", () => {
  it("hari ini, 7 hari termasuk hari ini, dan bulan ini dari tanggal 1", () => {
    expect(rentangPeriodeCepat("hari-ini", HARI_INI)).toEqual({ dari: HARI_INI, sampai: HARI_INI });
    expect(rentangPeriodeCepat("7-hari", HARI_INI)).toEqual({ dari: t(2026, 11, 13), sampai: HARI_INI });
    expect(rentangPeriodeCepat("bulan-ini", HARI_INI)).toEqual({ dari: t(2026, 11, 1), sampai: HARI_INI });
  });

  it("7 hari melintasi bulan", () => {
    expect(rentangPeriodeCepat("7-hari", t(2026, 12, 3)).dari).toEqual(t(2026, 11, 27));
  });
});

describe("periodeCepatTerpilih", () => {
  it("mengenali rentang yang cocok persis", () => {
    expect(periodeCepatTerpilih({ dari: t(2026, 11, 1), sampai: HARI_INI }, HARI_INI)).toBe("bulan-ini");
    expect(periodeCepatTerpilih({ dari: HARI_INI, sampai: HARI_INI }, HARI_INI)).toBe("hari-ini");
  });

  it("null bila salah satu kosong atau tidak cocok", () => {
    expect(periodeCepatTerpilih({ dari: t(2026, 11, 1), sampai: undefined }, HARI_INI)).toBeNull();
    expect(periodeCepatTerpilih({ dari: t(2026, 11, 2), sampai: HARI_INI }, HARI_INI)).toBeNull();
  });

  it("bulan ini kemarin tidak lagi terpilih setelah hari berganti", () => {
    const kemarin = { dari: t(2026, 11, 1), sampai: t(2026, 11, 18) };
    expect(periodeCepatTerpilih(kemarin, HARI_INI)).toBeNull();
  });
});

describe("labelRentang", () => {
  it("bulan sama, bulan beda, tahun beda, dan satu hari", () => {
    expect(labelRentang({ dari: t(2026, 11, 1), sampai: HARI_INI })).toBe("1 – 19 Nov 2026");
    expect(labelRentang({ dari: t(2026, 10, 28), sampai: t(2026, 11, 3) })).toBe("28 Okt – 3 Nov 2026");
    expect(labelRentang({ dari: t(2025, 12, 30), sampai: t(2026, 1, 2) })).toBe("30 Des 2025 – 2 Jan 2026");
    expect(labelRentang({ dari: HARI_INI, sampai: HARI_INI })).toBe("19 Nov 2026");
  });

  it("hanya satu sisi, atau kosong", () => {
    expect(labelRentang({ dari: t(2026, 11, 1), sampai: undefined })).toBe("Sejak 1 Nov 2026");
    expect(labelRentang({ dari: undefined, sampai: HARI_INI })).toBe("Sampai 19 Nov 2026");
    expect(labelRentang({ dari: undefined, sampai: undefined })).toBeNull();
  });
});

describe("labelPilPeriode", () => {
  it("menyebut nama periode cepat bila cocok", () => {
    expect(labelPilPeriode({ dari: t(2026, 11, 1), sampai: HARI_INI }, HARI_INI)).toBe("Bulan ini · 1 – 19 Nov 2026");
    expect(labelPilPeriode({ dari: t(2026, 11, 2), sampai: HARI_INI }, HARI_INI)).toBe("2 – 19 Nov 2026");
    expect(labelPilPeriode({ dari: undefined, sampai: undefined }, HARI_INI)).toBeNull();
  });
});
