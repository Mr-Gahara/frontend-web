import type { EntriBulkJadwal, KaryawanRuang } from "./tipe";
import type { PolaRosterItem } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";
import { indeksHari, tanggalLiburToko } from "@/features/tenant/jam-operasional";

export type MasalahShift = "nonaktif" | "hilang";

export interface SelSimulasi {
  tanggal: string;
  isLibur: boolean;
  shiftID?: string;
  label: string;
  jam: string;
  namaShift?: string;
  masalah: MasalahShift | null;
  /** Tanggal Libur di jam buka toko: tidak dibuatkan entri (JO2a). */
  dilewati: boolean;
}

export interface BarisSimulasi {
  karyawan: KaryawanRuang;
  jadwal: SelSimulasi[];
}

/**
 * Simulasi generate, dipindah dari step-dua-preview lama: hari ke-n rentang
 * memakai hari ke-(n mod siklus)+1 pola, dan label shift adalah empat huruf
 * pertama namanya. Bedanya dengan kode lama (keputusan GN2a): hari yang
 * shift-nya nonaktif atau tidak ditemukan ditandai, bukan diam-diam menjadi
 * libur, karena backend melewatinya tanpa mencatatnya (temuan butir 62).
 */
export function simulasiGenerate(
  tanggal: string[],
  pola: PolaRosterItem | undefined,
  shiftList: ShiftItem[],
  karyawan: KaryawanRuang[],
  liburToko: ReadonlySet<number> = new Set(),
): BarisSimulasi[] {
  const siklus = pola?.siklusHari || 7;
  const jadwal = tanggal.map((tgl, index): SelSimulasi => {
    // JO2a: tanggal libur toko dilewati, tetapi tetap memakan satu hari siklus
    // pola, karena urutan pola mengikuti tanggal.
    if (tanggalLiburToko(tgl, liburToko)) {
      return { tanggal: tgl, isLibur: false, label: "", jam: "", masalah: null, dilewati: true };
    }
    const detail = pola?.detailSiklus.find((d) => d.hariKe === (index % siklus) + 1);
    if (!detail || detail.isLibur || !detail.shiftID) {
      return { tanggal: tgl, isLibur: true, label: "OFF", jam: "", masalah: null, dilewati: false };
    }
    const shift = shiftList.find((s) => s.id === detail.shiftID);
    if (!shift) {
      return {
        tanggal: tgl,
        isLibur: false,
        label: "?",
        jam: "",
        namaShift: detail.shift?.namaShift,
        masalah: "hilang",
        dilewati: false,
      };
    }
    const dasar = {
      tanggal: tgl,
      isLibur: false,
      label: shift.namaShift.substring(0, 4).toUpperCase(),
      jam: `${shift.jamMasuk} - ${shift.jamPulang}`,
      namaShift: shift.namaShift,
      dilewati: false,
    };
    if (shift.status !== "Aktif") return { ...dasar, masalah: "nonaktif" };
    return { ...dasar, shiftID: shift.id, masalah: null };
  });
  return karyawan.map((k) => ({ karyawan: k, jadwal }));
}

/** Pesan yang menahan simpan bila ada hari dengan shift bermasalah (GN2a), atau null. */
export function pesanMasalahSimulasi(baris: BarisSimulasi[]): string | null {
  const sel = baris[0]?.jadwal.find((j) => j.masalah !== null);
  if (!sel) return null;
  const nama = sel.namaShift ? `"${sel.namaShift}"` : "yang dipakai";
  const sebab = sel.masalah === "nonaktif" ? "sudah nonaktif" : "tidak ditemukan";
  return `Shift ${nama} pada pola ini ${sebab}. Perbaiki pola roster sebelum menyimpan jadwal.`;
}

/**
 * Payload POST /jadwalshift/bulk: satu entri per karyawan per tanggal, seperti
 * kode lama, kecuali tanggal libur toko yang tidak dibuatkan entri sama sekali,
 * sehingga jadwal lama di tanggal itu tidak disentuh (JO2a).
 */
export function entriBulkJadwal(baris: BarisSimulasi[]): EntriBulkJadwal[] {
  return baris.flatMap((b) =>
    b.jadwal.filter((j) => !j.dilewati).map((j) => ({
      penggunaID: b.karyawan.id,
      tanggalKerja: j.tanggal,
      isLibur: j.isLibur,
      shiftID: j.shiftID,
    })),
  );
}

const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;

const gabung = (teks: string[]) =>
  teks.length <= 1
    ? (teks[0] ?? "")
    : teks.length === 2
      ? `${teks[0]} dan ${teks[1]}`
      : `${teks.slice(0, -1).join(", ")}, dan ${teks[teks.length - 1]}`;

/**
 * Ringkasan tanggal yang dilewati karena toko libur (JO2a, desain A):
 * "2 hari, toko libur (Minggu 22 dan 29 Nov)". Tanggal dikelompokkan per
 * nama hari (dipisah titik koma), dan nama bulan ditulis sekali per bulan
 * (dipisah koma). null bila tidak ada.
 */
export function ringkasanHariDilewati(baris: BarisSimulasi[]): string | null {
  const tanggal = (baris[0]?.jadwal ?? []).filter((j) => j.dilewati).map((j) => j.tanggal);
  if (tanggal.length === 0) return null;
  const perHari = new Map<number, Date[]>();
  for (const t of tanggal) {
    const [th, bl, hr] = t.split("-").map(Number);
    const d = new Date(th, bl - 1, hr);
    perHari.set(indeksHari(d), [...(perHari.get(indeksHari(d)) ?? []), d]);
  }
  const kelompok = [...perHari.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hari, daftar]) => {
      const perBulan: string[] = [];
      let i = 0;
      while (i < daftar.length) {
        const bulan = daftar[i].getMonth();
        const tgl: string[] = [];
        while (i < daftar.length && daftar[i].getMonth() === bulan) tgl.push(String(daftar[i++].getDate()));
        perBulan.push(`${gabung(tgl)} ${BULAN[bulan]}`);
      }
      return `${NAMA_HARI[hari]} ${perBulan.join(", ")}`;
    });
  return `${tanggal.length} hari, toko libur (${kelompok.join("; ")})`;
}
