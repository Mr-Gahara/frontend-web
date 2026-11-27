import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import PenggunaFormDialog from "@/components/pengguna/pengguna-form-dialog";
import type { PenggunaRequest } from "@/types/pengguna";
import type { Role } from "@/types/role";
import type { Lokasi } from "@/types/location";

vi.mock("@/lib/auth/useSession", async () => {
  const { IZIN_HALAMAN } = await import("@/lib/auth/permissions");
  const semua = [...new Set(Object.values(IZIN_HALAMAN).flatMap((s) => s.flat()))];
  return { useSession: () => ({ permissions: semua }) };
});

describe("Integration - PenggunaFormDialog", () => {
  const mockSetShowDialog = vi.fn();
  const mockSetForm = vi.fn();
  // Kita pastikan mock event menghentikan default submission behavior
  const mockHandleSubmit = vi.fn((e) => e?.preventDefault());

  const defaultProps = {
    showDialog: true,
    setShowDialog: mockSetShowDialog,
    editTarget: null,
    form: { nama: "", roleID: "", status: "aktif", aksesType: ["web"] } as PenggunaRequest,
    setForm: mockSetForm,
    formError: "",
    handleSubmit: mockHandleSubmit,
    isPending: false,
    isSelf: false,
    isOwner: true,
    roleList: [{ id: "1", namaRole: "Admin", deskripsi: null, level: 1, permissions: [] }] as Role[],
    currentUserLevel: 0,
    lokasiKerja: { tampil: false, pilihan: [] as Lokasi[], memuat: false },
  };

  const gudang = { id: "lok-gudang", nama: "Gudang Utama", tipe: "Gudang" } as Lokasi;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toko baru hanya punya role Owner: catatan Buat posisi bertaut ke Posisi & Hak Akses (KS12a)", () => {
    const owner = [{ id: "o", namaRole: "Owner", deskripsi: null, level: 100, permissions: [] }] as Role[];
    render(<PenggunaFormDialog {...defaultProps} roleList={owner} currentUserLevel={100} />);
    expect(screen.getByRole("note", { name: "Syarat belum ada" })).toHaveTextContent(
      "Belum ada posisi yang dapat diberikan ke karyawan.",
    );
    expect(screen.getByRole("link", { name: "Buat posisi" })).toHaveAttribute("href", "/dashboard/outlet/pengaturan/roles");
  });

  it("ada posisi di bawah level pengguna, atau role belum termuat: tanpa catatan", () => {
    const peran = [
      { id: "o", namaRole: "Owner", deskripsi: null, level: 100, permissions: [] },
      { id: "k", namaRole: "Kasir", deskripsi: null, level: 10, permissions: [] },
    ] as Role[];
    const { unmount } = render(<PenggunaFormDialog {...defaultProps} roleList={peran} currentUserLevel={100} />);
    expect(screen.queryByRole("note", { name: "Syarat belum ada" })).toBeNull();
    unmount();
    render(<PenggunaFormDialog {...defaultProps} roleList={[]} currentUserLevel={100} />);
    expect(screen.queryByRole("note", { name: "Syarat belum ada" })).toBeNull();
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

  it("isian Lokasi Kerja hanya tampil bila diizinkan, dengan Tidak dibatasi untuk null (B269)", () => {
    const { rerender } = render(<PenggunaFormDialog {...defaultProps} />);
    expect(screen.queryByText("Lokasi Kerja")).not.toBeInTheDocument();

    rerender(
      <PenggunaFormDialog
        {...defaultProps}
        form={{ ...defaultProps.form, locationID: null }}
        lokasiKerja={{ tampil: true, pilihan: [gudang], memuat: false }}
      />,
    );
    expect(screen.getByText("Lokasi Kerja")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Lokasi Kerja" })).toHaveTextContent("Tidak dibatasi");
  });

  it("lokasi kerja terkunci saat mengubah diri sendiri, karena backend mengabaikannya (B269)", () => {
    render(
      <PenggunaFormDialog
        {...defaultProps}
        isSelf
        form={{ ...defaultProps.form, locationID: "lok-gudang" }}
        lokasiKerja={{ tampil: true, pilihan: [gudang], memuat: false }}
      />,
    );
    const isian = screen.getByRole("combobox", { name: "Lokasi Kerja" });
    expect(isian).toBeDisabled();
    expect(isian).toHaveTextContent("Gudang Utama (Gudang)");
  });
});
