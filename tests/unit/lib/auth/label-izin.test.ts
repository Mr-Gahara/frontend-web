import { describe, expect, it } from "vitest";
import { labelIzin, labelSyarat, rapikanNamaIzin } from "@/lib/auth/label-izin";
import { IZIN_HALAMAN, syaratKurangRute } from "@/lib/auth/permissions";
import { labelMenuRute } from "@/components/sidebar-menu";

describe("pesan 403 yang menyebut izin (23 November 2026)", () => {
  it("deskripsi backend dipakai lebih dulu; tanpa itu nama teknis dirapikan", () => {
    const deskripsi = new Map([["read-absensi", "Melihat seluruh riwayat absensi staf"]]);
    expect(labelIzin("read-absensi", deskripsi)).toBe("Melihat seluruh riwayat absensi staf");
    expect(labelIzin("read-akunkas")).toBe("Lihat akun kas");
    expect(rapikanNamaIzin("create-metode-pembayaran")).toBe("Buat metode pembayaran");
    expect(rapikanNamaIzin("akses-lintas-outlet")).toBe("Akses lintas outlet");
    expect(rapikanNamaIzin("tidak-dikenal")).toBe("tidak dikenal");
    // Sebutan tampilan "kategori aset" (KA1a); nama izin backend tetap tipe-aset.
    expect(rapikanNamaIzin("create-tipe-aset")).toBe("Buat kategori aset");
  });

  it("izin alternatif ditulis sebagai salah satu", () => {
    expect(labelSyarat(["read-inventory", "read-inventory-outlet"])).toBe(
      "Salah satu: Lihat stok, atau Lihat stok outlet",
    );
  });

  it("syarat yang kurang hanya yang belum dipenuhi; alternatif cukup salah satu", () => {
    const rute = "/dashboard/outlet/rekap-absensi";
    expect(IZIN_HALAMAN[rute]).toBeDefined();
    expect(syaratKurangRute(rute, ["read-location"])).toEqual([["read-absensi"]]);
    expect(syaratKurangRute(rute, ["read-location", "read-absensi"])).toEqual([]);
  });

  it("nama halaman dari label menu, juga untuk halaman turunannya", () => {
    expect(labelMenuRute("/dashboard/outlet/rekap-absensi")).toBe("Rekap Absensi");
    expect(labelMenuRute("/dashboard/outlet/pengaturan/metodePembayaran/buatMetodePembayaran")).not.toBeNull();
    expect(labelMenuRute("/dashboard/profil")).toBeNull();
  });
});
