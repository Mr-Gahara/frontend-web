import { afterEach, describe, expect, it } from "vitest";
import { namaLonceng, teksLencana, tingkatTertinggi, urutkanPemberitahuan, type Pemberitahuan } from "@/features/notifikasi/jenis";
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

  it("lencana 9+ bila lebih dari sembilan, dan nama lonceng menyebut jumlahnya", () => {
    expect(teksLencana(3)).toBe("3");
    expect(teksLencana(9)).toBe("9");
    expect(teksLencana(12)).toBe("9+");
    expect(namaLonceng(0)).toBe("Pemberitahuan");
    expect(namaLonceng(4)).toBe("Pemberitahuan, 4 baru");
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
