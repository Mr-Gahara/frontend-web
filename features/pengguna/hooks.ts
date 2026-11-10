"use client";

/**
 * Hook data pengguna.
 *
 * Daftar dipisahkan per workspace karena backend memfilter dengan query
 * workspace, dan kedua ruang kerja menampilkan kumpulan pengguna berbeda.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { penggunaApi, type Workspace } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { PenggunaRequest } from "@/types/pengguna";

/** enabled: false menunda pemuatan, misalnya sampai form yang memakainya dibuka. */
export function useDaftarPengguna(workspace: Workspace, opsi: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.pengguna.daftar(workspace),
    queryFn: () => penggunaApi.daftar(workspace),
    enabled: opsi.enabled ?? true,
  });
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