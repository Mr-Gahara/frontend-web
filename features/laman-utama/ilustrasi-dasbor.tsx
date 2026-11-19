import { Fragment } from "react";
import {
  Banknote,
  Bell,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  LineChart,
  Package,
  PanelLeft,
  Receipt,
  Store,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { outletMenus } from "@/components/sidebar-menu";
import { cn } from "@/lib/utils";
import { KPI_CONTOH, VENUE_CONTOH, type StatusVenue } from "./konten";

/**
 * Tiruan Dashboard Outlet untuk hero laman utama (LU2a): komponen statis
 * yang meniru tata letak dasbor asli, dengan menu sidebar dari outletMenus
 * yang sama dengan sidebar aplikasi. Ditulis pada ukuran layar aslinya
 * (1440 × 900 untuk desktop, 390 × 760 untuk HP) lalu diperkecil, dan
 * kartunya dibaringkan ke belakang (laman-rebah) tanpa garis tepi agar
 * menyatu dengan latar navy hero. Seluruhnya satu gambar bagi pembaca
 * layar; datanya contoh.
 */

const IKON_KPI: LucideIcon[] = [Banknote, Receipt, TrendingUp, Package];

const GAYA_VENUE: Record<StatusVenue, { titik: string; teks: string; garis: string }> = {
  Dipakai: { titik: "bg-navy", teks: "text-navy", garis: "border-navy/15" },
  Kosong: { titik: "bg-sage", teks: "text-navy", garis: "border-navy/15" },
  Perbaikan: { titik: "bg-orange-600", teks: "text-orange-700", garis: "border-dashed border-amber-500" },
};

function TombolTopbar({ ikon: Ikon }: { ikon: LucideIcon }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-[10px] bg-navy text-gading">
      <Ikon className="size-5" />
    </span>
  );
}

function PemicuSidebar() {
  return (
    <span className="flex size-[26px] items-center justify-center rounded-md bg-navy text-gading">
      <PanelLeft className="size-4" />
    </span>
  );
}

function KartuKpi({ i, hp }: { i: number; hp?: boolean }) {
  const k = KPI_CONTOH[i];
  const Ikon = IKON_KPI[i];
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between border-t-4 border-karamel bg-navy text-gading",
        hp ? "gap-2 rounded-2xl p-3" : "h-[156px] gap-3 rounded-3xl p-5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn("font-semibold leading-snug text-krem/80", hp ? "text-kecil" : "text-isi")}>{k.judul}</span>
        <span className={cn("shrink-0 bg-karamel/20 text-karamel", hp ? "rounded-lg p-1.5" : "rounded-xl p-2")}>
          <Ikon className={hp ? "size-4" : "size-5"} />
        </span>
      </div>
      <strong className={cn("font-black tracking-tight", hp ? "text-besar" : "text-judul")}>{k.nilai}</strong>
      <span className={cn("flex items-center gap-2", hp ? "text-mikro" : "text-kecil")}>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-bold",
            k.naik ? "bg-sage-muda/20 text-sage-muda" : "bg-krem/10 text-krem",
          )}
        >
          {k.tren}
        </span>
        {!hp && <span className="font-medium text-krem/70">{k.pembanding}</span>}
      </span>
    </div>
  );
}

