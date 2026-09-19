/**
 * Pemanggilan API pengguna.
 *
 * Endpoint create memakai path tersendiri (/pengguna/register-pengguna),
 * berbeda dari path daftar dan update.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { PenggunaItem, PenggunaRequest } from "@/types/pengguna";

export type Workspace = "outlet" | "gudang";

export const penggunaApi = {
  daftar: (workspace: Workspace) =>
    apiData.get<PenggunaItem[]>(EP.pengguna.list, { workspace }),
  buat: (payload: PenggunaRequest) =>
    apiData.post<PenggunaItem>(EP.pengguna.register, payload),
  perbarui: (id: string, payload: PenggunaRequest) =>
    apiData.put<PenggunaItem>(EP.pengguna.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.pengguna.detail(id)),
};