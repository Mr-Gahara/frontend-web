"use client";

/**
 * Hook data pengguna.
 *
 * Daftar per ruang dipilah web (RS1a, `ruang-staf.ts`): lokasi kerja, lalu
 * izin dashboard (daftar ruang backend), lalu outlet, karena saringan
 * workspace backend membuang staf yang role-nya tanpa izin dashboard.
 */

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDaftarLokasi } from "@/features/inventaris/hooks";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { penggunaDiRuang } from "./ruang-staf";
import { penggunaApi, type Workspace } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { PenggunaRequest } from "@/types/pengguna";

/** enabled: false menunda pemuatan, misalnya sampai form yang memakainya dibuka. */
export function useDaftarPengguna(workspace: Workspace, opsi: { enabled?: boolean } = {}) {
  const { permissions } = useSession();
  const aktif = opsi.enabled ?? true;
  // Ruang staf dipilah web (RS1a, ruang-staf.ts): seluruh pengguna, kedua
  // daftar ruang backend sebagai izin dashboard, dan tipe lokasi kerja.
  const semua = useQuery({
    queryKey: queryKeys.pengguna.daftar(),
    queryFn: () => penggunaApi.daftarSemua(),
    enabled: aktif,
  });
  const outlet = useQuery({
    queryKey: queryKeys.pengguna.daftar("outlet"),
    queryFn: () => penggunaApi.daftar("outlet"),
    enabled: aktif,
  });
  const gudang = useQuery({
    queryKey: queryKeys.pengguna.daftar("gudang"),
    queryFn: () => penggunaApi.daftar("gudang"),
    enabled: aktif,
  });
  const lokasi = useDaftarLokasi({ aktif: aktif && permissions.includes(IZIN.location) });
  const data = useMemo(() => {
    if (!semua.data || !outlet.data || !gudang.data) return undefined;
    return penggunaDiRuang(workspace, {
      semua: semua.data,
      diRuangBackend: {
        outlet: new Set(outlet.data.map((p) => p.id)),
        gudang: new Set(gudang.data.map((p) => p.id)),
      },
      tipeLokasi: new Map((lokasi.data ?? []).map((l) => [l.id, l.tipe])),
    });
  }, [workspace, semua.data, outlet.data, gudang.data, lokasi.data]);
  const kueri = [semua, outlet, gudang];
  return {
    data,
    isLoading: kueri.some((q) => q.isLoading) || lokasi.isLoading,
    isError: kueri.some((q) => q.isError),
    error: kueri.find((q) => q.error)?.error ?? null,
  };
}

/**
 * Menyimpan pengguna: membuat bila id kosong, memperbarui bila terisi.
 *
 * Invalidasi mencakup akar pengguna, bukan satu workspace saja, karena
 * perubahan role atau status dapat memindahkan pengguna antar ruang kerja.
 * Invalidasi juga saat gagal: PUT yang dijawab 409 karena lokasi kerjanya
 * terhapus bersamaan tetap menyimpan field lain (backend P75, B315), sehingga
 * daftar harus dimuat ulang.
 */
export function useSimpanPengguna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: PenggunaRequest }) =>
      id ? penggunaApi.perbarui(id, data) : penggunaApi.buat(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pengguna.semua });
    },
  });
}

export function useHapusPengguna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => penggunaApi.hapus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pengguna.semua });
    },
  });
}