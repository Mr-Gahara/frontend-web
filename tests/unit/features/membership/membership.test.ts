import { describe, expect, it } from "vitest";
import { aksiMembership } from "@/features/membership/izin";
import { nilaiAwalPaket, payloadBuatPaket, payloadUbahPaket, skemaPaket } from "@/features/membership/schema";
import {
  jumlahMemberPerPaket,
  membershipBerlakuPerPelanggan,
  paketTerpilih,
  pelangganTerpilih,
  penjualanTersedia,
  saringMember,
  sisaHari,
  tanggalBerakhir,
  tanggalWIB,
  teksLencanaMember,
  teksMasa,
  teksSisa,
  urutPaket,
} from "@/features/membership/tampilan";
import type { Membership, PaketMembership } from "@/types/membership";
import type { Pelanggan } from "@/types/pelanggan";
import type { Penjualan } from "@/types/penjualan";

/**
 * Data mengikuti basis data development 17 November 2026: Budi dan
 * Customer, penjualan INV/TKA/... nyata, paket contoh di kanvas desain B.
 * Masa berlaku backend: mulai 00.00 WIB (17.00 UTC hari sebelumnya), berakhir
 * 23.59.59,999 WIB hari ke-durasi.
 */
const member = (o: Partial<Membership> & { id: string }): Membership => ({
  tenantID: "t",
  pelanggan: { id: "budi", namaPelanggan: "Budi", nomorHp: "082231314543" },
  paketMembership: { id: "bulanan", namaPaket: "Member Bulanan", durasiHari: 30 },
  penjualan: { id: "pj-953", noReferensi: "INV/TKA/20261117/110432038-953" },
  tanggalMulai: "2026-11-16T17:00:00.000Z",
  tanggalKadaluarsa: "2026-12-16T16:59:59.999Z",
  status: "Aktif",
  createdAt: "",
  updatedAt: "",
  ...o,
});
const BUDI = member({ id: "m1" });
const CUSTOMER = member({
  id: "m2",
  pelanggan: { id: "customer", namaPelanggan: "Customer", nomorHp: "082241425564" },
  paketMembership: { id: "tahunan", namaPaket: "Member Tahunan", durasiHari: 365 },
  penjualan: { id: "pj-905", noReferensi: "INV/TKA/20261021/201142861-905" },
  tanggalMulai: "2026-10-20T17:00:00.000Z",
  tanggalKadaluarsa: "2027-10-20T16:59:59.999Z",
});
const LAMA = member({ id: "m0", status: "Kadaluarsa", tanggalKadaluarsa: "2026-10-31T16:59:59.999Z" });
const paket = (o: Partial<PaketMembership> & { id: string }): PaketMembership => ({
  tenantID: "t",
  namaPaket: "Member Bulanan",
  harga: 100_000,
  durasiHari: 30,
  deskripsi: null,
  status: "Aktif",
  createdAt: "",
  updatedAt: "",
  ...o,
});
/** 17 November 2026 pukul 10.00 WIB. */
const SEKARANG = new Date("2026-11-17T03:00:00.000Z");

describe("masa berlaku (MB1a)", () => {
  it("teks masa satu tahun dan lintas tahun, dibaca dalam hari WIB", () => {
    expect(teksMasa(BUDI)).toBe("17 Nov – 16 Des 2026");
    expect(teksMasa(CUSTOMER)).toBe("21 Okt 2026 – 20 Okt 2027");
  });

  it("sisa hari termasuk hari ini, 0 bila lewat, dan teks Kadaluarsa menyebut tanggal berakhir", () => {
    expect(sisaHari(BUDI.tanggalKadaluarsa, SEKARANG)).toBe(30);
    expect(sisaHari(CUSTOMER.tanggalKadaluarsa, SEKARANG)).toBe(338);
    expect(sisaHari(LAMA.tanggalKadaluarsa, SEKARANG)).toBe(0);
    expect(teksSisa(BUDI, SEKARANG)).toBe("sisa 30 hari");
    expect(teksSisa(LAMA, SEKARANG)).toBe("berakhir 31 Okt 2026");
  });

  it("pratinjau berakhir: hari mulai ikut dihitung, sama dengan backend", () => {
    const akhir = tanggalBerakhir(new Date(2026, 10, 17), 30);
    expect([akhir.getFullYear(), akhir.getMonth(), akhir.getDate()]).toEqual([2026, 11, 16]);
    const mulai = tanggalWIB(BUDI.tanggalMulai);
    expect([mulai.getFullYear(), mulai.getMonth(), mulai.getDate()]).toEqual([2026, 10, 17]);
  });
});

