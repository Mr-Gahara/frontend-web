"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <p className="text-xs text-muted-foreground">{row.original.username ?? "Tanpa username"}</p>
      </div>
    ),
  },
  { id: "role", header: "Peran", cell: ({ row }) => LABEL_ROLE[row.original.role] },
  { id: "toko", header: "Toko", cell: ({ row }) => teksToko(row.original) },
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
export function HalamanDaftarAkun() {
  const [kata, setKata] = useState("");
  const kataTertunda = useDebounce(kata, 400);
  const [status, setStatus] = useState<FilterStatusAkun>("semua");
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Akun Klien</h1>
          <p className="text-sm text-muted-foreground">Kelola akun klien dan langganannya.</p>
        </div>
        <Link href={URL_BUAT_AKUN}>
          <Button type="button">
            <Plus className="mr-2 h-4 w-4" />
            Buat Akun Klien
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="cari-akun" className="text-xs font-medium">
            Cari akun
          </label>
          <Input
            id="cari-akun"
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            maxLength={PANJANG_CARI_AKUN}
            placeholder="Email, username, atau nama toko"
            className="w-72"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="filter-status" className="text-xs font-medium">
            Status
          </label>
          <Select value={status} onValueChange={(v) => setStatus(v as FilterStatusAkun)}>
            <SelectTrigger id="filter-status" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="non-aktif">Non-aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {daftar.isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-6"
        >
          <p className="text-sm font-medium text-destructive">
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