import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { PolaFormDialog } from "@/features/pola-roster/form-pola-roster";
import type { ShiftItem } from "@/types/shift";

describe("Integration - PolaFormDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  const shiftList: ShiftItem[] = [
    {
      id: "shift-1",
      namaShift: "Shift Pagi",
      jamMasuk: "08:00",
      jamPulang: "16:00",
      isLintasHari: false,
      toleransiTerlambat: 0,
      status: "Aktif",
      dibuatPada: null,
    },
    {
      id: "shift-2",
      namaShift: "Shift Malam",
      jamMasuk: "16:00",
      jamPulang: "00:00",
      isLintasHari: true,
      toleransiTerlambat: 0,
      status: "Aktif",
      dibuatPada: null,
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    editTarget: null,
    shiftList,
    onSubmit: mockOnSubmit,
    isPending: false,
  };

  const kirimForm = () => {
    const formElement = document.getElementById("pola-form");
    if (formElement) fireEvent.submit(formElement);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender form default dengan 7 hari siklus", () => {
    render(<PolaFormDialog {...defaultProps} />);

    expect(screen.getByText("Buat Pola Roster")).toBeInTheDocument();
    expect(screen.getByLabelText("Siklus (Hari)")).toHaveValue("7");
    expect(screen.getByText("7 Hari Terdeteksi")).toBeInTheDocument();
  });

  it("menampilkan galat bila form disubmit tanpa nama pola", async () => {
    render(<PolaFormDialog {...defaultProps} />);

    kirimForm();

    expect(await screen.findByText("Nama Pola wajib diisi.")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("mengubah jumlah siklus lalu mengirim payload tersanitasi; mengosongkan siklus tidak menghapus rincian (PL3a)", async () => {
    const user = userEvent.setup();
    render(<PolaFormDialog {...defaultProps} />);

    await user.type(screen.getByLabelText("Nama Pola Roster"), "Pola Satpam");
    const siklusInput = screen.getByLabelText("Siklus (Hari)");
    await user.clear(siklusInput);
    expect(screen.getByText("7 Hari Terdeteksi")).toBeInTheDocument();
    await user.type(siklusInput, "2");
    expect(screen.getByText("2 Hari Terdeteksi")).toBeInTheDocument();

    kirimForm();

    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      namaPola: "Pola Satpam",
      siklusHari: 2,
      detailSiklus: [
        { hariKe: 1, isLibur: true },
        { hariKe: 2, isLibur: true },
      ],
    });
  });

  it("menolak ketikan siklus di atas 31 (PL3a)", async () => {
    const user = userEvent.setup();
    render(<PolaFormDialog {...defaultProps} />);

    const siklusInput = screen.getByLabelText("Siklus (Hari)");
    await user.clear(siklusInput);
    await user.type(siklusInput, "32");

    expect(siklusInput).toHaveValue("3");
    expect(screen.getByText("3 Hari Terdeteksi")).toBeInTheDocument();
  });

  it("menonaktifkan tombol dan mengubah teks saat isPending bernilai true", () => {
    render(<PolaFormDialog {...defaultProps} isPending={true} />);

    const submitButton = screen.getByRole("button", { name: /menyimpan/i });
    expect(submitButton).toBeDisabled();
  });
});
