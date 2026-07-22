"use client";

import { useState, useMemo, useEffect } from "react";
import { format, addHours, setMinutes, setSeconds, isSameDay } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MonitorPlay, Calendar } from "lucide-react";

// ============================================================
// DESIGN TOKENS (Updated)
// ------------------------------------------------------------
// Menghilangkan Pure White (#FFFFFF) yang bikin mata "sakit"
// di tengah palet warm. Kita gunakan hierarki Cream.
// ============================================================
const COLORS = {
  navy: "#0A2947",
  navyLight: "#0D365E",
  cream: "#FFFAF3", // Light Cream (Pengganti Putih, untuk area konten utama)
  darkCream: "#F2EAE1", // Dark Cream (Untuk Wrapper/Background)
  gold: "#D4A373",
  sage: "#7c9b4bff",
  rose: "#f9536eff",
};

const DUMMY_ASSETS = [
  { _id: "A1", namaAset: "Meja Billiar 1", status: "Tersedia" },
  { _id: "A2", namaAset: "Meja Billiar 2", status: "Tersedia" },
  { _id: "A3", namaAset: "Meja Billiar 3", status: "Digunakan" },
  { _id: "A4", namaAset: "Meja Billiar 4", status: "Digunakan" },
  { _id: "A5", namaAset: "Meja Billiar 5", status: "Perbaikan" },
  { _id: "A6", namaAset: "Meja Billiar 6", status: "Tersedia" },
  { _id: "A7", namaAset: "Meja Billiar 7", status: "Tersedia" },
  { _id: "A8", namaAset: "Meja Billiar 8", status: "Tersedia" },
];

const getRelativeHour = (hourOffset: number, minute = 0) => {
  const d = new Date();
  d.setHours(d.getHours() + hourOffset, minute, 0, 0);
  return d;
};

const DUMMY_BOOKINGS = [
  {
    _id: "B1",
    dataAset: "A3",
    namaPelanggan: "Bena",
    tipePelanggan: "Umum",
    waktuMulai: getRelativeHour(0),
    waktuSelesai: getRelativeHour(1),
  },
  {
    _id: "B2",
    dataAset: "A4",
    namaPelanggan: "Adam",
    tipePelanggan: "Member",
    waktuMulai: getRelativeHour(0),
    waktuSelesai: getRelativeHour(1),
  },
  {
    _id: "B3",
    dataAset: "A6",
    namaPelanggan: "Sayuki",
    tipePelanggan: "Umum",
    waktuMulai: getRelativeHour(2),
    waktuSelesai: getRelativeHour(3),
  },
];

const TOTAL_TIMELINE_HOURS = 6;

const STATUS_STYLES = {
  Tersedia: { dot: COLORS.sage, label: "Tersedia" },
  Digunakan: { dot: COLORS.gold, label: "Digunakan" },
  Perbaikan: { dot: COLORS.rose, label: "Perbaikan" },
};

