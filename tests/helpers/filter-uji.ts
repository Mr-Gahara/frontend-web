import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Panel filter samping seragam (FL1a, components/filter/panel-filter.tsx):
 * dibuka lewat "Filter lainnya" dan berlaku lewat Terapkan (FL3a).
 */
export async function bukaPanelFilter(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: /^Filter lainnya/ }).click();
  const panel = page.getByRole("dialog", { name: "Filter lainnya" });
  await expect(panel).toBeVisible();
  return panel;
}

export async function terapkanPanelFilter(panel: Locator): Promise<void> {
  await panel.getByRole("button", { name: "Terapkan" }).click();
  await expect(panel).toBeHidden();
}

/** Tombol pilihan (pil atau segmen) di kelompok panel. */
export function pilihanPanel(panel: Locator, kelompok: string, nama: string): Locator {
  return panel.getByRole("group", { name: kelompok }).getByRole("button", { name: nama, exact: true });
}
