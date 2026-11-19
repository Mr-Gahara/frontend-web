"use client";

import { TeksDuaBaris } from "@/components/ui/teks-dua-baris";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth/useSession";
import type { Diskon } from "@/types/diskon";
import { DialogStatusDiskon } from "./dialog-status-diskon";
import { DialogFormDiskon } from "./form-diskon";
import { useDaftarDiskon } from "./hooks";
import { aksiDiskon } from "./izin";
import {
  BATAS_DISKON_AKTIF,
  FILTER_DISKON_AWAL,
  OPSI_FILTER_DISKON,
  jumlahFilterDiskon,
  pilFilterDiskon,
  aktifTetapiTidakBerlaku,
  masihDalamBatas,
  ringkasAturan,
  saringDiskon,
  teksNilai,
  type FilterDiskon,
} from "./tampilan";

const KELAS_KEPALA = "text-kecil font-semibold text-navy/60";

/**
 * Halaman diskon (keputusan PD2a dan PD3a). Daftar disaring di klien dari
 * satu cache daftar diskon. Tombol tambah, ubah, dan aktifkan atau
 * nonaktifkan mengikuti izin endpoint-nya (keputusan rancangan butir 14);
 * hapus tidak ada, karena backend tidak punya DELETE. Batas diskon aktif
 * ditahan di sini, dan penolakan backend tetap ditampilkan. Aturan
 * tambahan tampil baca-saja di kolom Aturan.
 */
