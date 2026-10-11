"use client";

import { useState } from "react";

import { gabungStatusStaf, type StatusStafDashboard } from "./staf";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMonitoringAbsensi } from "@/features/absensi/hooks";
import { stafRuang } from "@/features/absensi/ringkasan";
import { useDaftarIzinCuti } from "@/features/izin-cuti/hooks";
import { useDaftarPengguna } from "@/features/pengguna/hooks";
import { namaPeran } from "@/features/pengguna/peran";
import { inisialNama } from "@/features/pengguna/schema-profil";
import { isForbidden } from "@/lib/api/error";

export const LABEL_STATUS_STAF: Record<StatusStafDashboard, string> = {
  sedang_bekerja: "Masuk",
  sudah_pulang: "Pulang",
  belum_absen: "Belum absen",
  sakit: "Sakit",
  izin: "Izin",
  cuti: "Cuti",
};

const WARNA_STATUS_STAF: Record<StatusStafDashboard, { lencana: string; titik: string }> = {
  sedang_bekerja: { lencana: "bg-sage/15 text-[#4F5E3A]", titik: "bg-sage" },
  sudah_pulang: { lencana: "bg-navy/10 text-navy", titik: "bg-navy" },
  belum_absen: { lencana: "bg-navy/5 text-navy/70", titik: "bg-navy/30" },
  sakit: { lencana: "bg-rose-100 text-rose-700", titik: "bg-rose-500" },
  izin: { lencana: "bg-karamel/25 text-[#7A5226]", titik: "bg-karamel" },
  cuti: { lencana: "bg-karamel/25 text-[#7A5226]", titik: "bg-karamel" },
};

/** Urutan baris: yang hadir lebih dulu, lalu izin, sakit, dan cuti, lalu yang belum absen. */
const URUTAN_STATUS_STAF: Record<StatusStafDashboard, number> = {
  sedang_bekerja: 0,
  sudah_pulang: 1,
  izin: 2,
  sakit: 2,
  cuti: 2,
  belum_absen: 3,
};

/** Jumlah baris staf yang tampil di HP sebelum "Tampilkan semua" ditekan. */
const BATAS_STAF_HP = 5;

function AngkaRingkas({
  label,
  labelPendek,
  jumlah,
  titik,
}: {
  label: string;
  labelPendek?: string;
  jumlah: number;
  titik: string;
}) {
  return (
    <div className="bg-gading rounded-xl sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3 border border-navy/5 min-w-0">
      <p className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-medium text-navy/70 min-w-0">
        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${titik}`} aria-hidden="true" />
        <span className="hidden sm:inline truncate">{label}</span>
        <span className="sm:hidden truncate">{labelPendek ?? label}</span>
      </p>
      <p className="text-lg sm:text-2xl font-black tracking-tight">{jumlah}</p>
    </div>
  );
}

/**
 * Tabel status staf ruang outlet (keputusan DB3a). Izin dan cuti hanya
 * dimuat bagi pemegang read-izin-cuti; tanpa itu status absensi saja.
 */
export function PanelStaf({ hari, denganIzinCuti }: { hari: Date; denganIzinCuti: boolean }) {
  const monitoring = useMonitoringAbsensi(hari);
  const pengguna = useDaftarPengguna("outlet");
  const izinCuti = useDaftarIzinCuti({ aktif: denganIzinCuti });
  // Di HP hanya BATAS_STAF_HP baris pertama yang tampil sampai tombolnya ditekan.
  const [tampilSemua, setTampilSemua] = useState(false);
  const kelasBaris = (indeks: number) =>
    !tampilSemua && indeks >= BATAS_STAF_HP ? "hidden sm:table-row" : undefined;

  const daftarPengguna = pengguna.data ?? [];
  const peran = new Map(daftarPengguna.map((p) => [p.id, namaPeran(p)]));
  const idRuang = new Set(daftarPengguna.map((p) => p.id));
  const baris = gabungStatusStaf(
    stafRuang(monitoring.data?.daftar ?? [], idRuang),
    izinCuti.data ?? [],
    hari,
  ).sort((x, y) => URUTAN_STATUS_STAF[x.status] - URUTAN_STATUS_STAF[y.status]);
  const jumlah = (...status: StatusStafDashboard[]) =>
    baris.filter((b) => status.includes(b.status)).length;
  const sudahAbsen = jumlah("sedang_bekerja", "sudah_pulang");
  const memuat = monitoring.isLoading || pengguna.isLoading;
  const pesanGalat = monitoring.isError
    ? isForbidden(monitoring.error)
      ? "Anda tidak memiliki izin melihat absensi staf."
      : "Gagal memuat data absensi."
    : pengguna.isError
      ? "Gagal memuat daftar staf."
      : null;

  return (
    <section
      aria-label="Status Staf"
      className="bg-krem border border-navy/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-navy shadow-sm flex flex-col gap-3 sm:gap-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm sm:text-lg font-bold tracking-wide">Status Staf</h2>
        {!memuat && !pesanGalat && baris.length > 0 && (
          <span className="text-xs font-medium text-navy/70">
            {sudahAbsen} dari {baris.length} sudah absen
          </span>
        )}
      </div>
      {memuat ? (
        <Skeleton className="h-40 w-full bg-navy/5 rounded-xl" />
      ) : pesanGalat ? (
        <p className="text-sm font-medium text-rose-600">{pesanGalat}</p>
      ) : baris.length === 0 ? (
        <p className="text-sm text-navy/60">Belum ada staf di ruang outlet.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            <AngkaRingkas label="Masuk" jumlah={jumlah("sedang_bekerja")} titik="bg-sage" />
            <AngkaRingkas label="Pulang" jumlah={jumlah("sudah_pulang")} titik="bg-navy" />
            <AngkaRingkas
              label="Izin, sakit, cuti"
              labelPendek="Izin"
              jumlah={jumlah("izin", "sakit", "cuti")}
              titik="bg-karamel"
            />
            <AngkaRingkas label="Belum absen" labelPendek="Belum" jumlah={jumlah("belum_absen")} titik="bg-navy/30" />
          </div>
          <div className="sm:max-h-96 sm:overflow-y-auto [--warna-baris:#FFFAF3]">
            <Table>
              <TableHeader className="hidden sm:table-header-group sticky top-0 bg-krem">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baris.map((b, indeks) => (
                  <TableRow key={b.penggunaID} className={kelasBaris(indeks)}>
                    <TableCell>
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-navy text-gading flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0"
                          aria-hidden="true"
                        >
                          {inisialNama(b.nama)}
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{b.nama}</span>
                          <span className="sm:hidden text-[11px] text-navy/60 truncate">
                            {peran.get(b.penggunaID) ?? "-"}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-navy/70">{peran.get(b.penggunaID) ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold ${WARNA_STATUS_STAF[b.status].lencana}`}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${WARNA_STATUS_STAF[b.status].titik}`}
                          aria-hidden="true"
                        />
                        {LABEL_STATUS_STAF[b.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!tampilSemua && baris.length > BATAS_STAF_HP && (
              <button
                type="button"
                onClick={() => setTampilSemua(true)}
                className="sm:hidden w-full border-t border-navy/10 py-2.5 text-xs font-bold text-navy"
              >
                Tampilkan semua ({baris.length})
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}