import { describe, expect, it } from "vitest";
import {
  DAFTAR_PLAN,
  persenTerpakai,
  ringkasLangganan,
  sisaHari,
  tautanWhatsapp,
  teksRiwayat,
} from "@/features/langganan/data";
import type { LanggananToko, RiwayatLanggananToko } from "@/types/langganan";

const HARI = 86_400_000;
const kini = new Date("2026-11-03T05:00:00Z");

describe("sisaHari", () => {
  it("membulatkan ke atas dan tidak pernah negatif", () => {
    expect(sisaHari(new Date(kini.getTime() + 12 * HARI), kini)).toBe(12);
    expect(sisaHari(new Date(kini.getTime() + 1), kini)).toBe(1);
    expect(sisaHari(new Date(kini.getTime() - HARI), kini)).toBe(0);
  });
});

describe("persenTerpakai", () => {
  const mulai = new Date(kini.getTime() - 7 * HARI);
  const berakhir = new Date(kini.getTime() + 7 * HARI);
  it("menghitung bagian yang sudah terpakai", () => {
    expect(persenTerpakai(mulai, berakhir, kini)).toBe(50);
  });
  it("dibatasi 0 sampai 100", () => {
    expect(persenTerpakai(mulai, berakhir, new Date(mulai.getTime() - HARI))).toBe(0);
    expect(persenTerpakai(mulai, berakhir, new Date(berakhir.getTime() + HARI))).toBe(100);
    expect(persenTerpakai(berakhir, mulai, kini)).toBe(100);
  });
});

describe("tautanWhatsapp", () => {
  it("null selama nomor belum diisi", () => {
    expect(tautanWhatsapp("", "Kopi Senja", "Basic")).toBeNull();
    expect(tautanWhatsapp(" - ", "Kopi Senja", "Basic")).toBeNull();
  });
  it("membentuk tautan wa.me dari angka saja, dengan pesan berisi toko dan plan", () => {
    const t = tautanWhatsapp("+62 812-3456", "Kopi Senja", "Basic");
    expect(t).toMatch(/^https:\/\/wa\.me\/628123456\?text=/);
    expect(decodeURIComponent(t!.split("text=")[1])).toContain("toko Kopi Senja (plan Basic)");
  });
});

const iso = (d: Date) => d.toISOString();
const catatan = (ubah: Partial<RiwayatLanggananToko>): RiwayatLanggananToko => ({
  id: "r1",
  aksi: "buat",
  durasiBulan: null,
  berakhirSebelum: null,
  berakhirSesudah: null,
  planSebelum: "basic",
  planSesudah: "basic",
  createdAt: iso(kini),
  ...ubah,
});
const toko = (ubah: Partial<LanggananToko>): LanggananToko => ({
  plan: "basic",
  status: "aktif",
  aksesBerakhirPada: null,
  masaTenggangHari: 7,
  ...ubah,
});

describe("ringkasLangganan", () => {
  const mulai = new Date(kini.getTime() - 2 * HARI);
  const berakhir = new Date(mulai.getTime() + 14 * HARI);

  it("masa percobaan Basic: mulai dari catatan buat yang menetapkan tanggal berakhir", () => {
    const r = ringkasLangganan(
      toko({ aksesBerakhirPada: iso(berakhir) }),
      [catatan({ berakhirSesudah: iso(berakhir), createdAt: iso(mulai) })],
      kini,
    );
    expect(r).toMatchObject({ plan: "basic", percobaan: true, lewat: false, tenggangSampai: null });
    expect(r.mulai).toEqual(mulai);
    expect(r.berakhir).toEqual(berakhir);
  });

  it("bukan percobaan setelah ada catatan berdurasi, juga untuk plan lain", () => {
    const riwayat = [
      catatan({ id: "r2", aksi: "perpanjang", durasiBulan: 3, berakhirSesudah: iso(berakhir) }),
      catatan({ berakhirSesudah: iso(mulai), createdAt: iso(mulai) }),
    ];
    expect(ringkasLangganan(toko({ aksesBerakhirPada: iso(berakhir) }), riwayat, kini).percobaan).toBe(false);
    expect(ringkasLangganan(toko({ plan: "pro", aksesBerakhirPada: iso(berakhir) }), [catatan({})], kini).percobaan).toBe(false);
  });

  it("tanpa batas waktu: berakhir dan mulai null, bukan percobaan", () => {
    const r = ringkasLangganan(toko({ plan: "pro" }), [catatan({ aksi: "ubah-plan", planSesudah: "pro" })], kini);
    expect(r).toMatchObject({ berakhir: null, mulai: null, percobaan: false, lewat: false });
  });

  it("masa akses lewat: tenggang dihitung dari tanggal berakhir", () => {
    const lalu = new Date(kini.getTime() - HARI);
    const r = ringkasLangganan(toko({ aksesBerakhirPada: iso(lalu), masaTenggangHari: 7 }), [], kini);
    expect(r.lewat).toBe(true);
    expect(r.tenggangSampai).toEqual(new Date(lalu.getTime() + 7 * HARI));
    expect(r.mulai).toBeNull();
  });
});

describe("teksRiwayat", () => {
  it("menyebut durasi dan perubahan plan", () => {
    expect(teksRiwayat(catatan({}))).toBe("Akun dibuat, masa percobaan Basic");
    expect(teksRiwayat(catatan({ durasiBulan: 12, planSesudah: "pro" }))).toBe("Akun dibuat, plan Pro 12 bulan");
    expect(teksRiwayat(catatan({ aksi: "perpanjang", durasiBulan: 3 }))).toBe("Diperpanjang 3 bulan");
    expect(teksRiwayat(catatan({ aksi: "perpanjang", durasiBulan: 6, planSesudah: "advanced" }))).toBe(
      "Diperpanjang 6 bulan, plan Basic ke Advanced",
    );
    expect(teksRiwayat(catatan({ aksi: "ubah-plan", planSesudah: "pro" }))).toBe("Plan diubah dari Basic ke Pro");
    expect(teksRiwayat(catatan({ aksi: "unfreeze", durasiBulan: 1 }))).toBe("Akun diaktifkan kembali, 1 bulan");
    expect(teksRiwayat(catatan({ aksi: "kedaluwarsa" }))).toBe("Masa berlaku habis");
  });
});

describe("data plan", () => {
  it("fitur yang tidak termasuk berkurang dari Basic ke Pro", () => {
    expect(DAFTAR_PLAN.map((p) => p.fitur.filter((f) => !f.ada).length)).toEqual([2, 1, 0]);
  });
});
