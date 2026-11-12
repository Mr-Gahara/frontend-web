import { test, expect } from "@playwright/test";
import { BASIS, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { pengingatLangganan } from "../../../features/langganan/pengingat";
import type { LanggananToko } from "../../../types/langganan";

/*
 * Lonceng topbar sebagai pusat pemberitahuan (desain C, pemilik proyek
 * 12 November 2026). Isi panel dibandingkan dengan pengingat yang dihitung
 * dari respons nyata GET /akun/langganan; respons tidak dipalsukan
 * (keputusan rancangan butir 21). Keadaan hampir habis dan masa tenggang
 * diuji di unit test pengingat, karena akun uji tidak dapat dibuat berakhir
 * dalam tujuh hari secara deterministik.
 */

const URL_DASHBOARD = BASIS + "/dashboard/outlet";
const URL_LANGGANAN = "/dashboard/outlet/pengaturan/langganan";

for (const { nama, lebar } of [
  { nama: "desktop", lebar: 1280 },
  { nama: "HP", lebar: 390 },
]) {
  test(`lonceng ${nama}: aktif, panel Pemberitahuan muncul sesuai data langganan dan tetap di dalam layar`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: lebar, height: 800 });
    await login(page);
    const auth = await bukaDenganAuth(page, URL_DASHBOARD);
    const r = await api<LanggananToko>(page, auth, "GET", "/akun/langganan");
    expect(r.status, r.pesan).toBe(200);
    const harapan = pengingatLangganan(r.data, new Date());

    const lonceng = page.getByRole("button", { name: /^Pemberitahuan/ });
    await expect(lonceng).toBeEnabled();
    await expect(lonceng).toHaveAccessibleName(harapan ? "Pemberitahuan, 1 baru" : "Pemberitahuan");
    await expect(page.getByTestId("titik-pemberitahuan")).toHaveCount(harapan ? 1 : 0);

    await lonceng.click();
    const panel = page.getByRole("dialog", { name: "Pemberitahuan" });
    await expect(panel).toBeVisible();
    if (harapan) {
      await expect(panel).toContainText(harapan.judul);
      await expect(panel).toContainText(harapan.isi);
      await expect(panel.getByRole("link", { name: "Lihat langganan" })).toHaveAttribute("href", URL_LANGGANAN);
    } else {
      await expect(panel).toContainText("Belum ada pemberitahuan.");
    }

    const kotak = await panel.boundingBox();
    expect(kotak, "panel tampil").toBeTruthy();
    expect(kotak!.x, "tidak keluar di kiri").toBeGreaterThanOrEqual(0);
    expect(kotak!.x + kotak!.width, "tidak keluar di kanan").toBeLessThanOrEqual(lebar);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
}
