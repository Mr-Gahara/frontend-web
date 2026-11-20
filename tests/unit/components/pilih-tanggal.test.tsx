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

describe("PilihTanggal formatTeks (FL20a)", () => {
  it("bawaan bulan panjang untuk teks dan nama aksesibel", () => {
    render(<PilihTanggal label="Tanggal" value={new Date(2026, 8, 1)} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Tanggal, 01 September 2026" }).textContent).toBe("01 September 2026");
  });

  it("pendek: bulan singkat id-ID untuk teks dan nama aksesibel", () => {
    render(<PilihTanggal label="Dari" value={new Date(2026, 7, 15)} onChange={() => {}} formatTeks="pendek" />);
    expect(screen.getByRole("button", { name: "Dari, 15 Agt 2026" }).textContent).toBe("15 Agt 2026");
  });

  it("pendek tanpa tanggal tetap menampilkan placeholder", () => {
    render(<PilihTanggal label="Dari" value={undefined} onChange={() => {}} formatTeks="pendek" placeholder="Semua tanggal" />);
    expect(screen.getByRole("button", { name: "Dari, Semua tanggal" })).toBeTruthy();
  });
});