export default function DasborTimelinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const [isMounted, setIsMounted] = useState(false);

  // Detak "real-time"
  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const timelineStart = useMemo(() => {
    // Jika hari yang dipilih adalah hari ini (isSameDay)
    if (isSameDay(selectedDate, new Date())) {
      // WAJIB pakai new Date() yang baru agar selalu dapat jam riil saat ini,
      // bukan jam 00:00 bawaan dari navigasi state selectedDate.
      return setMinutes(setSeconds(new Date(), 0), 0);
    }

    // Jika bukan hari ini (hari sebelumnya / hari depannya)
    let base = new Date(selectedDate);
    base.setHours(8, 0, 0, 0); // Mulai dari jam buka (08:00)
    return base;
  }, [selectedDate]);

  const timeColumns = useMemo(() => {
    return Array.from({ length: TOTAL_TIMELINE_HOURS }).map((_, i) =>
      addHours(timelineStart, i),
    );
  }, [timelineStart]);

  const timelineEnd = addHours(timelineStart, TOTAL_TIMELINE_HOURS);
  const totalTimelineMinutes = TOTAL_TIMELINE_HOURS * 60;

  const dateNavText = isSameDay(selectedDate, new Date())
    ? `Hari ini, ${format(selectedDate, "dd MMM", { locale: localeID })}`
    : format(selectedDate, "dd MMM yyyy", { locale: localeID });

  // Posisi garis "sekarang"
  const nowPercent = useMemo(() => {
    if (!isSameDay(selectedDate, now)) return null;
    const diffMinutes = (now.getTime() - timelineStart.getTime()) / 60000;
    if (diffMinutes < 0 || diffMinutes > totalTimelineMinutes) return null;
    return (diffMinutes / totalTimelineMinutes) * 100;
  }, [selectedDate, now, timelineStart, totalTimelineMinutes]);

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

      {/* WRAPPER KESELURUHAN TIMELINE */}
      <div
        className="w-full rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 border"
        style={{
          background: COLORS.darkCream, // Base layer: Dark Cream
          borderColor: `${COLORS.navy}15`,
        }}
      >
        {/* LEGENDA STATUS */}
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
          style={{
            background: COLORS.cream, // Grid Layer: Light Cream
            borderColor: `${COLORS.navy}15`,
          }}
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

            {/* BODY ASET & KOTAK BOOKING */}
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              {DUMMY_ASSETS.map((aset) => {
                const bookingsInRow = DUMMY_BOOKINGS.filter(
                  (b) =>
                    b.dataAset === aset._id &&
                    b.waktuSelesai > timelineStart &&
                    b.waktuMulai < timelineEnd,
                );
                const statusStyle =
                  STATUS_STYLES[aset.status as keyof typeof STATUS_STYLES] ??
                  STATUS_STYLES.Tersedia;

                return (
                  <div key={aset._id} className="flex group">
                    {/* Kolom Info Aset (Navy) */}
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
                            {aset.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Area Grid Timeline */}
                    <div
                      className="flex-1 relative min-h-22 transition-colors"
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

                      {/* Indikator Garis "Waktu Sekarang" */}
                      {isMounted && nowPercent !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-px z-1 pointer-events-none shadow-[0_0_8px_rgba(212,163,115,0.8)]"
                          style={{
                            left: `${nowPercent}%`,
                            background: COLORS.gold,
                          }}
                        >
                        </div>
                      )}

                      {/* Render Data Booking */}
                      {bookingsInRow.map((booking) => {
                        const startDiffMs =
                          booking.waktuMulai.getTime() -
                          timelineStart.getTime();
                        let startMinutes = Math.floor(startDiffMs / 60000);

                        const durationMs =
                          booking.waktuSelesai.getTime() -
                          booking.waktuMulai.getTime();
                        let durationMinutes = Math.floor(durationMs / 60000);

                        if (startMinutes < 0) {
                          durationMinutes += startMinutes;
                          startMinutes = 0;
                        }
                        if (
                          startMinutes + durationMinutes >
                          totalTimelineMinutes
                        ) {
                          durationMinutes = totalTimelineMinutes - startMinutes;
                        }

                        const leftPercent =
                          (startMinutes / totalTimelineMinutes) * 100;
                        const widthPercent =
                          (durationMinutes / totalTimelineMinutes) * 100;
                        const isMember =
                          booking.tipePelanggan.toLowerCase() === "member";

                        return (
                          <div
                            key={booking._id}
                            className="absolute top-1/2 -translate-y-1/2 p-1.5 z-10"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                          >
                            <div
                              className="w-full h-full rounded-xl p-3 flex flex-col justify-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                              style={
                                isMember
                                  ? {
                                      background: COLORS.sage,
                                      color: COLORS.cream,
                                      boxShadow: "0 2px 4px rgba(10,41,71,0.1)",
                                    }
                                  : {
                                      background: COLORS.darkCream, // Menyatu dengan tema
                                      color: COLORS.navy,
                                      border: `1px solid ${COLORS.navy}20`,
                                      borderLeft: `4px solid ${COLORS.gold}`, // Aksen emas
                                      boxShadow:
                                        "0 2px 4px rgba(10,41,71,0.05)",
                                    }
                              }
                            >
                              <span className="text-sm font-bold truncate tracking-tight">
                                {booking.namaPelanggan}
                              </span>
                              <span
                                className="text-[11px] font-semibold truncate mt-0.5 tabular-nums tracking-wide"
                                style={{
                                  color: isMember
                                    ? "rgba(255,250,243,0.8)"
                                    : `${COLORS.navy}99`,
                                }}
                              >
                                {booking.tipePelanggan} •{" "}
                                {format(booking.waktuMulai, "HH:mm")} -{" "}
                                {format(booking.waktuSelesai, "HH:mm")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
