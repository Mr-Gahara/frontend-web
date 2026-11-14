"use client";

import { useDaftarAset, useSimpanAset } from "@/features/aset/hooks";
import {
  useDaftarBahanBaku,
  useBuatBahanBaku,
  useHapusBahanBaku,
} from "@/features/bahan-baku/hooks";
import { useBuatLokasi, useDaftarLokasi } from "@/features/inventaris/hooks";
import {
  NILAI_AWAL_LOKASI,
  payloadBuatLokasi,
} from "@/features/inventaris/schema-lokasi";
import {
  useDaftarKategori,
  useHapusKategori,
  useSimpanKategori,
} from "@/features/kategori/hooks";
import { useBuatPajak, useDaftarPajak } from "@/features/pajak/hooks";
import { payloadBuatPajak } from "@/features/pajak/payload";
import {
  useDaftarProduk,
  useHapusProduk,
  useSimpanProduk,
} from "@/features/produk/hooks";
import { useDaftarTarif, useSimpanTarif } from "@/features/tarif/hooks";
import {
  useDaftarTipeAset,
  useSimpanTipeAset,
} from "@/features/tipe-aset/hooks";
import type { KunciPlan } from "@/types/langganan";
import type { Lokasi, TipeLokasi } from "@/types/location";
import { useSegarkanSetup } from "./hooks";
import { LangkahBahanBaku } from "./langkah-bahan";
import { LangkahBooking } from "./langkah-booking";
import { LangkahKategori } from "./langkah-kategori";
import { LangkahLokasi } from "./langkah-lokasi";
import { LangkahPajak } from "./langkah-pajak";
import { LangkahProduk } from "./langkah-produk";
import { LangkahSelesai } from "./langkah-selesai";
import { LangkahTersimpan } from "./langkah-tersimpan";
import {
  butirBahan,
  butirKategori,
  butirProduk,
  payloadBahanSetup,
  payloadKategoriSetup,
  payloadProdukSetup,
  payloadTarifSetup,
} from "./payload";

/**
 * Langkah sesudah Owner terdaftar. Semuanya memakai sesi pengguna Owner dan
 * hook modul masing-masing (keputusan rancangan butir 12), sehingga hanya
 * dipasang setelah sesi itu ada. Setiap simpan menyegarkan status setup.
 */

export interface PropsTersambung {
  nomor: number;
  total: number;
  teksLanjut: string;
  onLanjut: () => void;
  onKembali?: () => void;
}

const sama = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** Tempat mengubah lokasi sesudah setup: outlet di Profil Toko, gudang di Pengaturan Gudang (WS6a). */
const CATATAN_LOKASI = {
  outlet: "Lokasi dan titik absen dapat diubah nanti dari Profil Toko.",
  gudang: "Lokasi dan titik absen gudang dapat diubah nanti dari Pengaturan Gudang.",
} as const;

const lokasiBertipe = (daftar: Lokasi[] | undefined, tipe: TipeLokasi) =>
  daftar?.find((l) => l.tipe === tipe);

function Memuat() {
  return <p className="text-isi text-muted-foreground">Memuat data toko...</p>;
}

/** Outlet dan gudang: satu lokasi per tipe, sehingga lokasi yang sudah ada tidak dibuat lagi. */
export function LangkahLokasiTersambung({
  jenis,
  onLewati,
  ...umum
}: PropsTersambung & { jenis: "outlet" | "gudang"; onLewati?: () => void }) {
  const daftar = useDaftarLokasi();
  const buat = useBuatLokasi();
  const segarkan = useSegarkanSetup();
  const tipe: TipeLokasi = jenis === "outlet" ? "Outlet" : "Gudang";
  if (daftar.isLoading) return <Memuat />;
  const ada = lokasiBertipe(daftar.data, tipe);
  if (ada) {
    return (
      <LangkahTersimpan
        {...umum}
        judul={jenis === "outlet" ? "Lokasi outlet" : "Gudang"}
        baris={[
          { label: "Nama", nilai: ada.nama },
          { label: "Alamat", nilai: ada.alamat || "-" },
          { label: "Radius absen", nilai: `${ada.radiusAbsen} meter` },
        ]}
        catatan={CATATAN_LOKASI[jenis]}
      />
    );
  }
  return (
    <LangkahLokasi
      key={jenis}
      jenis={jenis}
      {...umum}
      awal={NILAI_AWAL_LOKASI}
      onLewati={onLewati}
      onLanjut={async (nilai) => {
        await buat.mutateAsync(payloadBuatLokasi(nilai, tipe));
        await segarkan();
        umum.onLanjut();
      }}
    />
  );
}

