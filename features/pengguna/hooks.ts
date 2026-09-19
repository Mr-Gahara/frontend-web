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

export function useDaftarPengguna(workspace: Workspace) {
  return useQuery({
    queryKey: queryKeys.pengguna.daftar(workspace),
    queryFn: () => penggunaApi.daftar(workspace),
  });
}

/**
 * Menyimpan pengguna: membuat bila id kosong, memperbarui bila terisi.
 *
 * Invalidasi mencakup akar pengguna, bukan satu workspace saja, karena
 * perubahan role atau status dapat memindahkan pengguna antar ruang kerja.
 */
export function useSimpanPengguna() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: PenggunaRequest }) =>
      id ? penggunaApi.perbarui(id, data) : penggunaApi.buat(data),
    onSuccess: () => {
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