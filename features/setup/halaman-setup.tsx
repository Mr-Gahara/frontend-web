"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { NILAI_AWAL_LOKASI } from "@/features/inventaris/schema-lokasi";
import { KerangkaSetup } from "./kerangka-setup";
import { LangkahNamaToko, LangkahOwner } from "./langkah-akun";
import { LangkahLokasi } from "./langkah-lokasi";
import { LangkahBahanBaku, LangkahKategori, LangkahProduk } from "./langkah-menu";
import { LangkahBooking } from "./langkah-booking";
import { LangkahPajak } from "./langkah-pajak";
import { LangkahSelesai } from "./langkah-selesai";
import { bacaPlan, daftarLangkah } from "./langkah";
import type { DataSetup } from "./schema";

const DATA_AWAL: DataSetup = {
  toko: { namaToko: "" },
  owner: { nama: "", pin: "", ulangiPin: "" },
  lokasi: NILAI_AWAL_LOKASI,
  kategori: [],
  adaResep: true,
  bahan: [],
  produk: [],
  pajak: null,
  booking: null,
  gudang: NILAI_AWAL_LOKASI,
};

/**
 * Wizard setup toko (modul/setup-akun.md, desain F). Pratinjau tampilan:
 * isian disimpan di state halaman, belum ke backend. Penyimpanan, status
 * setup (Y1), dan plan dari backend (N1) disambungkan kemudian; selama itu
 * plan dibaca dari ?plan= dan rute ini belum ditautkan dari halaman lain.
 */
export function HalamanSetup() {
  const plan = bacaPlan(useSearchParams().get("plan"));
  const langkah = daftarLangkah(plan);
  const [indeks, setIndeks] = useState(0);
  const [data, setData] = useState<DataSetup>(DATA_AWAL);

  const maju = (ubah: Partial<DataSetup>) => {
    setData((d) => ({ ...d, ...ubah }));
    setIndeks((i) => i + 1);
    window.scrollTo({ top: 0 });
  };
  const umum = {
    nomor: indeks + 1,
    total: langkah.length,
    teksLanjut: indeks === langkah.length - 1 ? "Simpan dan selesaikan" : "Simpan dan lanjut",
    onKembali: indeks > 0 ? () => setIndeks((i) => i - 1) : undefined,
  };

  let isi: ReactNode;
  switch (langkah[indeks]?.kunci) {
    case "toko":
      isi = <LangkahNamaToko {...umum} awal={data.toko} onLanjut={(toko) => maju({ toko })} />;
      break;
    case "owner":
      isi = <LangkahOwner {...umum} awal={data.owner} onLanjut={(owner) => maju({ owner })} />;
      break;
    case "lokasi":
      isi = (
        <LangkahLokasi key="outlet" jenis="outlet" {...umum} awal={data.lokasi} onLanjut={(lokasi) => maju({ lokasi })} />
      );
      break;
    case "kategori":
      isi = <LangkahKategori {...umum} awal={data.kategori} onLanjut={(kategori) => maju({ kategori })} />;
      break;
    case "bahanBaku":
      isi = (
        <LangkahBahanBaku
          {...umum}
          awal={{ adaResep: data.adaResep, bahan: data.bahan }}
          onLanjut={(nilai) => maju(nilai)}
        />
      );
      break;
    case "produk":
      isi = (
        <LangkahProduk
          {...umum}
          awal={data.produk}
          kategori={data.kategori}
          bahan={data.bahan}
          adaResep={data.adaResep}
          onLanjut={(produk) => maju({ produk })}
        />
      );
      break;
    case "pajak":
      isi = <LangkahPajak {...umum} awal={data.pajak} onLanjut={(pajak) => maju({ pajak })} />;
      break;
    case "booking":
      isi = <LangkahBooking {...umum} awal={data.booking} onLanjut={(booking) => maju({ booking })} />;
      break;
    case "gudang":
      isi = (
        <LangkahLokasi key="gudang" jenis="gudang" {...umum} awal={data.gudang} onLanjut={(gudang) => maju({ gudang })} />
      );
      break;
    default:
      isi = <LangkahSelesai data={data} plan={plan} />;
  }

  return (
    <KerangkaSetup
      plan={plan}
      langkah={langkah}
      indeksAktif={indeks}
      namaToko={data.toko.namaToko}
      namaOwner={data.owner.nama}
    >
      {isi}
    </KerangkaSetup>
  );
}