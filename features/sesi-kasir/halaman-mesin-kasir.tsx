"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";
import { useSession } from "@/lib/auth/useSession";
import type { PerangkatKasir, SesiKasir } from "@/types/sesiKasir";
import type { StatusMuat } from "./bagian-kasir-buka";
import { DialogBerhenti } from "./dialog-berhenti";
import { DialogMesinKasir, type ModeDialogMesin } from "./dialog-mesin-kasir";
import { DialogTutupKasir } from "./dialog-tutup-kasir";
import { filterAwalRiwayat, teksRentangRiwayat, type NilaiFilterRiwayat } from "./filter";
import {
  useAdaSesiKasir,
  useDaftarMesinKasir,
  useHapusMesinKasir,
  useKasirBuka,
  usePerangkatToko,
  useRiwayatSesi,
  useSesiTerakhir,
  useSimpanMesinKasir,
  useTutupSesiKasir,
} from "./hooks";
import { bolehKelolaMesinKasir } from "./izin";
import { pesanHapusMesin, pesanSimpanMesin, pesanTutupKasir } from "./pesan";
import { FilterRiwayat } from "./riwayat-sesi";
import { SusunanMesinKasir } from "./susunan-mesin-kasir";
import { labelLaci, namaMesin, pilihanLaci, pilihanPerangkat } from "./tampilan";

export const URL_MESIN_KASIR = "/dashboard/outlet/keuangan/mesinKasir";
export const urlRincianSesi = (id: string) => `${URL_MESIN_KASIR}/${encodeURIComponent(id)}`;
const URL_BUAT_AKUN_KAS = "/dashboard/outlet/keuangan/akunkas/buatAkunKas";

const statusMuat = (q: { isLoading: boolean; isError: boolean }): StatusMuat =>
  q.isLoading ? "memuat" : q.isError ? "gagal" : "siap";

/**
 * Dialog tutup kasir dari web beserta pesannya, dipakai halaman Mesin Kasir
 * dan rincian sesi. Pesan catatan wajib dan kegagalan lain tampil di dialog,
 * tanpa angka sistem (hitung buta).
 */
export function useDialogTutupKasir() {
  const [sesi, setSesi] = useState<SesiKasir | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const tutup = useTutupSesiKasir({
    onSuccess: () => {
      setSesi(null);
      toast.success("Kasir ditutup");
    },
    onError: (err) => setPesan(pesanTutupKasir(err)),
  });
  return {
    sesi,
    pesan,
    menutup: tutup.isPending,
    buka: (s: SesiKasir) => {
      setPesan(null);
      setSesi(s);
    },
    batal: () => setSesi(null),
    kirim: (payload: { nominal: number; catatan?: string }) => {
      if (!sesi) return;
      setPesan(null);
      tutup.mutate({ id: sesi.id, payload });
    },
  };
}

