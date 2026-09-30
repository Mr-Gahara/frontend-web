import { describe, expect, it } from "vitest";
import { buatSkemaMetodePembayaran } from "@/features/metode-pembayaran/schema";
import {
  NILAI_AWAL_METODE,
  nilaiAwalMetode,
  payloadBuatMetode,
  payloadUbahMetode,
} from "@/features/metode-pembayaran/payload";
import { aksiMetodePembayaran } from "@/features/metode-pembayaran/izin";
import {
  BATAS_METODE_AKTIF,
  labelKategori,
  masihDalamBatas,
  metodeAktifTerakhir,
  pilihanAkun,
} from "@/features/metode-pembayaran/tampilan";
import type { AkunKas } from "@/types/akunKas";
import type { MetodePembayaran } from "@/types/metodePembayaran";

const metode = (id: string, isActive: boolean, akunId = "k1"): MetodePembayaran => ({
  id,
  tenantID: "t",
  akunKas: { id: akunId, namaAkun: "Laci", nomorAkun: "K-1" },
  namaPembayaran: "Metode " + id,
  kategori: "tunai",
  isActive,
  createdAt: "",
  updatedAt: "",
});

const akun = (id: string, status: AkunKas["status"]): AkunKas => ({
  id,
  tenantID: "t",
  namaAkun: "Akun " + id,
  nomorAkun: "N-" + id,
  saldo: 0,
  tipeAkun: "Kas Fisik",
  status,
  keterangan: null,
  createdAt: "",
  updatedAt: "",
});

describe("payload metode pembayaran", () => {
  it("buat hanya membawa field allowlist backend, tanpa field gateway, dengan nama dipangkas", () => {
    expect(
      payloadBuatMetode({ namaPembayaran: "  QRIS  ", kategori: "non-tunai", akunKasID: "k1", isActive: true }),
    ).toEqual({ namaPembayaran: "QRIS", kategori: "non-tunai", akunKasID: "k1", isActive: true });
  });

  it("nilai awal ubah diambil dari detail, termasuk id akun kas", () => {
    expect(nilaiAwalMetode(metode("1", false, "k9"))).toEqual({
      namaPembayaran: "Metode 1",
      kategori: "tunai",
      akunKasID: "k9",
      isActive: false,
    });
  });

  it("ubah tanpa perubahan menghasilkan payload kosong", () => {
    const m = metode("1", true);
    expect(payloadUbahMetode(nilaiAwalMetode(m), m)).toEqual({});
  });

  it("ubah hanya mengirim field yang berubah, tanpa akun yang tetap", () => {
    const m = metode("1", false);
    expect(payloadUbahMetode({ ...nilaiAwalMetode(m), namaPembayaran: " Baru ", isActive: true }, m)).toEqual({
      namaPembayaran: "Baru",
      isActive: true,
    });
    expect(payloadUbahMetode({ ...nilaiAwalMetode(m), akunKasID: "k2" }, m)).toEqual({ akunKasID: "k2" });
  });
});

describe("skema metode pembayaran", () => {
  const skema = buatSkemaMetodePembayaran(["k1"]);

  it("nama berisi spasi saja dan akun kosong ditolak dengan pesan halaman", () => {
    const r = skema.safeParse({ ...NILAI_AWAL_METODE, namaPembayaran: "   " });
    expect(r.success).toBe(false);
    const pesan = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(pesan).toContain("Nama Pembayaran wajib diisi.");
    expect(pesan).toContain("Akun Tujuan wajib dipilih.");
  });

  it("nama lebih dari 100 karakter ditolak", () => {
    expect(skema.safeParse({ ...NILAI_AWAL_METODE, namaPembayaran: "a".repeat(101), akunKasID: "k1" }).success).toBe(
      false,
    );
  });

  it("akun nonaktif ditolak saat buat", () => {
    expect(skema.safeParse({ ...NILAI_AWAL_METODE, namaPembayaran: "QRIS", akunKasID: "k9" }).success).toBe(false);
  });

  it("akun nonaktif yang tidak berubah boleh selama metode tetap nonaktif, tetapi ditolak saat diaktifkan kembali", () => {
    const skemaUbah = buatSkemaMetodePembayaran(["k1"], { akunKasID: "k9", isActive: false });
    const nilai = { namaPembayaran: "Lama", kategori: "tunai" as const, akunKasID: "k9", isActive: false };
    expect(skemaUbah.safeParse(nilai).success).toBe(true);
    expect(skemaUbah.safeParse({ ...nilai, isActive: true }).success).toBe(false);
  });
});

describe("izin dan tampilan metode pembayaran", () => {
  it("aksi mengikuti izin create dan update", () => {
    expect(aksiMetodePembayaran(["create-metode-pembayaran"])).toEqual({ buat: true, ubah: false });
    expect(aksiMetodePembayaran(["update-metode-pembayaran"])).toEqual({ buat: false, ubah: true });
  });

  it("batas dihitung dari metode aktif saja", () => {
    const sembilan = Array.from({ length: BATAS_METODE_AKTIF - 1 }, (_, i) => metode(String(i), true));
    expect(masihDalamBatas([...sembilan, metode("n", false)])).toBe(true);
    expect(masihDalamBatas([...sembilan, metode("x", true)])).toBe(false);
  });

  it("metode aktif terakhir dikenali, metode nonaktif tidak", () => {
    const a = metode("a", true);
    expect(metodeAktifTerakhir([a, metode("b", false)], a)).toBe(true);
    expect(metodeAktifTerakhir([a, metode("c", true)], a)).toBe(false);
    expect(metodeAktifTerakhir([metode("d", false)], metode("d", false))).toBe(false);
  });

  it("pilihan akun hanya akun aktif, ditambah akun metode ini bila sudah nonaktif", () => {
    const daftar = [akun("1", "aktif"), akun("2", "non-aktif"), akun("3", "non-aktif")];
    expect(pilihanAkun(daftar).map((p) => p.id)).toEqual(["1"]);
    expect(pilihanAkun(daftar, "2")).toEqual([
      { id: "1", label: "Akun 1 (N-1)", aktif: true },
      { id: "2", label: "Akun 2 (N-2) (nonaktif)", aktif: false },
    ]);
  });

  it("label kategori sama dengan halaman lama", () => {
    expect(labelKategori("tunai")).toBe("Tunai");
    expect(labelKategori("non-tunai")).toBe("Non Tunai");
  });
});