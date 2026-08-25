import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { JadwalGrid } from "@/components/jadwal/jadwal-grid";

// --- TAKTIK BUTLER: Mocking Child Component ---
// Kita memalsukan komponen ShiftCell agar test ini murni hanya menguji
// logika mapping dan state dari JadwalGrid tanpa terdistraksi error dari komponen anak.
vi.mock("@/components/jadwal/shift-cell", () => ({
  ShiftCell: ({ day, shifts, onClick, isSunday }: any) => (
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

  // Data tiruan presisi tinggi
  const mockKaryawan = [
    {
      id: "emp-1",
      nama: "Ridho MoltenZarak",
      role: "CEO / Admin",
      jadwalMap: {
        // Asumsi tanggal 1 ada shift pagi, tanggal 2 kosong (default OFF)
        1: [
          {
            id: "shift-pagi",
            type: "shift",
            label: "PAGI",
            name: "Shift Pagi",
          },
        ],
      },
    },
    {
      id: "emp-2",
      nama: "Karyawan Tester",
      role: "Kasir",
      jadwalMap: {}, // Kosong total
    },
  ];

  const defaultProps = {
    dataKaryawan: mockKaryawan as any,
    isLoading: false,
    year: 2026,
    month: 7, // Agustus (index bulan dimulai dari 0 di JavaScript)
    daysArray: [1, 2, 3], // Kita test 3 hari saja agar cepat
    daysInMonth: 31,
    onCellClick: mockOnCellClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus menampilkan indikator loading saat isLoading bernilai true (Edge Case)", () => {
    render(<JadwalGrid {...defaultProps} isLoading={true} />);

    expect(screen.getByText(/memuat data jadwal/i)).toBeInTheDocument();
    // Tabel karyawan tidak boleh muncul saat loading
    expect(screen.queryByText(/ridho/i)).not.toBeInTheDocument();
  });

  it("harus menampilkan pesan kosong jika tidak ada data karyawan (Edge Case)", () => {
    render(<JadwalGrid {...defaultProps} dataKaryawan={[]} />);

    expect(screen.getByText(/tidak ada data karyawan/i)).toBeInTheDocument();
  });

  it("harus merender header tanggal dan data karyawan dengan tepat (Happy Path)", () => {
    render(<JadwalGrid {...defaultProps} />);

    // 1. Cek apakah nama karyawan dan role ter-render
    expect(screen.getByText(/ridho moltenzarak/i)).toBeInTheDocument();
    expect(screen.getByText(/ceo \/ admin/i)).toBeInTheDocument();
    expect(screen.getByText(/karyawan tester/i)).toBeInTheDocument();

    // 2. Cek apakah sel jadwal ter-render dengan label yang benar
    // Ridho tanggal 1 = PAGI
    const ridhoCellDay1 = screen.getAllByTestId("mock-shift-cell-1")[0];
    expect(ridhoCellDay1).toHaveTextContent("PAGI");

    // Ridho tanggal 2 = OFF (karena tidak ada di jadwalMap, fallback ke OFF)
    const ridhoCellDay2 = screen.getAllByTestId("mock-shift-cell-2")[0];
    expect(ridhoCellDay2).toHaveTextContent("OFF");
  });

  it("harus memanggil onCellClick dengan parameter yang tepat saat sel jadwal diklik (Interaksi Spesifik)", () => {
    render(<JadwalGrid {...defaultProps} />);

    // Ambil sel shift tanggal 1 milik karyawan pertama (Ridho)
    const ridhoCellDay1 = screen.getAllByTestId("mock-shift-cell-1")[0];

    // Klik sel tersebut
    fireEvent.click(ridhoCellDay1);

    // Memastikan event dilempar ke atas dengan parameter yang benar:
    // (penggunaId, hari, arrayShifts)
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
    expect(mockOnCellClick).toHaveBeenCalledWith(
      "emp-1", // ID Karyawan
      1, // Tanggal / Hari
      [{ id: "shift-pagi", type: "shift", label: "PAGI", name: "Shift Pagi" }], // Data shift-nya
    );
  });
});