/** Halaman Mesin Kasir, tab kelima Keuangan (B227; modul/keuangan.md, MK1a sampai MK9). */
export function HalamanMesinKasir() {
  const sekarang = useJamBerjalan();
  const { permissions } = useSession();
  const bolehKelola = bolehKelolaMesinKasir(permissions);

  const kasirBuka = useKasirBuka();
  const mesin = useDaftarMesinKasir(bolehKelola);
  const akunKas = useDaftarAkunKas({ enabled: bolehKelola });
  const daftarMesin = mesin.data;
  const sesiTerakhir = useSesiTerakhir(bolehKelola ? daftarMesin : undefined);
  const perangkat = usePerangkatToko(bolehKelola);
  const tanpaMesin = bolehKelola && mesin.isSuccess && mesin.data.length === 0;
  const adaSesi = useAdaSesiKasir(tanpaMesin);

  const [filter, setFilter] = useState<NilaiFilterRiwayat>(() => filterAwalRiwayat(new Date()));
  const riwayat = useRiwayatSesi(filter);
  const sesiRiwayat = useMemo(() => riwayat.data?.pages.flatMap((h) => h.data) ?? [], [riwayat.data]);

  const [modeMesin, setModeMesin] = useState<ModeDialogMesin | null>(null);
  const [berhenti, setBerhenti] = useState<PerangkatKasir | null>(null);
  const dialogTutup = useDialogTutupKasir();

  const simpan = useSimpanMesinKasir({
    onSuccess: () => {
      setModeMesin(null);
      toast.success("Mesin kasir disimpan");
    },
    onError: (err) => toast.error(pesanSimpanMesin(err)),
  });
  const hapus = useHapusMesinKasir({
    onSuccess: () => {
      setBerhenti(null);
      toast.success("Mesin kasir dilepas");
    },
    onError: (err) => toast.error(pesanHapusMesin(err)),
  });

  const sesiBuka = kasirBuka.data ?? [];
  const mesinSiap = daftarMesin ?? [];
  const mesinUbah = modeMesin?.jenis === "ubah" ? modeMesin.mesin : undefined;
  const pilihanMesinFilter =
    bolehKelola && daftarMesin
      ? daftarMesin.map((m) => ({ installationId: m.installationId, nama: m.namaPerangkat }))
      : undefined;

  return (
    <>
      <SusunanMesinKasir
        sekarang={sekarang}
        bolehKelola={bolehKelola}
        belumPernahAdaSesi={adaSesi.data === false}
        kasirBuka={{ status: statusMuat(kasirBuka), sesi: sesiBuka, onCobaLagi: () => kasirBuka.refetch() }}
        mesin={{ status: statusMuat(mesin), daftar: mesinSiap, onCobaLagi: () => mesin.refetch() }}
        akunKas={akunKas.data}
        sesiTerakhir={sesiTerakhir}
        riwayat={{
          status: statusMuat(riwayat),
          sesi: sesiRiwayat,
          filter: <FilterRiwayat nilai={filter} onUbah={setFilter} pilihanMesin={pilihanMesinFilter} />,
          teksRentang: teksRentangRiwayat(filter),
          onResetFilter: () => setFilter(filterAwalRiwayat(new Date())),
          onCobaLagi: () => riwayat.refetch(),
          adaBerikutnya: Boolean(riwayat.hasNextPage),
          memuatBerikutnya: riwayat.isFetchingNextPage,
          onMuatBerikutnya: () => riwayat.fetchNextPage(),
        }}
        hrefRincian={(s) => urlRincianSesi(s.id)}
        onTambah={() => setModeMesin({ jenis: "tambah" })}
        onUbah={(m) =>
          setModeMesin({
            jenis: "ubah",
            mesin: m,
            kasirBuka: sesiBuka.some((s) => s.installationId === m.installationId),
            namaAlat: perangkat.daftar.find((p) => p.installationId === m.installationId)?.deviceName ?? null,
          })
        }
        onBerhenti={setBerhenti}
        onTutup={dialogTutup.buka}
      />

      {bolehKelola && (
        <>
          <DialogMesinKasir
            buka={modeMesin !== null}
            onBukaChange={(b) => !b && setModeMesin(null)}
            mode={modeMesin ?? { jenis: "tambah" }}
            perangkat={pilihanPerangkat(perangkat.daftar, mesinSiap)}
            laci={pilihanLaci(akunKas.data ?? [], mesinSiap, mesinUbah?.installationId)}
            sekarang={sekarang}
            menyimpan={simpan.isPending}
            hrefBuatAkunKas={URL_BUAT_AKUN_KAS}
            onSimpan={(payload) => simpan.mutate(payload)}
          />

          <DialogBerhenti
            namaMesin={berhenti?.namaPerangkat ?? ""}
            laci={berhenti ? labelLaci(berhenti, akunKas.data) : ""}
            buka={berhenti !== null}
            onBukaChange={(b) => !b && setBerhenti(null)}
            memproses={hapus.isPending}
            onBerhenti={() => berhenti && hapus.mutate(berhenti.id)}
          />

          <DialogTutupKasir
            namaMesin={dialogTutup.sesi ? namaMesin(dialogTutup.sesi.installationId, daftarMesin) : ""}
            laci={dialogTutup.sesi?.akunKas?.namaAkun ?? ""}
            buka={dialogTutup.sesi !== null}
            onBukaChange={(b) => !b && dialogTutup.batal()}
            menutup={dialogTutup.menutup}
            pesan={dialogTutup.pesan}
            onTutup={dialogTutup.kirim}
          />
        </>
      )}
    </>
  );
}
