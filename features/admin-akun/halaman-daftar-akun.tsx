"use client";

import { useMemo, useState } from "react";
import { BilahFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihanSegmen } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { pesanError } from "@/lib/api/error";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunAdmin } from "@/types/adminAkun";
import { useHalamanAkun } from "./hooks";
import {
  LABEL_ROLE,
  PANJANG_CARI_AKUN,
  paramDaftarAkun,
  URL_BUAT_AKUN,
  urlDetailAkun,
  teksMasaAkses,
  teksStatus,
  teksPlan,
  teksToko,
  type FilterStatusAkun,
} from "./tampilan";

const PILIHAN_UKURAN = [10, 20, 50] as const;

const KOLOM: ColumnDef<AkunAdmin>[] = [
  {
    accessorKey: "email",
    header: "Akun",
    cell: ({ row }) => (
      <div>
        <Link
          href={urlDetailAkun(row.original.id)}
          className="font-medium underline-offset-4 hover:underline"
        >
          {row.original.email}
        </Link>
        <p className="text-kecil text-muted-foreground">{row.original.username ?? "Tanpa username"}</p>
      </div>
    ),
  },
  { id: "role", header: "Peran", cell: ({ row }) => LABEL_ROLE[row.original.role] },
  { id: "toko", header: "Toko", cell: ({ row }) => teksToko(row.original) },
  { id: "plan", header: "Plan", cell: ({ row }) => teksPlan(row.original) },
  { id: "status", header: "Status", cell: ({ row }) => teksStatus(row.original) },
  { id: "masaAkses", header: "Masa Akses", cell: ({ row }) => teksMasaAkses(row.original) },
  {
    accessorKey: "createdAt",
    header: "Dibuat",
    cell: ({ row }) => formatTanggalPendek(row.original.createdAt),
  },
];

/**
 * Daftar seluruh akun platform (keputusan PA7a): akun admin ikut tampil
 * dengan penanda peran. Pencarian, filter status, dan halaman disaring
 * server (B177; keputusan rancangan butir 27). Urutan mengikuti backend.
 */
const LABEL_STATUS_AKUN: Record<Exclude<FilterStatusAkun, "semua">, string> = {
  aktif: "Aktif",
  "non-aktif": "Non-aktif",
};

export function HalamanDaftarAkun() {
  const [kata, setKata] = useState("");
  const kataTertunda = useDebounce(kata, 400);
  const [status, setStatus] = useState<FilterStatusAkun>("semua");
  const panel = usePanelFilter<FilterStatusAkun>({ terapan: status, bawaan: "semua", onTerapkan: setStatus });
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);

  // Mengganti pencarian atau status kembali ke halaman 1, disesuaikan saat
  // render, agar halaman lama tidak sempat diminta.
  const kunciKriteria = JSON.stringify([kataTertunda, status]);
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciKriteria);
  if (kunciSebelumnya !== kunciKriteria) {
    setKunciSebelumnya(kunciKriteria);
    setHalaman(1);
  }

  const daftar = useHalamanAkun(paramDaftarAkun(kataTertunda, status, halaman, ukuran));
  const baris = useMemo(() => daftar.data?.data ?? [], [daftar.data]);
  const tersaring = kataTertunda.trim() !== "" || status !== "semua";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight">Akun Klien</h1>
          <p className="text-isi text-muted-foreground">Kelola akun klien dan langganannya.</p>
        </div>
        <Link href={URL_BUAT_AKUN} className="w-full sm:w-auto">
          <Button type="button" size="aksi" className="w-full">
            <Plus className="h-4 w-4" />
            Buat Akun Klien
          </Button>
        </Link>
      </div>

      <BilahFilter
        cari={{
          id: "cari-akun",
          label: "Cari akun",
          placeholder: "Email, username, atau nama toko",
          value: kata,
          onChange: (v) => setKata(v.slice(0, PANJANG_CARI_AKUN)),
        }}
        jumlahAktif={status === "semua" ? 0 : 1}
        onBukaFilter={panel.buka}
        filterTerbuka={panel.terbuka}
        pil={
          status === "semua"
            ? []
            : [{ kunci: "status", label: `Status: ${LABEL_STATUS_AKUN[status]}`, onHapus: () => setStatus("semua") }]
        }
        onAturUlangSemua={() => setStatus("semua")}
      />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={panel.draf === "semua" ? 0 : 1}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        <KelompokFilter judul="Status">
          <PilihanSegmen
            label="Status"
            nilai={panel.draf === "semua" ? undefined : panel.draf}
            opsi={(["aktif", "non-aktif"] as const).map((v) => ({ nilai: v, label: LABEL_STATUS_AKUN[v] }))}
            onUbah={(v) => panel.setDraf(v ?? "semua")}
          />
        </KelompokFilter>
      </PanelFilter>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-6"
        >
          <p className="text-isi font-medium text-destructive">
            {pesanError(daftar.error, "Gagal memuat daftar akun.")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => daftar.refetch()}
            disabled={daftar.isFetching}
          >
            Coba Lagi
          </Button>
        </div>
      ) : (
        <DataTable
          columns={KOLOM}
          data={baris}
          loading={daftar.isLoading}
          emptyMessage={tersaring ? "Tidak ada akun yang cocok dengan pencarian." : "Belum ada akun."}
          paginasiServer={{
            halaman,
            jumlahHalaman: daftar.data?.pagination?.totalPages ?? 1,
            total: daftar.data?.pagination?.total ?? 0,
            ukuran,
            pilihanUkuran: PILIHAN_UKURAN,
            sibuk: daftar.isFetching,
            onGantiHalaman: setHalaman,
            onGantiUkuran: (berikut) => {
              setUkuran(berikut);
              setHalaman(1);
            },
          }}
        />
      )}
    </div>
  );
}