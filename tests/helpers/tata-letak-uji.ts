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
