/**
 * Koordinasi refresh sesi antar tab.
 *
 * Backend memutar tokenVersion setiap kali refresh web dijalankan
 * (penggunaDeviceService.refreshToken, cabang web), dan refresh token
 * lama langsung tidak berlaku. Bila dua tab memanggil refresh bersamaan,
 * tab yang kalah akan membawa cookie basi dan terlempar ke login.
 *
 * Karena itu refresh dijalankan satu tab saja, lalu hasilnya disiarkan
 * ke tab lain. Tab lain menunggu siaran itu dan tidak memanggil refresh
 * sendiri. Bila BroadcastChannel tidak tersedia, perilakunya kembali
 * seperti semula: setiap tab refresh sendiri.
 */

const NAMA_KANAL = "tachyon-sesi";
const BATAS_TUNGGU_MS = 10_000;

type Pesan =
  | { tipe: "mulai-refresh"; jenis: JenisToken; waktu: number }
  | { tipe: "hasil-refresh"; jenis: JenisToken; token: string | null };

export type JenisToken = "akun" | "pengguna";

const kanal =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(NAMA_KANAL)
    : null;

/** Tab lain sedang refresh: jenis token -> waktu mulai. */
const sedangBerjalanDiTabLain = new Map<JenisToken, number>();
/** Penunggu hasil di tab ini. */
const penunggu = new Map<JenisToken, Array<(token: string | null) => void>>();

kanal?.addEventListener("message", (e: MessageEvent<Pesan>) => {
  const pesan = e.data;
  if (pesan.tipe === "mulai-refresh") {
    sedangBerjalanDiTabLain.set(pesan.jenis, pesan.waktu);
    return;
  }
  sedangBerjalanDiTabLain.delete(pesan.jenis);
  const daftar = penunggu.get(pesan.jenis) ?? [];
  penunggu.set(pesan.jenis, []);
  daftar.forEach((selesai) => selesai(pesan.token));
});

const masihHangat = (waktu?: number) =>
  waktu !== undefined && Date.now() - waktu < BATAS_TUNGGU_MS;

/**
 * Menjalankan refresh sekali saja di antara seluruh tab.
 *
 * Bila tab lain sedang refresh, fungsi ini menunggu hasilnya. Bila
 * hasilnya tidak datang dalam batas waktu, tab ini mengambil alih agar
 * tidak menggantung selamanya.
 */
export function refreshTerkoordinasi(
  jenis: JenisToken,
  jalankan: () => Promise<string | null>,
): Promise<string | null> {
  if (!kanal) return jalankan();

  if (masihHangat(sedangBerjalanDiTabLain.get(jenis))) {
    return new Promise((resolve) => {
      const daftar = penunggu.get(jenis) ?? [];
      const selesai = (token: string | null) => {
        clearTimeout(pewaktu);
        resolve(token);
      };
      const pewaktu = setTimeout(() => {
        penunggu.set(
          jenis,
          (penunggu.get(jenis) ?? []).filter((f) => f !== selesai),
        );
        sedangBerjalanDiTabLain.delete(jenis);
        jalankan().then(resolve, () => resolve(null));
      }, BATAS_TUNGGU_MS);
      daftar.push(selesai);
      penunggu.set(jenis, daftar);
    });
  }

  kanal.postMessage({ tipe: "mulai-refresh", jenis, waktu: Date.now() } satisfies Pesan);
  return jalankan().then(
    (token) => {
      kanal.postMessage({ tipe: "hasil-refresh", jenis, token } satisfies Pesan);
      return token;
    },
    (e) => {
      kanal.postMessage({ tipe: "hasil-refresh", jenis, token: null } satisfies Pesan);
      throw e;
    },
  );
}