import { describe, expect, it } from "vitest";
import { HREF_TITIK_MENU, HREF_TITIK_MENU_GUDANG, TARGET_MENU_UTAMA, targetMenu, titikDashboard } from "@/components/panduan/titik-dashboard";

const semua = () => true;

describe("titik tur dashboard", () => {
  it("menu utama lebih dulu, lalu menu bertitik berurutan; Karyawan di titik ketiga seperti kanvas", () => {
    const t = titikDashboard(semua, false);
    expect(t.map((x) => x.target)).toEqual([TARGET_MENU_UTAMA, ...HREF_TITIK_MENU.map(targetMenu)]);
    expect(t).toHaveLength(5);
    expect(t[2]).toMatchObject({
      target: "menu:/dashboard/outlet/pengguna",
      judul: "Tambahkan karyawan",
      isi: "Setiap kasir masuk dengan nama dan PIN sendiri. Tambahkan karyawan di sini sebelum mereka memakai aplikasi kasir.",
    });
  });

  it("menu yang tidak tampil bagi pengguna tidak punya titik; menu utama selalu ada", () => {
    const t = titikDashboard((href) => href !== "/dashboard/outlet/pengguna", false);
    expect(t.map((x) => x.target)).not.toContain("menu:/dashboard/outlet/pengguna");
    expect(t).toHaveLength(4);
    expect(titikDashboard(() => false, false).map((x) => x.target)).toEqual([TARGET_MENU_UTAMA]);
  });

  it("di HP balon menu di bawah menunya dan teks menu utama menyebut sidebar dibuka", () => {
    const hp = titikDashboard(semua, true);
    const laptop = titikDashboard(semua, false);
    expect(hp.slice(1).every((x) => x.sisi === "bottom")).toBe(true);
    expect(laptop.slice(1).every((x) => x.sisi === "right")).toBe(true);
    expect(hp[0].isi).toContain("panduan membukanya untuk Anda");
    expect(laptop[0].isi).toContain("menyempitkan atau melebarkan menu");
  });
});
describe("titik tur dashboard ruang gudang (TG1a)", () => {
  it("menu utama lalu lima menu gudang berurutan dengan teks yang disetujui", () => {
    const t = titikDashboard(semua, false, "gudang");
    expect(t.map((x) => x.target)).toEqual([TARGET_MENU_UTAMA, ...HREF_TITIK_MENU_GUDANG.map(targetMenu)]);
    expect(t).toHaveLength(6);
    expect(t.slice(1).map((x) => x.judul)).toEqual([
      "Kelola barang gudang",
      "Tinjau pengajuan outlet",
      "Kirim barang ke outlet",
      "Tambahkan petugas gudang",
      "Pengaturan gudang",
    ]);
    expect(t[1].isi).toBe("Gudang baru mulai kosong. Masukkan barang dari master data toko di sini, lalu pantau stok gudang.");
    expect(t[3].isi).toBe("Permintaan yang disetujui dikirim lewat surat jalan yang dibuat di sini.");
  });

  it("menu gudang yang tidak tampil bagi pengguna tidak punya titik, dan menu outlet tidak ikut", () => {
    const t = titikDashboard((href) => href !== "/dashboard/gudang/pengguna", false, "gudang");
    expect(t.map((x) => x.target)).not.toContain(targetMenu("/dashboard/gudang/pengguna"));
    expect(t.some((x) => x.target.includes("/dashboard/outlet/"))).toBe(false);
    expect(t).toHaveLength(5);
  });
});
