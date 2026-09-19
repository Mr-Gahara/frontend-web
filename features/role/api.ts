/**
 * Pemanggilan API role dan permission.
 *
 * Dipakai halaman pengaturan role maupun halaman pengguna, yang
 * membutuhkan daftar role untuk menentukan level pengguna aktif.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { BuatRoleRequest, Permission, Role } from "@/types/role";

export const roleApi = {
  daftar: () => apiData.get<Role[]>(EP.role.list),
  detail: (id: string) => apiData.get<Role>(EP.role.detail(id)),
  buat: (payload: BuatRoleRequest) => apiData.post<Role>(EP.role.list, payload),
  perbarui: (id: string, payload: BuatRoleRequest) =>
    apiData.put<Role>(EP.role.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.role.detail(id)),
};

export const permissionApi = {
  daftar: () => apiData.get<Permission[]>(EP.permission.list),
};