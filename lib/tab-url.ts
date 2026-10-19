/**
 * Tab halaman daftar di URL (?tab=), agar tautan (misalnya dari dashboard)
 * dapat membuka tab tertentu dan tab tetap bertahan saat halaman dimuat ulang.
 *
 * Nilai dari URL tidak dipercaya:
 * - hanya slug milik tab yang boleh tampil yang diterima; selain itu, termasuk
 *   tab yang disembunyikan izin, kembali ke tab bawaan;
 * - slug dicocokkan dengan menelusuri daftar tab, tidak pernah dipakai sebagai
 *   kunci objek, sehingga nilai seperti "__proto__" tidak menyentuh prototipe;
 * - nilai mentahnya tidak dirender dan tidak dikirim ke server; yang dipakai
 *   hanya tab hasil pemetaan.
 * Akses data tetap dijaga gerbang rute dan backend; ?tab= hanya memilih tampilan.
 */

export const PARAM_TAB = "tab";

/** Slug per tab: kata yang terbaca di URL, bukan kode internal. */
export type SlugTab<T extends string> = Readonly<Partial<Record<T, string>>>;

export function tabDariUrl<T extends string>(
  nilai: string | null,
  slug: SlugTab<T>,
  boleh: readonly T[],
  bawaan: T,
): T {
  if (nilai === null) return bawaan;
  return boleh.find((t) => slug[t] === nilai) ?? bawaan;
}

/**
 * Alamat dengan ?tab= yang disusun lewat URLSearchParams, sehingga slug selalu
 * di-encode. Parameter lain dipertahankan; slug null menghapus ?tab= (tab bawaan).
 */
export function urlDenganTab(path: string, slug: string | null, kueri = ""): string {
  const params = new URLSearchParams(kueri);
  if (slug) params.set(PARAM_TAB, slug);
  else params.delete(PARAM_TAB);
  const teks = params.toString();
  return teks ? `${path}?${teks}` : path;
}