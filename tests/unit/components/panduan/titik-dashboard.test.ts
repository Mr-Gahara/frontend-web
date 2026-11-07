import { describe, expect, it } from "vitest";
import { HREF_TITIK_MENU, TARGET_MENU_UTAMA, targetMenu, titikDashboard } from "@/components/panduan/titik-dashboard";

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