import type { BuatAkunKlienPayload, DurasiLangganan } from "@/types/adminAkun";
import type { NilaiBuatAkunKlien } from "./schema";

export const NILAI_AWAL_AKUN_KLIEN: NilaiBuatAkunKlien = {
  email: "",
  username: "",
  password: "",
  durasi: "percobaan",
};

/**
 * Payload POST /akun/admin/users. Username kosong dan masa percobaan tidak
 * dikirim, karena backend memperlakukan ketiadaannya sebagai bawaan.
 */
export function payloadBuatAkunKlien(nilai: NilaiBuatAkunKlien): BuatAkunKlienPayload {
  const payload: BuatAkunKlienPayload = { email: nilai.email.trim(), password: nilai.password };
  const username = nilai.username.trim();
  if (username) payload.username = username;
  if (nilai.durasi !== "percobaan") payload.durasiBulan = Number(nilai.durasi) as DurasiLangganan;
  return payload;
}