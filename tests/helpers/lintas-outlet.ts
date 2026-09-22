import { IZIN_LINTAS_OUTLET } from "../../lib/auth/permissions";

/**
 * Keadaan izin lintas outlet untuk spec e2e. Satu-satunya akun uji (Ridho)
 * berperan Owner, dan backend memberi Owner seluruh permission yang ada di
 * seed. Selama IZIN_LINTAS_OUTLET null, Ridho terkunci ke outlet tenant;
 * begitu konstanta itu diisi dan permission owner di-seed ulang, Ridho
 * memegangnya, sehingga skenario lintas outlet berjalan dan skenario jalur
 * terkunci dilewati.
 */
export const ADA_IZIN_LINTAS = IZIN_LINTAS_OUTLET !== null;

/** Alasan test.fixme untuk skenario pemegang izin lintas outlet. */
export const MENUNGGU_IZIN_LINTAS =
  "Menunggu backend menetapkan permission lintas outlet (IZIN_LINTAS_OUTLET di lib/auth/permissions.ts)";

/** Alasan test.skip untuk skenario jalur terkunci setelah izin itu ditetapkan. */
export const JALUR_TERKUNCI =
  "Ridho memegang izin lintas outlet; jalur terkunci butuh akun uji tanpa izin itu (utang pengujian)";