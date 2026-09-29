import * as z from "zod";
import type {
  BuatLokasiPayload,
  Lokasi,
  PerbaruiLokasiPayload,
  TipeLokasi,
} from "@/types/location";

/**
 * Skema form lokasi: setup gudang (keputusan GD3a), dan kelak profil
 * gudang di pengaturan (GD2a). Isian disimpan sebagai teks tanpa z.coerce
 * (cara-kerja.md, Catatan form), sehingga isian kosong tetap kosong, lalu
 * diubah menjadi angka di payloadBuatLokasi. Aturannya mengikuti
 * validators/locationValidator.js backend: nama dan alamat wajib teks yang
 * tidak kosong, koordinat wajib angka sungguhan dalam rentang -90 sampai 90
 * dan -180 sampai 180, serta radius absen 10 sampai 50 meter. Backend
 * menjadikan radius opsional (bawaan model 50), tetapi form tetap
 * mewajibkannya seperti form lama. Setiap refine hanya menangkap satu jenis
 * kesalahan, sehingga setiap isian menampilkan satu pesan.
 */

const angkaAtauKosong = (t: string) => t === "" || Number.isFinite(Number(t));

function teksKoordinat(label: string, batas: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .refine(angkaAtauKosong, `${label} harus berupa angka desimal.`)
    .refine(
      (t) => !Number.isFinite(Number(t)) || Math.abs(Number(t)) <= batas,
      `${label} harus di antara -${batas} dan ${batas}.`,
    );
}

export const skemaLokasi = z.object({
  nama: z.string().trim().min(1, "Nama lokasi wajib diisi."),
  alamat: z.string().trim().min(1, "Alamat wajib diisi."),
  latitude: teksKoordinat("Latitude", 90),
  longitude: teksKoordinat("Longitude", 180),
  radiusAbsen: z
    .string()
    .trim()
    .min(1, "Radius absen wajib diisi.")
    .refine((t) => {
      if (t === "") return true;
      const n = Number(t);
      return Number.isFinite(n) && n >= 10 && n <= 50;
    }, "Radius absen harus di antara 10 dan 50 meter."),
});

export type NilaiFormLokasi = z.infer<typeof skemaLokasi>;

/** Koordinat kosong di awal, diisi lewat Deteksi Otomatis atau manual (GD3a). */
export const NILAI_AWAL_LOKASI: NilaiFormLokasi = {
  nama: "",
  alamat: "",
  latitude: "",
  longitude: "",
  radiusAbsen: "",
};

/**
 * Nilai awal form dari lokasi tersimpan (pengaturan gudang, GD2a).
 * koordinat.coordinates berurutan longitude, latitude (GeoJSON).
 */
export function nilaiAwalLokasi(lokasi: Lokasi): NilaiFormLokasi {
  const [longitude, latitude] = lokasi.koordinat.coordinates;
  return {
    nama: lokasi.nama,
    alamat: lokasi.alamat,
    latitude: String(latitude),
    longitude: String(longitude),
    radiusAbsen: String(lokasi.radiusAbsen),
  };
}

/** Payload PUT /location/:id dari nilai form yang sudah lolos skema, tanpa tipe. */
export function payloadPerbaruiLokasi(nilai: NilaiFormLokasi): PerbaruiLokasiPayload {
  return {
    nama: nilai.nama,
    alamat: nilai.alamat,
    radiusAbsen: Number(nilai.radiusAbsen),
    latitude: Number(nilai.latitude),
    longitude: Number(nilai.longitude),
  };
}

/** Payload POST /location dari nilai form yang sudah lolos skema. */
export function payloadBuatLokasi(nilai: NilaiFormLokasi, tipe: TipeLokasi): BuatLokasiPayload {
  return { ...payloadPerbaruiLokasi(nilai), tipe };
}