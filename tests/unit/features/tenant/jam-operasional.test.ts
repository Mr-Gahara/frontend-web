import { describe, expect, it } from "vitest";
import {
  hariLiburToko,
  peringatanShiftJamBuka,
  tanggalLiburToko,
  teksKelompokHari,
} from "@/features/tenant/jam-operasional";
import type { JamHariTenant, JamOperasional } from "@/types/tenant";

const buka = (b: string, t: string): JamHariTenant => ({ status: "buka", jamBuka: b, jamTutup: t });
const LIBUR: JamHariTenant = { status: "libur", jamBuka: null, jamTutup: null };
const DUA_EMPAT: JamHariTenant = { status: "24jam", jamBuka: null, jamTutup: null };
const tertentu = (hari: JamHariTenant[]): JamOperasional => ({ mode: "tertentu", hari });
/** Senin sampai Sabtu 08.00 sampai 22.00, Minggu libur (contoh kanvas). */
const BIASA = tertentu([...Array.from({ length: 6 }, () => buka("08:00", "22:00")), LIBUR]);

describe("teksKelompokHari", () => {
  it("hari berurutan tiga atau lebih menjadi rentang, sisanya disebut", () => {
    expect(teksKelompokHari([0, 1, 2, 3, 4, 5])).toBe("Senin sampai Sabtu");
    expect(teksKelompokHari([4, 5])).toBe("Jumat dan Sabtu");
    expect(teksKelompokHari([0, 2, 4])).toBe("Senin, Rabu, dan Jumat");
    expect(teksKelompokHari([6, 0, 1, 2])).toBe("Senin sampai Rabu dan Minggu");
  });
});

describe("peringatanShiftJamBuka (JO1a)", () => {
  it("pulang lewat jam tutup, seperti kanvas", () => {
    expect(peringatanShiftJamBuka(BIASA, "18:00", "23:00")).toEqual({
      judul: "Shift ini melewati jam tutup toko",
      kalimat: ["Toko tutup pukul 22.00 pada Senin sampai Sabtu, sedangkan shift pulang 23.00."],
      masukMelanggar: false,
      pulangMelanggar: true,
    });
  });

  it("masuk sebelum jam buka, dan keduanya", () => {
    const masuk = peringatanShiftJamBuka(BIASA, "07:00", "15:00");
    expect(masuk?.judul).toBe("Shift ini mulai sebelum toko buka");
    expect(masuk?.kalimat).toEqual(["Toko buka pukul 08.00 pada Senin sampai Sabtu, sedangkan shift masuk 07.00."]);
    const keduanya = peringatanShiftJamBuka(BIASA, "07:00", "23:00");
    expect(keduanya?.judul).toBe("Shift ini di luar jam buka toko");
    expect(keduanya?.kalimat).toHaveLength(2);
  });

  it("satu kalimat per kelompok hari berjam sama", () => {
    const jam = tertentu([
      ...Array.from({ length: 5 }, () => buka("08:00", "21:00")),
      buka("08:00", "23:00"),
      LIBUR,
    ]);
    expect(peringatanShiftJamBuka(jam, "16:00", "22:00")?.kalimat).toEqual([
      "Toko tutup pukul 21.00 pada Senin sampai Jumat, sedangkan shift pulang 22.00.",
    ]);
  });

  it("di dalam jam buka, hari 24 jam dan Libur tidak dihitung", () => {
    expect(peringatanShiftJamBuka(BIASA, "08:00", "16:00")).toBeNull();
    const jam = tertentu([buka("08:00", "22:00"), ...Array.from({ length: 5 }, () => DUA_EMPAT), LIBUR]);
    expect(peringatanShiftJamBuka(jam, "08:00", "22:00")).toBeNull();
  });

  it("jam tutup dan shift lewat tengah malam dibaca menyambung, termasuk luberan malam", () => {
    const malam = tertentu(Array.from({ length: 7 }, () => buka("10:00", "02:00")));
    expect(peringatanShiftJamBuka(malam, "18:00", "01:00")).toBeNull();
    expect(peringatanShiftJamBuka(malam, "00:00", "02:00")).toBeNull();
    expect(peringatanShiftJamBuka(malam, "20:00", "03:00")?.pulangMelanggar).toBe(true);
  });

  it("toko 24 jam, belum diatur, atau jam belum lengkap tanpa peringatan", () => {
    expect(peringatanShiftJamBuka({ mode: "24jam", hari: null }, "00:00", "23:00")).toBeNull();
    expect(peringatanShiftJamBuka(null, "18:00", "23:00")).toBeNull();
    expect(peringatanShiftJamBuka(BIASA, "18:0", "23:00")).toBeNull();
  });
});

describe("hari libur toko (JO2a)", () => {
  it("indeks hari Libur, kosong bila 24 jam atau belum diatur", () => {
    expect([...hariLiburToko(BIASA)]).toEqual([6]);
    expect(hariLiburToko({ mode: "24jam", hari: null }).size).toBe(0);
    expect(hariLiburToko(null).size).toBe(0);
  });

  it("tanggal lokal jatuh pada hari libur", () => {
    const libur = hariLiburToko(BIASA);
    expect(tanggalLiburToko("2026-11-22", libur)).toBe(true);
    expect(tanggalLiburToko("2026-11-23", libur)).toBe(false);
  });
});
