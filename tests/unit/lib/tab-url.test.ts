import { describe, expect, it } from "vitest";
import { tabDariUrl, urlDenganTab } from "@/lib/tab-url";
import { SLUG_TAB_PENGAJUAN } from "@/features/pengajuan-stok/tampilan";
import { SLUG_TAB_TRANSFER, TAB_TRANSFER } from "@/features/transfer-stok/tampilan";

type Tab = "ALL" | "PENDING" | "DIKIRIM";
const SLUG = { ALL: "semua", PENDING: "draf", DIKIRIM: "dikirim" } as const;
const SEMUA: readonly Tab[] = ["ALL", "PENDING", "DIKIRIM"];

describe("tabDariUrl", () => {
  it("tanpa ?tab= memakai tab bawaan", () => {
    expect(tabDariUrl(null, SLUG, SEMUA, "ALL")).toBe("ALL");
  });

  it("slug yang dikenal dipetakan ke tab internal", () => {
    expect(tabDariUrl("draf", SLUG, SEMUA, "ALL")).toBe("PENDING");
    expect(tabDariUrl("dikirim", SLUG, SEMUA, "ALL")).toBe("DIKIRIM");
  });

  it("kode internal, beda huruf, spasi, kosong, markup, dan nilai panjang kembali ke bawaan", () => {
    for (const nilai of ["PENDING", "Draf", "draf ", "", "<script>alert(1)</script>", "x".repeat(5000)]) {
      expect(tabDariUrl(nilai, SLUG, SEMUA, "ALL")).toBe("ALL");
    }
  });

  it("nama properti prototipe tidak pernah cocok", () => {
    for (const nilai of ["__proto__", "constructor", "toString", "hasOwnProperty", "prototype"]) {
      expect(tabDariUrl(nilai, SLUG, SEMUA, "ALL")).toBe("ALL");
    }
  });

  it("tab yang tidak boleh tampil kembali ke bawaan", () => {
    expect(tabDariUrl("dikirim", SLUG, ["ALL", "PENDING"], "ALL")).toBe("ALL");
  });
});

describe("urlDenganTab", () => {
  it("menulis slug ke ?tab=", () => {
    expect(urlDenganTab("/a", "draf")).toBe("/a?tab=draf");
  });

  it("slug null menghapus ?tab= dan mempertahankan parameter lain", () => {
    expect(urlDenganTab("/a", null, "tab=draf&cari=kopi")).toBe("/a?cari=kopi");
    expect(urlDenganTab("/a", null, "tab=draf")).toBe("/a");
  });

  it("mengganti ?tab= lama tanpa menggandakan", () => {
    expect(urlDenganTab("/a", "dikirim", "tab=draf")).toBe("/a?tab=dikirim");
  });

  it("meng-encode karakter khusus", () => {
    expect(urlDenganTab("/a", "a&b=c")).toBe("/a?tab=a%26b%3Dc");
  });
});

describe("slug tab fitur", () => {
  const POLA_SLUG = /^[a-z]+(-[a-z]+)*$/;

  it("slug pengajuan per ruang unik dan aman di URL", () => {
    for (const slug of Object.values(SLUG_TAB_PENGAJUAN)) {
      const nilai = Object.values(slug);
      expect(new Set(nilai).size).toBe(nilai.length);
      for (const s of nilai) expect(s).toMatch(POLA_SLUG);
    }
  });

  it("setiap tab transfer punya slug yang unik dan aman di URL", () => {
    const nilai = TAB_TRANSFER.map((t) => SLUG_TAB_TRANSFER[t]);
    expect(nilai.every((s) => typeof s === "string" && POLA_SLUG.test(s))).toBe(true);
    expect(new Set(nilai).size).toBe(nilai.length);
  });
});