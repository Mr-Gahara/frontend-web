import { describe, expect, it } from "vitest";
import { aksiTransfer } from "@/features/jurnal-transfer/izin";
import {
  filterServerTransfer,
  namaAkunTransfer,
  payloadBatalTransfer,
  payloadBuatTransfer,
  pesanSaldoKurang,
  pilihanTujuan,
} from "@/features/jurnal-transfer/payload";
import { skemaPindahDana } from "@/features/jurnal-transfer/schema";
import type { AkunKas } from "@/types/akunKas";

const ID_A = "a".repeat(24);
const ID_B = "b".repeat(24);

const akun = (id: string, saldo: number): AkunKas => ({
  id,
  tenantID: "t".repeat(24),
  namaAkun: "Akun " + id.slice(0, 1),
  nomorAkun: "N-" + id.slice(0, 1),
  saldo,
  tipeAkun: "Kas Fisik",
  status: "aktif",
  keterangan: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

const isian = (ubah: Record<string, string> = {}) => ({
  kasSumberID: ID_A,
  kasTujuanID: ID_B,
  jumlah: "15000",
  keterangan: "Setor ke bank",
  ...ubah,
});

const pesanGalat = (nilai: Record<string, string>) => {
  const hasil = skemaPindahDana.safeParse(nilai);
  return hasil.success ? [] : hasil.error.issues.map((i) => i.message);
};

describe("skemaPindahDana", () => {
  it("menerima isian lengkap dan memangkas jumlah serta keterangan", () => {
    const hasil = skemaPindahDana.safeParse(isian({ jumlah: " 15000 ", keterangan: "  Setor  " }));
    expect(hasil.success).toBe(true);
    if (hasil.success) {
      expect(hasil.data.jumlah).toBe("15000");
      expect(hasil.data.keterangan).toBe("Setor");
    }
  });

  it("menolak akun sumber dan tujuan yang belum dipilih", () => {
    const pesan = pesanGalat(isian({ kasSumberID: "", kasTujuanID: "" }));
    expect(pesan).toContain("Akun sumber wajib dipilih.");
    expect(pesan).toContain("Akun tujuan wajib dipilih.");
  });

  it("menolak akun tujuan yang sama dengan akun sumber", () => {
    expect(pesanGalat(isian({ kasTujuanID: ID_A }))).toContain(
      "Akun tujuan harus berbeda dari akun sumber.",
    );
  });

  it("menolak jumlah kosong", () => {
    expect(pesanGalat(isian({ jumlah: "  " }))).toContain("Jumlah wajib diisi.");
  });

  it("menolak jumlah 0, pecahan, negatif, dan bukan angka", () => {
    for (const jumlah of ["0", "1.5", "-5", "abc", "1e3"]) {
      expect(pesanGalat(isian({ jumlah })), jumlah).toContain(
        "Jumlah harus bilangan bulat minimal 1.",
      );
    }
  });

  it("menerima jumlah 1", () => {
    expect(pesanGalat(isian({ jumlah: "1" }))).toEqual([]);
  });

  it("menolak keterangan berisi spasi saja", () => {
    expect(pesanGalat(isian({ keterangan: "   " }))).toContain("Keterangan wajib diisi.");
  });

  it("menolak keterangan di atas 500 karakter dan menerima tepat 500", () => {
    expect(pesanGalat(isian({ keterangan: "x".repeat(501) }))).toContain(
      "Keterangan maksimal 500 karakter.",
    );
    expect(pesanGalat(isian({ keterangan: "x".repeat(500) }))).toEqual([]);
  });
});

describe("payload jurnal transfer", () => {
  it("payloadBuatTransfer mengirim tepat empat field, jumlah sebagai angka, tanpa tanggal", () => {
    expect(payloadBuatTransfer(isian({ jumlah: " 15000 ", keterangan: " Setor " }))).toEqual({
      kasSumberID: ID_A,
      kasTujuanID: ID_B,
      jumlah: 15000,
      keterangan: "Setor",
    });
  });

  it("payloadBatalTransfer tanpa alasan hanya mengirim status", () => {
    expect(payloadBatalTransfer("   ")).toEqual({ status: "VOID" });
  });

  it("payloadBatalTransfer mengirim alasan yang dipangkas sebagai catatan", () => {
    expect(payloadBatalTransfer(" salah akun ")).toEqual({ status: "VOID", catatan: "salah akun" });
  });

  it("pesanSaldoKurang hanya menahan jumlah di atas saldo akun sumber", () => {
    expect(pesanSaldoKurang("101", akun(ID_A, 100))).toBe("Jumlah melebihi saldo akun sumber.");
    expect(pesanSaldoKurang("100", akun(ID_A, 100))).toBeNull();
    expect(pesanSaldoKurang("100", undefined)).toBeNull();
  });

  it("pilihanTujuan membuang akun sumber dari pilihan", () => {
    const daftar = [akun(ID_A, 0), akun(ID_B, 0)];
    expect(pilihanTujuan(daftar, ID_A).map((a) => a.id)).toEqual([ID_B]);
    expect(pilihanTujuan(daftar, "")).toHaveLength(2);
  });

  it("filterServerTransfer hanya mengirim filter yang diisi", () => {
    expect(filterServerTransfer({ akunKasID: "", status: "" })).toEqual({});
    expect(filterServerTransfer({ akunKasID: ID_A, status: "VOID" })).toEqual({
      akunKasID: ID_A,
      status: "VOID",
    });
  });

  it("namaAkunTransfer memakai nama salinan, dan tanda hubung bila tidak ada", () => {
    expect(namaAkunTransfer({ id: ID_A, namaAkun: "Kas Laci", nomorAkun: null })).toBe("Kas Laci");
    expect(namaAkunTransfer({ id: ID_A, namaAkun: null, nomorAkun: null })).toBe("-");
    expect(namaAkunTransfer(null)).toBe("-");
  });
});

describe("aksiTransfer", () => {
  it("memetakan ketiga izin jurnal transfer ke aksinya", () => {
    expect(aksiTransfer(["read-jurnal-transfer"])).toEqual({ baca: true, buat: false, batal: false });
    expect(aksiTransfer(["create-jurnal-transfer", "update-jurnal-transfer"])).toEqual({
      baca: false,
      buat: true,
      batal: true,
    });
    expect(aksiTransfer([])).toEqual({ baca: false, buat: false, batal: false });
  });
});