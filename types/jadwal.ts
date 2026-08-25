export type ShiftItem = {
  id: string; // ID dari JadwalShift (atau "off" jika tidak ada jadwal)
  masterShiftId?: string; // ID dari MasterShift (atau null jika tidak ada jadwal)
  name: string; // Misal: "Pagi", "Malam", "Cuti"
  label: string; // Misal: "08:00 - 16:00"
  type: "pagi" | "sore" | "malam" | "cuti" | "off";
};

export type KaryawanJadwal = {
  id: string; // PenggunaID
  nama: string;
  role: string;
  // Key adalah tanggal (1-31), value adalah array shift di hari itu
  jadwalMap: Record<number, ShiftItem[]>;
};

export type MasterShiftItem = {
  id: string;
  nama: string;
  jam: string; // contoh: "08:00 - 16:00"
};

export type PolaRosterItem = {
  id: string;
  nama: string;
  siklus: number;
};

export interface JadwalManualPayload {
  penggunaId: string;
  tanggal: string; // Tipe String (YYYY-MM-DD) agar anti badai UTC Timezone
  isLibur: boolean;
  shiftIds: string[];
  catatan: string;
}

export interface JadwalUpdatePayload {
  isLibur: boolean;
  shiftID: string | null;
  catatan: string;
}
