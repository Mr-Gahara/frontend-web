"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addHours, setMinutes, setSeconds, isSameDay } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type {
  SesiBookingListApiResponse,
  SesiBookingResponse,
} from "@/types/sesiBooking";

// ─── Types lokal ────────────────────────────────────────────────────────────

interface AsetResponse {
  id: string;
  namaAset: string;
  status: string;
  dataAset: {
    id: string;
    namaTipeAset: string | null;
    deskripsi: string | null;
  } | null;
  tenantID: string | null;
}

interface AsetListApiResponse {
  data: AsetResponse[];
}

// ─── Design Tokens ──────────────────────────────────────────────────────────

const COLORS = {
  navy: "#0A2947",
  navyLight: "#0D365E",
  cream: "#FFFAF3",
  darkCream: "#F2EAE1",
  gold: "#D4A373",
  sage: "#7c9b4bff",
  rose: "#f9536eff",
};

const TOTAL_TIMELINE_HOURS = 6;

// Status dari backend lowercase: tersedia/digunakan/perbaikan
const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  tersedia: { dot: COLORS.sage, label: "Tersedia" },
  digunakan: { dot: COLORS.gold, label: "Digunakan" },
  perbaikan: { dot: COLORS.rose, label: "Perbaikan" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateParam(date: Date): string {
  // Format YYYY-MM-DD lokal (bukan UTC) — sesuai ekspektasi backend
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex animate-pulse">
      <div
        className="w-56 shrink-0 p-4 flex items-center gap-3"
        style={{ background: COLORS.navy }}
      >
        <div className="w-11 h-11 rounded-xl bg-white/10" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 rounded bg-white/20 w-3/4" />
          <div className="h-2.5 rounded bg-white/10 w-1/2" />
        </div>
      </div>
      <div className="flex-1 min-h-22" style={{ background: COLORS.cream }} />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-3"
      style={{ color: `${COLORS.navy}66` }}
    >
      <Calendar className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-3"
      style={{ color: COLORS.rose }}
    >
      <AlertCircle className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DasborTimelinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const tanggalParam = useMemo(() => toDateParam(selectedDate), [selectedDate]);

  // ── Fetch aset (stale: jarang berubah, cache 5 menit) ──
  const {
    data: asetData,
    isLoading: asetLoading,
    isError: asetError,
  } = useQuery<AsetListApiResponse>({
    queryKey: queryKeys.aset,
    queryFn: async () => {
      const res = await apiClient.get<any>("/aset", undefined, "pengguna");
      if (!res) return { data: [] };

      // Menangani variasi struktur response backend (res.data.data atau res.data)
      const raw = res.data?.data || res.data || [];
      return { data: Array.isArray(raw) ? raw : [] };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always", // MEMAKSA ambil data terbaru saat halaman dibuka
    refetchOnWindowFocus: true,
  });

  // ── Fetch booking per tanggal (refetch tiap ganti tanggal) ──
  const {
    data: bookingData,
    isLoading: bookingLoading,
    isError: bookingError,
  } = useQuery<SesiBookingListApiResponse>({
    queryKey: ["sesi-booking", tanggalParam],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/sesiBooking?tanggal=${tanggalParam}`,
        undefined,
        "pengguna",
      );
      if (!res) return { data: [] };

      // Validasi array yang ketat
      const raw = res.data?.data || res.data || [];
      return { data: Array.isArray(raw) ? raw : [] };
    },
    staleTime: 60 * 1000, // 1 menit — booking lebih dinamis
    refetchOnMount: "always", // Mencegah bug data gaib/kosong di klien
    refetchOnWindowFocus: true,
  });

  const asetList = asetData?.data ?? [];
  const bookingList = bookingData?.data ?? [];

  // ── Timeline ──

  const timelineStart = useMemo(() => {
    if (isSameDay(selectedDate, new Date())) {
      return setMinutes(setSeconds(new Date(), 0), 0);
    }
    const base = new Date(selectedDate);
    base.setHours(8, 0, 0, 0);
    return base;
  }, [selectedDate]);

  const timeColumns = useMemo(
    () =>
      Array.from({ length: TOTAL_TIMELINE_HOURS }).map((_, i) =>
        addHours(timelineStart, i),
      ),
    [timelineStart],
  );

  const timelineEnd = addHours(timelineStart, TOTAL_TIMELINE_HOURS);
  const totalTimelineMinutes = TOTAL_TIMELINE_HOURS * 60;

  const dateNavText = isSameDay(selectedDate, new Date())
    ? `Hari ini, ${format(selectedDate, "dd MMM", { locale: localeID })}`
    : format(selectedDate, "dd MMM yyyy", { locale: localeID });

  const nowPercent = useMemo(() => {
    if (!isSameDay(selectedDate, now)) return null;
    const diffMinutes = (now.getTime() - timelineStart.getTime()) / 60000;
    if (diffMinutes < 0 || diffMinutes > totalTimelineMinutes) return null;
    return (diffMinutes / totalTimelineMinutes) * 100;
  }, [selectedDate, now, timelineStart, totalTimelineMinutes]);

  // ── Derived: booking per aset ──
  // Map asetID → booking[] yang overlap dengan window timeline
  const bookingsByAset = useMemo(() => {
    const map = new Map<string, SesiBookingResponse[]>();
    for (const booking of bookingList) {
      const asetId = booking.dataAset?.id;
      if (!asetId) continue;
      const mulai = new Date(booking.waktuMulai);
      const selesai = booking.waktuSelesai
        ? new Date(booking.waktuSelesai)
        : null;
      // Booking aktif tanpa waktuSelesai: tetap tampilkan dari waktuMulai
      const selesaiEfektif = selesai ?? timelineEnd;
      if (selesaiEfektif <= timelineStart || mulai >= timelineEnd) continue;
      if (!map.has(asetId)) map.set(asetId, []);
      map.get(asetId)!.push(booking);
    }
    return map;
  }, [bookingList, timelineStart, timelineEnd]);

  const isLoading = asetLoading || bookingLoading;
  const isError = asetError || bookingError;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ color: COLORS.navy }}
          >
            Peta Ketersediaan Aset
          </h2>
          <p
            className="text-sm font-medium"
            style={{ color: `${COLORS.navy}99` }}
          >
            Pantau penggunaan aset dalam 6 jam ke depan.
          </p>
        </div>

        <div
          className="flex items-center self-start sm:self-auto rounded-full shadow-md overflow-hidden"
          style={{ background: COLORS.navy }}
        >
          <button
            aria-label="Tanggal sebelumnya"
            className="p-2.5 px-3.5 transition-colors cursor-pointer text-[#FFFAF399] hover:text-[#D4A373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A373] focus-visible:ring-offset-2"
            onClick={() =>
              setSelectedDate(
                (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1),
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="px-4 py-2.5 flex items-center gap-2.5 text-sm font-bold tracking-wide min-w-44 justify-center border-x"
            style={{
              color: COLORS.cream,
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: COLORS.gold }} />
            {dateNavText}
          </div>

          <button
            aria-label="Tanggal berikutnya"
            className="p-2.5 px-3.5 transition-colors cursor-pointer text-[#FFFAF399] hover:text-[#D4A373] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A373] focus-visible:ring-offset-2"
            onClick={() =>
              setSelectedDate(
                (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WRAPPER TIMELINE */}
      <div
        className="w-full rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 border"
        style={{
          background: COLORS.darkCream,
          borderColor: `${COLORS.navy}15`,
        }}
      >
        {/* LEGENDA */}
        <div className="flex flex-wrap items-center gap-4 px-2">
          {Object.entries(STATUS_STYLES).map(([key, s]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{ color: `${COLORS.navy}B3` }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: s.dot, boxShadow: `0 0 5px ${s.dot}` }}
              />
              {s.label}
            </span>
          ))}
          {isLoading && (
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: `${COLORS.navy}66` }}
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Memuat data...
            </span>
          )}
          <span
            className="flex items-center gap-1.5 text-xs font-bold ml-auto"
            style={{ color: `${COLORS.navy}B3` }}
          >
            <span
              className="w-2 h-0.5 rounded-full"
              style={{ background: COLORS.gold }}
            />
            Waktu sekarang
          </span>
        </div>

        {/* CONTAINER TABEL */}
        <div
          className="overflow-x-auto rounded-xl border shadow-sm"
          style={{ background: COLORS.cream, borderColor: `${COLORS.navy}15` }}
        >
          <div className="min-w-200">
            {/* HEADER KOLOM WAKTU */}
            <div
              className="flex text-sm font-bold relative z-20"
              style={{ background: COLORS.navy, color: COLORS.cream }}
            >
              <div
                className="w-56 shrink-0 p-4 flex items-center justify-center relative z-10"
                style={{
                  background: COLORS.navy,
                  boxShadow: "4px 0 12px rgba(10,41,71,0.2)",
                }}
              >
                Aset (Meja/Unit)
              </div>
              <div className="flex-1 flex relative">
                {timeColumns.map((time, idx) => (
                  <div
                    key={idx}
                    className="flex-1 py-4 flex items-center justify-center border-l tabular-nums"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    {format(time, "HH:mm")}
                  </div>
                ))}
              </div>
            </div>

            {/* BODY */}
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              {isError ? (
                <ErrorState message="Gagal memuat data. Periksa koneksi atau coba lagi." />
              ) : isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : asetList.length === 0 ? (
                <EmptyState message="Belum ada aset terdaftar." />
              ) : (
                asetList.map((aset) => {
                  const bookingsInRow = bookingsByAset.get(aset.id) ?? [];
                  const statusKey = aset.status?.toLowerCase() ?? "tersedia";
                  const statusStyle =
                    STATUS_STYLES[statusKey] ?? STATUS_STYLES.tersedia;

                  // --- ALGORITMA WATERFALL STACKING (ANTI-OVERLAP) ---
                  // 1. Urutkan berdasarkan waktu mulai tercepat
                  const sortedBookings = [...bookingsInRow].sort(
                    (a, b) =>
                      new Date(a.waktuMulai).getTime() -
                      new Date(b.waktuMulai).getTime()
                  );

                  const levels: number[] = [];
                  const positionedBookings = sortedBookings.map((booking) => {
                    const mulai = new Date(booking.waktuMulai);
                    const selesai = booking.waktuSelesai
                      ? new Date(booking.waktuSelesai)
                      : timelineEnd;

                    let startDiffMs = mulai.getTime() - timelineStart.getTime();
                    let startMinutes = Math.floor(startDiffMs / 60000);

                    let durationMs = selesai.getTime() - mulai.getTime();
                    let durationMinutes = Math.floor(durationMs / 60000);

                    if (startMinutes < 0) {
                      durationMinutes += startMinutes;
                      startMinutes = 0;
                    }
                    if (startMinutes + durationMinutes > totalTimelineMinutes) {
                      durationMinutes = totalTimelineMinutes - startMinutes;
                    }

                    // 2. Kalkulasi Visual Buffer
                    // Karena kita menggunakan minWidth: 140px, box akan memakan sekitar 60 menit 
                    // ruang visual di layar. Kita lindungi ruang ini agar tidak ditimpa box lain.
                    const VISUAL_BUFFER = 60;
                    const visualEndMinutes = Math.max(
                      startMinutes + durationMinutes,
                      startMinutes + VISUAL_BUFFER
                    );

                    let level = 0;
                    // 3. Cari tumpukan (level) terendah yang tidak bertabrakan
                    while (
                      levels[level] !== undefined &&
                      levels[level] > startMinutes
                    ) {
                      level++;
                    }
                    levels[level] = visualEndMinutes;

                    return { booking, startMinutes, durationMinutes, level, mulai, selesai };
                  });

                  const maxLevel = levels.length;
                  // 4. Hitung tinggi baris induk secara dinamis berdasarkan jumlah tumpukan
                  const dynamicRowHeight = Math.max(88, maxLevel * 74 + 16);

                  return (
                    <div key={aset.id} className="flex group">
                      {/* Kolom Info Aset */}
                      <div
                        className="w-56 shrink-0 p-4 flex items-center gap-3 relative z-10 transition-colors"
                        style={{
                          background: COLORS.navy,
                          boxShadow: "4px 0 12px rgba(10,41,71,0.08)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = COLORS.navyLight)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = COLORS.navy)
                        }
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background:
                              "linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <MonitorPlay
                            className="w-5 h-5"
                            style={{ color: COLORS.gold }}
                          />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span
                            className="text-sm font-bold truncate tracking-wide"
                            style={{ color: COLORS.cream }}
                          >
                            {aset.namaAset}
                          </span>
                          <span className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                background: statusStyle.dot,
                                boxShadow: `0 0 5px ${statusStyle.dot}`,
                              }}
                            />
                            <span
                              className="text-[11px] font-medium truncate tracking-wide uppercase"
                              style={{ color: "rgba(255,250,243,0.7)" }}
                            >
                              {statusStyle.label}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Area Grid Timeline */}
                      <div
                        className="flex-1 relative transition-colors"
                        style={{ minHeight: `${dynamicRowHeight}px` }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = COLORS.darkCream)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Garis Pembatas Jam */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {timeColumns.map((_, idx) => (
                            <div
                              key={idx}
                              className="flex-1 border-l"
                              style={{ borderColor: `${COLORS.navy}10` }}
                            />
                          ))}
                        </div>

                        {/* Garis Waktu Sekarang */}
                        {isMounted && nowPercent !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-px z-1 pointer-events-none shadow-[0_0_8px_rgba(212,163,115,0.8)]"
                            style={{
                              left: `${nowPercent}%`,
                              background: COLORS.gold,
                            }}
                          />
                        )}

                        {/* Booking Blocks Berundak */}
                        {positionedBookings.map((pos) => {
                          const { booking, startMinutes, durationMinutes, level, mulai, selesai } = pos;

                          const leftPercent = (startMinutes / totalTimelineMinutes) * 100;
                          const widthPercent = (durationMinutes / totalTimelineMinutes) * 100;

                          const namaPelanggan = booking.dataPelanggan?.namaPelanggan ?? "—";
                          const tipePelanggan = booking.dataPelanggan?.tipePelanggan ?? "";
                          const isMember = tipePelanggan.toLowerCase() === "member";
                          const isAktif = booking.status === "Aktif";
                          const isSelesai = booking.status === "Selesai";

                          const blockOpacity = isAktif ? 1 : 0.55;

                          return (
                            <div
                              key={booking.id}
                              className="absolute p-1 z-10 transition-all"
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                minWidth: "140px",
                                opacity: blockOpacity,
                                // KOREKSI: Posisi vertikal didorong berdasarkan 'level' 
                                top: `${level * 74 + 8}px`,
                                height: "72px",
                              }}
                            >
                              <div
                                className="w-full h-full rounded-xl p-2.5 flex flex-col justify-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                                style={
                                  isMember
                                    ? {
                                        background: COLORS.sage,
                                        color: COLORS.cream,
                                        boxShadow: "0 2px 4px rgba(10,41,71,0.1)",
                                      }
                                    : {
                                        background: COLORS.darkCream,
                                        color: COLORS.navy,
                                        border: `1px solid ${COLORS.navy}20`,
                                        borderLeft: `4px solid ${COLORS.gold}`,
                                        boxShadow: "0 2px 4px rgba(10,41,71,0.05)",
                                      }
                                }
                              >
                                <span className="text-sm font-bold truncate tracking-tight w-full">
                                  {namaPelanggan}
                                </span>
                                <span
                                  className="text-[11px] font-semibold truncate mt-0.5 tabular-nums tracking-wide w-full"
                                  style={{
                                    color: isMember
                                      ? "rgba(255,250,243,0.8)"
                                      : `${COLORS.navy}99`,
                                  }}
                                >
                                  {tipePelanggan && `${tipePelanggan} • `}
                                  {format(mulai, "HH:mm")} –{" "}
                                  {booking.waktuSelesai
                                    ? format(selesai, "HH:mm")
                                    : "aktif"}
                                  {isSelesai && " · Selesai"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
