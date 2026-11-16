"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pesanError } from "@/lib/api/error";
import {
  barisJamOperasional,
  dariJamOperasional,
  keJamOperasional,
  masalahJamBuka,
} from "@/features/setup/jam-buka";
import { IsianJamBuka } from "@/features/setup/langkah-jam-buka";
import type { Tenant } from "@/types/tenant";
import { usePerbaruiTenant } from "./hooks";

/**
 * Kartu Jam Buka di Profil Toko (JB8a, pemilik proyek 16 November 2026):
 * isian yang sama dengan langkah jam buka wizard, disimpan utuh ke
 * jamOperasional lewat PUT /tenant/:id (P81, B331). Halaman memasangnya
 * ulang lewat key berisi updatedAt, sehingga setelah simpan isian menampilkan
 * nilai tersimpan. Tanpa update-tenant hanya ringkasannya yang tampil.
 */
export function FormJamBuka({ tenant, bolehUbah }: { tenant: Tenant; bolehUbah: boolean }) {
  const awal = dariJamOperasional(tenant.jamOperasional);
  const [nilai, setNilai] = useState(awal);
  const [cek, setCek] = useState(false);
  const perbarui = usePerbaruiTenant({
    onSuccess: () => toast.success("Jam Buka Disimpan", { description: "Jam buka toko sudah tersimpan." }),
    onError: (err) =>
      toast.error("Gagal Menyimpan Jam Buka", { description: pesanError(err, "Periksa kembali jam buka.") }),
  });

  if (!bolehUbah) {
    const baris = tenant.jamOperasional ? barisJamOperasional(tenant.jamOperasional) : [];
    if (baris.length === 0) return <p className="text-isi text-muted-foreground">Jam buka belum diatur.</p>;
    return (
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-isi">
        {baris.map((b) => (
          <div key={b.label} className="contents">
            <dt className="font-semibold text-foreground">{b.label}</dt>
            <dd className="text-muted-foreground">{b.nilai}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const berubah = JSON.stringify(keJamOperasional(nilai)) !== JSON.stringify(tenant.jamOperasional);
  const masalah = cek ? masalahJamBuka(nilai) : null;
  const simpan = () => {
    setCek(true);
    if (masalahJamBuka(nilai) !== null) return;
    perbarui.mutate({ id: tenant.id, payload: { jamOperasional: keJamOperasional(nilai) } });
  };

  return (
    <div className="flex flex-col gap-5">
      <IsianJamBuka
        nilai={nilai}
        onUbah={setNilai}
        cek={cek}
        lanjutanLibur="Toko tercatat tutup setiap hari sampai jam bukanya diubah lagi di sini."
      />
      {masalah && (
        <p role="alert" className="text-isi font-medium text-destructive">
          {masalah}
        </p>
      )}
      <Button type="button" onClick={simpan} disabled={!berubah || perbarui.isPending} className="w-full gap-2">
        {perbarui.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Jam Buka
      </Button>
    </div>
  );
}
