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
import { useLebarElemen } from "@/hooks/use-lebar-elemen";
import { pesanError } from "@/lib/api/error";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunAdmin } from "@/types/adminAkun";
import { useHalamanAkun } from "./hooks";
import { LencanaStatus } from "./lencana-status";
import { RingkasanAkun } from "./ringkasan-akun";
import {
  KELAS_TOMBOL_UTAMA,
  kolomRingkas,
  namaToko,
  PANJANG_CARI_AKUN,
  paramDaftarAkun,
  URL_BUAT_AKUN,
  urlDetailAkun,
  teksMasaAkses,
  teksPlan,
  teksToko,
  type FilterStatusAkun,
} from "./tampilan";

const PILIHAN_UKURAN = [10, 20, 50] as const;

/** Email bertaut ke detail, penanda Admin, dan baris kedua (username, atau toko di susunan ringkas). */
function SelAkun({ akun, bawah }: { akun: AkunAdmin; bawah: string }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <Link
          href={urlDetailAkun(akun.id)}
          className="min-w-0 font-semibold [overflow-wrap:anywhere] text-navy underline-offset-4 hover:underline"
        >
          {akun.email}
        </Link>
        {akun.role === "admin" && (
          <span className="shrink-0 rounded-full bg-navy px-2 text-mikro leading-[18px] text-gading">Admin</span>
        )}
      </div>
      <p className="text-kecil [overflow-wrap:anywhere] text-muted-foreground">{bawah}</p>
    </div>
  );
}

function SelToko({ akun }: { akun: AkunAdmin }) {
  const belum = akun.role === "client" && namaToko(akun) === null;
  return <span className={belum ? "text-muted-foreground italic" : undefined}>{teksToko(akun)}</span>;
}

const KOLOM_AKUN: ColumnDef<AkunAdmin> = {
  accessorKey: "email",
  header: "Akun",
  meta: { lebarBungkus: 280 },
  cell: ({ row }) => <SelAkun akun={row.original} bawah={row.original.username ?? "Tanpa username"} />,
};
const KOLOM_PLAN: ColumnDef<AkunAdmin> = { id: "plan", header: "Plan", cell: ({ row }) => teksPlan(row.original) };
const KOLOM_STATUS: ColumnDef<AkunAdmin> = {
  id: "status",
  header: "Status",
  cell: ({ row }) => <LencanaStatus akun={row.original} />,
};
const KOLOM_MASA: ColumnDef<AkunAdmin> = {
  id: "masaAkses",
  header: "Masa Akses",
  cell: ({ row }) => teksMasaAkses(row.original),
};

/** Desain A lebar meja, juga dasar kartu HP: enam kolom. */
const KOLOM_PENUH: ColumnDef<AkunAdmin>[] = [
  KOLOM_AKUN,
  { id: "toko", header: "Toko", meta: { lebarBungkus: 220 }, cell: ({ row }) => <SelToko akun={row.original} /> },
  KOLOM_PLAN,
  KOLOM_STATUS,
  KOLOM_MASA,
  {
    accessorKey: "createdAt",
    header: "Dibuat",
    cell: ({ row }) => formatTanggalPendek(row.original.createdAt),
  },
];

/** Desain A tablet: toko turun di bawah email, kolom Dibuat tidak ditampilkan. */
const KOLOM_RINGKAS: ColumnDef<AkunAdmin>[] = [
  {
    ...KOLOM_AKUN,
    header: "Akun dan toko",
    meta: { lebarBungkus: 320 },
    cell: ({ row }) => (
      <SelAkun
        akun={row.original}
        bawah={baris2Ringkas(row.original)}
      />
    ),
  },
  KOLOM_PLAN,
  KOLOM_STATUS,
  KOLOM_MASA,
];

/** Baris kedua susunan ringkas: toko lalu username; akun admin tidak punya toko, sehingga username saja. */
function baris2Ringkas(akun: AkunAdmin): string {
  const username = akun.username ?? "Tanpa username";
  return akun.role === "admin" ? username : `${teksToko(akun)} · ${username}`;
}

const LABEL_STATUS_AKUN: Record<Exclude<FilterStatusAkun, "semua">, string> = {
  aktif: "Aktif",
  "non-aktif": "Non-aktif",
};

/**
 * Daftar seluruh akun platform (keputusan PA7a): akun admin ikut tampil
 * dengan penanda Admin. Pencarian, filter status, dan halaman disaring
 * server (B177; keputusan rancangan butir 27). Urutan mengikuti backend.
 * Kerangka desain B dengan kartu ringkas, tabel dan filter desain A
 * (pemilik proyek, 24 November 2026).
 */
export function HalamanDaftarAkun() {
  const [kata, setKata] = useState("");
  const kataTertunda = useDebounce(kata, 400);
  const [status, setStatus] = useState<FilterStatusAkun>("semua");
  const panel = usePanelFilter<FilterStatusAkun>({ terapan: status, bawaan: "semua", onTerapkan: setStatus });
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState<number>(PILIHAN_UKURAN[0]);
  const { ref: refWadah, lebar: lebarWadah } = useLebarElemen<HTMLDivElement>();
  const kolom = kolomRingkas(lebarWadah) ? KOLOM_RINGKAS : KOLOM_PENUH;

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
    <div ref={refWadah} className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight">Akun Klien</h1>
          <p className="text-isi text-muted-foreground">Kelola akun klien dan langganannya.</p>
        </div>
        <Link href={URL_BUAT_AKUN} className="w-full sm:w-auto">
          <Button type="button" size="aksi" className={`w-full ${KELAS_TOMBOL_UTAMA}`}>
            <Plus className="h-4 w-4" />
            Buat Akun Klien
          </Button>
        </Link>
      </div>

      <RingkasanAkun />

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
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 sm:p-6"
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
          columns={kolom}
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
