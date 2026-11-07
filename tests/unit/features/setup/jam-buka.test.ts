import { describe, expect, it } from "vitest";
import {
  bolehSamakan,
  HARI,
  HARI_KOSONG,
  masalahHari,
  masalahJamBuka,
  NILAI_AWAL_JAM_BUKA,
  penutupan,
  ringkasHari,
  samakanSemua,
  segmenHari,
  semuaLibur,
  sumberSamakan,
  type JamHari,
  type NilaiJamBuka,
} from "@/features/setup/jam-buka";

const jam = (buka: string, tutup: string): JamHari => {
  const [bj, bm] = buka.split(":");
  const [tj, tm] = tutup.split(":");
  return { status: "buka", buka: { jam: bj, menit: bm }, tutup: { jam: tj, menit: tm } };
};
const DUA_EMPAT: JamHari = { ...HARI_KOSONG, status: "24jam" };
const LIBUR: JamHari = { ...HARI_KOSONG, status: "libur" };
const tertentu = (hari: JamHari[]): NilaiJamBuka => ({ mode: "tertentu", hari });

describe("nilai awal", () => {
  it("tanpa pilihan bawaan, tujuh hari Senin sampai Minggu berstatus Buka dengan jam kosong", () => {
    expect(NILAI_AWAL_JAM_BUKA.mode).toBeNull();
    expect(HARI).toEqual(["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]);
    expect(NILAI_AWAL_JAM_BUKA.hari).toHaveLength(7);
    expect(NILAI_AWAL_JAM_BUKA.hari.every((h) => h.status === "buka" && h.buka.jam === "" && h.tutup.menit === "")).toBe(true);
  });
});

describe("masalahHari", () => {
  it("hari Buka wajib jam buka dan jam tutup lengkap", () => {
    expect(masalahHari(HARI_KOSONG)).toBe("Isi jam buka dan jam tutup.");
    expect(masalahHari(jam("08:00", ":"))).toBe("Isi jam buka dan jam tutup.");
    expect(masalahHari(jam("08:", "22:00"))).toBe("Isi jam buka dan jam tutup.");
  });

  it("jam buka sama dengan jam tutup ditolak, sesuai validator tenant backend", () => {
    expect(masalahHari(jam("08:00", "08:00"))).toBe("Jam buka dan jam tutup tidak boleh sama.");
    expect(masalahHari(jam("8:0", "08:00"))).toBe("Jam buka dan jam tutup tidak boleh sama.");
  });

  it("jam sah, termasuk yang tutup lewat tengah malam", () => {
    expect(masalahHari(jam("08:00", "22:00"))).toBeNull();
    expect(masalahHari(jam("10:00", "02:00"))).toBeNull();
  });

  it("hari 24 jam dan Libur selalu sah walau jamnya kosong", () => {
    expect(masalahHari(DUA_EMPAT)).toBeNull();
    expect(masalahHari(LIBUR)).toBeNull();
  });
});

describe("masalahJamBuka", () => {
  it("wajib memilih buka 24 jam atau jam tertentu", () => {
    expect(masalahJamBuka(NILAI_AWAL_JAM_BUKA)).toBe("Pilih salah satu: buka 24 jam atau jam tertentu.");
  });

  it("buka 24 jam sah tanpa memeriksa jam per hari", () => {
    expect(masalahJamBuka({ ...NILAI_AWAL_JAM_BUKA, mode: "24jam" })).toBeNull();
  });

  it("jam tertentu ditolak selama ada hari Buka yang jamnya belum sah", () => {
    expect(masalahJamBuka({ ...NILAI_AWAL_JAM_BUKA, mode: "tertentu" })).toBe("Masih ada hari yang jamnya belum lengkap.");
    const hari = [jam("08:00", "22:00"), jam("08:00", "08:00"), ...Array(5).fill(LIBUR)];
    expect(masalahJamBuka(tertentu(hari))).toBe("Masih ada hari yang jamnya belum lengkap.");
  });

  it("jam tertentu sah bila setiap hari Buka sah, termasuk campuran 24 jam dan Libur", () => {
    const hari = [LIBUR, jam("09:00", "01:00"), jam("09:00", "21:00"), jam("09:00", "21:00"), jam("09:00", "21:00"), DUA_EMPAT, jam("09:00", "21:00")];
    expect(masalahJamBuka(tertentu(hari))).toBeNull();
  });

  it("semua hari Libur tetap boleh disimpan, dengan peringatan", () => {
    const n = tertentu(Array(7).fill(LIBUR));
    expect(masalahJamBuka(n)).toBeNull();
    expect(semuaLibur(n)).toBe(true);
    expect(semuaLibur({ mode: "24jam", hari: Array(7).fill(LIBUR) })).toBe(false);
    expect(semuaLibur(tertentu([jam("08:00", "22:00"), ...Array(6).fill(LIBUR)]))).toBe(false);
  });
});

describe("penutupan", () => {
  it("jam tutup lebih kecil dari jam buka berarti tutup keesokan harinya, dengan nama harinya", () => {
    expect(penutupan(jam("10:00", "02:00"), 0)).toEqual({ jenis: "besok", teks: "Tutup keesokan harinya, Selasa pukul 02.00" });
    expect(penutupan(jam("10:00", "02:00"), 6)).toEqual({ jenis: "besok", teks: "Tutup keesokan harinya, Senin pukul 02.00" });
  });

  it("selain itu tutup di hari yang sama", () => {
    expect(penutupan(jam("08:00", "22:00"), 2)).toEqual({ jenis: "sama", teks: "Tutup di hari yang sama, pukul 22.00" });
    expect(penutupan(jam("8:0", "9:5"), 2)).toEqual({ jenis: "sama", teks: "Tutup di hari yang sama, pukul 09.05" });
  });

  it("tanpa keterangan untuk jam yang belum sah, hari 24 jam, dan hari Libur", () => {
    expect(penutupan(HARI_KOSONG, 0)).toBeNull();
    expect(penutupan(jam("08:00", "08:00"), 0)).toBeNull();
    expect(penutupan(DUA_EMPAT, 0)).toBeNull();
    expect(penutupan(LIBUR, 0)).toBeNull();
  });
});

describe("ringkasHari dan segmenHari", () => {
  it("ringkasan di samping nama hari", () => {
    expect(ringkasHari(jam("10:00", "02:00"))).toBe("10.00 sampai 02.00");
    expect(ringkasHari(DUA_EMPAT)).toBe("Buka 24 jam");
    expect(ringkasHari(LIBUR)).toBe("Libur");
    expect(ringkasHari(HARI_KOSONG)).toBe("Jam belum lengkap");
  });

  it("bilah terisi dari jam buka sampai jam tutup", () => {
    expect(segmenHari(jam("06:00", "18:00"))).toEqual({ kiri: 25, lebar: 50, lewatMalam: false });
  });

  it("hari yang tutup keesokan harinya terisi sampai ujung bilah", () => {
    expect(segmenHari(jam("18:00", "02:00"))).toEqual({ kiri: 75, lebar: 25, lewatMalam: true });
  });

  it("24 jam penuh; Libur dan jam belum sah kosong", () => {
    expect(segmenHari(DUA_EMPAT)).toEqual({ kiri: 0, lebar: 100, lewatMalam: false });
    expect(segmenHari(LIBUR).lebar).toBe(0);
    expect(segmenHari(HARI_KOSONG).lebar).toBe(0);
  });
});

describe("samakan semua hari", () => {
  it("sumbernya hari pertama berstatus Buka yang jamnya sah", () => {
    expect(sumberSamakan([LIBUR, HARI_KOSONG, jam("09:00", "21:00"), jam("10:00", "22:00")])).toBe(2);
    expect(sumberSamakan(Array(7).fill(HARI_KOSONG))).toBe(-1);
  });

  it("menimpa setiap hari Buka lain, termasuk yang sudah berisi jam berbeda, tanpa mengubah 24 jam dan Libur", () => {
    const hari = [LIBUR, jam("09:00", "01:00"), HARI_KOSONG, jam("07:00", "15:00"), DUA_EMPAT, HARI_KOSONG, LIBUR];
    const hasil = samakanSemua(hari);
    expect(hasil[0]).toBe(LIBUR);
    expect(hasil[4]).toBe(DUA_EMPAT);
    expect(hasil[6]).toBe(LIBUR);
    for (const i of [1, 2, 3, 5]) {
      expect(ringkasHari(hasil[i]), HARI[i]).toBe("09.00 sampai 01.00");
    }
  });

  it("salinan jam tidak berbagi objek dengan hari sumber", () => {
    const hasil = samakanSemua([jam("09:00", "21:00"), HARI_KOSONG]);
    expect(hasil[1].buka).not.toBe(hasil[0].buka);
    expect(hasil[1].buka).toEqual(hasil[0].buka);
  });

  it("tombol tampil hanya bila ada sumber dan hari Buka lain", () => {
    expect(bolehSamakan([jam("09:00", "21:00"), HARI_KOSONG, LIBUR])).toBe(true);
    expect(bolehSamakan([jam("09:00", "21:00"), LIBUR, DUA_EMPAT])).toBe(false);
    expect(bolehSamakan([HARI_KOSONG, HARI_KOSONG])).toBe(false);
  });
});