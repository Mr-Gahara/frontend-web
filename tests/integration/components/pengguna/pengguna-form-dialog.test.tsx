import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import PenggunaFormDialog from "@/components/pengguna/pengguna-form-dialog";

describe("Integration - PenggunaFormDialog", () => {
  const mockSetShowDialog = vi.fn();
  const mockSetForm = vi.fn();
  // Kita pastikan mock event menghentikan default submission behavior
  const mockHandleSubmit = vi.fn((e) => e?.preventDefault());

  const defaultProps = {
    showDialog: true,
    setShowDialog: mockSetShowDialog,
    editTarget: null,
    form: { username: "", nama: "", password: "" } as any,
    setForm: mockSetForm,
    formError: "",
    handleSubmit: mockHandleSubmit,
    isPending: false,
    isSelf: false,
    isOwner: true,
    roleList: [{ id: "1", name: "Admin", level: 1 }] as any,
    currentUserLevel: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus merender form saat showDialog bernilai true (Happy Path)", () => {
    render(<PenggunaFormDialog {...defaultProps} />);
    // Menggunakan nama asli dari log: "Simpan Pengguna"
    expect(
      screen.getByRole("button", { name: /simpan pengguna/i }),
    ).toBeInTheDocument();
  });

  it("harus memanggil handleSubmit saat form disubmit (Happy Path - Bypass Validation)", () => {
    render(<PenggunaFormDialog {...defaultProps} />);

    const submitButton = screen.getByRole("button", {
      name: /simpan pengguna/i,
    });
    fireEvent.submit(submitButton);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it("harus menampilkan pesan error merah jika prop formError terisi (Edge Case)", () => {
    const errorMessage = "Username zarak.ceo sudah digunakan";
    render(<PenggunaFormDialog {...defaultProps} formError={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("harus mendisabel tombol simpan jika isPending bernilai true (Edge Case)", () => {
    render(<PenggunaFormDialog {...defaultProps} isPending={true} />);

    // Menggunakan nama yang muncul saat isPending true: "Menyimpan Data..."
    const submitButton = screen.getByRole("button", {
      name: /menyimpan data/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("harus memanggil setShowDialog(false) ketika tombol Close (X) diklik (Happy Path)", async () => {
    const user = userEvent.setup();
    render(<PenggunaFormDialog {...defaultProps} />);

    // Mencari tombol dengan nama "Close" sesuai hasil log terminal
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(mockSetShowDialog).toHaveBeenCalledWith(false);
  });
});
