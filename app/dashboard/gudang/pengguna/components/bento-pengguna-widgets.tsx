"use client";

import React from "react";
import { PenggunaItem } from "@/types/pengguna";
import { Role } from "@/types/role";
import {
  MonitorSmartphone,
  Users,
  UserCheck,
  Clock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

// IMPORT HOOK ABSENSI ASLI
import { useMonitoringAbsensi } from "@/hooks/use-monitoring-absensi";

// --- WIDGET 1: KARYAWAN AKTIF (TERHUBUNG KE BACKEND) ---
export function WidgetActiveUsers({
  penggunaList,
  roleList,
}: {
  penggunaList: PenggunaItem[];
  roleList: Role[];
}) {
  const { data: absensiRes, isLoading } = useMonitoringAbsensi(new Date());

  React.useEffect(() => {
    if (absensiRes) console.log("🔥 Data API Absensi:", absensiRes);
  }, [absensiRes]);

  const rawData = absensiRes as any;
  const daftarStaf =
    rawData?.data?.data?.daftar ||
    rawData?.data?.daftar ||
    rawData?.daftar ||
    [];

  const activeUsersAPI = daftarStaf.filter(
    (staf: any) => staf.status === "sedang_bekerja",
  );

  return (
    <div className="rounded-xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col w-full h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center gap-3 mb-2 text-[#0A2947]/60">
          <div className="p-2 bg-[#FFFAF3] rounded-lg shadow-sm border border-[#0A2947]/5">
            <UserCheck className="h-4 w-4 text-[#718355]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0A2947]/60">
            Aktif Bekerja
          </span>
        </div>
        <div className="flex items-end gap-2 mt-2">
          {isLoading ? (
            <Loader2 className="h-10 w-10 text-[#0A2947] animate-spin mb-1" />
          ) : (
            <span className="text-6xl font-black text-[#0A2947] leading-none">
              {activeUsersAPI.length}
            </span>
          )}
          <span className="text-sm text-[#0A2947]/60 font-medium mb-1.5">
            online hari ini
          </span>
        </div>
      </div>

      {/* Daftar Karyawan dari Backend */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#0A2947]/20">
        {isLoading ? (
          <div className="text-sm font-medium text-[#0A2947]/50 text-center mt-4">
            Memuat data absensi...
          </div>
        ) : activeUsersAPI.length === 0 ? (
          <div className="text-sm font-medium text-[#0A2947]/50 text-center mt-4">
            Belum ada karyawan yang absen hari ini.
          </div>
        ) : (
          activeUsersAPI.map((staf: any, idx: number) => {
            const matchedUser = penggunaList.find(
              (p) =>
                (p as any).id === staf.penggunaID || p._id === staf.penggunaID,
            );
            let roleName = "Staff";

            if (matchedUser) {
              if (
                typeof matchedUser.roleID === "object" &&
                matchedUser.roleID !== null
              ) {
                roleName = (matchedUser.roleID as any).namaRole;
              } else if (typeof matchedUser.roleID === "string") {
                const foundRole = roleList.find(
                  (r) =>
                    (r as any).id === matchedUser.roleID ||
                    r._id === matchedUser.roleID,
                );
                if (foundRole) roleName = foundRole.namaRole;
              }
            }

            const jamMasuk = staf.sesiTerakhir?.waktuMasuk
              ? format(new Date(staf.sesiTerakhir.waktuMasuk), "HH:mm") + " WIB"
              : "-";

            return (
              <div
                key={staf.penggunaID || idx}
                className="flex flex-col gap-1.5 rounded-lg border border-[#0A2947]/10 bg-[#FFFAF3] p-3 hover:border-[#0A2947]/30 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-[#0A2947] truncate pr-2">
                    {staf.nama}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#718355] px-2 py-0.5 rounded-full shrink-0">
                    <Clock className="h-3 w-3" />
                    {jamMasuk}
                  </div>
                </div>
                <p className="text-xs font-semibold capitalize text-[#0A2947]/60">
                  {roleName}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Notes */}
      <div className="text-center text-[10px] font-medium text-[#0A2947]/40 mt-4 pt-4 border-t border-[#0A2947]/10">
        Disinkronisasi secara real-time
      </div>
    </div>
  );
}

// --- WIDGET 2: TOTAL USERS ---
export function WidgetTotalUsers({
  penggunaList,
}: {
  penggunaList: PenggunaItem[];
}) {
  return (
    <div className="rounded-xl bg-[#0A2947] p-6 shadow-sm flex flex-col justify-between text-[#FFFAF3] relative overflow-hidden w-full h-full">
      <Users className="absolute -bottom-6 -right-4 h-32 w-32 opacity-[0.07] transform rotate-12" />
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 opacity-90">
            <div className="p-2 bg-[#D4A373]/20 rounded-lg">
              <Users className="h-4 w-4 text-[#D4A373]" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Total Pengguna
            </h3>
          </div>
          <p className="text-sm text-[#FFFAF3]/70 font-medium leading-relaxed max-w-[85%]">
            Meringkas seluruh entitas akun yang memiliki hak akses ke dalam
            sistem.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-6xl lg:text-7xl font-black tracking-tighter leading-none">
            {penggunaList.length}
          </span>
          <span className="text-base text-[#FFFAF3]/70 mb-1.5 font-bold">
            Akun Terdaftar
          </span>
        </div>
      </div>
    </div>
  );
}

// --- WIDGET 3: AKSES PLATFORM ---
export function WidgetAccess({
  penggunaList,
}: {
  penggunaList: PenggunaItem[];
}) {
  const appAksesCount = penggunaList.filter((p) =>
    p.aksesType.includes("app"),
  ).length;
  const webAksesCount = penggunaList.filter((p) =>
    p.aksesType.includes("web"),
  ).length;

  return (
    <div className="rounded-xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col justify-between w-full h-full hover:border-[#0A2947]/20 transition-colors">
      <div className="flex items-center gap-3 mb-4 text-[#0A2947]/60">
        <div className="p-2 bg-[#FFFAF3] rounded-lg shadow-sm border border-[#0A2947]/5">
          <MonitorSmartphone className="h-4 w-4 text-[#D4A373]" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider">
          Akses Platform
        </span>
      </div>
      <div className="flex items-center justify-around mt-auto pt-2">
        <div className="text-center">
          <div className="text-4xl font-black text-[#0A2947]">
            {appAksesCount}
          </div>
          <div className="text-xs font-bold text-[#0A2947]/60 mt-2 uppercase tracking-widest">
            Aplikasi
          </div>
        </div>
        <div className="w-px h-12 bg-[#0A2947]/10"></div>
        <div className="text-center">
          <div className="text-4xl font-black text-[#0A2947]">
            {webAksesCount}
          </div>
          <div className="text-xs font-bold text-[#0A2947]/60 mt-2 uppercase tracking-widest">
            Web
          </div>
        </div>
      </div>
    </div>
  );
}
