"use client";

/**
 * Hook data role dan permission.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionApi, roleApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import { useSession } from "@/lib/auth/useSession";
import type { BuatRoleRequest, Role } from "@/types/role";

export function useDaftarRole() {
  return useQuery({
    queryKey: queryKeys.roles.daftar(),
    queryFn: roleApi.daftar,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => roleApi.detail(id),
    enabled: !!id,
  });
}

export function useDaftarPermission() {
  return useQuery({
    queryKey: queryKeys.permissions.daftar(),
    queryFn: permissionApi.daftar,
    staleTime: 30 * 60 * 1000,
  });
}

function useInvalidasiRole() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.semua });
}

export function useSimpanRole() {
  const invalidasi = useInvalidasiRole();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: BuatRoleRequest }) =>
      id ? roleApi.perbarui(id, data) : roleApi.buat(data),
    onSuccess: invalidasi,
  });
}

export function useHapusRole() {
  const invalidasi = useInvalidasiRole();
  return useMutation({
    mutationFn: (id: string) => roleApi.hapus(id),
    onSuccess: invalidasi,
  });
}

/**
 * Level role pengguna yang sedang masuk.
 *
 * Token pengguna hanya membawa nama role, tanpa level, sehingga level
 * dicari dari daftar role. Owner selalu level tertinggi (100) karena
 * backend memberinya seluruh permission.
 *
 * Perhitungan ini sebelumnya diulang di lima halaman dengan bentuk yang
 * sedikit berbeda, termasuk pembacaan role.level yang selalu undefined.
 */
export function useLevelPenggunaAktif(roleList: Role[] = []) {
  const { pengguna } = useSession();

  if (pengguna?.role === "Owner") return 100;
  const milikSaya = roleList.find(
    (r) => r.namaRole === pengguna?.role || r.id === pengguna?.roleID,
  );
  return milikSaya?.level ?? 0;
}