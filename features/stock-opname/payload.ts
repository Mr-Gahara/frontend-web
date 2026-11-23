/** Satu baris hitung fisik per satuan, misalnya 21 kaleng (B366). */
export interface RincianIsian {
  satuan: string;
  jumlah: string;
}

export interface RincianFisik {
  satuan: string;
  jumlah: number;
}

export interface IsianItem {
  qtyPhysical: string;
  catatanItem: string;
  /**
   * Hitungan per satuan (P87, B366; pemilik proyek, 23 November 2026), hanya
   * bila pengguna memakai kemasan atau lebih dari satu satuan. Tanpa rincian
   * hitungan memakai qtyPhysical dalam satuan dasar seperti sebelumnya.
   */
  rincian?: RincianIsian[];
}

/** Nilai tersimpan di server untuk satu item, sebagai pembanding isian. */
export interface NilaiServer {
  qtyPhysical: number | null;
  catatanItem: string | null;
  rincianFisik?: RincianFisik[];
}

export interface ItemHitungan {
  itemId: string;
  /** null berarti belum dihitung (kontrak/temuan.md butir 22, diperbaiki backend B98). */
  qtyPhysical?: number | null;
  /** Ganti qtyPhysical: dijumlah server ke satuan dasar (B366); tidak dikirim bersamaan. */
  rincianFisik?: RincianFisik[];
  catatanItem?: string;
}

/** Baris rincian yang terisi, sebagai angka. */
export function rincianTerisi(rincian: readonly RincianIsian[]): RincianFisik[] {
  return rincian
    .filter((r) => r.jumlah.trim() !== "")
    .map((r) => ({ satuan: r.satuan, jumlah: Number(r.jumlah.trim()) }));
}

/** Rincian satu baris bersatuan dasar sama saja dengan qtyPhysical. */
export function pakaiRincian(isian: IsianItem, satuanDasar: string | undefined): boolean {
  const r = isian.rincian;
  if (!r || r.length === 0) return false;
  return !(r.length === 1 && r[0].satuan === satuanDasar);
}

/**
 * Hitungan fisik dalam satuan dasar untuk menampilkan selisih sebelum
 * disimpan; faktor per satuan dari bahan (faktorKeDasar). null bila belum
 * diisi atau ada satuan yang faktornya tidak diketahui web.
 */
export function totalIsianDasar(
  isian: IsianItem | undefined,
  satuanDasar: string | undefined,
  faktor: (satuan: string) => number | null,
): number | null {
  if (!isian) return null;
  if (!pakaiRincian(isian, satuanDasar)) {
    const teks = (isian.rincian?.[0]?.jumlah ?? isian.qtyPhysical).trim();
    return teks === "" ? null : Number(teks);
  }
  const terisi = rincianTerisi(isian.rincian!);
  if (terisi.length === 0) return null;
  let total = 0;
  for (const r of terisi) {
    const f = faktor(r.satuan);
    if (f === null) return null;
    total += r.jumlah * f;
  }
  return Math.round(total * 1000) / 1000;
}

const samaRincian = (a: readonly RincianFisik[], b: readonly RincianFisik[] | undefined) =>
  JSON.stringify(a) === JSON.stringify(b ?? []);

/**
 * Isian awal tabel hitungan dari item dokumen opname: hitungan yang belum
 * diisi dan catatan kosong menjadi string kosong.
 */
export function isiAwalHitungan(
  items: { itemId: string; qtyPhysical: number | null; catatanItem: string | null; rincianFisik?: RincianFisik[] }[],
): Record<string, IsianItem> {
  const isian: Record<string, IsianItem> = {};
  for (const item of items) {
    isian[item.itemId] = {
      qtyPhysical: item.qtyPhysical !== null && item.qtyPhysical !== undefined ? String(item.qtyPhysical) : "",
      catatanItem: item.catatanItem || "",
      // Rincian tersimpan (B366) dibuka kembali per satuan.
      ...(item.rincianFisik?.length
        ? { rincian: item.rincianFisik.map((r) => ({ satuan: r.satuan, jumlah: String(r.jumlah) })) }
        : {}),
    };
  }
  return isian;
}

/** Nilai tersimpan per itemId dari item dokumen opname. */
export function petakanNilaiServer(
  items: readonly { itemId: string; qtyPhysical?: number | null; catatanItem?: string | null; rincianFisik?: RincianFisik[] }[],
): Record<string, NilaiServer> {
  return Object.fromEntries(
    items.map((i) => [
      i.itemId,
      {
        qtyPhysical: i.qtyPhysical ?? null,
        catatanItem: i.catatanItem ?? null,
        ...(i.rincianFisik?.length ? { rincianFisik: i.rincianFisik } : {}),
      },
    ]),
  );
}

/**
 * Payload simpan hitungan sementara: hanya item yang isiannya berbeda dari
 * nilai tersimpan di server, dan hanya field yang berubah. Isian kosong
 * dikirim sebagai qtyPhysical null (belum dihitung), dan catatan yang dihapus
 * sebagai string kosong. Backend membiarkan field yang tidak dikirim (B98),
 * sehingga mengubah catatan saja tidak menimpa hitungan staf lain yang
 * tersimpan setelah halaman dimuat. Hitungan per satuan dikirim sebagai
 * rincianFisik bila berbeda dari rincian tersimpan (B366).
 */
export function susunPayloadHitungan(
  isian: Record<string, IsianItem>,
  server: Record<string, NilaiServer>,
  satuanDasar: Record<string, string> = {},
): { items: ItemHitungan[] } {
  const items: ItemHitungan[] = [];
  for (const [itemId, data] of Object.entries(isian)) {
    const asal = server[itemId] ?? { qtyPhysical: null, catatanItem: null };
    const catatan = data.catatanItem.trim();
    const catatanBerubah = catatan !== (asal.catatanItem ?? "");
    const item: ItemHitungan = { itemId };

    if (pakaiRincian(data, satuanDasar[itemId])) {
      const rincian = rincianTerisi(data.rincian!);
      if (rincian.length === 0) {
        if (asal.qtyPhysical !== null) item.qtyPhysical = null;
      } else if (!samaRincian(rincian, asal.rincianFisik)) {
        item.rincianFisik = rincian;
      }
    } else {
      const teksQty = (data.rincian?.[0]?.jumlah ?? data.qtyPhysical).trim();
      const qty = teksQty === "" ? null : Number(teksQty);
      if (qty !== asal.qtyPhysical) item.qtyPhysical = qty;
    }
    if (catatanBerubah) item.catatanItem = catatan;
    if (Object.keys(item).length > 1) items.push(item);
  }
  return { items };
}
