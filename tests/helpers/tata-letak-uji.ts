import { expect, type Page } from "@playwright/test";

/** Lebar uji OA6a: HP, tablet, dan laptop. */
export const LEBAR_UJI = [
  { nama: "HP", width: 390, height: 844 },
  { nama: "tablet", width: 768, height: 1024 },
  { nama: "laptop", width: 1280, height: 800 },
] as const;

/** Halaman tidak bergulir ke samping: lebar isi dokumen tidak melebihi layar. */
export async function tanpaGulirSamping(page: Page, konteks: string) {
  const lebar = await page.evaluate(() => ({ isi: document.documentElement.scrollWidth, layar: window.innerWidth }));
  expect(lebar.isi, `${konteks}: lebar isi tidak melebihi layar`).toBeLessThanOrEqual(lebar.layar);
}

/** Memeriksa tanpaGulirSamping di setiap LEBAR_UJI, lalu kembali ke lebar laptop. */
export async function tanpaGulirDiSemuaLebar(page: Page, konteks: string) {
  for (const l of LEBAR_UJI) {
    await page.setViewportSize({ width: l.width, height: l.height });
    await tanpaGulirSamping(page, `${konteks} (${l.nama} ${l.width} px)`);
  }
}

/**
 * Wadah gulir dashboard (app/dashboard/layout.tsx) dan setiap wadah tabel
 * tidak lebih lebar dari isinya. tanpaGulirSamping tidak menangkapnya,
 * karena luberan di dalam wadah gulir dashboard tidak melebarkan dokumen
 * (luberan HP 390 px, 17 November 2026).
 */
export async function tanpaLuberWadah(page: Page, konteks: string) {
  const wadah = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('div.flex-1.overflow-y-auto, [data-slot="table-container"]')]
      .filter((e) => e.offsetParent !== null)
      .map((e) => ({ nama: e.dataset.slot ?? "wadah gulir dashboard", isi: e.scrollWidth, lebar: e.clientWidth })),
  );
  expect(wadah.length, `${konteks}: wadah gulir dashboard terbaca`).toBeGreaterThan(0);
  for (const w of wadah) {
    expect(w.isi, `${konteks}: ${w.nama} tidak lebih lebar dari wadahnya`).toBeLessThanOrEqual(w.lebar + 1);
  }
}
