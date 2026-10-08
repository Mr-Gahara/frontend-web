import type {
  BuatPelangganPayload,
  Pelanggan,
  PerbaruiPelangganPayload,
} from "@/types/pelanggan";
import type { NilaiFormPelanggan } from "./schema";

/** Isian opsional beserta sebutannya di pesan. */
const ISIAN_OPSIONAL = [
  ["nomorHp", "Nomor HP"],
  ["email", "Email"],
  ["alamat", "Alamat"],
] as const;

export const NILAI_AWAL_PELANGGAN: NilaiFormPelanggan = {
  namaPelanggan: "",
  tipePelanggan: "umum",
  nomorHp: "",
  email: "",
  alamat: "",
};

/** Nilai awal form ubah; isian yang masih null menjadi teks kosong. */
export function nilaiAwalPelanggan(pelanggan: Pelanggan): NilaiFormPelanggan {
  return {
    namaPelanggan: pelanggan.namaPelanggan,
    tipePelanggan: pelanggan.tipePelanggan,
    nomorHp: pelanggan.nomorHp ?? "",
    email: pelanggan.email ?? "",
    alamat: pelanggan.alamat ?? "",
  };
}

/** Payload POST /pelanggan: isian opsional yang kosong tidak dikirim. */
export function payloadBuatPelanggan(nilai: NilaiFormPelanggan): BuatPelangganPayload {
  const payload: BuatPelangganPayload = {
    namaPelanggan: nilai.namaPelanggan,
    tipePelanggan: nilai.tipePelanggan,
  };
  for (const [field] of ISIAN_OPSIONAL) {
    if (nilai[field] !== "") payload[field] = nilai[field];
  }
  return payload;
}

/**
 * Payload PUT /pelanggan/:id: hanya field yang berbeda dari data server
 * (keputusan rancangan butir 15). Isian yang dikosongkan dikirim sebagai
 * teks kosong. Hasil kosong berarti tidak ada perubahan.
 */
export function payloadPerbaruiPelanggan(
  nilai: NilaiFormPelanggan,
  tersimpan: Pelanggan,
): PerbaruiPelangganPayload {
  const awal = nilaiAwalPelanggan(tersimpan);
  const payload: PerbaruiPelangganPayload = {};
  if (nilai.namaPelanggan !== awal.namaPelanggan) payload.namaPelanggan = nilai.namaPelanggan;
  if (nilai.tipePelanggan !== awal.tipePelanggan) payload.tipePelanggan = nilai.tipePelanggan;
  for (const [field] of ISIAN_OPSIONAL) {
    if (nilai[field] !== awal[field]) payload[field] = nilai[field];
  }
  return payload;
}