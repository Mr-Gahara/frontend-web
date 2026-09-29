/** Status master shift; Non-Aktif berarti diarsipkan lewat DELETE /shift/:id. */
export type StatusShift = "Aktif" | "Non-Aktif";

/**
 * Master shift dari GET /shift, sesuai mappers/shiftMapper.js backend
 * 00b9957. Respons tidak membawa tenantID, dan waktu dibuat bernama
 * dibuatPada.
 */
export interface ShiftItem {
  id: string;
  namaShift: string;
  jamMasuk: string; // Format: HH:mm
  jamPulang: string; // Format: HH:mm
  isLintasHari: boolean;
  toleransiTerlambat: number; // Dalam menit
  status: StatusShift;
  dibuatPada: string | null;
}

/** Payload POST dan PUT /shift (validators/shiftValidator.js). */
export interface ShiftRequest {
  namaShift: string;
  jamMasuk: string;
  jamPulang: string;
  isLintasHari: boolean;
  toleransiTerlambat: number;
  status: StatusShift;
}
