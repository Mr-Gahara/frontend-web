import { afterEach, describe, expect, it } from "vitest";
import { namaLonceng, ringkasPanel, teksLencana, tingkatTertinggi, urutkanPemberitahuan, type Pemberitahuan } from "@/features/notifikasi/jenis";
import { bolehBukaSendiri } from "@/features/notifikasi/lonceng-pemberitahuan";
import { pemberitahuanLangganan, URL_LANGGANAN } from "@/features/notifikasi/sumber-langganan";
import { AWALAN_KUNCI, SAKLAR_OTOMATIS } from "@/lib/panduan";

const p = (id: string, tingkat: Pemberitahuan["tingkat"]): Pemberitahuan => ({ id, tingkat, judul: id, isi: id, tautan: [] });

describe("urutan dan lencana (LN11a, LN12a)", () => {
  it("diurutkan penting, perlu tindakan, info; urutan sumber dipertahankan di dalam tingkat", () => {
    const hasil = urutkanPemberitahuan([p("i1", "info"), p("t1", "tindakan"), p("p1", "penting"), p("t2", "tindakan")]);
    expect(hasil.map((x) => x.id)).toEqual(["p1", "t1", "t2", "i1"]);
    expect(tingkatTertinggi([p("i1", "info"), p("t1", "tindakan")])).toBe("tindakan");
    expect(tingkatTertinggi([])).toBeNull();
  });

  it("kartu utama (kesiapan toko, KS2a) paling atas apa pun tingkatnya; lencana tetap tingkat tertinggi", () => {
    const utama = { ...p("k", "info"), utama: true };
    const hasil = urutkanPemberitahuan([p("t1", "tindakan"), p("p1", "penting"), utama]);
    expect(hasil.map((x) => x.id)).toEqual(["k", "p1", "t1"]);
    expect(tingkatTertinggi([utama, p("t1", "tindakan")])).toBe("tindakan");
  });

  it("lencana 9+ bila lebih dari sembilan, dan nama lonceng menyebut jumlahnya", () => {
    expect(teksLencana(3)).toBe("3");
    expect(teksLencana(9)).toBe("9");
    expect(teksLencana(12)).toBe("9+");
    expect(namaLonceng(0)).toBe("Pemberitahuan");
    expect(namaLonceng(4)).toBe("Pemberitahuan, 4 baru");
  });
});

describe("ringkasPanel (LN19a)", () => {
  const banyak = (n: number, t: Pemberitahuan["tingkat"], awalan: string) =>
    Array.from({ length: n }, (_, i) => p(`${awalan}${i}`, t));

  it("lima teratas menurut tingkat; sisanya dihitung untuk Lihat semua", () => {
    const hasil = ringkasPanel([...banyak(6, "info", "i"), ...banyak(3, "tindakan", "t"), p("p0", "penting")]);
    expect(hasil.tampil.map((x) => x.id)).toEqual(["p0", "t0", "t1", "t2", "i0"]);
    expect(hasil.tersembunyi).toBe(5);
  });

  it("seluruh kartu penting selalu tampil walau lebih dari lima; lima atau kurang tanpa sisa", () => {
    const hasil = ringkasPanel([...banyak(7, "penting", "p"), ...banyak(2, "info", "i")]);
    expect(hasil.tampil).toHaveLength(7);
    expect(hasil.tersembunyi).toBe(2);
    expect(ringkasPanel(banyak(5, "info", "i")).tersembunyi).toBe(0);
  });
});

describe("ringkasPanel dengan kartu utama (KS2a)", () => {
  it("kartu utama selalu tampil di samping seluruh kartu penting, lalu sampai lima kartu", () => {
    const utama = { ...p("k", "info"), utama: true };
    const banyak = [...Array.from({ length: 6 }, (_, i) => p(`t${i}`, "tindakan")), utama];
    const { tampil, tersembunyi } = ringkasPanel(banyak);
    expect(tampil.map((x) => x.id)).toEqual(["k", "t0", "t1", "t2", "t3"]);
    expect(tersembunyi).toBe(2);
    const penting = [...Array.from({ length: 5 }, (_, i) => p(`p${i}`, "penting")), utama, p("i", "info")];
    expect(ringkasPanel(penting).tampil.map((x) => x.id)).toEqual(["k", "p0", "p1", "p2", "p3", "p4"]);
  });
});

describe("pemberitahuanLangganan (TP8a dalam lonceng)", () => {
  const akses = { permissions: ["read-langganan"], plan: "basic" as const, fiturSiap: {} };
  it("masa tenggang penting, hampir habis perlu tindakan, dengan bilah dan tautan bagi pembaca langganan", () => {
    const tenggang = pemberitahuanLangganan({ jenis: "tenggang", judul: "J", isi: "I", persen: 40 }, akses);
    expect(tenggang).toMatchObject({ tingkat: "penting", persen: 40 });
    expect(tenggang?.tautan).toEqual([{ href: URL_LANGGANAN, label: "Lihat langganan" }]);
    const hampir = pemberitahuanLangganan({ jenis: "hampir-habis", judul: "J", isi: "I", persen: null }, akses);
    expect(hampir?.tingkat).toBe("tindakan");
    expect(pemberitahuanLangganan(null, akses)).toBeNull();
  });
});

describe("bolehBukaSendiri (LN3a, LN13a)", () => {
  afterEach(() => localStorage.clear());
  const tandaiTurDilihat = () => localStorage.setItem(AWALAN_KUNCI + "dashboard.u1", "dilihat");
  const masukan = { pathname: "/dashboard/outlet", adaPemicuStok: true, penggunaId: "u1" };

  it("hanya di beranda dashboard outlet, selama pemicu stok berlaku, setelah tur dashboard pernah tampil", () => {
    tandaiTurDilihat();
    expect(bolehBukaSendiri(masukan)).toBe(true);
    expect(bolehBukaSendiri({ ...masukan, pathname: "/dashboard/outlet/penjualan" })).toBe(false);
    expect(bolehBukaSendiri({ ...masukan, adaPemicuStok: false })).toBe(false);
    expect(bolehBukaSendiri({ ...masukan, penggunaId: null })).toBe(false);
  });

  it("tidak bertumpuk dengan tur yang belum pernah tampil, dan mati oleh saklar e2e", () => {
    expect(bolehBukaSendiri(masukan)).toBe(false);
    tandaiTurDilihat();
    localStorage.setItem(SAKLAR_OTOMATIS, "mati");
    expect(bolehBukaSendiri(masukan)).toBe(false);
  });
});
