import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { PolaFormDialog } from "@/components/pola-roster/pola-form-dialog";

describe("Integration - PolaFormDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const mockMasterShift = [
    { id: "shift-1", nama: "Shift Pagi", jam: "08:00-16:00" },
    { id: "shift-2", nama: "Shift Malam", jam: "16:00-00:00" },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    editTarget: null,
    masterShiftList: mockMasterShift as any,
    onSubmit: mockOnSubmit,
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus merender form default dengan 7 hari siklus (Happy Path)", () => {
    render(<PolaFormDialog {...defaultProps} />);
    
    // Cek judul dialog
    expect(screen.getByText("Buat Pola Roster")).toBeInTheDocument();
    
    // Cek default value siklus (7) ter-render
    expect(screen.getByDisplayValue("7")).toBeInTheDocument();
    
    // Cek kalkulasi text informasi array ter-render
    expect(screen.getByText("7 Hari Terdeteksi")).toBeInTheDocument();
  });

  it("harus menampilkan error jika form disubmit tanpa Nama Pola (Unhappy Path - Internal Validation)", () => {
    render(<PolaFormDialog {...defaultProps} />);
    
    const submitButton = screen.getByRole("button", { name: /simpan pola roster/i });
    
    // Bypass validasi HTML5 (required) untuk mengetes logika setErrorMsg di dalam fungsi handleSubmit Tuan
    fireEvent.submit(submitButton);

    // Memastikan pesan error buatan Anda muncul di layar
    expect(screen.getByText("Nama Pola wajib diisi.")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("harus bisa mengubah jumlah siklus dan mensubmit data yang benar (Interaksi Spesifik)", async () => {
    const user = userEvent.setup();
    render(<PolaFormDialog {...defaultProps} />);
    
    // 1. Mengisi Nama Pola
    const namaInput = screen.getByLabelText(/nama pola roster/i);
    await user.type(namaInput, "Pola Satpam");

    // 2. Mengubah Siklus menjadi 2 hari
    const siklusInput = screen.getByLabelText(/siklus \(hari\)/i);
    await user.clear(siklusInput);
    await user.type(siklusInput, "2");

    // Memastikan jumlah baris otomatis terpotong menjadi 2
    expect(screen.getByText("2 Hari Terdeteksi")).toBeInTheDocument();

    // 3. Submit Form
    const submitButton = screen.getByRole("button", { name: /simpan pola roster/i });
    fireEvent.submit(submitButton);

    // 4. Memastikan format payload yang dikirim ke backend sudah disanitasi (hanya 2 hari, dan libur)
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      namaPola: "Pola Satpam",
      siklusHari: 2,
      detailSiklus: [
        { hariKe: 1, isLibur: true },
        { hariKe: 2, isLibur: true }
      ]
    });
  });

  it("harus mendisabel tombol dan mengubah teks saat isPending bernilai true (Edge Case)", () => {
    render(<PolaFormDialog {...defaultProps} isPending={true} />);
    
    const submitButton = screen.getByRole("button", { name: /menyimpan/i });
    expect(submitButton).toBeDisabled();
  });
});