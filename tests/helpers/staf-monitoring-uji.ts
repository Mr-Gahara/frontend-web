import { expect, type Page } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";
import { bersihkanHari, CATATAN_UJI, siapkanFixtureJadwal } from "./jadwal-uji";
import { tanggalLokal } from "./reservasi-uji";

/*
 * Staf monitoring per lokasi outlet untuk panel Status Staf (B183). Backend
 * memuat pengguna aktif yang berjadwal hari ini pada shift lokasi itu
 * (absensiService.getMonitoringHarian), sehingga pembatas lima baris di HP
 * butuh lebih dari lima staf berjadwal. Enam pengguna uji dibuat sekali oleh
 * Ridho lewat API (data milik modul pengguna, keputusan rancangan butir 23)
 * dan menetap; jadwal hari ini pada shift pagi uji outlet dibuat setiap run
 * dan dihapus lewat fungsi yang dikembalikan, dipanggil di finally.
 */
export const AWALAN_STAF_MONITORING = "E2E Staf Monitoring";
const JUMLAH_STAF = 6;

type Mentah = { id?: string; _id?: string };
type PenggunaMentah = Mentah & { nama?: string };
type PeranMentah = Mentah & { namaRole?: string };

const idMilik = (x: Mentah | undefined) => String(x?.id ?? x?._id ?? "");

async function pastikanStaf(page: Page, auth: Auth): Promise<string[]> {
  const baca = async () => {
    const res = await api<PenggunaMentah[]>(page, auth, "GET", "/pengguna");
    expect(res.status, `GET /pengguna: ${res.pesan}`).toBe(200);
    return res.data ?? [];
  };
  const nama = (n: number) => `${AWALAN_STAF_MONITORING} ${n}`;
  let pengguna = await baca();
  const kurang = Array.from({ length: JUMLAH_STAF }, (_, i) => i + 1).filter(
    (n) => !pengguna.some((p) => p.nama === nama(n)),
  );
  if (kurang.length > 0) {
    const peran = await api<PeranMentah[]>(page, auth, "GET", "/role");
    expect(peran.status, `GET /role: ${peran.pesan}`).toBe(200);
    const bukanOwner = (peran.data ?? []).find((r) => !/owner/i.test(r.namaRole ?? ""));
    expect(bukanOwner, "perlu peran selain Owner untuk staf monitoring uji").toBeTruthy();
    for (const n of kurang) {
      const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
        nama: nama(n),
        pin: `2468${String(n).padStart(2, "0")}`,
        roleID: idMilik(bukanOwner),
        aksesType: ["app"],
      });
      expect(buat.status, `buat ${nama(n)}: ${buat.pesan}`).toBeLessThan(300);
    }
    pengguna = await baca();
  }
  return Array.from({ length: JUMLAH_STAF }, (_, i) => idMilik(pengguna.find((p) => p.nama === nama(i + 1))));
}

/**
 * Menjadwalkan keenam staf uji hari ini pada shift pagi uji outlet, dan
 * mengembalikan pembersih jadwalnya. Jadwal sisa run yang gagal dihapus
 * lebih dulu, agar POST tidak ditolak karena hari itu sudah berjadwal.
 */
export async function jadwalkanStafMonitoring(page: Page, auth: Auth): Promise<() => Promise<void>> {
  const fx = await siapkanFixtureJadwal(page, auth, "outlet");
  const hari = tanggalLokal(new Date());
  const staf = await pastikanStaf(page, auth);
  const bersihkan = async () => {
    for (const penggunaId of staf) await bersihkanHari(page, auth, { ...fx, penggunaId }, hari, hari);
  };
  await bersihkan();
  for (const penggunaId of staf) {
    const res = await api<{ ditolak: number }>(page, auth, "POST", "/jadwalshift", {
      penggunaId,
      tanggal: hari,
      isLibur: false,
      shiftIds: [fx.shiftPagi],
      catatan: CATATAN_UJI,
    });
    expect(res.status, `POST /jadwalshift staf monitoring: ${res.pesan}`).toBe(201);
    expect(res.data.ditolak, "jadwal staf monitoring ditolak backend").toBe(0);
  }
  return bersihkan;
}
