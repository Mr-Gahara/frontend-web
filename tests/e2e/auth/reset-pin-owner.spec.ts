import { test, expect } from "@playwright/test";
import { tempelKode } from "../../helpers/kode-uji";
import { ALASAN_TANPA_MAILPIT, ambilOtp, mailpitMenyala } from "../../helpers/mailpit-uji";
import {
  ALASAN_TANPA_ADMIN,
  PASSWORD_AKUN_UJI,
  hapusAkunKlienUji,
  kredensialAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";
import { isiLoginAkun, isiLoginPengguna } from "../../helpers/masuk-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";
import { tanpaGulirDiSemuaLebar } from "../../helpers/tata-letak-uji";

/*
 * Reset PIN Owner dari panel Lupa PIN? (OA1a, B178), sampai masuk dengan PIN
 * baru. Memakai akun klien sekali pakai dari API admin (toko dan Owner lewat
 * wizard), tidak pernah akun uji bersama, karena PIN Owner benar-benar
 * berganti. Kode dibaca dari Mailpit (UJ1a). Pemakaian OTP per run: 1 kirim
 * dan 1 periksa kode (inti/pengujian.md).
 */
const PIN_BARU = "654321";

test("Owner mengatur ulang PIN lewat kode email, lalu masuk dengan PIN baru", async ({ page, browser }) => {
  const admin = kredensialAdmin();
  test.skip(!admin, ALASAN_TANPA_ADMIN);
  test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
  test.setTimeout(120_000);
  const { id, email } = await akunBaru(page, "resetpin");
  try {
    await isiTokoDanOwner(page);

    // Perangkat lain tanpa sesi pengguna: wizard mengalihkan Owner ke login PIN.
    const ctx = await browser.newContext();
    const hal = await ctx.newPage();
    await hal.goto("/login");
    await isiLoginAkun(hal, email, PASSWORD_AKUN_UJI);
    await hal.waitForURL(/\/login\/pengguna/);
    await hal.getByRole("button", { name: "Lupa PIN?" }).click();
    await hal.getByRole("link", { name: "Atur ulang PIN Owner" }).click();
    await hal.waitForURL("**/lupa-pin");

    const sejak = new Date();
    const tKirim = hal.waitForResponse(
      (r) => r.request().method() === "POST" && /\/api\/pengguna\/reset-pin-owner\/otp$/.test(r.url()),
    );
    await hal.getByRole("button", { name: "Kirim kode" }).click();
    const kirim = await tKirim;
    expect(kirim.status(), "POST reset-pin-owner/otp").toBe(200);
    const tersamar = ((await kirim.json()).data as { email: string }).email;

    await expect(hal.getByRole("heading", { level: 1, name: "Kode dan PIN baru" })).toBeVisible();
    await expect(hal.getByText(`Kode dikirim ke ${tersamar}, berlaku 10 menit.`)).toBeVisible();
    await expect(hal.getByRole("button", { name: /Kirim ulang dalam/ })).toBeDisabled();
    await tanpaGulirDiSemuaLebar(hal, "atur ulang PIN tahap 2");

    // HP: panel navy ringkas satu baris, panel penuh tersembunyi (OA6a).
    await hal.setViewportSize({ width: 390, height: 844 });
    await expect(hal.locator("aside").filter({ has: hal.locator("time") })).toBeHidden();
    await expect(hal.locator("aside").filter({ hasText: email })).toBeVisible();
    await hal.setViewportSize({ width: 1280, height: 800 });

    const kode = await ambilOtp(email, sejak);
    await tempelKode(hal.getByLabel("Digit 1 dari 6"), kode);
    await hal.getByLabel("Password akun toko").fill(PASSWORD_AKUN_UJI);
    await hal.getByLabel("PIN baru", { exact: true }).fill(PIN_BARU);
    await hal.getByLabel("Ulangi PIN baru").fill(PIN_BARU);
    const tSimpan = hal.waitForResponse(
      (r) => r.request().method() === "POST" && /\/api\/pengguna\/reset-pin-owner$/.test(r.url()),
    );
    await hal.getByRole("button", { name: "Simpan PIN baru" }).click();
    const simpan = await tSimpan;
    expect(simpan.status(), "POST reset-pin-owner").toBe(200);
    expect(simpan.request().postDataJSON()).toEqual({ password: PASSWORD_AKUN_UJI, pinBaru: PIN_BARU, otp: kode });

    await hal.waitForURL(/\/login\/pengguna/);
    await expect(hal.getByText("PIN Owner diubah")).toBeVisible();
    await isiLoginPengguna(hal, "Rina E2E", PIN_BARU);
    await hal.waitForURL("**/setup");
    await ctx.close();
  } finally {
    await hapusAkunKlienUji(id, wajibAdmin());
  }
});
