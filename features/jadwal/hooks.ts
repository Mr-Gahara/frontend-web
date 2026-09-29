"use client";

/**
 * Hook data jadwal. Karyawan per ruang memakai kunci di bawah akar pengguna
 * dengan penanda ruang, agar tidak bertabrakan dengan data halaman pengguna
 * (keputusan rancangan butir 3). Mutation menunggu invalidasi jadwal,
 * juga saat gagal, agar kalender menampilkan keadaan sebenarnya setelah
 * perubahan sebagian (keputusan JD6a).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jadwalApi } from "./api";
import { gabungHasil } from "./hasil";
import type { LangkahJadwal } from "./rencana";
import type { EntriBulkJadwal, HasilJadwal, RuangJadwal } from "./tipe";
import { pesanError } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";

export function useKaryawanRuang(ruang: RuangJadwal) {
  return useQuery({
    queryKey: [...queryKeys.pengguna.semua, "ruang", ruang] as const,
    queryFn: () => jadwalApi.karyawan(ruang),
  });
}

export function useDaftarJadwal(rentang: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: queryKeys.jadwalShift.daftar(rentang),
    queryFn: () => jadwalApi.daftar(rentang),
  });
}

function useInvalidasiJadwal() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.jadwalShift.semua });
}

/** Galat satu langkah simpan jadwal; pesannya menyebut langkah bila ada beberapa. */
export class GagalLangkahJadwal extends Error {
  constructor(indeks: number, total: number, sebab: unknown) {
    const pesan = pesanError(sebab, "Terdapat bentrokan atau kesalahan data.");
    super(
      total === 1
        ? pesan
        : `Langkah ${indeks + 1} dari ${total} gagal: ${pesan} Perubahan sebelumnya sudah tersimpan; tutup dialog dan buka sel ini lagi untuk melihat keadaan terbaru.`,
    );
    this.name = "GagalLangkahJadwal";
  }
}

export function useSimpanJadwalHari() {
  const invalidasi = useInvalidasiJadwal();
  return useMutation({
    mutationFn: async (langkah: LangkahJadwal[]): Promise<HasilJadwal> => {
      const hasil: HasilJadwal[] = [];
      for (const [indeks, l] of langkah.entries()) {
        try {
          if (l.jenis === "buat") hasil.push(await jadwalApi.buat(l.payload));
          else if (l.jenis === "ubah") {
            await jadwalApi.perbarui(l.id, l.payload);
            hasil.push({ message: "", berhasilDiproses: 1, ditolak: 0, detailDitolak: [] });
          } else await jadwalApi.hapus(l.id);
        } catch (err) {
          throw new GagalLangkahJadwal(indeks, langkah.length, err);
        }
      }
      return gabungHasil(hasil);
    },
    onSettled: invalidasi,
  });
}

export function useHapusJadwal() {
  const invalidasi = useInvalidasiJadwal();
  return useMutation({ mutationFn: jadwalApi.hapus, onSuccess: invalidasi });
}

export function useGenerateJadwal() {
  const invalidasi = useInvalidasiJadwal();
  return useMutation({
    mutationFn: (entri: EntriBulkJadwal[]) => jadwalApi.bulk(entri),
    onSuccess: invalidasi,
  });
}