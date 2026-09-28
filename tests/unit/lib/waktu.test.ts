import { describe, expect, it } from "vitest";
import {
  BATAS_JAM,
  BATAS_MENIT,
  dariTanggalLokal,
  dariTeksWaktu,
  gabungTeksWaktu,
  keTanggalLokal,
  pisahTeksWaktu,
  gabungTanggalWaktu,
  keTeksWaktu,
  rapikanBagian,
  terimaKetikan,
  waktuDari,
  waktuLengkap,
} from "@/lib/waktu";

describe("terimaKetikan", () => {
  it("menerima angka dalam batas", () => {
    expect(terimaKetikan("", "9", BATAS_JAM)).toBe("9");
    expect(terimaKetikan("1", "12", BATAS_JAM)).toBe("12");
    expect(terimaKetikan("5", "59", BATAS_MENIT)).toBe("59");
  });

  it("membuang huruf dan tanda", () => {
    expect(terimaKetikan("", "a", BATAS_JAM)).toBe("");
    expect(terimaKetikan("1", "1a", BATAS_JAM)).toBe("1");
  });

  it("menolak ketikan yang melebihi batas dan mempertahankan nilai sah terakhir (K-TW4a)", () => {
    expect(terimaKetikan("9", "99", BATAS_JAM)).toBe("9");
    expect(terimaKetikan("2", "24", BATAS_JAM)).toBe("2");
    expect(terimaKetikan("6", "60", BATAS_MENIT)).toBe("6");
  });

  it("menolak lebih dari dua digit", () => {
    expect(terimaKetikan("12", "123", BATAS_JAM)).toBe("12");
  });

  it("membiarkan isian dikosongkan (K-TW5a)", () => {
    expect(terimaKetikan("12", "", BATAS_JAM)).toBe("");
  });
});

describe("rapikanBagian", () => {
  it("memberi nol di depan satu digit dan membiarkan isian kosong", () => {
    expect(rapikanBagian("7")).toBe("07");
    expect(rapikanBagian("12")).toBe("12");
    expect(rapikanBagian("")).toBe("");
  });
});

describe("waktuLengkap dan keTeksWaktu", () => {
  it("menganggap lengkap bila jam dan menit terisi dalam batas", () => {
    expect(waktuLengkap({ jam: "7", menit: "5" })).toBe(true);
    expect(keTeksWaktu({ jam: "7", menit: "5" })).toBe("07:05");
  });

  it("menganggap belum lengkap bila salah satu kosong atau di luar batas", () => {
    expect(waktuLengkap({ jam: "", menit: "05" })).toBe(false);
    expect(waktuLengkap({ jam: "24", menit: "00" })).toBe(false);
    expect(waktuLengkap({ jam: "99", menit: "05" })).toBe(false);
    expect(waktuLengkap({ jam: "ab", menit: "05" })).toBe(false);
    expect(keTeksWaktu({ jam: "", menit: "05" })).toBe("");
  });
});

describe("dariTeksWaktu", () => {
  it("memecah teks HH:mm yang sah", () => {
    expect(dariTeksWaktu("08:30")).toEqual({ jam: "08", menit: "30" });
  });

  it("menghasilkan isian kosong untuk teks yang tidak sah", () => {
    expect(dariTeksWaktu("8:30")).toEqual({ jam: "", menit: "" });
    expect(dariTeksWaktu("25:00")).toEqual({ jam: "", menit: "" });
    expect(dariTeksWaktu(undefined)).toEqual({ jam: "", menit: "" });
  });
});

describe("waktuDari", () => {
  it("mengambil jam dan menit dua digit dari Date", () => {
    expect(waktuDari(new Date(2026, 8, 28, 9, 4))).toEqual({ jam: "09", menit: "04" });
  });
});

describe("pisahTeksWaktu dan gabungTeksWaktu", () => {
  it("mempertahankan isian yang belum lengkap agar angka yang baru diketik tidak hilang", () => {
    expect(pisahTeksWaktu("8:")).toEqual({ jam: "8", menit: "" });
    expect(gabungTeksWaktu({ jam: "8", menit: "" })).toBe("8:");
    expect(pisahTeksWaktu("08:30")).toEqual({ jam: "08", menit: "30" });
  });

  it("menghasilkan ':' untuk kedua isian kosong, dan isian kosong dari teks kosong", () => {
    expect(gabungTeksWaktu({ jam: "", menit: "" })).toBe(":");
    expect(pisahTeksWaktu(":")).toEqual({ jam: "", menit: "" });
    expect(pisahTeksWaktu(undefined)).toEqual({ jam: "", menit: "" });
  });
});

describe("keTanggalLokal dan dariTanggalLokal", () => {
  it("mengubah Date menjadi YYYY-MM-DD lokal dan kembali", () => {
    expect(keTanggalLokal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    const hasil = dariTanggalLokal("2026-01-05");
    expect([hasil?.getFullYear(), hasil?.getMonth(), hasil?.getDate(), hasil?.getHours()]).toEqual([2026, 0, 5, 0]);
  });

  it("menghasilkan undefined untuk teks kosong, bentuk lain, atau tanggal yang tidak ada", () => {
    expect(dariTanggalLokal("")).toBeUndefined();
    expect(dariTanggalLokal(undefined)).toBeUndefined();
    expect(dariTanggalLokal("05/01/2026")).toBeUndefined();
    expect(dariTanggalLokal("2026-02-30")).toBeUndefined();
  });
});

describe("gabungTanggalWaktu", () => {
  it("memasang jam dan menit pada tanggal itu dengan detik dan milidetik 0", () => {
    const hasil = gabungTanggalWaktu(new Date(2026, 8, 28, 15, 33, 12, 500), { jam: "08", menit: "05" });
    expect(hasil).not.toBeNull();
    expect(hasil!.getDate()).toBe(28);
    expect(hasil!.getHours()).toBe(8);
    expect(hasil!.getMinutes()).toBe(5);
    expect(hasil!.getSeconds()).toBe(0);
    expect(hasil!.getMilliseconds()).toBe(0);
  });

  it("mengembalikan null untuk waktu yang belum lengkap, sehingga tanggal tidak pernah bergeser", () => {
    expect(gabungTanggalWaktu(new Date(2026, 8, 28), { jam: "99", menit: "05" })).toBeNull();
    expect(gabungTanggalWaktu(new Date(2026, 8, 28), { jam: "", menit: "05" })).toBeNull();
  });
});