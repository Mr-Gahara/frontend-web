import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HalamanGalat, ISI_GALAT } from "@/components/galat/halaman-galat";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

describe("HalamanGalat (desain A)", () => {
  it("404 halaman penuh: kode, judul, Ke dashboard, dan Kembali", () => {
    render(<HalamanGalat kode={404} />);
    expect(screen.getByText("404")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: ISI_GALAT[404].judul })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ke dashboard" }).getAttribute("href")).toBe("/dashboard");
    expect(screen.getByRole("button", { name: "Kembali ke halaman sebelumnya" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
  });
  it("403 tertanam: tanpa landmark main kedua dan tanpa tautan kembali", () => {
    render(<HalamanGalat kode={403} tertanam />);
    expect(screen.getByText(/Anda tidak memiliki izin membuka halaman ini\./)).toBeTruthy();
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.queryByRole("button", { name: "Kembali ke halaman sebelumnya" })).toBeNull();
  });
  it("500: Coba lagi memanggil ulang, Ke dashboard menjadi tautan, dan kode galat tampil", () => {
    const cobaLagi = vi.fn();
    render(<HalamanGalat kode={500} onCobaLagi={cobaLagi} kodeGalat="abc123" />);
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(cobaLagi).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Ke dashboard" })).toBeTruthy();
    expect(screen.getByText("abc123")).toBeTruthy();
  });
  it("400 memakai teks tautan rusak", () => {
    render(<HalamanGalat kode={400} />);
    expect(screen.getByText("Tautan yang Anda buka rusak atau tidak lengkap.")).toBeTruthy();
  });
});
