import fs from "node:fs";
import path from "node:path";
import type { Page, Response } from "@playwright/test";

/*
 * Akun admin uji untuk spec panel admin (keputusan PA4a dan PA5a).
 * Kredensialnya tidak pernah ditulis di repo: dibaca dari variabel
 * lingkungan atau dari .env.e2e di akar repo, yang diabaikan git.
 * Tanpa keduanya, spec admin dilewati dengan alasan yang terlihat.
 */

export interface KredensialAdmin {
  email: string;
  password: string;
}

export const ALASAN_TANPA_ADMIN =
  "Kredensial admin uji tidak tersedia: isi E2E_ADMIN_EMAIL dan E2E_ADMIN_PASSWORD di .env.e2e";

const POLA_LOGIN_AKUN = /\/api\/akun\/auth\/login(\?|$)/i;

function bacaBerkasEnv(): Record<string, string> {
  const berkas = path.resolve(process.cwd(), ".env.e2e");
  const nilai: Record<string, string> = {};
  if (!fs.existsSync(berkas)) return nilai;
  for (const baris of fs.readFileSync(berkas, "utf8").split("\n")) {
    const cocok = baris.match(/^([A-Z0-9_]+)=(.*)$/);
    if (cocok) nilai[cocok[1]] = cocok[2].trim().replace(/^["']|["']$/g, "");
  }
  return nilai;
}

/** Kredensial admin uji, atau null bila tidak tersedia. */
export function kredensialAdmin(): KredensialAdmin | null {
  const berkas = bacaBerkasEnv();
  const email = process.env.E2E_ADMIN_EMAIL ?? berkas.E2E_ADMIN_EMAIL ?? "";
  const password = process.env.E2E_ADMIN_PASSWORD ?? berkas.E2E_ADMIN_PASSWORD ?? "";
  return email && password ? { email, password } : null;
}

/** Login akun admin lewat UI sampai panel admin; mengembalikan respons login. */
export async function loginAdmin(page: Page, admin: KredensialAdmin): Promise<Response> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(admin.email);
  await page.getByLabel(/password/i).fill(admin.password);
  const tunggu = page.waitForResponse(
    (r) => POLA_LOGIN_AKUN.test(r.url()) && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /login/i }).click();
  const respons = await tunggu;
  await page.waitForURL("**/admin");
  return respons;
}