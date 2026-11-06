"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";
import { cn } from "@/lib/utils";
import type { PerangkatKasir, SesiKasir } from "@/types/sesiKasir";
import { buatDataContoh } from "./data-contoh";
import { DialogBerhenti } from "./dialog-berhenti";
import { DialogMesinKasir, type ModeDialogMesin } from "./dialog-mesin-kasir";
import { DialogTutupKasir } from "./dialog-tutup-kasir";
import { HalamanMesinKasir } from "./halaman-mesin-kasir";
import { RincianSesi } from "./rincian-sesi";
import { FilterRiwayat, SEMUA_MESIN, type NilaiFilterRiwayat } from "./riwayat-sesi";
import { labelLaci, namaMesin, pilihanLaci, pilihanPerangkat } from "./tampilan";

/**
 * Pratinjau development Mesin Kasir (pemilik proyek, 6 November 2026):
 * seluruh keadaan Revisi 1 dan Revisi 2 dengan data contoh, tanpa API.
 * Rute pemakainya memanggil notFound() di produksi.
 */

export const URL_PRATINJAU = "/dashboard/outlet/keuangan/pratinjauMesinKasir";
const URL_BUAT_AKUN_KAS = "/dashboard/outlet/keuangan/akunkas/buatAkunKas";
const UKURAN_HALAMAN = 4;
const PESAN_CATATAN_WAJIB = "Hitungan berbeda dengan catatan sistem. Tulis catatan penyebabnya, lalu tutup lagi.";

const KEADAAN = [
  { kunci: "normal", label: "Normal" },
  { kunci: "semua-tutup", label: "Semua kasir tutup" },
  { kunci: "riwayat-kosong", label: "Riwayat kosong" },
  { kunci: "memuat", label: "Memuat" },
  { kunci: "gagal", label: "Gagal dimuat" },
  { kunci: "tanpa-izin", label: "Tanpa izin kelola" },
  { kunci: "awal", label: "Belum ada mesin kasir" },
] as const;
type Keadaan = (typeof KEADAAN)[number]["kunci"];

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

const hrefRincian = (sesi: SesiKasir) => `${URL_PRATINJAU}/rincian?sesi=${encodeURIComponent(sesi.id)}`;

function filterAwal(sekarang: Date): NilaiFilterRiwayat {
  const dari = new Date(sekarang);
  dari.setDate(dari.getDate() - 6);
  return { mesin: SEMUA_MESIN, dari, sampai: new Date(sekarang) };
}

