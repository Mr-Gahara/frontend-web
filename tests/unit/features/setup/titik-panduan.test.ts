import { describe, expect, it } from "vitest";
import {
  titikBahan,
  titikBooking,
  titikKategori,
  titikLokasi,
  titikNamaToko,
  titikOwner,
  titikPajak,
  titikProduk,
} from "@/features/setup/titik-panduan";

const target = (t: { target: string }[]) => t.map((x) => x.target);

describe("titik tur wizard setup", () => {
  it("setiap langkah berakhir di tombol lanjut dengan judul mengikuti teks tombolnya", () => {
    const semua = [
      titikNamaToko("Simpan dan lanjut"),
      titikOwner("Simpan dan lanjut"),
      titikLokasi("outlet", "Simpan dan lanjut", false),
      titikKategori("Simpan dan lanjut"),
      titikBahan("Simpan dan lanjut", true),
      titikProduk("Simpan dan lanjut"),
      titikPajak("Simpan dan selesaikan", false),
      titikBooking("Simpan dan lanjut", true),
      titikLokasi("gudang", "Simpan dan selesaikan", true),
    ];
    for (const t of semua) {
      expect(t.at(-1)?.target).toBe("lanjut");
      expect(new Set(target(t)).size, "target tidak berulang dalam satu langkah").toBe(t.length);
    }
    expect(titikPajak("Simpan dan selesaikan", false).at(-1)?.judul).toBe("Tekan Simpan dan selesaikan");
  });

  it("titik tombol tambah bahan baku hanya ada bila ada resep", () => {
    expect(target(titikBahan("Simpan dan lanjut", true))).toEqual(["bahan-resep", "tambah", "lanjut"]);
    expect(target(titikBahan("Simpan dan lanjut", false))).toEqual(["bahan-resep", "lanjut"]);
  });

  it("pajak menambah titik Tambah pajak dan mengganti isi titik lanjut saat sudah ada pajak tersimpan", () => {
    const pertama = titikPajak("Simpan dan lanjut", false);
    const daftar = titikPajak("Simpan dan lanjut", true);
    expect(target(pertama)).toEqual(["pajak-isian", "pajak-cakupan", "pajak-hitung", "lanjut"]);
    expect(target(daftar)).toEqual(["pajak-isian", "pajak-cakupan", "pajak-hitung", "tambah", "lanjut"]);
    expect(pertama.at(-1)?.isi).toBe("Pajak pertama langsung tersimpan saat tombol ini ditekan.");
    expect(daftar.at(-1)?.isi).toBe("Lanjut bila minimal satu pajak aktif.");
  });

  it("titik Lewati hanya untuk langkah yang boleh dilengkapi nanti, tepat sebelum lanjut", () => {
    expect(target(titikLokasi("outlet", "Simpan dan lanjut", false))).not.toContain("lewati");
    expect(target(titikLokasi("gudang", "Simpan dan lanjut", true)).slice(-2)).toEqual(["lewati", "lanjut"]);
    expect(target(titikBooking("Simpan dan lanjut", true)).slice(-2)).toEqual(["lewati", "lanjut"]);
  });

  it("teks lokasi memakai kata outlet atau gudang", () => {
    const outlet = titikLokasi("outlet", "Simpan dan lanjut", false);
    const gudang = titikLokasi("gudang", "Simpan dan lanjut", true);
    expect(outlet[1]).toMatchObject({
      judul: "Ambil koordinat di outlet",
      isi: "Tekan tombol ini saat Anda sedang berada di outlet. Karyawan hanya bisa absen di sekitar titik ini.",
    });
    expect(gudang[1]).toMatchObject({
      judul: "Ambil koordinat di gudang",
      isi: "Tekan tombol ini saat Anda sedang berada di gudang. Staf gudang hanya bisa absen di sekitar titik ini.",
    });
    expect(gudang.at(-1)?.isi).toBe("Anda akan diminta memastikan sedang di gudang sebelum lokasi disimpan.");
  });
});