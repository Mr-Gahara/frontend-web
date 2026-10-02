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
import { pesanError } from "@/lib/api/error";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunAdmin } from "@/types/adminAkun";
import { useDaftarAkun } from "./hooks";
import {
  LABEL_ROLE,
  URL_BUAT_AKUN,
  urlDetailAkun,
  saringAkun,
  teksMasaAkses,
  teksStatus,
  teksToko,
  type FilterStatusAkun,
} from "./tampilan";

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
 * dengan penanda peran. Pencarian dan filter status di klien, karena
 * backend mengirim seluruh akun sekali muat.
 */
export function HalamanDaftarAkun() {
  const daftar = useDaftarAkun();
  const [kata, setKata] = useState("");
  const [status, setStatus] = useState<FilterStatusAkun>("semua");

  const semua = useMemo(() => daftar.data ?? [], [daftar.data]);
  const baris = useMemo(() => saringAkun(semua, kata, status), [semua, kata, status]);

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
        <p className="pb-2 text-sm text-muted-foreground">
          {baris.length} dari {semua.length} akun
        </p>
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
          emptyMessage={
            semua.length > 0 ? "Tidak ada akun yang cocok dengan pencarian." : "Belum ada akun."
          }
        />
      )}
    </div>
  );
}