function SpandukPratinjau({ keadaan, onKeadaan }: { keadaan?: Keadaan; onKeadaan?: (k: Keadaan) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-karamel bg-white/70 p-4">
      <p className="text-sm font-semibold text-navy">
        Pratinjau development dengan data contoh. Tidak ada yang tersimpan, dan halaman ini tidak ada di produksi.
      </p>
      {onKeadaan && (
        <div role="group" aria-label="Keadaan pratinjau" className="flex flex-wrap gap-2">
          {KEADAAN.map((k) => (
            <Button
              key={k.kunci}
              type="button"
              variant="outline"
              aria-pressed={keadaan === k.kunci}
              onClick={() => onKeadaan(k.kunci)}
              className={cn(
                "h-10 rounded-full border-navy/15 px-3.5 text-sm font-semibold",
                keadaan === k.kunci ? "bg-navy text-gading hover:bg-navy/90 hover:text-gading" : "bg-white text-navy",
              )}
            >
              {k.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function useDialogContoh(saldoSistemTutup: number) {
  const [modeMesin, setModeMesin] = useState<ModeDialogMesin | null>(null);
  const [berhenti, setBerhenti] = useState<PerangkatKasir | null>(null);
  const [tutup, setTutup] = useState<SesiKasir | null>(null);
  const [pesanTutup, setPesanTutup] = useState<string | null>(null);

  const simpanContoh = (teks: string) => {
    toast.success(`${teks} (pratinjau, tidak disimpan)`);
  };

  return {
    modeMesin,
    setModeMesin,
    berhenti,
    setBerhenti,
    tutup,
    pesanTutup,
    bukaTutup: (sesi: SesiKasir) => {
      setPesanTutup(null);
      setTutup(sesi);
    },
    tutupDialogTutup: () => setTutup(null),
    simpanContoh,
    /** Simulasi backend: hitungan yang berbeda dari saldo sistem tanpa catatan dijawab catatan wajib. */
    tutupContoh: (nominal: number, catatan?: string) => {
      if (nominal !== saldoSistemTutup && !catatan) {
        setPesanTutup(PESAN_CATATAN_WAJIB);
        return;
      }
      setTutup(null);
      simpanContoh("Kasir ditutup");
    },
  };
}

export function PratinjauMesinKasir() {
  const sekarang = useJamBerjalan();
  const data = useMemo(() => buatDataContoh(new Date()), []);
  const [keadaan, setKeadaan] = useState<Keadaan>("normal");
  const [filter, setFilter] = useState<NilaiFilterRiwayat>(() => filterAwal(new Date()));
  const [tampil, setTampil] = useState(UKURAN_HALAMAN);
  const dialog = useDialogContoh(data.saldoSistemTutup);

  const status = keadaan === "memuat" ? "memuat" : keadaan === "gagal" ? "gagal" : "siap";
  const bolehKelola = keadaan !== "tanpa-izin";
  const daftarMesin = keadaan === "awal" ? [] : data.mesin;
  const sesiBuka =
    keadaan === "semua-tutup" || keadaan === "awal" ? [] : data.sesi.filter((s) => s.status === "BUKA");

  const riwayatTersaring = useMemo(() => {
    if (keadaan === "riwayat-kosong" || keadaan === "awal") return [];
    const batasDari = filter.dari ? new Date(filter.dari).setHours(0, 0, 0, 0) : -Infinity;
    const batasSampai = filter.sampai ? new Date(filter.sampai).setHours(23, 59, 59, 999) : Infinity;
    return data.sesi.filter((s) => {
      const t = new Date(s.dibukaPada).getTime();
      return (
        s.status === "TUTUP" &&
        t >= batasDari &&
        t <= batasSampai &&
        (filter.mesin === SEMUA_MESIN || s.installationId === filter.mesin)
      );
    });
  }, [data.sesi, filter, keadaan]);

  const sesiTerakhir = useMemo(() => {
    const hasil: Record<string, SesiKasir | null> = {};
    for (const m of data.mesin) hasil[m.installationId] = data.sesi.find((s) => s.installationId === m.installationId) ?? null;
    return hasil;
  }, [data]);

  const teksRentang =
    filter.dari && filter.sampai
      ? `${FORMAT_TANGGAL.format(filter.dari)} sampai ${FORMAT_TANGGAL.format(filter.sampai)}`
      : "rentang ini";

  const mesinUbah = dialog.modeMesin?.jenis === "ubah" ? dialog.modeMesin.mesin : undefined;

  return (
    <div className="flex flex-col gap-8">
      <SpandukPratinjau keadaan={keadaan} onKeadaan={setKeadaan} />

      <HalamanMesinKasir
        sekarang={sekarang}
        bolehKelola={bolehKelola}
        kasirBuka={{ status, sesi: sesiBuka, onCobaLagi: () => setKeadaan("normal") }}
        mesin={{ status, daftar: daftarMesin, onCobaLagi: () => setKeadaan("normal") }}
        akunKas={data.akunKas}
        sesiTerakhir={sesiTerakhir}
        riwayat={{
          status,
          sesi: riwayatTersaring.slice(0, tampil),
          filter: (
            <FilterRiwayat
              nilai={filter}
              onUbah={(nilai) => {
                setFilter(nilai);
                setTampil(UKURAN_HALAMAN);
              }}
              pilihanMesin={
                bolehKelola ? data.mesin.map((m) => ({ installationId: m.installationId, nama: m.namaPerangkat })) : undefined
              }
            />
          ),
          teksRentang,
          onResetFilter: () => setFilter(filterAwal(new Date())),
          onCobaLagi: () => setKeadaan("normal"),
          adaBerikutnya: riwayatTersaring.length > tampil,
          memuatBerikutnya: false,
          onMuatBerikutnya: () => setTampil((n) => n + UKURAN_HALAMAN),
        }}
        hrefRincian={hrefRincian}
        onTambah={() => dialog.setModeMesin({ jenis: "tambah" })}
        onUbah={(m) =>
          dialog.setModeMesin({
            jenis: "ubah",
            mesin: m,
            kasirBuka: sesiBuka.some((s) => s.installationId === m.installationId),
            namaAlat: data.perangkat.find((p) => p.installationId === m.installationId)?.deviceName ?? null,
          })
        }
        onBerhenti={dialog.setBerhenti}
        onTutup={dialog.bukaTutup}
      />

      <DialogMesinKasir
        buka={dialog.modeMesin !== null}
        onBukaChange={(b) => !b && dialog.setModeMesin(null)}
        mode={dialog.modeMesin ?? { jenis: "tambah" }}
        perangkat={pilihanPerangkat(data.perangkat, daftarMesin)}
        laci={pilihanLaci(data.akunKas, daftarMesin, mesinUbah?.installationId)}
        sekarang={sekarang}
        menyimpan={false}
        hrefBuatAkunKas={URL_BUAT_AKUN_KAS}
        onSimpan={() => {
          dialog.setModeMesin(null);
          dialog.simpanContoh("Mesin kasir disimpan");
        }}
      />

      <DialogBerhenti
        namaMesin={dialog.berhenti?.namaPerangkat ?? ""}
        laci={dialog.berhenti ? labelLaci(dialog.berhenti, data.akunKas) : ""}
        buka={dialog.berhenti !== null}
        onBukaChange={(b) => !b && dialog.setBerhenti(null)}
        memproses={false}
        onBerhenti={() => {
          dialog.setBerhenti(null);
          dialog.simpanContoh("Mesin kasir dilepas");
        }}
      />

      <DialogTutupKasir
        namaMesin={dialog.tutup ? namaMesin(dialog.tutup.installationId, bolehKelola ? data.mesin : undefined) : ""}
        laci={dialog.tutup?.akunKas?.namaAkun ?? ""}
        buka={dialog.tutup !== null}
        onBukaChange={(b) => !b && dialog.tutupDialogTutup()}
        menutup={false}
        pesan={dialog.pesanTutup}
        onTutup={({ nominal, catatan }) => dialog.tutupContoh(nominal, catatan)}
      />
    </div>
  );
}

/** Pratinjau rincian satu sesi contoh. */
export function PratinjauRincianSesi({ idSesi }: { idSesi: string | null }) {
  const data = useMemo(() => buatDataContoh(new Date()), []);
  const dialog = useDialogContoh(data.saldoSistemTutup);
  const sesi = data.sesi.find((s) => s.id === idSesi) ?? data.sesi[0];
  const mesin = data.mesin.find((m) => m.installationId === sesi.installationId);
  const nama = namaMesin(sesi.installationId, data.mesin);
  const laci = mesin ? labelLaci(mesin, data.akunKas) : (sesi.akunKas?.namaAkun ?? "-");

  return (
    <div className="flex flex-col gap-8">
      <SpandukPratinjau />
      <RincianSesi
        sesi={sesi}
        namaMesin={nama}
        laci={laci}
        hrefKembali={URL_PRATINJAU}
        bolehTutup
        onTutup={() => dialog.bukaTutup(sesi)}
      />
      <DialogTutupKasir
        namaMesin={nama}
        laci={sesi.akunKas?.namaAkun ?? "-"}
        buka={dialog.tutup !== null}
        onBukaChange={(b) => !b && dialog.tutupDialogTutup()}
        menutup={false}
        pesan={dialog.pesanTutup}
        onTutup={({ nominal, catatan }) => dialog.tutupContoh(nominal, catatan)}
      />
    </div>
  );
}