export type ShiftItem = {
  id: string; // ID dari JadwalShift (atau "off" jika tidak ada jadwal)
  masterShiftId?: string; // ID dari MasterShift (atau null jika tidak ada jadwal)
  name: string; // Misal: "Pagi", "Malam", "LIBUR"
  label: string; // Misal: "08:00 - 16:00"
  type: "pagi" | "sore" | "malam" | "cuti" | "off";
  isLibur?: boolean; // jadwal libur yang tersimpan, berbeda dari sel tanpa jadwal (JD5a)
  catatan?: string | null; // dibawa ke form ubah agar tidak hilang (JD4)
  shiftNonaktif?: boolean; // shift jadwal ini sudah dinonaktifkan (JD7)
};

export type KaryawanJadwal = {
  id: string; // PenggunaID
  nama: string;
  role: string;
  // Key adalah tanggal (1-31), value adalah array shift di hari itu
  jadwalMap: Record<number, ShiftItem[]>;
};
