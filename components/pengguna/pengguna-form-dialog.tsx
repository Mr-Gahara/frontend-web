"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PenggunaRequest, PenggunaItem } from "@/types/pengguna";
import { Role } from "@/types/role";
import { X, UserPlus, UserCog, Smartphone, Monitor, MonitorSmartphone } from "lucide-react";

interface PenggunaFormDialogProps {
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
  editTarget: PenggunaItem | null;
  form: PenggunaRequest;
  setForm: React.Dispatch<React.SetStateAction<PenggunaRequest>>;
  formError: string;
  handleSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isSelf: boolean;
  isOwner: boolean;
  roleList: Role[];
  currentUserLevel: number;
}

export default function PenggunaFormDialog({
  showDialog,
  setShowDialog,
  editTarget,
  form,
  setForm,
  formError,
  handleSubmit,
  isPending,
  isSelf,
  isOwner,
  roleList,
  currentUserLevel,
}: PenggunaFormDialogProps) {

  // Logic untuk menentukan kartu akses mana yang sedang aktif
  const isAppOnly = form.aksesType?.length === 1 && form.aksesType.includes("app");
  const isWebOnly = form.aksesType?.length === 1 && form.aksesType.includes("web");
  const isBoth = form.aksesType?.length === 2;

  const handleAksesSelect = (type: "app" | "web" | "both") => {
    if (isSelf) return; // Disable perubahan jika mengedit diri sendiri

    if (type === "app") {
      setForm((prev) => ({ ...prev, aksesType: ["app"] }));
    } else if (type === "web") {
      setForm((prev) => ({ ...prev, aksesType: ["web"] }));
    } else if (type === "both") {
      setForm((prev) => ({ ...prev, aksesType: ["app", "web"] }));
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      {/* 
        TWEAK: sm:max-w-[540px] untuk memperlebar pop up 
        p-6 sm:p-8 untuk memberikan ruang lega (breathing room)
      */}
      <DialogContent className="sm:max-w-135 border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl">
        
        {/* CUSTOM HEADER */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
              {editTarget ? <UserCog className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                {editTarget ? "Edit Pengguna" : "Tambah Pengguna"}
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                {editTarget
                  ? "Perbarui data informasi akun pengguna."
                  : "Isi form berikut untuk menambahkan akun baru."}
              </DialogDescription>
            </div>
          </div>
          {/* TWEAK: Tombol X dibikin clean tanpa border bundar, cursor pointer */}
          <button 
            onClick={() => setShowDialog(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* HAK AKSES PLATFORM - CARD SELECTION */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-[#041E3F]">Hak Akses Platform</label>
            <div className="grid grid-cols-3 gap-3">
              {/* Opsi App */}
              <div 
                onClick={() => handleAksesSelect("app")}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${
                  isAppOnly 
                    ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" 
                    : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"
                } ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <Smartphone className={`h-7 w-7 mb-2.5 ${isAppOnly ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                <span className="text-sm font-bold">App Kasir</span>
              </div>

              {/* Opsi Web */}
              <div 
                onClick={() => handleAksesSelect("web")}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${
                  isWebOnly 
                    ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" 
                    : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"
                } ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <Monitor className={`h-7 w-7 mb-2.5 ${isWebOnly ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                <span className="text-sm font-bold">Web Backoffice</span>
              </div>

              {/* Opsi Keduanya */}
              <div 
                onClick={() => handleAksesSelect("both")}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${
                  isBoth 
                    ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" 
                    : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"
                } ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <MonitorSmartphone className={`h-7 w-7 mb-2.5 ${isBoth ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                <span className="text-sm font-bold">Keduanya</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#041E3F]">Nama Lengkap</label>
            <Input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Masukkan nama pengguna"
              className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">
                Nomor HP <span className="text-[#041E3F]/50 font-semibold">(opsional)</span>
              </label>
              <Input
                value={form.nomorHp ?? ""}
                onChange={(e) => setForm({ ...form, nomorHp: e.target.value })}
                placeholder="081234..."
                className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4"
              />
            </div>

            {(!isSelf || isOwner) ? (
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">PIN Keamanan</label>
                <Input
                  type="password"
                  value={form.pin ?? ""}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  placeholder={editTarget ? "Kosongkan jika tetap" : "Masukkan PIN"}
                  className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4"
                  required={!editTarget}
                />
              </div>
            ) : (
              <div className="space-y-2 flex flex-col justify-end">
                <span className="text-sm font-semibold text-[#041E3F]/50 italic pb-3">PIN hanya dapat diubah oleh Owner</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">Peran / Role</label>
              <Select
                value={form.roleID}
                onValueChange={(value) => setForm({ ...form, roleID: value })}
                disabled={isSelf}
              >
                <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium">
                  {roleList
                    .filter((role: Role) => role.level < currentUserLevel)
                    .map((role: Role, index: number) => {
                      const roleIdValue = (role as any).id || (role as any)._id || `role-fallback-${index}`;
                      return (
                        <SelectItem key={roleIdValue} value={String(roleIdValue)} className="cursor-pointer text-sm">
                          {role.namaRole}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">Status</label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as "aktif" | "non-aktif" })}
                disabled={isSelf}
              >
                <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium">
                  <SelectItem value="aktif" className="cursor-pointer text-sm">Aktif</SelectItem>
                  <SelectItem value="non-aktif" className="cursor-pointer text-red-600 focus:text-red-700 text-sm">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600 font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 mt-1">
              {formError}
            </p>
          )}

          {/* ACTION BUTTON FULL WIDTH */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-14 mt-4 rounded-xl cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md transition-all active:scale-[0.98]"
          >
            {isPending ? "Menyimpan Data..." : "Simpan Pengguna"}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}