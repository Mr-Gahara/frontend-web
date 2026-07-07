"use client";

import React from "react";
import { PenggunaItem } from "@/types/pengguna";
import { MonitorSmartphone, Users, UserCheck, Clock } from "lucide-react";

// --- WIDGET 1: KARYAWAN AKTIF ---
export function WidgetActiveUsers() {
  const mockActiveUsers = [
    { nama: "Budi Santoso", role: "Kasir", loginAt: "08:15 WIB" },
    { nama: "Siti Aminah", role: "Admin", loginAt: "07:50 WIB" },
    { nama: "Agus Supriyadi", role: "Koki", loginAt: "09:00 WIB" },
    { nama: "Rina Marlina", role: "Staff", loginAt: "09:15 WIB" },
  ];

  return (
    <div className="rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col w-full h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center gap-2 text-[#041E3F]/60 mb-2">
          <UserCheck className="h-4 w-4 text-green-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Aktif Bekerja</span>
        </div>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-6xl font-bold text-[#041E3F] leading-none">{mockActiveUsers.length}</span>
          <span className="text-sm text-[#041E3F]/60 mb-1">online hari ini</span>
        </div>
      </div>

      {/* Daftar Karyawan */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#041E3F]/20">
        {mockActiveUsers.map((user, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 rounded-lg border border-[#041E3F]/10 bg-[#FFFAF3] p-3 hover:border-[#041E3F]/30 transition-colors shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-sm font-bold text-[#041E3F] truncate pr-2">{user.nama}</p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                <Clock className="h-3 w-3" />
                {user.loginAt}
              </div>
            </div>
            <p className="text-xs font-medium text-[#041E3F]/60">{user.role}</p>
          </div>
        ))}
      </div>
      
      {/* Footer Notes */}
      <div className="text-center text-[10px] font-medium text-[#041E3F]/40 mt-4 pt-4 border-t border-[#041E3F]/10">
        *Data absensi masih berupa mock data
      </div>
    </div>
  );
}

// --- WIDGET 2: TOTAL USERS ---
export function WidgetTotalUsers({ penggunaList }: { penggunaList: PenggunaItem[] }) {
  return (
    <div className="rounded-xl bg-[#0A2947] p-6 shadow-sm flex flex-col justify-between text-[#FFFAF3] relative overflow-hidden w-full h-full">
      <Users className="absolute -bottom-6 -right-4 h-32 w-32 opacity-[0.07] transform rotate-12" />
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90 flex items-center gap-2">
            <Users className="h-4 w-4" /> Total Pengguna
          </h3>
          <p className="text-sm text-[#FFFAF3]/70 leading-relaxed max-w-[85%]">
            Meringkas seluruh entitas akun yang memiliki hak akses ke dalam sistem.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-6xl lg:text-7xl font-bold tracking-tighter leading-none">{penggunaList.length}</span>
          <span className="text-base text-[#FFFAF3]/70 mb-1.5 font-medium">Akun Terdaftar</span>
        </div>
      </div>
    </div>
  );
}

// --- WIDGET 3: AKSES PLATFORM ---
export function WidgetAccess({ penggunaList }: { penggunaList: PenggunaItem[] }) {
  const appAksesCount = penggunaList.filter((p) => p.aksesType.includes("app")).length;
  const webAksesCount = penggunaList.filter((p) => p.aksesType.includes("web")).length;

  return (
    <div className="rounded-xl border border-[#041E3F]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col justify-between w-full h-full hover:border-[#041E3F]/20 transition-colors">
      <div className="flex items-center gap-2 text-[#041E3F]/60 mb-4">
        <MonitorSmartphone className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Akses Platform</span>
      </div>
      <div className="flex items-center justify-around mt-auto pt-2">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#041E3F]">{appAksesCount}</div>
          <div className="text-xs font-bold text-[#041E3F]/60 mt-2 uppercase tracking-widest">Aplikasi</div>
        </div>
        <div className="w-px h-12 bg-[#041E3F]/10"></div>
        <div className="text-center">
          <div className="text-4xl font-bold text-[#041E3F]">{webAksesCount}</div>
          <div className="text-xs font-bold text-[#041E3F]/60 mt-2 uppercase tracking-widest">Web</div>
        </div>
      </div>
    </div>
  );
}