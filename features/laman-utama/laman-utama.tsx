import Link from "next/link";
import { TandaTachyon } from "@/features/auth/tanda-tachyon";
import { cn } from "@/lib/utils";
import { IlustrasiDasbor } from "./ilustrasi-dasbor";
import { LANGKAH, NAV_BAGIAN, PAKET, RUANG } from "./konten";
import { Muncul } from "./muncul";
import { TanyaJawab } from "./tanya-jawab";
import { TombolAkun } from "./tombol-akun";

/**
 * Laman utama di / (desain G kanvas "Laman Utama Tachyon POS", LU1a):
 * navbar dan hero desain F berlatar navy dengan tiruan Dashboard Outlet,
 * ruang outlet dan gudang desain C, tiga paket desain B, tahapan mulai dan
 * banner desain A, lalu tanya jawab desain E. Judul besar dikecualikan dari
 * skala tipografi (CV25a, LU5a).
 */

const WADAH = "mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-16";
const TAUTAN = "rounded-sm hover:text-karamel focus-visible:outline-2 focus-visible:outline-offset-2";

function Merek({ besar }: { besar?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", TAUTAN)}>
      <TandaTachyon ukuran={besar ? 34 : 28} />
      <span className={cn("font-extrabold", besar ? "text-subjudul" : "text-besar sm:text-subjudul")}>Tachyon POS</span>
    </Link>
  );
}

function Hero() {
  return (
    <div className="bg-navy bg-[radial-gradient(rgba(255,250,243,0.1)_1px,transparent_1px)] bg-[size:22px_22px] text-gading md:bg-[size:28px_28px]">
      <header className={cn(WADAH, "flex items-center justify-between gap-6 py-3.5 md:py-5")}>
        <Merek />
        <nav aria-label="Bagian laman" className="hidden gap-8 text-isi font-semibold text-gading/75 lg:flex">
          {NAV_BAGIAN.map((n) => (
            <a key={n.href} href={n.href} className={TAUTAN}>
              {n.label}
            </a>
          ))}
        </nav>
        <TombolAkun varian="navbar" className="flex items-center gap-3" />
      </header>

      <section aria-labelledby="judul-hero" className={cn(WADAH, "flex flex-col gap-4 pt-8 md:gap-6 md:pt-[72px]")}>
        <span
          className="laman-naik self-start font-mono text-mikro tracking-[0.06em] text-sage-pucat md:text-kecil"
          style={{ "--tunda": "0ms" } as React.CSSProperties}
        >
          KASIR · STOK · KEUANGAN · SHIFT
        </span>
        <h1
          id="judul-hero"
          // eslint-disable-next-line no-restricted-syntax -- teks hero di luar skala tipografi (CV25a, LU5a)
          className="laman-naik max-w-[12em] text-[44px] leading-[0.98] font-black tracking-[-0.04em] md:text-[64px] xl:text-[80px]"
          style={{ "--tunda": "120ms" } as React.CSSProperties}
        >
          Toko Anda, terbaca{" "}
          <span className="text-sage-pucat underline decoration-sage-pucat/45 decoration-4 underline-offset-8 md:decoration-[6px] md:underline-offset-[12px]">
            dalam satu layar.
          </span>
        </h1>
        <p
          className="laman-naik max-w-[34em] text-besar leading-relaxed text-gading/90 md:text-subjudul"
          style={{ "--tunda": "240ms" } as React.CSSProperties}
        >
          <span className="md:hidden">Omzet, status venue, dan karyawan yang bertugas, langsung saat Anda masuk.</span>
          <span className="hidden md:inline">
            Dasbor outlet menampilkan omzet, pendapatan bulan ini, status venue, dan karyawan yang bertugas, langsung
            saat Anda masuk.
          </span>
        </p>
      </section>

      <div className={cn(WADAH, "pt-9 md:pt-12")}>
        <IlustrasiDasbor />
      </div>
    </div>
  );
}

function Ruang() {
  return (
    <section id="ruang" aria-label="Ruang kerja" className={cn(WADAH, "grid gap-9 py-11 md:grid-cols-2 md:gap-0 md:py-24")}>
      {RUANG.map((r, i) => (
        <Muncul
          key={r.label}
          tunda={i * 120}
          className={cn("flex flex-col gap-3 md:gap-5", i === 0 ? "md:border-r md:border-navy/15 md:pr-12" : "md:pl-12")}
        >
          <span className="font-mono text-mikro font-semibold uppercase tracking-[0.08em] text-cokelat md:text-kecil">
            {r.label}
          </span>
          {/* eslint-disable-next-line no-restricted-syntax -- judul bagian di luar skala tipografi (CV25a, LU5a) */}
          <h2 className="text-[28px] leading-[1.05] font-extrabold tracking-[-0.02em] md:text-[40px]">{r.judul}</h2>
          <p className="text-besar leading-relaxed text-navy/75">{r.isi}</p>
          <ul className="flex flex-col">
            {r.daftar.map((d) => (
              <li key={d} className="border-t border-navy/12 py-2.5 text-besar font-semibold md:py-3">
                {d}
              </li>
            ))}
          </ul>
        </Muncul>
      ))}
    </section>
  );
}

