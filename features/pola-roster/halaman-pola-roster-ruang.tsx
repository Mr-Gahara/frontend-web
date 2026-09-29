"use client";

/**
 * Halaman pola roster satu ruang: memuat pola dan shift, lalu menyimpan
 * dan menghapus pola lewat features/pola-roster. Dipakai rute outlet dan
 * gudang (keputusan PL5). Toast ditampilkan di sini; galat dilempar ulang
 * agar dialog bertahan saat simpan atau hapus gagal (keputusan Fase 0).
 */
import { toast } from "sonner";
import PolaUtama from "./halaman-pola-roster";
import { useDaftarPolaRoster, useHapusPolaRoster, useSimpanPolaRoster } from "./hooks";
import type { RuangPolaRoster } from "./ruang";
import { useDaftarShift } from "@/features/shift/hooks";
import { pesanError } from "@/lib/api/error";

export function HalamanPolaRosterRuang({ ruang }: { ruang: RuangPolaRoster }) {
  const daftar = useDaftarPolaRoster(ruang);
  const shift = useDaftarShift(ruang);
  const simpan = useSimpanPolaRoster(ruang);
  const hapus = useHapusPolaRoster();

  return (
    <PolaUtama
      tipeRuang={ruang}
      dataPola={daftar.data}
      shiftList={shift.data}
      isLoading={daftar.memuat || shift.memuat}
      isError={daftar.gagal || shift.gagal}
      onSave={async (payload, id) => {
        try {
          await simpan.mutateAsync({ id, payload });
          toast.success("Berhasil", {
            description: `Pola Roster berhasil ${id ? "diperbarui" : "ditambahkan"}.`,
          });
        } catch (err) {
          toast.error("Gagal Menyimpan", {
            description: pesanError(err, "Terjadi kesalahan saat menyimpan Pola Roster."),
          });
          throw err;
        }
      }}
      onDelete={async (id) => {
        try {
          await hapus.mutateAsync(id);
          toast.success("Berhasil", { description: "Pola Roster berhasil dihapus." });
        } catch (err) {
          toast.error("Gagal Menghapus", {
            description: pesanError(err, "Terjadi kesalahan saat menghapus Pola Roster."),
          });
          throw err;
        }
      }}
      isSaving={simpan.isPending}
      isDeleting={hapus.isPending}
    />
  );
}