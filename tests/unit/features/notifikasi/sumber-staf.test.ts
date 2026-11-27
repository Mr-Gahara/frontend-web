import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import {
  URL_GENERATE_JADWAL,
  URL_STATUS_STAF,
  pemberitahuanHasilPengajuan,
  pemberitahuanIzinCuti,
  pemberitahuanPerangkatMenunggu,
  pemberitahuanJadwalMingguDepan,
  pemberitahuanKehadiran,
  rentangMingguDepan,
  tahanPengingatAbsensi,
  waktunyaCekJadwal,
} from "@/features/notifikasi/sumber-staf";
import type { JadwalItem } from "@/features/jadwal/tipe";
import { IZIN_HALAMAN } from "@/lib/auth/permissions";
import type { MonitoringStaf } from "@/types/absensi";
import type { IzinCuti } from "@/types/izinCuti";
import type { PengajuanStok } from "@/types/pengajuanStok";

const SEMUA_IZIN = [...new Set(Object.values(IZIN_HALAMAN).flatMap((s) => s.flat()))];
const akses: AksesTautan = { permissions: SEMUA_IZIN, plan: "pro", fiturSiap: { wms: true } };
// Rabu 25 November 2026 10.00 lokal
const kini = new Date(2026, 10, 25, 10, 0);

describe("pemberitahuanIzinCuti", () => {
  it("hanya yang berstatus diajukan, tanpa tautan (ditinjau lewat aplikasi)", () => {
    const izin = (nama: string, status: IzinCuti["status"]) => ({ pengguna: { nama }, status }) as IzinCuti;
    expect(pemberitahuanIzinCuti([izin("A", "disetujui")])).toBeNull();
    const p = pemberitahuanIzinCuti([izin("Ani", "diajukan"), izin("Budi", "diajukan"), izin("C", "ditolak")]);
    expect(p).toMatchObject({ tingkat: "tindakan", tautan: [] });
    expect(p?.isi).toBe("2 pengajuan izin, sakit, atau cuti menunggu persetujuan (Ani, Budi). Tinjau lewat aplikasi.");
  });
});

describe("pemberitahuanKehadiran", () => {
  const jadwal = (id: string, jamMasuk: string, ubah: Partial<JadwalItem> = {}): JadwalItem => ({
    id: "j" + id,
    tanggalKerja: "2026-11-25",
    isLibur: false,
    catatan: null,
    karyawan: { id, nama: id, roleID: null, role: null },
    shift: { id: "s", namaShift: "Pagi", jamMasuk, jamPulang: "17:00", isLintasHari: false, status: "Aktif" },
    ...ubah,
  });
  const staf = (id: string, status: MonitoringStaf["status"], statusAbsensi: "Terlambat" | "Tepat Waktu" | null = null): MonitoringStaf => ({
    penggunaID: id,
    nama: `Staf ${id}`,
    status,
    jumlahSesi: statusAbsensi ? 1 : 0,
    sesiTerakhir: statusAbsensi ? { waktuMasuk: "", waktuSelesai: null, statusAbsensi, menitTerlambat: 5 } : null,
    totalJamKerja: 0,
  });

  it("belum absen hanya bila shift hari ini sudah mulai; staf tanpa jadwal atau libur tidak dihitung", () => {
    const monitoring = [staf("a", "belum_absen"), staf("b", "belum_absen"), staf("c", "belum_absen"), staf("d", "belum_absen")];
    const jadwalHariIni = [jadwal("a", "08:00"), jadwal("b", "13:00"), jadwal("d", "08:00", { isLibur: true, shift: null })];
    const p = pemberitahuanKehadiran(monitoring, jadwalHariIni, kini, akses);
    expect(p?.isi).toBe("1 staf belum absen padahal shiftnya sudah mulai (Staf a).");
    expect(p?.tautan).toEqual([{ href: URL_STATUS_STAF, label: "Lihat status staf" }]);
  });

  it("terlambat dari status kedatangan; tidak ada kartu bila semua tepat waktu", () => {
    const p = pemberitahuanKehadiran([staf("e", "sedang_bekerja", "Terlambat")], [], kini, akses);
    expect(p?.isi).toBe("1 staf absen terlambat (Staf e).");
    expect(pemberitahuanKehadiran([staf("f", "sedang_bekerja", "Tepat Waktu")], [jadwal("f", "08:00")], kini, akses)).toBeNull();
    expect(pemberitahuanKehadiran(null, [], kini, akses)).toBeNull();
  });
});

describe("jadwal minggu depan", () => {
  it("rentang Senin sampai Minggu minggu depan, dicek mulai Kamis sampai Minggu", () => {
    expect(rentangMingguDepan(kini)).toEqual({ startDate: "2026-11-30", endDate: "2026-12-06" });
    expect(rentangMingguDepan(new Date(2026, 10, 29))).toEqual({ startDate: "2026-11-30", endDate: "2026-12-06" });
    expect(waktunyaCekJadwal(kini)).toBe(false); // Rabu
    expect(waktunyaCekJadwal(new Date(2026, 10, 26))).toBe(true); // Kamis
    expect(waktunyaCekJadwal(new Date(2026, 10, 29))).toBe(true); // Minggu
    expect(waktunyaCekJadwal(new Date(2026, 10, 30))).toBe(false); // Senin
  });

  it("kartu hanya bila jadwal minggu depan kosong pada Kamis sampai Minggu", () => {
    const kamis = new Date(2026, 10, 26, 9);
    const p = pemberitahuanJadwalMingguDepan([], kamis, akses);
    expect(p?.isi).toBe("Belum ada jadwal shift outlet untuk 2026-11-30 sampai 2026-12-06.");
    expect(p?.tautan).toEqual([{ href: URL_GENERATE_JADWAL, label: "Buat jadwal" }]);
    expect(pemberitahuanJadwalMingguDepan([{} as JadwalItem], kamis, akses)).toBeNull();
    expect(pemberitahuanJadwalMingguDepan([], kini, akses)).toBeNull();
  });
});

