"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pesanError } from "@/lib/api/error";
import type { AkunAdmin } from "@/types/adminAkun";
import { useHapusAkun } from "./hooks";
import { URL_DAFTAR_AKUN, namaToko } from "./tampilan";

/**
 * Konfirmasi hapus akun klien dengan password admin, yang diverifikasi
 * backend. Dipasang setiap kali dibuka, sehingga password tidak tersimpan
 * di antara pembukaan, dan hanya tertutup saat berhasil (keputusan Fase 0).
 */
export function DialogHapusAkun({
  akun,
  buka,
  onTutup,
}: {
  akun: AkunAdmin;
  buka: boolean;
  onTutup: () => void;
}) {
  if (!buka) return null;
  return <IsiDialogHapus akun={akun} onTutup={onTutup} />;
}

function IsiDialogHapus({ akun, onTutup }: { akun: AkunAdmin; onTutup: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [galat, setGalat] = useState("");
  const hapus = useHapusAkun({
    onSuccess: () => {
      toast.success("Akun dihapus", { description: akun.email });
      router.push(URL_DAFTAR_AKUN);
    },
    onError: (err) => setGalat(pesanError(err, "Gagal menghapus akun.")),
  });
  const memuat = hapus.isPending;
  const toko = namaToko(akun);

  const kirim = () => {
    setGalat("");
    if (!password) {
      setGalat("Password admin wajib diisi.");
      return;
    }
    hapus.mutate({ id: akun.id, password });
  };

  return (
    <Dialog
      open
      onOpenChange={(buka) => {
        if (!buka && !memuat) onTutup();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus akun {akun.email}</DialogTitle>
          <DialogDescription>
            Akun ini{toko ? ` beserta seluruh data toko ${toko}` : ""} dihapus permanen dan tidak
            dapat dikembalikan.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            kirim();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="password-admin" className="text-sm font-medium">
              Password admin
            </label>
            <Input
              id="password-admin"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={memuat}
            />
            <p className="text-xs text-muted-foreground">
              Masukkan password akun admin Anda untuk memastikan penghapusan.
            </p>
          </div>

          {galat && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {galat}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onTutup} disabled={memuat}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={memuat}>
              {memuat ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}