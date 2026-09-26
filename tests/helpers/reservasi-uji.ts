import { expect, type Page, type Request, type Response } from "@playwright/test";
import { api, type Auth } from "./transfer-uji";

/*
 * Helper spec reservasi: nama unik per run, permintaan yang ditahan lalu
 * diteruskan ke backend sungguhan, pemantau permintaan, serta data uji tipe
 * aset dan aset lewat API. Respons sukses tidak pernah dipalsukan (keputusan
 * rancangan butir 21, keputusan R1a).
 */

export const ID_TIDAK_ADA = "000000000000000000000000";

let urut = 0;
export const unik = () => Date.now().toString(36) + (urut++).toString(36);
export const tunda = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Predikat waitForResponse untuk satu method dan pola URL. */
export function cocok(method: string, pola: RegExp) {
  return (r: Response) => r.request().method() === method && pola.test(r.url());
}

/** Menghitung permintaan satu method dan pola URL; lepas() menghentikannya. */
export function pantauPermintaan(page: Page, method: string, pola: RegExp) {
  const tercatat: Request[] = [];
  const catat = (r: Request) => {
    if (r.method() === method && pola.test(r.url())) tercatat.push(r);
  };
  page.on("request", catat);
  return { jumlah: () => tercatat.length, lepas: () => page.off("request", catat) };
}

/** Menahan permintaan method itu sebentar lalu meneruskannya ke backend sungguhan. */
export async function tahanLaluTeruskan(page: Page, method: string, pola: RegExp, ms = 1_500) {
  await page.route(pola, async (route) => {
    if (route.request().method() === method) await tunda(ms);
    await route.continue();
  });
}

export type TipeAsetMentah = {
  id: string;
  namaTipeAset: string;
  deskripsi: string | null;
  dataTarif: { id: string }[];
};

export type AsetMentah = {
  id: string;
  namaAset: string;
  status: string;
  dataAset: { id: string; namaTipeAset: string | null } | null;
};

export async function buatTipeAset(page: Page, auth: Auth, nama: string, deskripsi?: string) {
  const r = await api<TipeAsetMentah>(
    page,
    auth,
    "POST",
    "/tipeaset",
    deskripsi ? { namaTipeAset: nama, deskripsi } : { namaTipeAset: nama },
  );
  expect(r.status, "buat tipe aset uji: " + r.pesan).toBeLessThan(300);
  expect(r.data?.id, "respons buat tipe aset harus membawa id").toBeTruthy();
  return r.data;
}

export async function buatAset(
  page: Page,
  auth: Auth,
  data: { namaAset: string; tipeAsetID: string; status?: "tersedia" | "perbaikan" },
) {
  const r = await api<AsetMentah>(page, auth, "POST", "/aset", data);
  expect(r.status, "buat aset uji: " + r.pesan).toBeLessThan(300);
  expect(r.data?.id, "respons buat aset harus membawa id").toBeTruthy();
  return r.data;
}

/** Menghapus data uji lewat API; status tidak diperiksa karena dipakai di finally. */
export async function hapusLewatApi(page: Page, auth: Auth, path: string, id: string | undefined) {
  if (id) await api(page, auth, "DELETE", path + "/" + id);
}