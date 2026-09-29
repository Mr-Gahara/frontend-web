import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { JadwalGrid } from "@/features/jadwal/grid-jadwal";
import type { KaryawanJadwal, ShiftItem } from "@/types/jadwal";

// ShiftCell dipalsukan agar test ini hanya menguji pemetaan dan interaksi
// JadwalGrid, tanpa bergantung pada tampilan sel.
vi.mock("@/features/jadwal/sel-shift", () => ({
  ShiftCell: ({
    day,
    shifts,
    onClick,
    isSunday,
  }: {
    day: number;
    shifts: ShiftItem[];
    onClick: () => void;
    isSunday: boolean;
  }) => (
    <td
      data-testid={`mock-shift-cell-${day}`}
      onClick={onClick}
      className={isSunday ? "sunday-cell" : ""}
    >
      {shifts[0]?.label || "OFF"}
    </td>
  ),
}));

describe("Integration - JadwalGrid", () => {
  const mockOnCellClick = vi.fn();

  const SHIFT_PAGI: ShiftItem = { id: "shift-pagi", type: "pagi", label: "PAGI", name: "Shift Pagi" };

  const mockKaryawan: KaryawanJadwal[] = [
    {
      id: "emp-1",
      nama: "Ridho MoltenZarak",
      role: "CEO / Admin",
      // Tanggal 1 ada shift pagi; tanggal 2 tanpa jadwal.
      jadwalMap: { 1: [SHIFT_PAGI] },
    },
    {
      id: "emp-2",
      nama: "Karyawan Tester",
      role: "Kasir",
      jadwalMap: {},
    },
  ];

  const defaultProps = {
    dataKaryawan: mockKaryawan,
    isLoading: false,
    year: 2026,
    month: 7, // Agustus (indeks bulan dimulai dari 0)
    daysArray: [1, 2, 3],
    daysInMonth: 31,
    onCellClick: mockOnCellClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan indikator memuat saat isLoading bernilai true", () => {
    render(<JadwalGrid {...defaultProps} isLoading={true} />);

    expect(screen.getByText(/memuat data jadwal/i)).toBeInTheDocument();
    expect(screen.queryByText(/ridho/i)).not.toBeInTheDocument();
  });

  it("menampilkan pesan galat saat data gagal dimuat (JD3)", () => {
    render(<JadwalGrid {...defaultProps} isError={true} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal Memuat Data");
    expect(screen.queryByText(/ridho/i)).not.toBeInTheDocument();
  });

  it("menampilkan pesan kosong bila tidak ada data karyawan", () => {
    render(<JadwalGrid {...defaultProps} dataKaryawan={[]} />);

    expect(screen.getByText(/tidak ada data karyawan/i)).toBeInTheDocument();
  });

  it("merender header tanggal dan data karyawan dengan tepat", () => {
    render(<JadwalGrid {...defaultProps} />);

    expect(screen.getByText(/ridho moltenzarak/i)).toBeInTheDocument();
    expect(screen.getByText(/ceo \/ admin/i)).toBeInTheDocument();
    expect(screen.getByText(/karyawan tester/i)).toBeInTheDocument();

    expect(screen.getAllByTestId("mock-shift-cell-1")[0]).toHaveTextContent("PAGI");
    // Tanggal 2 tidak ada di jadwalMap, sehingga memakai item kosong "OFF".
    expect(screen.getAllByTestId("mock-shift-cell-2")[0]).toHaveTextContent("OFF");
  });

  it("memanggil onCellClick dengan parameter yang tepat saat sel diklik", () => {
    render(<JadwalGrid {...defaultProps} />);

    fireEvent.click(screen.getAllByTestId("mock-shift-cell-1")[0]);

    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
    expect(mockOnCellClick).toHaveBeenCalledWith("emp-1", 1, [SHIFT_PAGI]);
  });
});