describe("pemberitahuanHasilPengajuan", () => {
  const pengajuan = (id: string, status: PengajuanStok["status"], waktu: Date, pengaju = "saya"): PengajuanStok =>
    ({
      id,
      nomorPengajuan: `PGJ/${id}`,
      status,
      dimintaOleh: { id: pengaju, nama: pengaju },
      tanggalApprove: status === "REJECTED" ? null : waktu.toISOString(),
      updatedAt: waktu.toISOString(),
    }) as PengajuanStok;
  const jamLalu = (j: number) => new Date(kini.getTime() - j * 3_600_000);

  it("milik saya yang diputuskan dalam 24 jam: disetujui lewat tanggalApprove, ditolak lewat updatedAt", () => {
    const p = pemberitahuanHasilPengajuan(
      [
        pengajuan("1", "APPROVED", jamLalu(2)),
        pengajuan("2", "REJECTED", jamLalu(5)),
        pengajuan("3", "COMPLETED", jamLalu(30)),
        pengajuan("4", "APPROVED", jamLalu(1), "orang-lain"),
      ],
      "saya",
      kini,
      akses,
    );
    expect(p?.isi).toBe("Dalam 24 jam terakhir: 1 disetujui (PGJ/1), 1 ditolak (PGJ/2).");
    expect(p?.tautan.map((t) => t.href)).toEqual([
      "/dashboard/outlet/inventaris/pengajuanStok/1",
      "/dashboard/outlet/inventaris/pengajuanStok/2",
    ]);
  });

  it("tidak ada kartu tanpa pengguna aktif atau tanpa keputusan baru", () => {
    expect(pemberitahuanHasilPengajuan([pengajuan("1", "APPROVED", jamLalu(2))], null, kini, akses)).toBeNull();
    expect(pemberitahuanHasilPengajuan([pengajuan("1", "APPROVED", jamLalu(48))], "saya", kini, akses)).toBeNull();
  });
});

describe("pemberitahuanPerangkatMenunggu (PW08, B381)", () => {
  const perangkat = (nama: string | null) => ({ pengguna: nama ? { nama } : null });

  it("tanpa perangkat menunggu atau belum dimuat: tidak ada kartu", () => {
    expect(pemberitahuanPerangkatMenunggu([])).toBeNull();
    expect(pemberitahuanPerangkatMenunggu(null)).toBeNull();
  });

  it("perlu tindakan, angka dan sampai tiga nama, disetujui lewat aplikasi tanpa tautan", () => {
    const p = pemberitahuanPerangkatMenunggu(["Sari", "Budi", "Rina", "Aryo"].map(perangkat));
    expect(p?.tingkat).toBe("tindakan");
    expect(p?.judul).toBe("Perangkat menunggu izin");
    expect(p?.isi).toBe("4 perangkat menunggu izin (Sari, Budi, Rina, dan 1 lainnya). Setujui lewat aplikasi.");
    expect(p?.tautan).toEqual([]);
  });

  it("satu pengguna dengan dua perangkat disebut sekali; pengguna tanpa data menjadi staf", () => {
    const p = pemberitahuanPerangkatMenunggu([perangkat("Sari"), perangkat("Sari"), perangkat(null)]);
    expect(p?.isi).toBe("3 perangkat menunggu izin (Sari, staf). Setujui lewat aplikasi.");
  });
});

describe("tahanPengingatAbsensi (PW19, KS8a)", () => {
  const siap = {
    berizin: true,
    gagal: false,
    pengguna: [{}, {}],
    shift: [{ status: "Non-Aktif" }, { status: "Aktif" }],
    pola: [{}],
  };

  it("tidak ditahan bila ada staf selain Owner, shift aktif, dan pola roster", () => {
    expect(tahanPengingatAbsensi(siap)).toBe(false);
  });

  it("ditahan bila hanya Owner, tanpa shift aktif, atau tanpa pola roster (kasus toko baru)", () => {
    expect(tahanPengingatAbsensi({ ...siap, pengguna: [{}] })).toBe(true);
    expect(tahanPengingatAbsensi({ ...siap, shift: [{ status: "Non-Aktif" }] })).toBe(true);
    expect(tahanPengingatAbsensi({ ...siap, shift: [] })).toBe(true);
    expect(tahanPengingatAbsensi({ ...siap, pola: [] })).toBe(true);
  });

  it("ditahan selama data belum termuat, agar pengingat tidak muncul lalu hilang", () => {
    expect(tahanPengingatAbsensi({ ...siap, pengguna: null })).toBe(true);
    expect(tahanPengingatAbsensi({ ...siap, pola: null })).toBe(true);
  });

  it("tidak berlaku tanpa izin membaca datanya atau bila permintaan gagal (perilaku sebelum PW19)", () => {
    expect(tahanPengingatAbsensi({ ...siap, berizin: false, pengguna: [{}] })).toBe(false);
    expect(tahanPengingatAbsensi({ ...siap, gagal: true, pengguna: null })).toBe(false);
  });
});
