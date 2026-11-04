import { expect } from "@playwright/test";

/*
 * Penangkap email lokal untuk alur ber-OTP (UJ1a, modul/setup-akun.md,
 * Pengujian OTP). Backend non-produksi mengirim lewat SMTP ke Mailpit
 * (EMAIL_TRANSPORT=smtp, B215); spec membaca email terbaru untuk alamat
 * unik per run lewat API HTTP-nya, tanpa jalan pintas di logika OTP.
 */
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://localhost:8025";

export const ALASAN_TANPA_MAILPIT =
  "Mailpit tidak menyala di " + MAILPIT + ", atau backend tidak dijalankan dengan EMAIL_TRANSPORT=smtp (modul/setup-akun.md, Pengujian OTP)";

/** Mailpit dapat dihubungi. */
export async function mailpitMenyala(): Promise<boolean> {
  try {
    return (await fetch(MAILPIT + "/api/v1/info")).ok;
  } catch {
    return false;
  }
}

interface PesanMailpit {
  ID: string;
  Created: string;
}

/**
 * Kode 6 digit dari email terbaru untuk alamat itu yang tiba setelah
 * `sejak`. Ditunggu sampai 15 detik, karena backend mengirim setelah
 * menjawab.
 */
export async function ambilOtp(email: string, sejak: Date): Promise<string> {
  let kode = "";
  await expect
    .poll(
      async () => {
        const cari = await fetch(
          `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}&limit=5`,
        ).then((r) => r.json() as Promise<{ messages?: PesanMailpit[] }>);
        const baru = (cari.messages ?? []).find((m) => new Date(m.Created).getTime() >= sejak.getTime() - 2_000);
        if (!baru) return "";
        const isi = await fetch(`${MAILPIT}/api/v1/message/${baru.ID}`).then(
          (r) => r.json() as Promise<{ Text?: string; HTML?: string }>,
        );
        kode = (isi.Text || isi.HTML || "").match(/\b(\d{6})\b/)?.[1] ?? "";
        return kode;
      },
      { message: "OTP untuk " + email + " di Mailpit", timeout: 15_000 },
    )
    .not.toBe("");
  return kode;
}