function StatusVenueTiruan({ kolom, jumlah }: { kolom: 2 | 3; jumlah: number }) {
  const legenda: [string, string][] = [
    ["bg-navy", "Dipakai 3"],
    ["bg-sage", "Kosong 4"],
    ["bg-orange-600", "Perbaikan 1"],
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <strong className="text-subjudul">Status Venue</strong>
        <span className="text-kecil text-navy/70">3 dari 8 dipakai</span>
      </div>
      <span className="block h-2 overflow-hidden rounded-full bg-navy/10">
        <span className="block h-full w-[37%] rounded-full bg-navy" />
      </span>
      <div className="flex gap-3 text-kecil">
        {legenda.map(([warna, teks]) => (
          <span key={teks} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", warna)} />
            {teks}
          </span>
        ))}
      </div>
      <div className={cn("grid gap-2", kolom === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {VENUE_CONTOH.slice(0, jumlah).map((v) => {
          const g = GAYA_VENUE[v.status];
          return (
            <div key={v.nama} className={cn("flex flex-col gap-1 rounded-xl border bg-gading px-3 py-2.5", g.garis)}>
              <strong className="text-kecil">{v.nama}</strong>
              <span className={cn("flex items-center gap-1.5 text-mikro font-medium", g.teks)}>
                <span className={cn("size-2 rounded-full", g.titik)} />
                {v.status}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Layar desktop 1440 × 900: sidebar outlet dan panel gading Dashboard Outlet. */
function LayarDesktop() {
  return (
    <div className="relative h-[900px] w-[1440px] bg-navy text-gading">
      <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col overflow-hidden px-2 py-4">
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700">
            <Store className="size-[18px]" />
          </span>
          <span className="flex flex-1 flex-col">
            <strong className="text-isi">Kedai Contoh</strong>
            <span className="text-kecil text-gading/70">Outlet Ops.</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-gading/70" />
        </div>
        {outletMenus.map((g, gi) => (
          <Fragment key={g.grup ?? gi}>
            {g.grup && (
              <span className="block px-2 pt-4 pb-2 text-mikro uppercase tracking-[0.08em] text-gading/60">
                {g.grup}
              </span>
            )}
            {g.items.map((m, mi) => (
              <div
                key={m.label}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2 text-isi font-medium",
                  gi === 0 && mi === 0 && "bg-gading/30",
                )}
              >
                <m.icon className="size-4" />
                <span className="flex-1">{m.label}</span>
                {m.subItems?.length ? <ChevronRight className="size-3.5 text-gading/70" /> : null}
              </div>
            ))}
          </Fragment>
        ))}
        <div className="mt-auto flex items-center gap-2.5 bg-navy p-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-karamel text-kecil font-extrabold text-navy">
            S
          </span>
          <span className="flex flex-col">
            <strong className="text-isi">Sinta</strong>
            <span className="text-kecil text-gading/70">Owner</span>
          </span>
        </div>
      </aside>

      <div className="absolute top-4 right-6 bottom-4 left-[272px] overflow-hidden rounded-[28px] bg-gading px-8 py-5 text-navy">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PemicuSidebar />
            <strong className="text-besar font-semibold">Kamis, 19 November 2026</strong>
          </div>
          <div className="flex gap-2">
            <TombolTopbar ikon={CircleHelp} />
            <TombolTopbar ikon={Bell} />
          </div>
        </div>

        <div className="mt-[76px] grid grid-cols-4 gap-4">
          {KPI_CONTOH.map((k, i) => (
            <KartuKpi key={k.judul} i={i} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-6">
          <div className="flex h-[474px] flex-col gap-2.5 rounded-3xl border border-navy/10 bg-krem p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-karamel text-navy">
                <LineChart className="size-5" />
              </span>
              <strong className="text-subjudul">Pendapatan Bulan Ini</strong>
            </div>
            <div className="flex items-center gap-3">
              <strong className="text-tampilan font-black">Rp 48.360.000</strong>
              <span className="rounded-full bg-sage/20 px-2.5 py-0.5 text-kecil font-extrabold text-sage-tua">
                ↑ 18,4%
              </span>
              <span className="text-kecil text-navy/70">vs periode sebelumnya</span>
            </div>
            <svg viewBox="0 0 560 270" className="w-full flex-1">
              <g className="stroke-navy/15" strokeDasharray="4 6">
                {[20, 85, 150, 215].map((y) => (
                  <line key={y} x1="0" y1={y} x2="560" y2={y} />
                ))}
              </g>
              <path
                d="M0 150 C 30 120, 45 190, 70 170 S 120 110, 150 140 S 200 90, 230 120 S 280 160, 310 110 S 360 40, 390 80 S 440 130, 470 70 S 530 30, 560 55 L560 245 L0 245Z"
                className="fill-sage/15"
              />
              <path
                d="M0 150 C 30 120, 45 190, 70 170 S 120 110, 150 140 S 200 90, 230 120 S 280 160, 310 110 S 360 40, 390 80 S 440 130, 470 70 S 530 30, 560 55"
                fill="none"
                className="stroke-sage"
                strokeWidth="3"
              />
              <g className="fill-navy/60" fontSize="11">
                {[
                  [0, "1 Nov"],
                  [140, "6 Nov"],
                  [290, "11 Nov"],
                  [440, "16 Nov"],
                ].map(([x, t]) => (
                  <text key={t} x={x} y="266">
                    {t}
                  </text>
                ))}
              </g>
            </svg>
          </div>
          <div className="flex h-[474px] flex-col gap-3 rounded-3xl border border-navy/10 bg-krem p-6">
            <StatusVenueTiruan kolom={2} jumlah={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Layar HP 390 × 760: panel gading berbingkai navy, KPI 2 × 2, lalu Status Venue. */
function LayarHp() {
  return (
    <div className="h-[760px] w-[390px] bg-navy p-3">
      <div className="flex h-full flex-col gap-3.5 rounded-3xl bg-gading px-4 py-[22px] text-navy">
        <div className="flex items-center justify-between gap-2.5">
          <PemicuSidebar />
          <strong className="flex-1 text-besar font-semibold leading-snug">Kamis, 19 November 2026</strong>
          <TombolTopbar ikon={CircleHelp} />
          <TombolTopbar ikon={Bell} />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-2">
          {KPI_CONTOH.map((k, i) => (
            <KartuKpi key={k.judul} i={i} hp />
          ))}
        </div>
        <div className="flex flex-col gap-2.5 rounded-[20px] border border-navy/10 bg-krem p-4">
          <StatusVenueTiruan kolom={3} jumlah={6} />
        </div>
      </div>
    </div>
  );
}

export function IlustrasiDasbor() {
  return (
    <figure className="m-0">
      {/* HP: bingkai ponsel 300 × 600 berisi layar 390 px diperkecil 0,7282. */}
      <div
        role="img"
        aria-label="Dasbor outlet Tachyon POS di HP, data contoh"
        className="mx-auto w-[300px] pb-9 [perspective:1100px] [perspective-origin:50%_10%] md:hidden"
      >
        <div
          className="laman-rebah h-[600px] w-[300px] overflow-hidden rounded-[36px] border-8 border-navy bg-navy"
          style={{ "--miring": "18deg" } as React.CSSProperties}
        >
          <div className="origin-top-left [text-rendering:geometricPrecision] scale-[0.7282]">
            <LayarHp />
          </div>
        </div>
      </div>

      {/* Tablet dan desktop: layar 1440 px diperkecil mengikuti lebar isi. */}
      <div
        role="img"
        aria-label="Dasbor outlet Tachyon POS dengan sidebar, data contoh"
        className="hidden pb-16 [perspective:1700px] [perspective-origin:50%_10%] md:block"
      >
        <div
          className="laman-rebah mx-auto overflow-hidden rounded-[20px] md:h-[440px] md:w-[704px] lg:h-[560px] lg:w-[896px] xl:h-[720px] xl:w-[1152px]"
          style={{ "--miring": "22deg" } as React.CSSProperties}
        >
          <div className="origin-top-left [text-rendering:geometricPrecision] md:scale-[0.48889] lg:scale-[0.62222] xl:scale-[0.8]">
            <LayarDesktop />
          </div>
        </div>
      </div>

      <figcaption className="pb-7 text-center text-kecil text-gading/85">
        <span className="md:hidden">Tampilan Dashboard Outlet di HP; data contoh.</span>
        <span className="hidden md:inline">Tampilan Dashboard Outlet di aplikasi; data contoh.</span>
      </figcaption>
    </figure>
  );
}