export function LangkahKategoriTersambung(umum: PropsTersambung) {
  const daftar = useDaftarKategori();
  const simpan = useSimpanKategori();
  const hapus = useHapusKategori();
  const segarkan = useSegarkanSetup();
  if (daftar.isLoading) return <Memuat />;
  return (
    <LangkahKategori
      {...umum}
      butir={(daftar.data ?? []).map(butirKategori)}
      onTambah={async (n) => {
        await simpan.mutateAsync({ data: payloadKategoriSetup(n) });
        await segarkan();
      }}
      onHapus={async (id) => {
        await hapus.mutateAsync(id);
        await segarkan();
      }}
    />
  );
}

export function LangkahBahanTersambung({
  adaResep,
  onPilihResep,
  ...umum
}: PropsTersambung & {
  adaResep: boolean | null;
  onPilihResep: (ya: boolean) => void;
}) {
  const daftar = useDaftarBahanBaku();
  const buat = useBuatBahanBaku();
  const hapus = useHapusBahanBaku();
  const segarkan = useSegarkanSetup();
  if (daftar.isLoading) return <Memuat />;
  const bahan = daftar.data ?? [];
  return (
    <LangkahBahanBaku
      {...umum}
      adaResepAwal={adaResep ?? true}
      butir={bahan.map(butirBahan)}
      onTambah={async (n) => {
        await buat.mutateAsync(payloadBahanSetup(n));
        await segarkan();
      }}
      onHapus={async (id) => {
        await hapus.mutateAsync(id);
        await segarkan();
      }}
      onLanjut={(ya) => {
        onPilihResep(ya);
        umum.onLanjut();
      }}
    />
  );
}

export function LangkahProdukTersambung({
  adaResep,
  ...umum
}: PropsTersambung & { adaResep: boolean | null }) {
  const produk = useDaftarProduk();
  const kategori = useDaftarKategori();
  const bahan = useDaftarBahanBaku();
  const simpan = useSimpanProduk();
  const hapus = useHapusProduk();
  const segarkan = useSegarkanSetup();
  if (produk.isLoading || kategori.isLoading || bahan.isLoading)
    return <Memuat />;
  const daftarKategori = kategori.data ?? [];
  const daftarBahan = bahan.data ?? [];
  return (
    <LangkahProduk
      {...umum}
      kategori={daftarKategori}
      bahan={daftarBahan}
      // Tanpa pilihan di sesi ini (wizard dibuka ulang), resep ditawarkan bila bahan baku sudah ada.
      adaResep={(adaResep ?? daftarBahan.length > 0) && daftarBahan.length > 0}
      butir={(produk.data ?? []).map((p) => butirProduk(p, daftarKategori))}
      onTambah={async (n) => {
        await simpan.mutateAsync({ data: payloadProdukSetup(n) });
        await segarkan();
      }}
      onHapus={async (id) => {
        await hapus.mutateAsync(id);
        await segarkan();
      }}
    />
  );
}

/**
 * Pajak: langkah daftar (keputusan pemilik proyek, 5 November 2026). Pajak
 * pertama langsung melanjutkan; sesudahnya pajak tersimpan tampil dan
 * dapat ditambah.
 */
export function LangkahPajakTersambung(umum: PropsTersambung) {
  const daftar = useDaftarPajak();
  const buat = useBuatPajak();
  const segarkan = useSegarkanSetup();
  if (daftar.isLoading) return <Memuat />;
  const pajak = daftar.data ?? [];
  return (
    <LangkahPajak
      {...umum}
      awal={null}
      tersimpan={pajak.map((p) => ({
        id: p.id,
        label: p.namaPajak,
        keterangan: `${p.tarifPajak}%, ${p.statusPajak ? "aktif" : "nonaktif"}`,
      }))}
      adaAktif={pajak.some((p) => p.statusPajak)}
      onSelesai={umum.onLanjut}
      onLanjut={async (nilai) => {
        await buat.mutateAsync(payloadBuatPajak(nilai));
        await segarkan();
        if (pajak.length === 0) umum.onLanjut();
      }}
    />
  );
}

