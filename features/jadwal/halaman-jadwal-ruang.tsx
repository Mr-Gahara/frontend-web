"use client";

/**
 * Halaman jadwal satu ruang: memuat karyawan ruang, jadwal sebulan (J1a),
 * dan shift, lalu memetakan jadwal ke sel. Dipakai rute outlet dan gudang
 * (keputusan J5b). Simpan menjalankan langkah beruntun dengan satu toast
 * ringkasan (JD6a); penolakan backend ditampilkan sebagai galat (J2a).
 * Galat dilempar ulang agar dialog bertahan (keputusan Fase 0).
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import JadwalUtama from "./halaman-jadwal";
import { pesanDitolak } from "./hasil";
import { useDaftarJadwal, useHapusJadwal, useSimpanJadwalHari } from "./hooks";
import { keKaryawanRuang, petakanJadwalKaryawan } from "./pemetaan";
import { rencanaSimpanJadwal } from "./rencana";
import { rentangBulan } from "./rentang";
import type { HasilJadwal, RuangJadwal } from "./tipe";
import { useDaftarPengguna } from "@/features/pengguna/hooks";
import { useDaftarShift } from "@/features/shift/hooks";
import { pesanError } from "@/lib/api/error";

export function HalamanJadwalRuang({ ruang }: { ruang: RuangJadwal }) {
  const [bulan, setBulan] = useState(() => new Date());
  const [cari, setCari] = useState("");
  const rentang = useMemo(() => rentangBulan(bulan), [bulan]);
  const karyawan = useDaftarPengguna(ruang);
  const jadwal = useDaftarJadwal(rentang);
  const shift = useDaftarShift(ruang);
  const simpan = useSimpanJadwalHari();
  const hapus = useHapusJadwal();

  const baris = useMemo(() => {
    const kata = cari.toLowerCase();
    return petakanJadwalKaryawan(keKaryawanRuang(karyawan.data ?? []), jadwal.data ?? []).filter((k) =>
      k.nama.toLowerCase().includes(kata),
    );
  }, [karyawan.data, jadwal.data, cari]);

  const namaKaryawan = (id: string) => karyawan.data?.find((k) => k.id === id)?.nama;

  return (
    <JadwalUtama
      tipeRuang={ruang}
      dataKaryawan={baris}
      shiftList={shift.data}
      isLoading={karyawan.isLoading || jadwal.isLoading || shift.memuat}
      isError={karyawan.isError || jadwal.isError || shift.gagal}
      currentDate={bulan}
      onPrevMonth={() => setBulan((b) => new Date(b.getFullYear(), b.getMonth() - 1, 1))}
      onNextMonth={() => setBulan((b) => new Date(b.getFullYear(), b.getMonth() + 1, 1))}
      searchQuery={cari}
      onSearchChange={setCari}
      onSimpan={async (payload, ada) => {
        const langkah = rencanaSimpanJadwal(ada, payload);
        let hasil: HasilJadwal;
        try {
          hasil = await simpan.mutateAsync(langkah);
        } catch (err) {
          toast.error("Gagal Menyimpan", {
            description: err instanceof Error ? err.message : "Terdapat bentrokan atau kesalahan data.",
          });
          throw err;
        }
        const ditolak = pesanDitolak(hasil, namaKaryawan);
        if (ditolak) {
          toast.error("Gagal Menyimpan", { description: ditolak });
          throw new Error(ditolak);
        }
        if (langkah.length === 1 && langkah[0].jenis === "buat") {
          toast.success("Jadwal Berhasil Dibuat", { description: "Jadwal shift baru telah diterapkan." });
        } else {
          toast.success("Jadwal Diperbarui", { description: "Perubahan jadwal telah disimpan." });
        }
      }}
      onHapus={async (id) => {
        try {
          await hapus.mutateAsync(id);
          toast.success("Jadwal Dihapus", { description: "Jadwal telah dihapus dari kalender." });
        } catch (err) {
          toast.error("Gagal Menghapus", {
            description: pesanError(err, "Terjadi kesalahan saat menghapus jadwal."),
          });
          throw err;
        }
      }}
      isSaving={simpan.isPending || hapus.isPending}
    />
  );
}