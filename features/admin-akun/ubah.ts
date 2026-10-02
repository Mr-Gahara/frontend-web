import { z } from "zod";
import type { AkunAdmin, PerbaruiAkunPayload } from "@/types/adminAkun";
import { skemaBuatAkunKlien } from "./schema";

/**
 * PUT /akun/admin/users/:id tidak punya validator di backend, sehingga
 * aturannya ditegakkan di sini dengan aturan yang sama dengan buat akun.
 * Password kosong berarti tidak diganti.
 */
export const skemaUbahAkun = skemaBuatAkunKlien.pick({ email: true, username: true }).extend({
  password: z
    .string()
    .refine(
      (v): boolean => v === "" || (v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v)),
      "Password baru minimal 8 karakter, dengan huruf kapital dan angka, atau kosongkan.",
    ),
});

export type NilaiUbahAkun = z.infer<typeof skemaUbahAkun>;

export function nilaiAwalUbahAkun(akun: AkunAdmin): NilaiUbahAkun {
  return { email: akun.email, username: akun.username ?? "", password: "" };
}

/**
 * Hanya field yang berubah dibanding data server (keputusan rancangan butir
 * 15). Email dibandingkan tanpa membedakan huruf, karena backend
 * menyimpannya huruf kecil; username yang dikosongkan dikirim sebagai null;
 * password hanya dikirim bila diisi.
 */
export function payloadPerbaruiAkun(nilai: NilaiUbahAkun, akun: AkunAdmin): PerbaruiAkunPayload {
  const payload: PerbaruiAkunPayload = {};
  const email = nilai.email.trim();
  if (email.toLowerCase() !== akun.email.toLowerCase()) payload.email = email;
  const username = nilai.username.trim();
  if (username !== (akun.username ?? "")) payload.username = username || null;
  if (nilai.password) payload.password = nilai.password;
  return payload;
}

export interface AksiKelolaAkun {
  ubah: boolean;
  hapusTampil: boolean;
  hapusAktif: boolean;
}

/**
 * Ubah dan hapus hanya untuk akun klien (keputusan PA13a). Tombol hapus
 * selalu tampil untuk akun klien, tetapi hanya aktif bagi akun non-aktif,
 * karena backend menolak menghapus akun aktif (PA14a).
 */
export function aksiKelolaAkun(akun: AkunAdmin): AksiKelolaAkun {
  const klien = akun.role === "client";
  return { ubah: klien, hapusTampil: klien, hapusAktif: klien && akun.status === "non-aktif" };
}