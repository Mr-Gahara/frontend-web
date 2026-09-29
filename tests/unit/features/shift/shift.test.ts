import { describe, expect, it } from "vitest";
import { hitungLintasHari, nilaiAwalShift, payloadShift } from "@/features/shift/payload";
import { filterDaftarShift, KUNCI_LOKASI_SHIFT } from "@/features/shift/ruang";
import { skemaShift, type NilaiFormShift } from "@/features/shift/schema";
import type { ShiftItem } from "@/types/shift";

const SHIFT: ShiftItem = {
  id: "s1",
  namaShift: "Pagi",
  jamMasuk: "08:00",
  jamPulang: "16:00",
  isLintasHari: false,
  toleransiTerlambat: 0,
  status: "Aktif",
  dibuatPada: null,
};

const DASAR: NilaiFormShift = {
  namaShift: "Pagi",
  jamMasuk: "08:00",
  jamPulang: "16:00",
  toleransi: "",
  status: "Aktif",
};

const pesanPertama = (nilai: NilaiFormShift) => {
  const hasil = skemaShift.safeParse(nilai);
  return hasil.success ? null : hasil.error.issues[0].message;
};

describe("hitungLintasHari (keputusan SH2a)", () => {
  it("lintas hari bila jam pulang lebih awal dari jam masuk", () => {
    expect(hitungLintasHari("22:00", "06:00")).toBe(true);
  });

  it("lintas hari untuk shift 24 jam (jam masuk sama dengan jam pulang)", () => {
    expect(hitungLintasHari("08:00", "08:00")).toBe(true);
  });

  it("bukan lintas hari untuk shift biasa", () => {
    expect(hitungLintasHari("08:00", "16:00")).toBe(false);
  });

  it("bukan lintas hari selama jam belum lengkap", () => {
    expect(hitungLintasHari("22:", "06:00")).toBe(false);
    expect(hitungLintasHari("", "")).toBe(false);
  });
});

describe("skemaShift (keputusan SH3a dan SH4a)", () => {
  it("menerima toleransi kosong dan bilangan bulat", () => {
    expect(pesanPertama(DASAR)).toBeNull();
    expect(pesanPertama({ ...DASAR, toleransi: "15" })).toBeNull();
  });

  it("menolak toleransi desimal", () => {
    expect(pesanPertama({ ...DASAR, toleransi: "1.5" })).toBe("Toleransi harus bilangan bulat menit.");
  });

  it("menolak toleransi negatif dengan pesan form lama", () => {
    expect(pesanPertama({ ...DASAR, toleransi: "-15" })).toBe("Toleransi tidak boleh negatif.");
  });

  it("menolak nama berisi spasi saja", () => {
    expect(pesanPertama({ ...DASAR, namaShift: "   " })).toBe("Nama shift wajib diisi.");
  });

  it("menolak jam yang belum lengkap", () => {
    expect(pesanPertama({ ...DASAR, jamMasuk: "08:" })).toBe("Isi jam masuk dengan lengkap.");
    expect(pesanPertama({ ...DASAR, jamPulang: "" })).toBe("Isi jam pulang dengan lengkap.");
  });
});

describe("nilaiAwalShift", () => {
  it("nilai awal buat kosong dan berstatus Aktif", () => {
    expect(nilaiAwalShift(null)).toEqual({
      namaShift: "",
      jamMasuk: "",
      jamPulang: "",
      toleransi: "",
      status: "Aktif",
    });
  });

  it("toleransi 0 tampil kosong saat ubah, seperti form lama", () => {
    expect(nilaiAwalShift(SHIFT).toleransi).toBe("");
    expect(nilaiAwalShift({ ...SHIFT, toleransiTerlambat: 20 }).toleransi).toBe("20");
  });
});

describe("payloadShift", () => {
  it("memangkas nama, mengisi toleransi kosong dengan 0, dan menghitung lintas hari", () => {
    expect(
      payloadShift({ ...DASAR, namaShift: "  Malam ", jamMasuk: "22:00", jamPulang: "06:00" }, null),
    ).toEqual({
      namaShift: "Malam",
      jamMasuk: "22:00",
      jamPulang: "06:00",
      isLintasHari: true,
      toleransiTerlambat: 0,
      status: "Aktif",
    });
  });

  it("membawa lokasi hanya begitu backend memisahkan shift per lokasi (keputusan SH1b)", () => {
    const payload = payloadShift(DASAR, "lokasi-1");
    if (KUNCI_LOKASI_SHIFT === null) {
      expect(Object.keys(payload).sort()).toEqual(
        ["isLintasHari", "jamMasuk", "jamPulang", "namaShift", "status", "toleransiTerlambat"],
      );
    } else {
      expect(payload).toMatchObject({ [KUNCI_LOKASI_SHIFT]: "lokasi-1" });
    }
  });
});

describe("filterDaftarShift", () => {
  it("mengikuti dukungan pemisahan lokasi di backend", () => {
    if (KUNCI_LOKASI_SHIFT === null) {
      expect(filterDaftarShift("gudang", "lokasi-1")).toEqual({ workspace: "gudang" });
    } else {
      expect(filterDaftarShift("outlet", null)).toBeNull();
      expect(filterDaftarShift("outlet", "lokasi-1")).toEqual({ [KUNCI_LOKASI_SHIFT]: "lokasi-1" });
    }
  });
});