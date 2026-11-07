import { expect, type Page } from "@playwright/test";

/**
 * Pembantu e2e tur sorotan (components/panduan/tur-sorotan.tsx). Balon
 * dicari lewat teks "Panduan x dari y", karena sidebar HP juga berperan
 * dialog. Nama aksesibel balon adalah judul titiknya, yang dapat memuat
 * label isian, sehingga isian di belakang balon dicari dengan label persis.
 */
export const balonPanduan = (page: Page) => page.getByRole("dialog").filter({ hasText: /Panduan \d+ dari \d+/ });

/** Balon seluruhnya di dalam layar dan elemen yang disorot sudah digulir ke layar. */
export async function periksaLetak(page: Page, target: string) {
  const layar = page.viewportSize();
  if (!layar) throw new Error("viewport tidak diketahui");
  const di = (k: { x: number; y: number; width: number; height: number } | null) =>
    !!k && k.x >= 0 && k.y >= 0 && k.x + k.width <= layar.width + 0.5 && k.y + k.height <= layar.height + 0.5;
  await expect
    .poll(async () => di(await balonPanduan(page).boundingBox()), { message: `balon titik ${target} di dalam layar` })
    .toBe(true);
  await expect
    .poll(async () => di(await page.locator(`[data-panduan="${target}"]`).boundingBox()), {
      message: `elemen ${target} tergulir ke layar`,
    })
    .toBe(true);
}

/**
 * Menjalani tur dari titik pertama sampai Selesai, memeriksa nomor dan letak
 * setiap titik; periksa dipanggil di setiap titik sebelum Lanjut ditekan.
 */
export async function jalaniTur(page: Page, target: string[], periksa?: (indeks: number) => Promise<void>) {
  const balon = balonPanduan(page);
  for (const [i, t] of target.entries()) {
    await expect(balon).toContainText(`Panduan ${i + 1} dari ${target.length}`);
    await periksaLetak(page, t);
    await expect(balon.getByRole("button", { name: "Kembali" })).toHaveCount(i === 0 ? 0 : 1);
    await periksa?.(i);
    await balon.getByRole("button", { name: i === target.length - 1 ? "Selesai" : "Lanjut" }).click();
  }
  await expect(balon).toHaveCount(0);
}