function Paket() {
  return (
    <section id="paket" aria-labelledby="judul-paket" className="bg-krem">
      <div className={cn(WADAH, "flex flex-col gap-6 py-11 md:gap-9 md:py-20")}>
        <Muncul className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          {/* eslint-disable-next-line no-restricted-syntax -- judul bagian di luar skala tipografi (CV25a, LU5a) */}
          <h2 id="judul-paket" className="text-[30px] font-extrabold tracking-[-0.02em] md:text-[40px]">
            Pilih sesuai toko Anda
          </h2>
          <p className="max-w-[30em] text-isi leading-relaxed text-navy/75 md:text-besar">
            Semua akun baru mulai dengan masa coba. Naik paket kapan saja; kasir tetap berjalan selama setup fitur
            barunya.
          </p>
        </Muncul>
        <div className="grid gap-8 md:grid-cols-3">
          {PAKET.map((p, i) => (
            <Muncul key={p.nama} tunda={i * 120} className={cn("flex flex-col gap-2 border-t-4 pt-4 md:gap-3 md:pt-5", p.garis)}>
              <h3 className="text-judul font-black md:text-tampilan">{p.nama}</h3>
              <p className="text-isi text-navy/75 md:text-besar">{p.untuk}</p>
              <ul className="mt-1 flex flex-col gap-1.5 text-isi md:mt-2 md:gap-2 md:text-besar">
                {p.fitur.map((f) => (
                  <li key={f.teks} className={f.ada ? "text-navy" : "text-navy/70 line-through"}>
                    {f.ada ? null : <span className="sr-only">Tidak termasuk: </span>}
                    {f.teks}
                  </li>
                ))}
              </ul>
            </Muncul>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mulai() {
  return (
    <section id="mulai" aria-label="Cara mulai">
      <ol className={cn(WADAH, "grid gap-7 py-10 md:grid-cols-3 md:gap-10 md:py-[88px]")}>
        {LANGKAH.map((l, i) => (
          <Muncul
            as="li"
            key={l.no}
            tunda={i * 120}
            className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 md:flex md:flex-col"
          >
            {/* eslint-disable-next-line no-restricted-syntax -- angka langkah di luar skala tipografi (CV25a, LU5a) */}
            <span aria-hidden="true" className="font-mono text-[40px] leading-none font-medium text-karamel md:text-[56px]">
              {l.no}
            </span>
            <div className="flex flex-col gap-1.5 md:gap-3">
              <h3 className="text-subjudul font-extrabold md:text-judul">{l.judul}</h3>
              <p className="text-isi leading-relaxed text-navy/75 md:text-besar">{l.isi}</p>
            </div>
          </Muncul>
        ))}
      </ol>
      <div className={cn(WADAH, "pb-4 md:pb-8")}>
        <Muncul className="flex flex-col gap-4 rounded-2xl bg-navy px-5 py-8 text-gading md:flex-row md:items-center md:justify-between md:gap-8 md:rounded-[20px] md:p-10 lg:p-16">
          {/* eslint-disable-next-line no-restricted-syntax -- judul banner di luar skala tipografi (CV25a, LU5a) */}
          <h2 className="max-w-[13em] text-[30px] leading-[1.05] font-black tracking-[-0.02em] md:text-[44px]">
            Buka kasir pertama Anda hari ini.
          </h2>
          <TombolAkun varian="banner" className="flex shrink-0 flex-col gap-3 sm:flex-row [&>a]:h-11 md:[&>a]:h-[52px] md:[&>a]:px-7" />
        </Muncul>
      </div>
    </section>
  );
}

function Tanya() {
  return (
    <section
      id="tanya"
      aria-labelledby="judul-tanya"
      className={cn(WADAH, "grid items-start gap-5 pt-10 pb-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-14 md:pt-[88px] md:pb-[104px]")}
    >
      <Muncul>
        {/* eslint-disable-next-line no-restricted-syntax -- judul bagian di luar skala tipografi (CV25a, LU5a) */}
        <h2 id="judul-tanya" className="text-[32px] leading-none font-black tracking-[-0.03em] md:text-[52px]">
          Tanya jawab
        </h2>
      </Muncul>
      <Muncul tunda={120}>
        <TanyaJawab />
      </Muncul>
    </section>
  );
}

function Kaki() {
  const akun = [
    { href: "/login", label: "Masuk" },
    { href: "/daftar", label: "Coba gratis" },
    { href: "/lupa-password", label: "Lupa password" },
  ];
  return (
    <footer className="bg-krem text-navy">
      <div className={cn(WADAH, "flex flex-col gap-6 pt-9 pb-7 md:gap-10 md:pt-14 md:pb-8")}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
          <div className="col-span-2 flex flex-col gap-2.5 md:col-span-1 md:gap-3.5">
            <Merek besar />
            <p className="max-w-[26em] text-besar leading-relaxed">
              Kasir, stok, keuangan, dan jadwal shift untuk kafe, kedai, dan toko, dalam satu aplikasi.
            </p>
          </div>
          <nav aria-label="Produk" className="flex flex-col gap-2.5 text-besar md:gap-3">
            <strong className="text-kecil uppercase tracking-[0.06em] md:text-isi">Produk</strong>
            {NAV_BAGIAN.map((n) => (
              <a key={n.href} href={n.href} className={cn("self-start", TAUTAN)}>
                {n.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Akun" className="flex flex-col gap-2.5 text-besar md:gap-3">
            <strong className="text-kecil uppercase tracking-[0.06em] md:text-isi">Akun</strong>
            {akun.map((n) => (
              <Link key={n.href} href={n.href} className={cn("self-start", TAUTAN)}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-1 border-t border-navy/20 pt-4 text-kecil md:flex-row md:justify-between md:pt-5 md:text-isi">
          <span>© 2026 Tachyon POS. Hak cipta dilindungi.</span>
          <span>Dibuat untuk toko di Indonesia</span>
        </div>
      </div>
    </footer>
  );
}

export function LamanUtama() {
  return (
    <div className="flex min-h-full flex-col overflow-x-clip bg-gading text-navy">
      <Hero />
      <main>
        <Ruang />
        <Paket />
        <Mulai />
        <Tanya />
      </main>
      <Kaki />
    </div>
  );
}
