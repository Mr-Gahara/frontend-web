import { describe, expect, it } from "vitest";
import type { AksesTautan } from "@/features/notifikasi/akses";
import {
  URL_DISKON,
  URL_MEMBERSHIP,
  pemberitahuanDiskonBerakhir,
  pemberitahuanMembershipBerakhir,
  pemberitahuanPenjualanBelumLunas,
} from "@/features/notifikasi/sumber-penjualan";
import { FILTER_KOSONG, filterDariUrl } from "@/features/penjualan/filter-panel";
import type { Diskon } from "@/types/diskon";
import type { Membership } from "@/types/membership";

const akses = (permissions: string[] = ["read-penjualan", "read-membership"]): AksesTautan => ({
  permissions,
  plan: "pro",
  fiturSiap: {},
});
const kini = new Date(2026, 10, 25, 10, 0);
const hariLagi = (n: number) => new Date(kini.getTime() + n * 86_400_000).toISOString();

describe("pemberitahuanPenjualanBelumLunas (LN9a, LN18a)", () => {
  it("menjumlahkan belum bayar dan sebagian, dengan tautan ke daftar tersaring per status", () => {
    const p = pemberitahuanPenjualanBelumLunas({ belumBayar: 3, sebagian: 1 }, akses());
    expect(p).toMatchObject({ tingkat: "tindakan", isi: "4 penjualan belum lunas: 3 belum dibayar, 1 baru dibayar sebagian." });
    expect(p?.tautan).toEqual([
      { href: "/dashboard/outlet/penjualan?status=belum-bayar", label: "Belum bayar" },
      { href: "/dashboard/outlet/penjualan?status=sebagian", label: "Sebagian" },
    ]);
  });

  it("hanya status yang ada; tidak ada kartu bila nol atau belum termuat; tanpa tautan tanpa izin", () => {
    expect(pemberitahuanPenjualanBelumLunas({ belumBayar: 0, sebagian: 2 }, akses())?.tautan.map((t) => t.label)).toEqual([
      "Sebagian",
    ]);
    expect(pemberitahuanPenjualanBelumLunas({ belumBayar: 0, sebagian: 0 }, akses())).toBeNull();
    expect(pemberitahuanPenjualanBelumLunas({ belumBayar: null, sebagian: null }, akses())).toBeNull();
    expect(pemberitahuanPenjualanBelumLunas({ belumBayar: 1, sebagian: 0 }, akses([]))?.tautan).toEqual([]);
  });

  it("filterDariUrl: kedua slug mengisi Status; nilai lain kembali ke filter kosong", () => {
    expect(filterDariUrl("belum-bayar")).toEqual({ ...FILTER_KOSONG, statusPenjualan: "UNPAID" });
    expect(filterDariUrl("sebagian")).toEqual({ ...FILTER_KOSONG, statusPenjualan: "PARTIAL" });
    expect(filterDariUrl("lunas")).toEqual(FILTER_KOSONG);
    expect(filterDariUrl("__proto__")).toEqual(FILTER_KOSONG);
    expect(filterDariUrl(null)).toEqual(FILTER_KOSONG);
  });
});

describe("pemberitahuanMembershipBerakhir (LN10a)", () => {
  const m = (nama: string, kadaluarsa: string, status: Membership["status"] = "Aktif") =>
    ({ pelanggan: { id: nama, namaPelanggan: nama }, tanggalKadaluarsa: kadaluarsa, status }) as Membership;

  it("Aktif yang kedaluwarsa dalam tujuh hari, urut tanggal, ke halaman Membership", () => {
    const p = pemberitahuanMembershipBerakhir(
      [m("Budi", hariLagi(5)), m("Ani", hariLagi(2)), m("Cici", hariLagi(9)), m("Dedi", hariLagi(-1)), m("Eka", hariLagi(1), "Kadaluarsa")],
      kini,
      akses(),
    );
    expect(p?.isi).toMatch(/^2 membership pelanggan berakhir dalam 7 hari: Ani \(.+\), Budi \(.+\)\.$/);
    expect(p?.tautan).toEqual([{ href: URL_MEMBERSHIP, label: "Lihat membership" }]);
    expect(pemberitahuanMembershipBerakhir([m("Cici", hariLagi(9))], kini, akses())).toBeNull();
  });
});

describe("pemberitahuanDiskonBerakhir", () => {
  const d = (namaDiskon: string, tanggalBerakhir: string | null, status: Diskon["status"] = "Aktif") =>
    ({ namaDiskon, tanggalBerakhir, status }) as Diskon;

  it("Aktif yang berakhir dalam tiga hari, dan yang sudah lewat tetapi masih Aktif", () => {
    const p = pemberitahuanDiskonBerakhir(
      [d("Promo A", hariLagi(2)), d("Promo B", hariLagi(-1)), d("Promo C", hariLagi(5)), d("Promo D", null), d("Promo E", hariLagi(1), "Non-Aktif")],
      kini,
      akses(),
    );
    expect(p?.isi).toBe(
      "1 diskon berakhir dalam 3 hari (Promo A); 1 diskon sudah lewat masa berlakunya tetapi masih Aktif (Promo B).",
    );
    expect(p?.tautan).toEqual([{ href: URL_DISKON, label: "Lihat diskon" }]);
    expect(pemberitahuanDiskonBerakhir([d("Promo C", hariLagi(5))], kini, akses())).toBeNull();
  });
});
