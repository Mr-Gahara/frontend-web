"use client";

import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { isNotFound, pesanError } from "@/lib/api/error";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import {
  useBuatMetodePembayaran,
  useDaftarMetodePembayaran,
  useMetodePembayaran,
  usePerbaruiMetodePembayaran,
} from "./hooks";
import { FormMetodePembayaran, KepalaFormMetode, MemuatMetode, PesanMetode, URL_DAFTAR_METODE } from "./form-metode-pembayaran";
import { NILAI_AWAL_METODE, nilaiAwalMetode, payloadBuatMetode, payloadUbahMetode } from "./payload";
import { masihDalamBatas } from "./tampilan";

const KELAS_HALAMAN = "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8";

/**
 * Halaman buat. Form dipasang setelah akun kas dan daftar metode termuat,
 * karena pilihan akun dan batas metode aktif diturunkan dari keduanya
 * (keputusan rancangan butir 8, PO3a). Mutation memakai mutate dengan
 * callback, sehingga penolakan backend tampil di form tanpa unhandled
 * rejection seperti halaman lama.
 */
export function HalamanBuatMetodePembayaran() {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const akun = useDaftarAkunKas();
  const daftar = useDaftarMetodePembayaran({ semua: true });
  const buat = useBuatMetodePembayaran({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Metode pembayaran baru telah ditambahkan." });
      router.push(URL_DAFTAR_METODE);
    },
    onError: (err) => setGalat(pesanError(err, "Gagal menyimpan metode pembayaran.")),
  });

  let isi: ReactNode;
  if (akun.isError || daftar.isError) {
    isi = (
      <PesanMetode
        judul="Gagal memuat data"
        pesan={pesanError(akun.error ?? daftar.error, "Akun kas atau metode pembayaran gagal dimuat.")}
        onCobaLagi={() => {
          void akun.refetch();
          void daftar.refetch();
        }}
      />
    );
  } else if (!akun.data || !daftar.data) {
    isi = <MemuatMetode teks="Memuat akun kas..." />;
  } else {
    const bolehAktif = masihDalamBatas(daftar.data);
    isi = (
      <FormMetodePembayaran
        nilaiAwal={{ ...NILAI_AWAL_METODE, isActive: bolehAktif }}
        akunKas={akun.data}
        bolehAktif={bolehAktif}
        sedangMenyimpan={buat.isPending}
        galat={galat}
        onSimpan={(n) => {
          setGalat("");
          buat.mutate(payloadBuatMetode(n));
        }}
      />
    );
  }

  return (
    <div className={KELAS_HALAMAN}>
      <KepalaFormMetode judul="Tambah Metode Pembayaran" keterangan="Buat saluran pembayaran baru untuk sistem kasir POS Anda." />
      {isi}
    </div>
  );
}

/**
 * Halaman ubah. Detail dimuat ulang setiap halaman dibuka, dan form dipasang
 * setelah pemuatan itu selesai, dengan key id dan updatedAt (butir 8).
 * Detail yang tidak ditemukan atau gagal dimuat menampilkan pesan, bukan
 * loader tanpa akhir seperti halaman lama.
 */
export function HalamanUbahMetodePembayaran() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [galat, setGalat] = useState("");
  const detail = useMetodePembayaran(id);
  const akun = useDaftarAkunKas();
  const daftar = useDaftarMetodePembayaran({ semua: true });
  const perbarui = usePerbaruiMetodePembayaran({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Metode pembayaran telah diperbarui." });
      router.push(URL_DAFTAR_METODE);
    },
    onError: (err) => setGalat(pesanError(err, "Gagal memperbarui metode pembayaran.")),
  });

  const m = detail.data;
  let isi: ReactNode;
  if (isNotFound(detail.error)) {
    isi = <PesanMetode judul="Metode pembayaran tidak ditemukan" pesan="Metode ini tidak ada atau bukan milik toko Anda." />;
  } else if (detail.isError || akun.isError || daftar.isError) {
    isi = (
      <PesanMetode
        judul="Gagal memuat data"
        pesan={pesanError(detail.error ?? akun.error ?? daftar.error, "Detail metode pembayaran gagal dimuat.")}
        onCobaLagi={() => {
          void detail.refetch();
          void akun.refetch();
          void daftar.refetch();
        }}
      />
    );
  } else if (!m || !detail.isFetchedAfterMount || !akun.data || !daftar.data) {
    isi = <MemuatMetode teks="Memuat detail metode pembayaran..." />;
  } else {
    isi = (
      <FormMetodePembayaran
        key={`${m.id}-${m.updatedAt}`}
        nilaiAwal={nilaiAwalMetode(m)}
        asal={m}
        akunKas={akun.data}
        bolehAktif={m.isActive || masihDalamBatas(daftar.data)}
        sedangMenyimpan={perbarui.isPending}
        galat={galat}
        onSimpan={(n) => {
          setGalat("");
          perbarui.mutate({ id: m.id, payload: payloadUbahMetode(n, m) });
        }}
      />
    );
  }

  return (
    <div className={KELAS_HALAMAN}>
      <KepalaFormMetode judul="Edit Metode Pembayaran" keterangan="Perbarui informasi atau ubah status saluran pembayaran POS Anda." />
      {isi}
    </div>
  );
}