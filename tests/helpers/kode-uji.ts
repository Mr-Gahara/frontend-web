import type { Locator } from "@playwright/test";

/** Menempelkan teks ke kotak kode OTP lewat event paste, seperti pengguna menempel dari email. */
export async function tempelKode(kotak: Locator, kode: string) {
  await kotak.evaluate((el, teks) => {
    const data = new DataTransfer();
    data.setData("text", teks);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  }, kode);
}
