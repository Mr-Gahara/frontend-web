import type { SlugTab } from "@/lib/tab-url";

/**
 * Tab Semua dan Stok Kritis di daftar Stok outlet, Inventaris gudang, dan
 * Produk, dibaca dari ?tab= (lib/tab-url.ts) agar pemberitahuan stok minimum
 * lonceng membuka daftar yang langsung tersaring (LN16a).
 */
export type TabStok = "ALL" | "CRITICAL";
export const TAB_STOK: readonly TabStok[] = ["ALL", "CRITICAL"];
export const SLUG_TAB_STOK: SlugTab<TabStok> = { ALL: "semua", CRITICAL: "stok-kritis" };

/** Href daftar yang langsung membuka tab Stok Kritis. */
export const denganTabKritis = (path: string) => `${path}?tab=${SLUG_TAB_STOK.CRITICAL}`;
