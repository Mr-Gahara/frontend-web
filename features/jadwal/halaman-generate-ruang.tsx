"use client";

/**
 * Halaman generate jadwal satu ruang (keputusan J5b dan JD13c): memuat
 * karyawan ruang, pola roster, dan shift, lalu menjalankan langkah 1
 * (parameter) dan langkah 2 (pratinjau dan simpan). Jadwal yang ditolak
 * backend ditampilkan dan halaman tetap di langkah 2 (J2a); bila tidak ada
 * yang ditolak, halaman kembali ke kalender ruang itu.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { StepSatuForm, type GenerateParams } from "./langkah-satu";
import { StepDuaPreview } from "./langkah-dua";
import { pesanDitolak } from "./hasil";
import { useGenerateJadwal } from "./hooks";
import { keKaryawanRuang } from "./pemetaan";
import type { EntriBulkJadwal, RuangJadwal } from "./tipe";
import { useDaftarPengguna } from "@/features/pengguna/hooks";
import { useDaftarPolaRoster } from "@/features/pola-roster/hooks";
import { useDaftarShift } from "@/features/shift/hooks";
import { pesanError } from "@/lib/api/error";

export function HalamanGenerateRuang({ ruang }: { ruang: RuangJadwal }) {
  const router = useRouter();
  const urlKalender = `/dashboard/${ruang}/jadwal`;
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [params, setParams] = useState<GenerateParams | undefined>();
  const [pesanSimpan, setPesanSimpan] = useState("");
  const karyawan = useDaftarPengguna(ruang);
  const pola = useDaftarPolaRoster(ruang);
  const shift = useDaftarShift(ruang);
  const generate = useGenerateJadwal();
  const karyawanList = keKaryawanRuang(karyawan.data ?? []);

  if (karyawan.isLoading || pola.memuat || shift.memuat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#041E3F] mb-4" />
        <p className="text-[#041E3F]/70 font-bold">
          Mempersiapkan mesin generator...
        </p>
      </div>
    );
  }

  if (karyawan.isError || pola.gagal || shift.gagal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div role="alert" className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="font-bold">
            Gagal mengambil data master dari server. Pastikan koneksi stabil.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-[#041E3F] text-[#FFFAF3] rounded-xl font-bold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const simpan = async (entri: EntriBulkJadwal[]) => {
    setPesanSimpan("");
    try {
      const hasil = await generate.mutateAsync(entri);
      const ditolak = pesanDitolak(hasil, (id) => karyawan.data?.find((k) => k.id === id)?.nama);
      if (ditolak) {
        setPesanSimpan(`${ditolak}. Jadwal lain yang tidak ditolak sudah tersimpan.`);
        return;
      }
      router.push(urlKalender);
    } catch (err) {
      setPesanSimpan(pesanError(err, "Gagal menyimpan jadwal ke server."));
    }
  };

  return (
    <div className="py-6 px-2 sm:px-6 w-full max-w-[95vw] mx-auto min-h-[85vh]">
      <button
        type="button"
        onClick={() => router.push(urlKalender)}
        className="flex items-center gap-2 text-[#041E3F]/60 hover:text-[#041E3F] font-bold text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali ke Kalender Jadwal
      </button>

      {pesanSimpan && langkah === 2 && (
        <div
          role="alert"
          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-6 max-w-6xl mx-auto"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{pesanSimpan}</p>
        </div>
      )}

      {langkah === 1 || !params ? (
        <StepSatuForm
          polaRosterList={pola.data}
          karyawanList={karyawanList}
          initialData={params}
          onNext={(nilai) => {
            setParams(nilai);
            setLangkah(2);
            setPesanSimpan("");
          }}
          onCancel={() => router.push(urlKalender)}
        />
      ) : (
        <StepDuaPreview
          params={params}
          polaRosterList={pola.data}
          shiftList={shift.data}
          karyawanList={karyawanList}
          onBack={() => {
            setLangkah(1);
            setPesanSimpan("");
          }}
          onSubmit={(entri) => void simpan(entri)}
          isPending={generate.isPending}
        />
      )}
    </div>
  );
}