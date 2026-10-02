import { describe, it, expect } from "vitest";
import {
  akibatPerpanjang,
  aksiLangganan,
  durasiWajibSaatAktifkan,
  payloadAktifkan,
  payloadBekukan,
  payloadPerpanjang,
  pelakuRiwayat,
  teksPerubahanMasa,
} from "@/features/admin-akun/langganan";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunAdmin, LanggananAkun, RiwayatLangganan } from "@/types/adminAkun";

const langganan = (ubah: Partial<LanggananAkun> = {}): LanggananAkun => ({
  aksesBerakhirPada: null,
  alasanNonAktif: null,
  dibekukanPada: null,
  masaTenggangHari: 7,
  ...ubah,
});

const akun = (ubah: Partial<AkunAdmin> = {}): AkunAdmin => ({
  id: "a1",
  username: null,
  email: "klien@contoh.id",
  role: "client",
  status: "aktif",
  daftarTenant: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  langganan: langganan(),
  ...ubah,
});

const catatan = (ubah: Partial<RiwayatLangganan> = {}): RiwayatLangganan => ({
  id: "r1",
  akunID: "a1",
  aksi: "perpanjang",
  durasiBulan: 3,
  berakhirSebelum: null,
  berakhirSesudah: null,
  olehAkunID: "admin1",
  alasan: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  ...ubah,
});

const SEKARANG = new Date("2026-10-02T12:00:00.000Z");

describe("aksiLangganan", () => {
  it("klien aktif: bekukan dan perpanjang", () => {
    expect(aksiLangganan(akun())).toEqual({ bekukan: true, aktifkan: false, perpanjang: true });
  });

  it("klien non-aktif: aktifkan dan perpanjang", () => {
    expect(aksiLangganan(akun({ status: "non-aktif" }))).toEqual({
      bekukan: false,
      aktifkan: true,
      perpanjang: true,
    });
  });

  it("akun admin tidak punya aksi langganan", () => {
    expect(aksiLangganan(akun({ role: "admin" }))).toEqual({
      bekukan: false,
      aktifkan: false,
      perpanjang: false,
    });
  });
});

describe("durasiWajibSaatAktifkan", () => {
  it("wajib bila masa akses belum diatur", () => {
    expect(durasiWajibSaatAktifkan(akun(), SEKARANG)).toBe(true);
  });

  it("wajib bila masa akses sudah lewat", () => {
    const lewat = akun({ langganan: langganan({ aksesBerakhirPada: "2026-10-01T00:00:00.000Z" }) });
    expect(durasiWajibSaatAktifkan(lewat, SEKARANG)).toBe(true);
  });

  it("opsional bila masa akses masih berjalan", () => {
    const berjalan = akun({ langganan: langganan({ aksesBerakhirPada: "2026-12-01T00:00:00.000Z" }) });
    expect(durasiWajibSaatAktifkan(berjalan, SEKARANG)).toBe(false);
  });
});

describe("akibatPerpanjang", () => {
  it("membedakan akun aktif, beku karena kedaluwarsa, dan dibekukan admin", () => {
    const beku = (alasanNonAktif: "manual" | "kedaluwarsa") =>
      akun({ status: "non-aktif", langganan: langganan({ alasanNonAktif }) });
    expect(akibatPerpanjang(akun())).toContain("Masa akses bertambah");
    expect(akibatPerpanjang(beku("kedaluwarsa"))).toContain("aktif kembali");
    expect(akibatPerpanjang(beku("manual"))).toContain("tetap non-aktif");
  });
});

describe("payload langganan", () => {
  it("bekukan: alasan kosong tidak dikirim, alasan berisi dipangkas", () => {
    expect(payloadBekukan("   ")).toEqual({});
    expect(payloadBekukan("  menunggak  ")).toEqual({ alasan: "menunggak" });
  });

  it("aktifkan: durasi hanya dikirim bila dipilih", () => {
    expect(payloadAktifkan(null, "")).toEqual({});
    expect(payloadAktifkan(6, " lunas ")).toEqual({ durasiBulan: 6, alasan: "lunas" });
  });

  it("perpanjang: durasi selalu dikirim", () => {
    expect(payloadPerpanjang(12, "")).toEqual({ durasiBulan: 12 });
  });
});

describe("riwayat langganan", () => {
  it("perubahan masa akses: tidak berubah, baru diatur, dan berpindah", () => {
    const awal = "2026-10-31T16:59:59.999Z";
    const akhir = "2027-01-31T16:59:59.999Z";
    expect(teksPerubahanMasa(catatan())).toBeNull();
    expect(teksPerubahanMasa(catatan({ berakhirSebelum: awal, berakhirSesudah: awal }))).toBeNull();
    expect(teksPerubahanMasa(catatan({ berakhirSesudah: akhir }))).toBe(
      `Masa akses sampai ${formatTanggalPendek(akhir)}`,
    );
    expect(teksPerubahanMasa(catatan({ berakhirSebelum: awal, berakhirSesudah: akhir }))).toBe(
      `Masa akses ${formatTanggalPendek(awal)} menjadi ${formatTanggalPendek(akhir)}`,
    );
  });

  it("pelaku: admin, atau sistem bila tanpa olehAkunID", () => {
    expect(pelakuRiwayat(catatan())).toBe("Admin");
    expect(pelakuRiwayat(catatan({ olehAkunID: null }))).toBe("Sistem");
  });
});