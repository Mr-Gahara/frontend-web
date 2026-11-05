"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { pesanError } from "@/lib/api/error";
import { tujuanGuardSetup } from "@/lib/auth/tujuan";
import { useSession } from "@/lib/auth/useSession";
import { KerangkaSetup } from "./kerangka-setup";
import { useBuatToko, useDaftarOwner, useNamaToko, useStatusSetup } from "./hooks";
import { LangkahNamaToko, LangkahOwner } from "./langkah-akun";
import {
  LangkahBahanTersambung,
  LangkahBookingTersambung,
  LangkahKategoriTersambung,
  LangkahLokasiTersambung,
  LangkahPajakTersambung,
  LangkahProdukTersambung,
  SelesaiTersambung,
} from "./langkah-tersambung";
import { LangkahTersimpan } from "./langkah-tersimpan";
import {
  indeksAwal,
  langkahDariStatus,
  ownerTerdaftar,
  planSetup,
  selesaiPerLangkah,
  setupTuntas,
  type StatusSetup,
} from "./status";

/**
 * Wizard setup toko (modul/setup-akun.md, desain F, B219 sampai B223).
 * Status dan plan dibaca dari GET /api/setup/status; wizard dibuka di
 * langkah pertama yang belum selesai, dan setiap langkah langsung tersimpan
 * di server (keputusan pemilik proyek, 5 November 2026).
 */
export function HalamanSetup() {
  const router = useRouter();
  const sesi = useSession();
  const aktif = sesi.status !== "memuat" && sesi.adaTokenAkun && !sesi.adalahAdmin;
  const status = useStatusSetup(aktif);
  // Setelah bertindak di wizard, setup yang menjadi tuntas tidak lagi
  // mengalihkan ke dashboard, agar layar selesai tetap tampil.
  const [bertindak, setBertindak] = useState(false);
  const data = status.data;
  const tujuan = tujuanGuardSetup(
    { status: sesi.status, adaTokenAkun: sesi.adaTokenAkun, adalahAdmin: sesi.adalahAdmin },
    data ? { tuntas: !bertindak && setupTuntas(data), ownerTerdaftar: ownerTerdaftar(data) } : null,
  );

  useEffect(() => {
    if (tujuan) router.replace(tujuan);
  }, [tujuan, router]);

  if (status.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-permukaan p-6 text-navy">
        <p role="alert" className="text-sm font-medium text-destructive">
          {pesanError(status.error, "Gagal memuat status setup toko.")}
        </p>
        <button type="button" onClick={() => status.refetch()} className="text-sm font-semibold underline">
          Coba lagi
        </button>
      </div>
    );
  }
  if (!data || tujuan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-permukaan text-sm text-muted-foreground">
        Memuat setup toko...
      </div>
    );
  }
  return <WizardSetup status={data} onBertindak={() => setBertindak(true)} />;
}

const PESAN_FITUR = { booking: "sesi booking", gudang: "gudang" } as const;

/**
 * Isi wizard. Dipasang setelah status pertama termuat, sehingga langkah
 * awal dihitung sekali; penyegaran status sesudahnya hanya mengubah daftar
 * periksa, tidak memindahkan langkah.
 */
function WizardSetup({ status, onBertindak }: { status: StatusSetup; onBertindak: () => void }) {
  const plan = planSetup(status);
  const langkah = langkahDariStatus(status);
  const selesai = selesaiPerLangkah(status);
  const [indeks, setIndeks] = useState(() => indeksAwal(status));
  const [adaResep, setAdaResep] = useState<boolean | null>(null);
  const [dilewati, setDilewati] = useState<string[]>([]);
  const namaToko = useNamaToko(status.adaToko);
  const buatToko = useBuatToko();
  const daftarOwner = useDaftarOwner();

  const pindah = (ke: number) => {
    setIndeks(ke);
    window.scrollTo({ top: 0 });
  };
  const maju = () => {
    onBertindak();
    pindah(indeks + 1);
  };
  const lewati = (fitur: keyof typeof PESAN_FITUR) => {
    setDilewati((d) => (d.includes(PESAN_FITUR[fitur]) ? d : [...d, PESAN_FITUR[fitur]]));
    maju();
  };
  const umum = {
    nomor: indeks + 1,
    total: langkah.length,
    teksLanjut: indeks === langkah.length - 1 ? "Simpan dan selesaikan" : "Simpan dan lanjut",
    onKembali: indeks > 0 ? () => pindah(indeks - 1) : undefined,
    onLanjut: maju,
  };
  const kunci = langkah[indeks]?.kunci;

  let isi: ReactNode;
  switch (kunci) {
    case "toko":
      isi = selesai.toko ? (
        <LangkahTersimpan
          {...umum}
          judul="Nama toko"
          baris={[{ label: "Nama toko", nilai: namaToko.data || "-" }]}
          catatan="Nama toko dapat diubah nanti dari Profil Toko."
        />
      ) : (
        <LangkahNamaToko
          {...umum}
          awal={{ namaToko: "" }}
          onLanjut={async ({ namaToko: nama }) => {
            await buatToko.mutateAsync(nama.trim());
            maju();
          }}
        />
      );
      break;
    case "owner":
      isi = selesai.owner ? (
        <LangkahTersimpan
          {...umum}
          judul="Owner toko"
          baris={[{ label: "Owner", nilai: "Sudah terdaftar, masuk dengan nama dan PIN" }]}
          catatan="Nama dan PIN Owner dapat diubah nanti dari menu Pengguna."
        />
      ) : (
        <LangkahOwner
          {...umum}
          awal={{ nama: "", pin: "", ulangiPin: "" }}
          onLanjut={async ({ nama, pin }) => {
            await daftarOwner.mutateAsync({ nama: nama.trim(), pin });
            maju();
          }}
        />
      );
      break;
    case "lokasi":
      isi = <LangkahLokasiTersambung key="outlet" jenis="outlet" {...umum} />;
      break;
    case "kategori":
      isi = <LangkahKategoriTersambung {...umum} />;
      break;
    case "bahanBaku":
      isi = <LangkahBahanTersambung {...umum} adaResep={adaResep} onPilihResep={setAdaResep} />;
      break;
    case "produk":
      isi = <LangkahProdukTersambung {...umum} adaResep={adaResep} />;
      break;
    case "pajak":
      isi = <LangkahPajakTersambung {...umum} />;
      break;
    case "booking":
      isi = <LangkahBookingTersambung {...umum} selesai={selesai.booking} onLewati={() => lewati("booking")} />;
      break;
    case "gudang":
      isi = (
        <LangkahLokasiTersambung key="gudang" jenis="gudang" {...umum} onLewati={() => lewati("gudang")} />
      );
      break;
    default:
      isi = <SelesaiTersambung plan={plan} dilewati={dilewati} />;
  }

  return (
    <KerangkaSetup
      plan={plan}
      langkah={langkah}
      indeksAktif={indeks}
      selesaiLangkah={selesai}
      namaToko={namaToko.data ?? ""}
    >
      {isi}
    </KerangkaSetup>
  );
}
