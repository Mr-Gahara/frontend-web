import { describe, expect, it } from "vitest";
import { hitungAbsensi, jamWIB, stafRuang } from "@/features/absensi/ringkasan";
import type { MonitoringStaf } from "@/types/absensi";

const STAF = (penggunaID: string, status: MonitoringStaf["status"], waktuMasuk: string | null = null): MonitoringStaf => ({
  penggunaID,
  nama: penggunaID,
  status,
  jumlahSesi: status === "belum_absen" ? 0 : 1,
  sesiTerakhir: waktuMasuk ? { waktuMasuk, waktuSelesai: null } : null,
  totalJamKerja: 0,
});

describe("monitoring absensi", () => {
  it("menyaring staf dengan karyawan ruang (keputusan AB4a)", () => {
    const daftar = [STAF("a", "sedang_bekerja"), STAF("b", "sedang_bekerja"), STAF("c", "belum_absen")];
    expect(stafRuang(daftar, new Set(["a", "c"])).map((s) => s.penggunaID)).toEqual(["a", "c"]);
  });

  it("menghitung yang sedang bekerja dan yang sudah absen (keputusan AB5a)", () => {
    const hasil = hitungAbsensi([STAF("a", "sedang_bekerja"), STAF("b", "sudah_pulang"), STAF("c", "belum_absen")]);
    expect(hasil.sedangBekerja.map((s) => s.penggunaID)).toEqual(["a"]);
    expect(hasil.sudahAbsen).toBe(2);
  });

  it("memformat jam masuk dalam WIB, dan tanda hubung bila kosong atau tidak sah (AB7)", () => {
    expect(jamWIB("2026-09-29T01:05:00.000Z")).toBe("08:05 WIB");
    expect(jamWIB(null)).toBe("-");
    expect(jamWIB("bukan tanggal")).toBe("-");
  });
});