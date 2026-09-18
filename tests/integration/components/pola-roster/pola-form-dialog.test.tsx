import { render, screen, fireEvent } from "@testing-library/react";
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
    
    expect(screen.getByText("Buat Pola Roster")).toBeInTheDocument();
    expect(screen.getByDisplayValue("7")).toBeInTheDocument();
    expect(screen.getByText("7 Hari Terdeteksi")).toBeInTheDocument();
  });

  it("harus menampilkan error jika form disubmit tanpa Nama Pola (Unhappy Path - Internal Validation)", () => {
    render(<PolaFormDialog {...defaultProps} />);
    
    // Alih-alih fireEvent.submit pada button, kita targetkan DOM form-nya langsung.
    // Ini lebih dapat diandalkan untuk mem-bypass atribut 'required' pada JSDOM.
    const formElement = document.getElementById('pola-form');
    if (formElement) {
        fireEvent.submit(formElement);
    }

    // Memastikan pesan error buatan Anda muncul di layar
    expect(screen.getByText("Nama Pola wajib diisi.")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("harus bisa mengubah jumlah siklus dan mensubmit data yang benar (Interaksi Spesifik)", async () => {
    const user = userEvent.setup();
    render(<PolaFormDialog {...defaultProps} />);
    
    // Karena label tidak memiliki atribut 'htmlFor', getByLabelText akan gagal.
    // Kita gunakan getByPlaceholderText atau mencari input di sekitar label.
    // Mencari input Nama Pola berdasarkan placeholder (strategi yang lebih aman):
    const namaInput = screen.getByPlaceholderText(/Misal: Reguler 5-2/i);
    await user.type(namaInput, "Pola Satpam");

    // Mencari input Siklus. Karena tidak ada placeholder, kita ambil input yang nilainya saat ini "7"
    const siklusInput = screen.getByDisplayValue("7");
    await user.clear(siklusInput);
    await user.type(siklusInput, "2");

    // Memastikan jumlah baris otomatis terpotong menjadi 2
    expect(screen.getByText("2 Hari Terdeteksi")).toBeInTheDocument();

    // Submit Form melalui form element
    const formElement = document.getElementById('pola-form');
    if (formElement) {
        fireEvent.submit(formElement);
    }

    // Memastikan format payload yang dikirim ke backend sudah disanitasi
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