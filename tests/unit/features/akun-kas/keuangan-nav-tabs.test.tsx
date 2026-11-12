import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KeuanganNavTabs } from "@/app/dashboard/outlet/keuangan/components/keuangan-nav-tabs";

const sesi = vi.hoisted(() => ({ permissions: [] as string[] }));

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/outlet/keuangan/akunkas" }));
vi.mock("@/lib/auth/useSession", () => ({ useSession: () => sesi }));

const namaTab = () => screen.queryAllByRole("link").map((l) => l.textContent);

describe("KeuanganNavTabs (kontrak/temuan.md butir 163)", () => {
  beforeEach(() => {
    sesi.permissions = [];
  });

  it("menyembunyikan tab yang halamannya ditolak IZIN_HALAMAN", () => {
    sesi.permissions = ["read-akunkas"];
    render(<KeuanganNavTabs />);
    expect(namaTab()).toEqual(["Mutasi Kas", "Akun Kas & Bank"]);
  });

  it("Belanja Stok tampil dengan izin pembelian per ruang", () => {
    sesi.permissions = ["read-akunkas", "read-location", "read-pembelian-stok-gudang", "read-laporan"];
    render(<KeuanganNavTabs />);
    expect(namaTab()).toEqual(["Ringkasan Laba/Rugi", "Arus Kas", "Mutasi Kas", "Akun Kas & Bank", "Belanja Stok"]);
  });

  it("Mesin Kasir tampil sebagai tab kelima dengan read-sesi-kasir saja", () => {
    sesi.permissions = ["read-akunkas", "read-sesi-kasir"];
    render(<KeuanganNavTabs />);
    expect(namaTab()).toEqual(["Mutasi Kas", "Akun Kas & Bank", "Mesin Kasir"]);
  });

  it("Mesin Kasir tidak tampil dengan kelola-perangkat-kasir tanpa read-sesi-kasir", () => {
    sesi.permissions = ["kelola-perangkat-kasir", "read-pengguna", "read-akunkas"];
    render(<KeuanganNavTabs />);
    expect(namaTab()).toEqual(["Mutasi Kas", "Akun Kas & Bank"]);
  });

  it("tanpa izin keuangan tidak ada tab", () => {
    render(<KeuanganNavTabs />);
    expect(namaTab()).toEqual([]);
  });
});
