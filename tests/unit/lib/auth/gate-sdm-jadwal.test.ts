import { describe, expect, it } from "vitest";
import { aksiJadwal } from "@/features/jadwal/izin";
import { aksiPolaRoster } from "@/features/pola-roster/izin";
import { aksiShift } from "@/features/shift/izin";
import { bolehBukaHalaman, IZIN } from "@/lib/auth/permissions";

const RUANG = ["/dashboard/outlet", "/dashboard/gudang"];
const KALENDER = [IZIN.location, IZIN.pengguna, IZIN.jadwalShift, IZIN.shift];
const GENERATE = [IZIN.location, IZIN.pengguna, IZIN.shift, IZIN.polaRoster, IZIN.buatJadwalShift];

describe("gate halaman shift, pola roster, dan jadwal (B139, B140, B168)", () => {
  it.each(RUANG)("%s: setiap halaman terbuka dengan izin bacanya beserta read-location", (ruang) => {
    expect(bolehBukaHalaman(`${ruang}/shift`, [IZIN.location, IZIN.shift])).toBe(true);
    expect(bolehBukaHalaman(`${ruang}/pola-roster`, [IZIN.location, IZIN.polaRoster, IZIN.shift])).toBe(true);
    expect(bolehBukaHalaman(`${ruang}/jadwal`, KALENDER)).toBe(true);
    expect(bolehBukaHalaman(`${ruang}/jadwal/generate`, GENERATE)).toBe(true);
  });

  it.each(RUANG)("%s: tanpa izin modulnya halaman tertutup", (ruang) => {
    expect(bolehBukaHalaman(`${ruang}/shift`, [IZIN.location])).toBe(false);
    expect(bolehBukaHalaman(`${ruang}/pola-roster`, [IZIN.location, IZIN.shift])).toBe(false);
    expect(bolehBukaHalaman(`${ruang}/jadwal`, [IZIN.location, IZIN.pengguna, IZIN.shift])).toBe(false);
    expect(bolehBukaHalaman(`${ruang}/jadwal/generate`, KALENDER)).toBe(false);
  });

  it("lokasi ruang wajib, karena shift dan pola disaring per lokasi", () => {
    expect(bolehBukaHalaman("/dashboard/outlet/shift", [IZIN.shift])).toBe(false);
  });
});

describe("aksi shift, pola roster, dan jadwal", () => {
  it("mengikuti izin create, update, dan delete masing-masing", () => {
    expect(aksiShift([IZIN.ubahShift])).toEqual({ buat: false, ubah: true, nonaktifkan: false });
    expect(aksiShift([IZIN.buatShift, IZIN.hapusShift])).toEqual({ buat: true, ubah: false, nonaktifkan: true });
    expect(aksiPolaRoster([IZIN.hapusPolaRoster])).toEqual({ buat: false, ubah: false, hapus: true });
  });

  it("generate di kalender mengikuti gerbang halaman generate", () => {
    const url = "/dashboard/outlet/jadwal/generate";
    expect(aksiJadwal([IZIN.buatJadwalShift], url)).toMatchObject({ buat: true, generate: false });
    expect(aksiJadwal(GENERATE, url)).toMatchObject({ buat: true, ubah: false, hapus: false, generate: true });
  });
});
