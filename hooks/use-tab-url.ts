import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PARAM_TAB, tabDariUrl, urlDenganTab, type SlugTab } from "@/lib/tab-url";

/**
 * Tab aktif yang disimpan di ?tab= (lib/tab-url.ts). URL adalah satu-satunya
 * sumber: tidak ada state tab terpisah. Berganti tab memakai router.replace
 * tanpa menggulir, agar riwayat tidak menumpuk satu entri per klik dan tombol
 * kembali tetap menuju halaman sebelumnya. Tab bawaan menghapus ?tab=.
 * Komponen pemakainya wajib berada di dalam <Suspense> (useSearchParams).
 */
export function useTabUrl<T extends string>(
  slug: SlugTab<T>,
  boleh: readonly T[],
  bawaan: T,
): [T, (tab: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = tabDariUrl(searchParams.get(PARAM_TAB), slug, boleh, bawaan);
  const pilih = (baru: T) => {
    const s = baru === bawaan ? null : (slug[baru] ?? null);
    router.replace(urlDenganTab(pathname, s, searchParams.toString()), { scroll: false });
  };
  return [tab, pilih];
}