/**
 * Sesi booking: tipe aset, aset, dan tarif pertama dalam satu isian. Tipe
 * aset dan aset bernama sama yang sudah ada dipakai ulang, agar mengulang
 * simpan setelah gagal di tengah tidak membuat data kembar.
 */
export function LangkahBookingTersambung({
  selesai,
  onLewati,
  ...umum
}: PropsTersambung & { selesai: boolean; onLewati: () => void }) {
  const tipe = useDaftarTipeAset();
  const aset = useDaftarAset();
  const tarif = useDaftarTarif();
  const simpanTipe = useSimpanTipeAset();
  const simpanAset = useSimpanAset();
  const simpanTarif = useSimpanTarif();
  const segarkan = useSegarkanSetup();
  if (tipe.isLoading || aset.isLoading || tarif.isLoading) return <Memuat />;
  if (selesai) {
    return (
      <LangkahTersimpan
        {...umum}
        judul="Sesi booking"
        baris={[
          {
            label: "Tipe aset",
            nilai: (tipe.data ?? []).map((t) => t.namaTipeAset).join(", "),
          },
          {
            label: "Aset",
            nilai: (aset.data ?? []).map((a) => a.namaAset).join(", "),
          },
          {
            label: "Tarif",
            nilai: (tarif.data ?? []).map((t) => t.namaTarif).join(", "),
          },
        ]}
        catatan="Aset dan tarif dapat diubah atau ditambah nanti dari halaman Aset dan Tarif di menu Sesi Booking & Reservasi."
      />
    );
  }
  return (
    <LangkahBooking
      {...umum}
      awal={null}
      onLewati={onLewati}
      onLanjut={async (n) => {
        const tipeAda = (tipe.data ?? []).find((t) =>
          sama(t.namaTipeAset, n.namaTipeAset),
        );
        const tipeAsetID =
          tipeAda?.id ??
          (
            await simpanTipe.mutateAsync({
              data: { namaTipeAset: n.namaTipeAset.trim() },
            })
          ).id;
        const asetAda = (aset.data ?? []).find((a) =>
          sama(a.namaAset, n.namaAset),
        );
        if (!asetAda)
          await simpanAset.mutateAsync({
            data: { namaAset: n.namaAset.trim(), tipeAsetID },
          });
        await simpanTarif.mutateAsync({
          data: payloadTarifSetup(n, tipeAsetID),
        });
        await segarkan();
        umum.onLanjut();
      }}
    />
  );
}

/** Layar selesai dengan ringkasan dari server. */
export function SelesaiTersambung({
  plan,
  dilewati,
}: {
  plan: KunciPlan;
  dilewati: string[];
}) {
  const lokasi = useDaftarLokasi();
  const kategori = useDaftarKategori();
  const produk = useDaftarProduk();
  const bahan = useDaftarBahanBaku();
  const pajak = useDaftarPajak();
  const aset = useDaftarAset();
  const tarif = useDaftarTarif();
  const pajakAktif = (pajak.data ?? []).find((p) => p.statusPajak);
  const asetPertama = aset.data?.[0];
  const tarifPertama = tarif.data?.[0];
  return (
    <LangkahSelesai
      plan={plan}
      ringkasan={{
        outlet: lokasiBertipe(lokasi.data, "Outlet")?.nama ?? null,
        kategori: kategori.data?.length ?? 0,
        produk: produk.data?.length ?? 0,
        bahan: bahan.data?.length ?? 0,
        pajak: pajakAktif
          ? `${pajakAktif.namaPajak} ${pajakAktif.tarifPajak}%`
          : null,
        booking:
          asetPertama && tarifPertama
            ? `${asetPertama.namaAset}, tarif ${tarifPertama.namaTarif}`
            : null,
        gudang: lokasiBertipe(lokasi.data, "Gudang")?.nama ?? null,
        dilewati,
      }}
    />
  );
}