describe("daftar member", () => {
  it("cari nama atau nomor HP dan saringan status", () => {
    const semua = [BUDI, CUSTOMER, LAMA];
    expect(saringMember(semua, "", "Semua")).toHaveLength(3);
    expect(saringMember(semua, "", "Kadaluarsa").map((m) => m.id)).toEqual(["m0"]);
    expect(saringMember(semua, "cust", "Semua").map((m) => m.id)).toEqual(["m2"]);
    expect(saringMember(semua, "0822313", "Aktif").map((m) => m.id)).toEqual(["m1"]);
  });

  it("jumlah member aktif per paket tidak menghitung yang kadaluarsa", () => {
    expect(jumlahMemberPerPaket([BUDI, CUSTOMER, LAMA])).toEqual(
      new Map([
        ["bulanan", 1],
        ["tahunan", 1],
      ]),
    );
  });
});

describe("dialog Daftarkan (MB2a)", () => {
  it("pelanggan bawaan toko tidak ditawarkan", () => {
    const daftar = [{ id: "a", isBawaan: true }, { id: "b", isBawaan: false }] as Pelanggan[];
    expect(pelangganTerpilih(daftar).map((p) => p.id)).toEqual(["b"]);
  });

  it("penjualan VOID dan yang sudah dipakai disembunyikan, kecuali milik membership yang sedang diubah", () => {
    const pj = (id: string, statusPenjualan: string) => ({ id, statusPenjualan }) as Penjualan;
    const daftar = [pj("pj-953", "PAID"), pj("pj-016", "UNPAID"), pj("pj-void", "VOID")];
    expect(penjualanTersedia(daftar, [BUDI]).map((p) => p.id)).toEqual(["pj-016"]);
    expect(penjualanTersedia(daftar, [BUDI], "m1").map((p) => p.id)).toEqual(["pj-953", "pj-016"]);
  });

  it("paket Non-Aktif tidak ditawarkan, kecuali paket tersimpan membership yang diubah; nonaktif di akhir daftar", () => {
    const daftar = [paket({ id: "lama", status: "Non-Aktif" }), paket({ id: "bulanan" })];
    expect(paketTerpilih(daftar).map((p) => p.id)).toEqual(["bulanan"]);
    expect(paketTerpilih(daftar, "lama").map((p) => p.id)).toEqual(["lama", "bulanan"]);
    expect(urutPaket(daftar).map((p) => p.id)).toEqual(["bulanan", "lama"]);
  });
});

describe("lencana laman Pelanggan (MB3a)", () => {
  it("membership aktif dengan tanggal berakhir terjauh; kadaluarsa tidak berlencana", () => {
    const perpanjangan = member({ id: "m3", tanggalKadaluarsa: "2027-01-15T16:59:59.999Z" });
    const peta = membershipBerlakuPerPelanggan([BUDI, perpanjangan, CUSTOMER, LAMA]);
    expect(peta.get("budi")?.id).toBe("m3");
    expect(teksLencanaMember(peta.get("customer")!)).toBe("Member s.d. 20 Okt 2027");
    expect(membershipBerlakuPerPelanggan([LAMA]).size).toBe(0);
  });
});

describe("form paket", () => {
  it("validasi nama, harga tidak negatif, dan durasi bilangan bulat minimal 1", () => {
    const sah = { namaPaket: "Member Bulanan", harga: "100000", durasiHari: "30", deskripsi: "", aktif: true };
    expect(skemaPaket.safeParse(sah).success).toBe(true);
    expect(skemaPaket.safeParse({ ...sah, harga: "0" }).success).toBe(true);
    expect(skemaPaket.safeParse({ ...sah, harga: "-1" }).success).toBe(false);
    expect(skemaPaket.safeParse({ ...sah, durasiHari: "1.5" }).success).toBe(false);
    expect(skemaPaket.safeParse({ ...sah, namaPaket: "  " }).success).toBe(false);
  });

  it("buat mengirim seluruh field tanpa deskripsi kosong; ubah hanya yang berubah", () => {
    expect(payloadBuatPaket({ namaPaket: "Gold", harga: "100000", durasiHari: "30", deskripsi: "", aktif: false })).toEqual({
      namaPaket: "Gold",
      harga: 100_000,
      durasiHari: 30,
      status: "Non-Aktif",
    });
    const tersimpan = paket({ id: "bulanan", deskripsi: "Lama" });
    const awal = nilaiAwalPaket(tersimpan);
    expect(payloadUbahPaket(awal, tersimpan)).toEqual({});
    expect(payloadUbahPaket({ ...awal, harga: "120000", deskripsi: "", aktif: false }, tersimpan)).toEqual({
      harga: 120_000,
      deskripsi: null,
      status: "Non-Aktif",
    });
  });
});

describe("izin (keputusan rancangan butir 14)", () => {
  it("Daftarkan menuntut create-membership beserta baca paket, pelanggan, dan penjualan", () => {
    const baca = ["read-membership", "read-paket-membership", "read-pelanggan", "read-penjualan"];
    expect(aksiMembership([...baca, "create-membership"]).daftarkan).toBe(true);
    expect(aksiMembership(["create-membership", "read-membership"]).daftarkan).toBe(false);
    expect(aksiMembership(["read-membership"])).toMatchObject({ bacaMember: true, bacaPaket: false, hapusMember: false });
  });
});
