"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { queryKeys } from "@/lib/queryKeys";
import { decodeJWT } from "@/lib/decodeToken";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { PenggunaItem } from "@/types/pengguna";
import { AkunSession } from "@/types/auth";
import {
  User,
  Lock,
  Store,
  Shield,
  Trash2,
  Save,
  Loader2,
  Phone,
  Activity,
  Terminal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function ProfilPage() {
  useAuthGuard();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Ekstrak data dari token JWT (PERBAIKAN: Defensif membaca 'id' atau '_id')
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("penggunaToken")
      : null;
  const payload = token ? decodeJWT(token) : null;

  // Mencegah kegagalan baca ID
  const userId = payload?._id || payload?.id || "";
  const namaFromToken = payload?.nama || "";

  // Mencegah kegagalan baca Role jika struktur di token ternyata masih string
  const roleFromToken = payload?.role?.nama || payload?.role || "Staf";
  const akunRaw =
    typeof window !== "undefined" ? localStorage.getItem("akun") : null;
  const akunSession: AkunSession | null = akunRaw ? JSON.parse(akunRaw) : null;
  const namaTokoFromToken =
    akunSession?.daftarTenant?.find((t) => t.tenantID === payload?.tenantID)
      ?.namaToko || "Toko";

  // 2. PRE-POPULATE
  const [nama, setNama] = useState(namaFromToken);
  const [nomorHp, setNomorHp] = useState("");
  const [pinLama, setPinLama] = useState("");
  const [pinBaru, setPinBaru] = useState("");

  // Read-only display state
  const [status, setStatus] = useState("aktif");
  const [aksesType, setAksesType] = useState<string[]>(["app"]);

  // --- useQuery: fetch profil ---
  const { data: profilData, isLoading } = useQuery({
    queryKey: queryKeys.penggunaDetail(userId),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PenggunaItem }>(
        `/pengguna/${userId}`,
        undefined,
        "pengguna",
      );
      return res.data; // Pastikan ini mengembalikan objek PenggunaItem
    },
    enabled: !!userId, // Jika userId ada, query akan berjalan
  });

  // 3. Sinkronisasi data dari database
  useEffect(() => {
    if (profilData) {

      const dataAktual = profilData;

      setNama(dataAktual.nama ?? namaFromToken);
      setNomorHp(dataAktual.nomorHp ?? "");
      setStatus(dataAktual.status ?? "aktif");
      setAksesType(dataAktual.aksesType ?? ["app"]);
    }
  }, [profilData, namaFromToken]);

  const updateProfilMutation = useMutation({
    mutationFn: async (mutationPayload: {
      nama: string;
      nomorHp?: string | null;
      pinLama?: string;
      pinBaru?: string;
    }) => {
      return await apiClient.put(
        `/pengguna/${userId}`,
        mutationPayload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Profil Anda berhasil diperbarui.",
      });
      setPinLama("");
      setPinBaru("");
      queryClient.invalidateQueries({
        queryKey: queryKeys.penggunaDetail(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengguna() });
    },
    onError: (err: any) => {
      toast.error("Gagal", {
        description: err.message || "Gagal memperbarui profil.",
      });
    },
  });

  const handleUpdateProfil = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      toast.error("Gagal", { description: "Nama tidak boleh kosong." });
      return;
    }

    const mutationPayload: {
      nama: string;
      nomorHp: string | null;
      pinLama?: string;
      pinBaru?: string;
    } = {
      nama,
      nomorHp: !nomorHp || nomorHp.trim() === "" ? null : nomorHp.trim(),
    };

    if (pinBaru.trim() !== "") {
      if (pinBaru.length < 4) {
        toast.error("Gagal", {
          description: "PIN baru minimal harus terdiri dari 4 karakter.",
        });
        return;
      }

      if (!/^\d+$/.test(pinBaru)) {
        toast.error("Gagal", {
          description: "PIN baru harus berupa angka seluruhnya.",
        });
        return;
      }

      if (!pinLama.trim()) {
        toast.error("Gagal", {
          description:
            "Silakan masukkan PIN lama Anda untuk mengonfirmasi perubahan.",
        });
        return;
      }
      mutationPayload.pinLama = pinLama;
      mutationPayload.pinBaru = pinBaru;
    }

    updateProfilMutation.mutate(mutationPayload);
  };

  const handleDeleteAkunClick = () => {
    alert(
      "Fungsionalitas penghapusan akun mandiri belum diaktifkan pada sistem backend.",
    );
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi identitas akun Anda di dalam sistem outlet.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-border pb-6">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt={nama || "Avatar Pengguna"}
            />
            <AvatarFallback className="text-xl font-semibold bg-secondary text-foreground">
              {nama ? nama.substring(0, 2).toUpperCase() : "US"}
            </AvatarFallback>
          </Avatar>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {nama || "Nama Pengguna"}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Sesi Aktif: {roleFromToken} @ {namaTokoFromToken}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfil} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Status Pengguna
              </label>
              <div className="w-full rounded-md border border-input bg-muted/50 p-2.5 flex items-center justify-between text-sm select-none">
                <span className="text-foreground capitalize">{status}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    status === "aktif"
                      ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  Locked
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" /> Otorisasi Platform
              </label>
              <div className="w-full rounded-md border border-input bg-muted/50 p-2.5 flex items-center justify-between text-sm select-none">
                <div className="flex gap-1">
                  {aksesType.map((type) => (
                    <span
                      key={type}
                      className="text-[10px] font-mono uppercase bg-background border border-border text-foreground px-1.5 py-0.5 rounded"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-muted border-border text-muted-foreground">
                  Read Only
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" /> Nama Toko / Tenant
              </label>
              <Input
                type="text"
                value={namaTokoFromToken}
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Hak Akses / Role
              </label>
              <Input
                type="text"
                value={roleFromToken}
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
            </div>
          </div>

          <hr className="border-border my-2" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="nama"
                className="text-xs font-medium text-foreground flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5" /> Nama Lengkap
              </label>
              <Input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nomorHp"
                className="text-xs font-medium text-foreground flex items-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5" /> Nomor WhatsApp / HP
              </label>
              <Input
                id="nomorHp"
                type="number"
                value={nomorHp}
                onChange={(e) => setNomorHp(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="no-spinner flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-muted/20 p-4 rounded-lg border border-border">
            <div className="space-y-2">
              <label
                htmlFor="pinLama"
                className="text-xs font-medium text-foreground flex items-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" /> PIN Lama
              </label>
              <Input
                id="pinLama"
                type="password"
                value={pinLama}
                onChange={(e) => setPinLama(e.target.value)}
                placeholder="Masukkan PIN saat ini"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors font-mono tracking-widest"
                maxLength={6}
                disabled={updateProfilMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="pinBaru"
                className="text-xs font-medium text-foreground flex items-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5 text-primary" /> PIN Baru
              </label>
              <Input
                id="pinBaru"
                type="password"
                value={pinBaru}
                onChange={(e) => setPinBaru(e.target.value)}
                placeholder="Masukkan PIN baru"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors font-mono tracking-widest"
                maxLength={6}
                disabled={updateProfilMutation.isPending}
              />
            </div>
            <p className="text-[11px] text-muted-foreground sm:col-span-2">
              *Kosongkan kedua kolom di atas jika Anda tidak berniat mengubah
              PIN.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={updateProfilMutation.isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 cursor-pointer gap-2"
            >
              {updateProfilMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-destructive">
            Zona Bahaya
          </h2>
          <p className="text-xs text-muted-foreground">
            Tindakan di bawah ini bersifat permanen dan memutus akses Anda dari
            tenant.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-destructive/20 pt-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Hapus Akun Ini
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Menghapus data kepegawaian Anda dari database tenant saat ini.
              Sesi login akan segera dihentikan secara paksa.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAkunClick}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 h-10 py-2 px-4 shrink-0 cursor-pointer gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Akun
          </button>
        </div>
      </div>
    </div>
  );
}
