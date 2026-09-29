"use client";

/**
 * Halaman master shift satu ruang: memuat, menyimpan, dan menonaktifkan
 * shift lewat features/shift, lalu menampilkan HalamanShift. Dipakai rute
 * outlet dan gudang (keputusan SH1b). Toast ditampilkan di sini; galat
 * dilempar ulang agar dialog bertahan saat simpan atau nonaktifkan gagal
 * (keputusan Fase 0).
 */
import { toast } from "sonner";
import HalamanShift from "./halaman-shift";
import { useDaftarShift, useNonaktifkanShift, useSimpanShift } from "./hooks";
import type { RuangShift } from "./ruang";
import { pesanError } from "@/lib/api/error";

export function HalamanShiftRuang({ ruang }: { ruang: RuangShift }) {
  const daftar = useDaftarShift(ruang);
  const simpan = useSimpanShift(ruang);
  const nonaktifkan = useNonaktifkanShift();

  return (
    <HalamanShift
      tipeRuang={ruang}
      dataShift={daftar.data}
      isLoading={daftar.memuat}
      isError={daftar.gagal}
      onSave={async (nilai, id) => {
        try {
          await simpan.mutateAsync({ id, nilai });
          toast.success("Berhasil", {
            description: `Master shift berhasil ${id ? "diperbarui" : "ditambahkan"}.`,
          });
        } catch (err) {
          toast.error("Gagal Menyimpan", {
            description: pesanError(err, "Terjadi kesalahan saat menyimpan master shift."),
          });
          throw err;
        }
      }}
      onDelete={async (id) => {
        try {
          await nonaktifkan.mutateAsync(id);
          toast.success("Berhasil", {
            description: "Shift berhasil dinonaktifkan dan diarsipkan.",
          });
        } catch (err) {
          toast.error("Gagal Menonaktifkan", {
            description: pesanError(err, "Terjadi kesalahan saat menonaktifkan shift."),
          });
          throw err;
        }
      }}
      isSaving={simpan.isPending}
      isDeleting={nonaktifkan.isPending}
    />
  );
}