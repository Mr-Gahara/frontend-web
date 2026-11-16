"use client";

/**
 * Hook profil sendiri: pengguna milik sesi dan pengubahannya.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useSession } from "@/lib/auth/useSession";
import { bolehLintasOutlet } from "@/lib/auth/permissions";
import { queryKeys } from "@/lib/queryKeys";
import { penggunaApi } from "./api";
import { ruangLokasiKerja, type RuangKerja } from "./lokasi-kerja";
import type { PerbaruiProfilPayload } from "@/types/pengguna";

/** Callback halaman (toast dan pengalihan). Invalidasi diurus hook. */
type OpsiMutasi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

/**
 * Pengguna milik sesi. Id diambil dari token; backend meloloskan
 * GET /pengguna/:id atas diri sendiri tanpa read-pengguna
 * (checkPermissionOrSelf), sehingga setiap pengguna dapat membaca
 * profilnya. Token tidak membawa nama maupun nomor HP, jadi keduanya hanya
 * tersedia dari sini. Dimuat ulang setiap halaman dibuka (keputusan
 * rancangan butir 8), dan tidak meminta apa pun selama sesi belum pulih.
 */
export function usePenggunaSaya() {
  const { pengguna } = useSession();
  const id = pengguna?.id ?? "";
  return useQuery({
    queryKey: queryKeys.pengguna.detail(id),
    queryFn: () => penggunaApi.detail(id),
    enabled: id !== "",
    refetchOnMount: "always",
  });
}

/**
 * Ruang lokasi kerja pengguna sesi (LK3a): null bila tidak dibatasi.
 * `siap` false selama detail diri masih dimuat, agar gerbang dan pengalihan
 * tidak memutuskan dari data yang belum ada. Tipe lokasinya ikut di detail
 * diri (B339), sehingga daftar lokasi tidak diminta.
 */
export function useRuangLokasiKerja(): { ruang: RuangKerja | null; siap: boolean } {
  const { permissions } = useSession();
  const lintas = bolehLintasOutlet(permissions);
  const saya = usePenggunaSaya();
  const siap = lintas || !saya.isPending;
  return { ruang: ruangLokasiKerja(saya.data?.lokasiKerja, lintas), siap };
}

export interface PerbaruiProfilVars {
  id: string;
  payload: PerbaruiProfilPayload;
}

/**
 * Mengubah profil sendiri. Invalidasi akar pengguna ditunggu sebelum
 * callback halaman, agar form yang dipasang ulang membaca nilai tersimpan.
 * Bila PIN ikut berubah, backend memutus sesi (tokenVersion naik), sehingga
 * tidak ada yang dimuat ulang: permintaan itu pasti dijawab 401, dan halaman
 * mengakhiri sesi lewat callback-nya (keputusan PF7a).
 */
export function usePerbaruiProfil(opsi: OpsiMutasi<PerbaruiProfilVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: PerbaruiProfilVars) => penggunaApi.perbaruiProfil(id, payload),
    onSuccess: async (...args) => {
      if (args[1].payload.pinBaru === undefined) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.pengguna.semua });
      }
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}