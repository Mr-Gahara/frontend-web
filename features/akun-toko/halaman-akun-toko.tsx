"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { HalamanGalat } from "@/components/galat/halaman-galat";
import { Button } from "@/components/ui/button";
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { useLevelPenggunaAktif } from "@/features/role/hooks";
import { useAkunSaya } from "@/features/setup/hooks";
import { DialogUbahEmail } from "./dialog-ubah-email";
import { DialogUbahPassword } from "./dialog-ubah-password";
import { bolehKelolaAkunToko } from "./izin";

function BarisAkun({ label, nilai, tombol, onUbah }: { label: string; nilai: string; tombol: string; onUbah: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-[15px] font-medium [overflow-wrap:anywhere]">{nilai}</p>
      </div>
      <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onUbah}>
        {tombol}
      </Button>
    </div>
  );
}

/**
 * Halaman Akun Toko di Pengaturan (OA8a): email dan password masuk akun
 * toko, khusus Owner pemegang update-akun. Gerbang rute memeriksa izinnya;
 * level Owner diperiksa di sini, karena backend menolak selain Owner.
 * Email dan id akun dibaca dari GET /akun/me (keputusan rancangan butir 12).
 */
export function HalamanAkunToko() {
  const { permissions } = useSession();
  const boleh = bolehKelolaAkunToko(permissions, useLevelPenggunaAktif());
  const akun = useAkunSaya(boleh);
  const [dialog, setDialog] = useState<"email" | "password" | null>(null);

  if (!boleh) return <HalamanGalat kode={403} tertanam />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Akun Toko</h1>
        <p className="text-sm text-muted-foreground">Email, password, dan penghapusan akun toko. Hanya untuk Owner.</p>
      </div>

      {akun.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Memuat akun" />
        </div>
      ) : akun.isError || !akun.data?.id ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-destructive">{pesanError(akun.error, "Gagal memuat akun toko.")}</p>
          <Button type="button" onClick={() => akun.refetch()}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <section aria-labelledby="judul-email-password" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
          <div>
            <h2 id="judul-email-password" className="text-base font-semibold">
              Email dan Password
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Setiap perubahan memakai kode yang dikirim ke email akun saat ini.
            </p>
          </div>
          <BarisAkun label="Email akun" nilai={akun.data.email ?? "-"} tombol="Ubah email" onUbah={() => setDialog("email")} />
          <BarisAkun label="Password akun" nilai="••••••••" tombol="Ubah password" onUbah={() => setDialog("password")} />
          <DialogUbahEmail
            open={dialog === "email"}
            onOpenChange={(buka) => setDialog(buka ? "email" : null)}
            idAkun={akun.data.id}
            emailSaatIni={akun.data.email ?? ""}
          />
          <DialogUbahPassword
            open={dialog === "password"}
            onOpenChange={(buka) => setDialog(buka ? "password" : null)}
            idAkun={akun.data.id}
          />
        </section>
      )}
    </div>
  );
}
