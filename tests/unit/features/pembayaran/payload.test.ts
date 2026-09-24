import { describe, expect, it } from "vitest";
import {
  nominalDariTeks,
  susunPayloadPembayaran,
  validasiPembayaran,
} from "@/features/pembayaran/payload";
import { akunKasAktif } from "@/features/akun-kas/filter";
import { metodeAktif } from "@/features/metode-pembayaran/filter";
import type { AkunKas } from "@/types/akunKas";
import type { MetodePembayaran } from "@/types/metodePembayaran";

const rupiah = (n: number) => `Rp${n}`;
const isianSah = { akunKasID: "k1", metodePembayaranID: "m1", jumlahBayarStr: "Rp 50.000" };

function akun(id: string, status: AkunKas["status"]): AkunKas {
  return {
    id,
    tenantID: "t",
    namaAkun: "Kas " + id,
    nomorAkun: "",
    saldo: 0,
    tipeAkun: "Kas Fisik",
    status,
    keterangan: null,
    createdAt: "",
    updatedAt: "",
  };
}

function metode(id: string, isActive: boolean): MetodePembayaran {
  return {
    id,
    tenantID: "t",
    akunKas: null,
    namaPembayaran: "Metode " + id,
    kategori: "tunai",
    isActive,
    createdAt: "",
    updatedAt: "",
  };
}

describe("nominalDariTeks", () => {
  it("mengambil angka dari isian berformat rupiah", () => {
    expect(nominalDariTeks("Rp 50.000")).toBe(50000);
    expect(nominalDariTeks("")).toBeNull();
  });
});

describe("validasiPembayaran", () => {
  it("memeriksa akun kas, metode, lalu nominal, dengan pesan halaman lama", () => {
    expect(validasiPembayaran({ ...isianSah, akunKasID: "" }, 100000, rupiah)).toBe(
      "Silakan pilih Akun Kas tujuan penerimaan pembayaran.",
    );
    expect(validasiPembayaran({ ...isianSah, metodePembayaranID: "" }, 100000, rupiah)).toBe(
      "Silakan pilih Metode Pembayaran.",
    );
    expect(validasiPembayaran({ ...isianSah, jumlahBayarStr: "" }, 100000, rupiah)).toBe(
      "Jumlah pembayaran tidak valid.",
    );
    expect(validasiPembayaran({ ...isianSah, jumlahBayarStr: "0" }, 100000, rupiah)).toBe(
      "Jumlah pembayaran tidak valid.",
    );
  });

  it("menolak nominal di atas sisa tagihan dan menerima yang sah", () => {
    expect(validasiPembayaran(isianSah, 40000, rupiah)).toBe(
      "Jumlah bayar tidak boleh melebihi sisa tagihan (Rp40000).",
    );
    expect(validasiPembayaran(isianSah, 50000, rupiah)).toBeNull();
  });

  it("tidak memeriksa batas atas selama penjualan belum termuat", () => {
    expect(validasiPembayaran(isianSah, null, rupiah)).toBeNull();
  });
});

describe("susunPayloadPembayaran", () => {
  const sekarang = new Date("2026-09-24T04:00:00.000Z");

  it("tanpa status (K2a), dengan tanggalBayar ISO dan nominal angka", () => {
    const payload = susunPayloadPembayaran(
      { penjualanID: "p1", ...isianSah, catatan: "" },
      sekarang,
    );
    expect(payload).toEqual({
      penjualanID: "p1",
      akunKasID: "k1",
      metodePembayaranID: "m1",
      jumlahBayar: 50000,
      tanggalBayar: "2026-09-24T04:00:00.000Z",
    });
    expect(payload).not.toHaveProperty("status");
  });

  it("catatan dipangkas, dan catatan kosong tidak dikirim", () => {
    const payload = susunPayloadPembayaran(
      { penjualanID: "p1", ...isianSah, catatan: "  DP 50%  " },
      sekarang,
    );
    expect(payload.catatan).toBe("DP 50%");
  });
});

describe("penyaring referensi pembayaran", () => {
  it("akunKasAktif hanya akun berstatus aktif", () => {
    expect(akunKasAktif([akun("1", "aktif"), akun("2", "non-aktif")]).map((a) => a.id)).toEqual(["1"]);
  });

  it("metodeAktif membuang metode nonaktif", () => {
    expect(metodeAktif([metode("1", true), metode("2", false)]).map((m) => m.id)).toEqual(["1"]);
  });
});