export function HalamanDiskon() {
  const { permissions } = useSession();
  const aksi = aksiDiskon(permissions);
  const daftar = useDaftarDiskon();
  const semua = useMemo(() => daftar.data ?? [], [daftar.data]);

  const [filter, setFilter] = useState<FilterDiskon>(FILTER_DISKON_AWAL);
  const panel = usePanelFilter({ terapan: filter, bawaan: FILTER_DISKON_AWAL, onTerapkan: setFilter });
  const [form, setForm] = useState<{ diskon: Diskon | null } | null>(null);
  const [statusDiubah, setStatusDiubah] = useState<Diskon | null>(null);

  const [cari, setCari] = useState("");
  const tampil = useMemo(() => saringDiskon(semua, filter, cari), [semua, filter, cari]);
  const dalamBatas = masihDalamBatas(semua);

  const columns: ColumnDef<Diskon>[] = [
    {
      accessorKey: "namaDiskon",
      meta: { label: "Nama Diskon", lebarBungkus: 200 },
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-kecil font-semibold text-navy/60 hover:text-navy hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Diskon
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <TeksDuaBaris teks={row.original.namaDiskon} className="font-bold text-navy" />
      ),
    },
    {
      accessorKey: "cakupan",
      meta: { label: "Cakupan" },
      header: () => <span className={KELAS_KEPALA}>Cakupan</span>,
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-kecil font-bold ${
            row.original.cakupan === "Global"
              ? "bg-sky-100 text-sky-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {row.original.cakupan}
        </span>
      ),
    },
    {
      accessorKey: "tipe",
      meta: { label: "Tipe" },
      header: () => <span className={KELAS_KEPALA}>Tipe</span>,
      cell: ({ row }) => (
        <span className="text-isi font-medium text-navy/70">
          {row.original.tipe === "persen" ? "Persen" : "Nominal"}
        </span>
      ),
    },
    {
      accessorKey: "nilai",
      meta: { label: "Nilai" },
      header: () => <span className={KELAS_KEPALA}>Nilai</span>,
      cell: ({ row }) => (
        <span className="font-bold text-navy">{teksNilai(row.original)}</span>
      ),
    },
    {
      accessorKey: "bisaDigabung",
      meta: { label: "Digabung" },
      header: () => <span className={KELAS_KEPALA}>Digabung</span>,
      cell: ({ row }) => (
        <span className="text-isi font-medium text-navy/70">
          {row.original.bisaDigabung ? "Ya" : "Tidak"}
        </span>
      ),
    },
    {
      id: "aturan",
      meta: { label: "Aturan", lebarBungkus: 180 },
      header: () => <span className={KELAS_KEPALA}>Aturan</span>,
      cell: ({ row }) => {
        const aturan = ringkasAturan(row.original);
        if (aturan.length === 0) {
          return <span className="text-isi font-medium text-navy/40">-</span>;
        }
        return (
          <ul className="space-y-0.5">
            {aturan.map((teks) => (
              <li key={teks}>
                <TeksDuaBaris teks={teks} className="text-kecil font-medium text-navy/70" />
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: () => <span className={KELAS_KEPALA}>Status</span>,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-kecil font-bold ${
              row.original.status === "Aktif"
                ? "bg-green-100 text-green-700"
                : "bg-navy/10 text-navy/60"
            }`}
          >
            {row.original.status}
          </span>
          {aktifTetapiTidakBerlaku(row.original) && (
            <span className="text-mikro font-semibold text-amber-700">Tidak sedang berlaku</span>
          )}
        </div>
      ),
    },
    {
      id: "aksi",
      header: () => <div className="text-right text-kecil text-navy/60">Aksi</div>,
      cell: ({ row }) => {
        if (!aksi.ubah) return null;
        const item = row.original;
        const mengaktifkan = item.status === "Non-Aktif";
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-krem border-navy/10">
                <DropdownMenuItem
                  className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                  onClick={() => setForm({ diskon: item })}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-navy/10" />
                <DropdownMenuItem
                  disabled={mengaktifkan && !dalamBatas}
                  className={
                    mengaktifkan
                      ? "cursor-pointer text-navy hover:bg-navy/5 font-medium"
                      : "cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-medium"
                  }
                  onClick={() => setStatusDiubah(item)}
                >
                  {mengaktifkan ? "Aktifkan" : "Nonaktifkan"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight text-navy">Kelola Diskon</h1>
          <p className="text-isi text-navy/60">
            Kelola seluruh data diskon dan promosi toko.
          </p>
        </div>
        {aksi.buat && (
          <Button
            onClick={() => setForm({ diskon: null })}
            size="aksi"
            className="cursor-pointer bg-navy text-gading hover:bg-navy/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Tambah Diskon
          </Button>
        )}
      </div>

      {!dalamBatas && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-isi font-medium text-amber-800">
          Toko ini sudah punya {BATAS_DISKON_AKTIF} diskon aktif (batas maksimal). Diskon baru hanya
          dapat disimpan Non-Aktif; nonaktifkan diskon yang tidak dipakai untuk mengaktifkan diskon lain.
        </p>
      )}

      <BilahFilter
        cari={{ id: "cari-diskon", label: "Cari nama diskon", placeholder: "Cari nama diskon...", value: cari, onChange: setCari }}
        jumlahAktif={jumlahFilterDiskon(filter)}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={pilFilterDiskon(filter, setFilter)}
        onAturUlangSemua={() => setFilter(FILTER_DISKON_AWAL)}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterDiskon(panel.draf)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Status">
          <PilihanSegmen
            label="Status"
            nilai={panel.draf.status === "all" ? undefined : panel.draf.status}
            opsi={[...OPSI_FILTER_DISKON.status]}
            onUbah={(status) => panel.setDraf({ ...panel.draf, status: status ?? "all" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Cakupan">
          <PilihanSegmen
            label="Cakupan"
            nilai={panel.draf.cakupan === "all" ? undefined : panel.draf.cakupan}
            opsi={[...OPSI_FILTER_DISKON.cakupan]}
            onUbah={(cakupan) => panel.setDraf({ ...panel.draf, cakupan: cakupan ?? "all" })}
          />
        </KelompokFilter>
        <KelompokFilter judul="Tipe">
          <PilihanSegmen
            label="Tipe"
            nilai={panel.draf.tipe === "all" ? undefined : panel.draf.tipe}
            opsi={[...OPSI_FILTER_DISKON.tipe]}
            onUbah={(tipe) => panel.setDraf({ ...panel.draf, tipe: tipe ?? "all" })}
          />
        </KelompokFilter>
      </PanelFilter>

      <div className="flex flex-col gap-4 mt-2">
        {daftar.isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center">
            <p className="text-isi font-medium text-red-600">
              Gagal memuat data diskon. Periksa koneksi Anda, lalu coba lagi.
            </p>
            <Button variant="outline" onClick={() => daftar.refetch()} disabled={daftar.isFetching}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tampil}
            loading={daftar.isLoading}
            emptyMessage="Belum ada data diskon."
          />
        )}
      </div>

      <DialogFormDiskon
        terbuka={form !== null}
        diskon={form?.diskon ?? null}
        batasTercapai={!dalamBatas}
        onTutup={() => setForm(null)}
      />
      <DialogStatusDiskon diskon={statusDiubah} onTutup={() => setStatusDiubah(null)} />
    </div>
  );
}