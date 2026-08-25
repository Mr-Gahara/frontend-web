export interface ShiftItem {
  id: string; // ID dari database (MongoDB _id yang sudah di-mapping)
  _id?: string;
  tenantID: string;
  namaShift: string;
  jamMasuk: string; // Format: HH:mm
  jamPulang: string; // Format: HH:mm
  isLintasHari: boolean;
  toleransiTerlambat: number; // Dalam menit
  status: "Aktif" | "Non-Aktif";
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftRequest {
  namaShift: string;
  jamMasuk: string;
  jamPulang: string;
  isLintasHari: boolean;
  toleransiTerlambat: number;
  status: "Aktif" | "Non-Aktif";
}
