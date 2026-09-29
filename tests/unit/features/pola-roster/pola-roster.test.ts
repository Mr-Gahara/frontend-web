import { describe, expect, it } from "vitest";
import {
  labelShiftPola,
  nilaiAwalPolaRoster,
  payloadPolaRoster,
  sesuaikanRincian,
  tambahLokasiPolaRoster,
  teksLabelShift,
  terimaKetikanSiklus,
} from "@/features/pola-roster/payload";
import { filterDaftarPola, KUNCI_LOKASI_POLA_ROSTER } from "@/features/pola-roster/ruang";
import { buatSkemaPolaRoster, type NilaiFormPolaRoster } from "@/features/pola-roster/schema";
import type { PolaRosterItem } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";

const SHIFT = (id: string, namaShift: string, status: ShiftItem["status"]): ShiftItem => ({
  id,
  namaShift,
  jamMasuk: "08:00",
  jamPulang: "16:00",
  isLintasHari: false,
  toleransiTerlambat: 0,
  status,
  dibuatPada: null,
});

const SKEMA = buatSkemaPolaRoster(new Set(["aktif-1"]));

const pesanPertama = (nilai: NilaiFormPolaRoster) => {
  const hasil = SKEMA.safeParse(nilai);
  return hasil.success ? null : hasil.error.issues[0].message;
};

const DASAR: NilaiFormPolaRoster = {
  namaPola: "Reguler",
  siklus: "2",
  detailSiklus: [
    { hariKe: 1, isLibur: false, shiftID: "aktif-1" },
    { hariKe: 2, isLibur: true, shiftID: "" },
  ],
};

describe("terimaKetikanSiklus (keputusan PL3a dan PL4a)", () => {
  it("menerima angka sampai 31", () => {
    expect(terimaKetikanSiklus("7", "31")).toBe("31");
  });

  it("menolak ketikan di atas 31 dan mempertahankan nilai sebelumnya", () => {
    expect(terimaKetikanSiklus("3", "32")).toBe("3");
  });

  it("membuang selain angka dan menerima isian kosong", () => {
    expect(terimaKetikanSiklus("7", "a1")).toBe("1");
    expect(terimaKetikanSiklus("7", "")).toBe("");
  });
});

describe("sesuaikanRincian", () => {
  it("mempertahankan baris lama beserta shift-nya, dan menambah baris libur", () => {
    const hasil = sesuaikanRincian(DASAR.detailSiklus, 3);
    expect(hasil).toEqual([...DASAR.detailSiklus, { hariKe: 3, isLibur: true, shiftID: "" }]);
  });

  it("memotong baris di atas jumlah baru", () => {
    expect(sesuaikanRincian(DASAR.detailSiklus, 1)).toEqual([DASAR.detailSiklus[0]]);
  });
});

describe("nilaiAwalPolaRoster", () => {
  it("nilai awal buat berisi 7 hari libur", () => {
    const awal = nilaiAwalPolaRoster(null);
    expect(awal.siklus).toBe("7");
    expect(awal.detailSiklus).toHaveLength(7);
    expect(awal.detailSiklus.every((d) => d.isLibur && d.shiftID === "")).toBe(true);
  });

  it("nilai awal ubah memakai id shift dari populate bila shiftID kosong", () => {
    const pola: PolaRosterItem = {
      id: "p1",
      namaPola: "Reguler",
      siklusHari: 1,
      detailSiklus: [{ hariKe: 1, isLibur: false, shiftID: null, shift: { id: "aktif-1" } }],
    };
    expect(nilaiAwalPolaRoster(pola).detailSiklus).toEqual([
      { hariKe: 1, isLibur: false, shiftID: "aktif-1" },
    ]);
  });
});

describe("payloadPolaRoster", () => {
  it("memangkas nama dan hanya mengirim shiftID untuk hari kerja", () => {
    expect(payloadPolaRoster({ ...DASAR, namaPola: "  Reguler " })).toEqual({
      namaPola: "Reguler",
      siklusHari: 2,
      detailSiklus: [
        { hariKe: 1, isLibur: false, shiftID: "aktif-1" },
        { hariKe: 2, isLibur: true },
      ],
    });
  });
});

describe("buatSkemaPolaRoster (keputusan PL1a dan PL2a)", () => {
  it("menolak nama berisi spasi saja", () => {
    expect(pesanPertama({ ...DASAR, namaPola: "   " })).toBe("Nama Pola wajib diisi.");
  });

  it("menolak siklus kosong", () => {
    expect(pesanPertama({ ...DASAR, siklus: "" })).toBe("Jumlah siklus minimal adalah 1 hari.");
  });

  it("menolak hari kerja tanpa shift", () => {
    expect(
      pesanPertama({ ...DASAR, detailSiklus: [{ hariKe: 1, isLibur: false, shiftID: "" }, DASAR.detailSiklus[1]] }),
    ).toBe("Ada baris hari kerja yang belum dipilih master shift-nya.");
  });

  it("menolak shift yang sudah nonaktif", () => {
    expect(
      pesanPertama({ ...DASAR, detailSiklus: [{ hariKe: 1, isLibur: false, shiftID: "arsip-1" }, DASAR.detailSiklus[1]] }),
    ).toBe("Shift pada hari ke-1 sudah nonaktif; pilih shift lain atau Libur.");
  });
});

describe("labelShiftPola (keputusan PL1a)", () => {
  it("memberi penanda nonaktif dari daftar shift", () => {
    const label = labelShiftPola({ shiftID: "arsip-1" }, [SHIFT("arsip-1", "Shift Lama", "Non-Aktif")]);
    expect(teksLabelShift(label)).toBe("Shift Lama (nonaktif)");
  });

  it("memakai shift hasil populate bila tidak ada di daftar", () => {
    const label = labelShiftPola(
      { shiftID: "arsip-2", shift: { id: "arsip-2", namaShift: "Shift Arsip", status: "Non-Aktif" } },
      [],
    );
    expect(teksLabelShift(label)).toBe("Shift Arsip (nonaktif)");
  });
});

describe("pemisahan per ruang (keputusan PL5)", () => {
  it("filter dan payload mengikuti dukungan lokasi di backend", () => {
    const payload = payloadPolaRoster(DASAR);
    if (KUNCI_LOKASI_POLA_ROSTER === null) {
      expect(filterDaftarPola("lokasi-1")).toEqual({});
      expect(tambahLokasiPolaRoster(payload, "lokasi-1")).toEqual(payload);
    } else {
      expect(filterDaftarPola(null)).toBeNull();
      expect(tambahLokasiPolaRoster(payload, "lokasi-1")).toMatchObject({
        [KUNCI_LOKASI_POLA_ROSTER]: "lokasi-1",
      });
    }
  });
});