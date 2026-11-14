import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PilihTanggal } from "@/components/pilih-tanggal";

/**
 * Tombol Kosongkan di bawah kalender (filter tanggal daftar penjualan,
 * pemilik proyek 14 November 2026): hanya tampil bila onKosongkan diisi
 * dan tanggal terisi.
 */
const buka = (label: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));

describe("PilihTanggal onKosongkan", () => {
  it("tanggal terisi: Kosongkan memanggil onKosongkan dan menutup kalender", () => {
    const onKosongkan = vi.fn();
    render(
      <PilihTanggal label="Dari Tanggal" value={new Date(2026, 10, 3)} onChange={() => {}} onKosongkan={onKosongkan} />,
    );
    buka("Dari Tanggal");
    fireEvent.click(screen.getByRole("button", { name: "Kosongkan" }));
    expect(onKosongkan).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Kosongkan" })).toBeNull();
  });

  it("tanggal kosong: tombol Kosongkan tidak tampil", () => {
    render(<PilihTanggal label="Dari Tanggal" value={undefined} onChange={() => {}} onKosongkan={() => {}} />);
    buka("Dari Tanggal");
    expect(screen.queryByRole("button", { name: "Kosongkan" })).toBeNull();
  });

  it("tanpa onKosongkan: isian tanggal lain tidak berubah", () => {
    render(<PilihTanggal label="Tanggal" value={new Date(2026, 10, 3)} onChange={() => {}} />);
    buka("Tanggal");
    expect(screen.queryByRole("button", { name: "Kosongkan" })).toBeNull();
  });
});
