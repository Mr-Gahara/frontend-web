import type { Membership, PaketMembership, StatusMembership } from "@/types/membership";
import type { Pelanggan } from "@/types/pelanggan";
import type { Penjualan } from "@/types/penjualan";

/**
 * Aturan tampilan modul membership (desain B, MB1a sampai MB3a; pemilik
 * proyek, 17 November 2026) sebagai fungsi murni. Masa berlaku dihitung
 * backend dalam hari WIB, sehingga seluruh tanggal di sini dibaca di zona
 * Asia/Jakarta, tidak mengikuti zona perangkat.
 */

const HARI_MS = 86_400_000;
const WIB_MS = 7 * 3_600_000;
const ZONA = "Asia/Jakarta";

/** Nomor hari WIB sejak epoch; dua waktu di hari WIB yang sama memberi nomor sama. */
export function nomorHariWIB(waktu: Date | string): number {
  return Math.floor((new Date(waktu).getTime() + WIB_MS) / HARI_MS);
}

const fmt = (opsi: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, ...opsi });
const HARI_BULAN = fmt({ day: "numeric", month: "short" });
const HARI_BULAN_TAHUN = fmt({ day: "numeric", month: "short", year: "numeric" });
const TAHUN = fmt({ year: "numeric" });

/** Tanggal kalender (tengah malam lokal) untuk hari WIB dari waktu itu, untuk isian tanggal mulai. */
export function tanggalWIB(iso: string): Date {
  const bagian = Object.fromEntries(
    fmt({ year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(new Date(iso))
      .map((b) => [b.type, b.value]),
  );
  return new Date(Number(bagian.year), Number(bagian.month) - 1, Number(bagian.day));
}

/** "16 Des 2026" (hari WIB). */
export function tanggalSingkat(iso: string): string {
  return HARI_BULAN_TAHUN.format(new Date(iso));
}

/** "17 Nov – 16 Des 2026", atau dengan dua tahun bila berbeda tahun. */
export function teksMasa(m: Pick<Membership, "tanggalMulai" | "tanggalKadaluarsa">): string {
  const mulai = new Date(m.tanggalMulai);
  const akhir = new Date(m.tanggalKadaluarsa);
  const tahunSama = TAHUN.format(mulai) === TAHUN.format(akhir);
  return `${tahunSama ? HARI_BULAN.format(mulai) : HARI_BULAN_TAHUN.format(mulai)} – ${HARI_BULAN_TAHUN.format(akhir)}`;
}

/** Sisa hari termasuk hari ini; 0 bila sudah lewat. */
export function sisaHari(tanggalKadaluarsa: string, sekarang: Date): number {
  return Math.max(0, nomorHariWIB(tanggalKadaluarsa) - nomorHariWIB(sekarang) + 1);
}

export function teksSisa(m: Pick<Membership, "tanggalKadaluarsa" | "status">, sekarang: Date): string {
  if (m.status === "Kadaluarsa") return `berakhir ${tanggalSingkat(m.tanggalKadaluarsa)}`;
  return `sisa ${sisaHari(m.tanggalKadaluarsa, sekarang)} hari`;
}

/**
 * Tanggal berakhir pratinjau dialog: hari ke-durasi, hari mulai ikut
 * dihitung (paket 30 hari mulai 17 November berakhir 16 Desember), sama
 * dengan membershipService._hitungMasa backend.
 */
export function tanggalBerakhir(mulai: Date, durasiHari: number): Date {
  return new Date(mulai.getFullYear(), mulai.getMonth(), mulai.getDate() + durasiHari - 1);
}

export type SaringanStatus = "Semua" | StatusMembership;

/** Cari nama atau nomor HP pelanggan dan saringan status, di klien (backend tanpa pencarian). */
export function saringMember(daftar: readonly Membership[], cari: string, status: SaringanStatus): Membership[] {
  const kunci = cari.trim().toLowerCase();
  return daftar.filter((m) => {
    if (status !== "Semua" && m.status !== status) return false;
    if (!kunci) return true;
    const nama = m.pelanggan?.namaPelanggan.toLowerCase() ?? "";
    const hp = m.pelanggan?.nomorHp ?? "";
    return nama.includes(kunci) || hp.includes(kunci);
  });
}

/** Pelanggan yang dapat didaftarkan: pelanggan bawaan toko tidak ditawarkan (MB2a). */
export function pelangganTerpilih(daftar: readonly Pelanggan[]): Pelanggan[] {
  return daftar.filter((p) => !p.isBawaan);
}

/** Penjualan yang dapat dipakai: bukan VOID dan belum dipakai membership lain. */
export function penjualanTersedia(
  daftar: readonly Penjualan[],
  membership: readonly Membership[],
  kecualiMembershipID?: string,
): Penjualan[] {
  const dipakai = new Set(
    membership.filter((m) => m.id !== kecualiMembershipID && m.penjualan).map((m) => m.penjualan!.id),
  );
  return daftar.filter((p) => p.statusPenjualan !== "VOID" && !dipakai.has(p.id));
}

/** Paket yang dapat dipilih saat mendaftarkan atau mengubah: hanya Aktif, ditambah paket tersimpan. */
export function paketTerpilih(daftar: readonly PaketMembership[], paketTersimpanID?: string): PaketMembership[] {
  return daftar.filter((p) => p.status === "Aktif" || p.id === paketTersimpanID);
}

/** Paket aktif dulu, lalu nonaktif di akhir (redup); urutan harga backend dipertahankan. */
export function urutPaket(daftar: readonly PaketMembership[]): PaketMembership[] {
  return [...daftar.filter((p) => p.status === "Aktif"), ...daftar.filter((p) => p.status !== "Aktif")];
}

/** Jumlah membership Aktif per paket, untuk kartu paket. */
export function jumlahMemberPerPaket(daftar: readonly Membership[]): Map<string, number> {
  const hasil = new Map<string, number>();
  for (const m of daftar) {
    if (m.status !== "Aktif" || !m.paketMembership) continue;
    hasil.set(m.paketMembership.id, (hasil.get(m.paketMembership.id) ?? 0) + 1);
  }
  return hasil;
}

/**
 * Membership berlaku per pelanggan untuk lencana laman Pelanggan (MB3a):
 * yang Aktif dengan tanggal berakhir paling jauh.
 */
export function membershipBerlakuPerPelanggan(daftar: readonly Membership[]): Map<string, Membership> {
  const hasil = new Map<string, Membership>();
  for (const m of daftar) {
    if (m.status !== "Aktif" || !m.pelanggan) continue;
    const lama = hasil.get(m.pelanggan.id);
    if (!lama || new Date(m.tanggalKadaluarsa) > new Date(lama.tanggalKadaluarsa)) hasil.set(m.pelanggan.id, m);
  }
  return hasil;
}

/** "Member s.d. 16 Des 2026". */
export function teksLencanaMember(m: Pick<Membership, "tanggalKadaluarsa">): string {
  return `Member s.d. ${tanggalSingkat(m.tanggalKadaluarsa)}`;
}
