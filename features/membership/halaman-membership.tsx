"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Membership, PaketMembership } from "@/types/membership";
import { DialogHapusMember, DialogHapusPaket, DialogPaket } from "./dialog-paket";
import { DialogMember } from "./dialog-member";
import { useDaftarMembership, useDaftarPaketMembership, useUbahPaket } from "./hooks";
import { aksiMembership } from "./izin";
import { jumlahMemberPerPaket, saringMember, teksMasa, teksSisa, urutPaket, type SaringanStatus } from "./tampilan";

type Tab = "member" | "paket";
const SARINGAN: SaringanStatus[] = ["Semua", "Aktif", "Kadaluarsa"];

function LencanaStatus({ aktif, teks }: { aktif: boolean; teks: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-kecil font-bold",
        aktif ? "bg-sage-pucat text-sage-tua" : "bg-navy/10 text-navy/70",
      )}
    >
      {teks}
    </span>
  );
}

function MenuAksi({ label, item }: { label: string; item: { teks: string; ikon: React.ReactNode; merah?: boolean; onPilih: () => void }[] }) {
  if (item.length === 0) return null;
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={label} className="h-8 w-8 text-navy/50 hover:text-navy hover:bg-navy/10 cursor-pointer">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-gading border-navy/10 rounded-xl shadow-lg">
          {item.map((i, n) => (
            <div key={i.teks}>
              {i.merah && n > 0 && <DropdownMenuSeparator className="bg-navy/5" />}
              <DropdownMenuItem
                onSelect={i.onPilih}
                className={cn(
                  "cursor-pointer font-bold rounded-lg m-1",
                  i.merah ? "text-red-600 focus:text-red-700 focus:bg-red-500/10" : "text-navy hover:bg-navy/5",
                )}
              >
                {i.ikon} {i.teks}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Laman Membership (desain B kanvas "Modul Membership", MB1a sampai MB3a;
 * pemilik proyek, 17 November 2026): tab Member dan Paket, aksi lewat
 * dialog. Membership berasal dari penjualan paket di kasir. Tab, tombol, dan
 * menu mengikuti izin endpoint-nya (keputusan rancangan butir 14).
 */
export function HalamanMembership() {
  const { permissions } = useSession();
  const aksi = aksiMembership(permissions);
  const [tab, setTab] = useState<Tab>(aksi.bacaMember ? "member" : "paket");
  const [formMember, setFormMember] = useState<{ membership: Membership | null } | null>(null);
  const [hapusMember, setHapusMember] = useState<Membership | null>(null);
  const [formPaket, setFormPaket] = useState<{ paket: PaketMembership | null } | null>(null);
  const [hapusPaket, setHapusPaket] = useState<PaketMembership | null>(null);

  const member = useDaftarMembership(aksi.bacaMember);
  const paket = useDaftarPaketMembership(aksi.bacaPaket);
  const daftarMember = useMemo(() => member.data ?? [], [member.data]);
  const daftarPaket = useMemo(() => paket.data ?? [], [paket.data]);

  const tombolKepala =
    tab === "member"
      ? aksi.daftarkan && { teks: "Daftarkan Member", aksi: () => setFormMember({ membership: null }) }
      : aksi.buatPaket && { teks: "Tambah Paket", aksi: () => setFormPaket({ paket: null }) };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-judul font-bold tracking-tight text-navy">Manajemen Membership</h1>
          <p className="text-isi font-medium text-navy/60">Kelola paket langganan dan pelanggan yang menjadi member.</p>
        </div>
        {tombolKepala && (
          <Button type="button" onClick={tombolKepala.aksi} className="cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm w-full sm:w-auto font-bold">
            <Plus className="mr-2 h-4 w-4" /> {tombolKepala.teks}
          </Button>
        )}
      </div>

      <div role="tablist" aria-label="Membership" className="flex border-b border-navy/10">
        {(["member", "paket"] as const)
          .filter((t) => (t === "member" ? aksi.bacaMember : aksi.bacaPaket))
          .map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "cursor-pointer px-4 sm:px-6 py-3 text-besar font-bold border-b-[3px] -mb-px",
                tab === t ? "border-navy text-navy" : "border-transparent text-navy/50 hover:text-navy",
              )}
            >
              {t === "member" ? "Member" : "Paket"}
            </button>
          ))}
      </div>

      {tab === "member" ? (
        <TabMember
          aksi={aksi}
          member={member}
          daftarMember={daftarMember}
          tanpaPaket={paket.isSuccess && daftarPaket.length === 0}
          onUbah={(m) => setFormMember({ membership: m })}
          onHapus={setHapusMember}
          onTambahPaket={() => {
            setTab("paket");
            if (aksi.buatPaket) setFormPaket({ paket: null });
          }}
        />
      ) : (
        <TabPaket
          aksi={aksi}
          paket={paket}
          daftarPaket={daftarPaket}
          daftarMember={daftarMember}
          onTambah={() => setFormPaket({ paket: null })}
          onUbah={(p) => setFormPaket({ paket: p })}
          onHapus={setHapusPaket}
        />
      )}

      {formMember && (
        <DialogMember
          membership={formMember.membership}
          daftarMember={daftarMember}
          daftarPaket={daftarPaket}
          onTutup={() => setFormMember(null)}
        />
      )}
      {hapusMember && <DialogHapusMember membership={hapusMember} onTutup={() => setHapusMember(null)} />}
      {formPaket && <DialogPaket paket={formPaket.paket} onTutup={() => setFormPaket(null)} />}
      {hapusPaket && <DialogHapusPaket paket={hapusPaket} onTutup={() => setHapusPaket(null)} />}
    </div>
  );
}

type Aksi = ReturnType<typeof aksiMembership>;

function GalatMuat({ galat, onCoba, memuat, teks }: { galat: unknown; onCoba: () => void; memuat: boolean; teks: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-8 text-center">
      <p className="text-isi font-medium text-red-600">{pesanError(galat, teks)}</p>
      <Button type="button" variant="outline" onClick={onCoba} disabled={memuat}>
        Coba Lagi
      </Button>
    </div>
  );
}

function TabMember({
  aksi,
  member,
  daftarMember,
  tanpaPaket,
  onUbah,
  onHapus,
  onTambahPaket,
}: {
  aksi: Aksi;
  member: ReturnType<typeof useDaftarMembership>;
  daftarMember: Membership[];
  tanpaPaket: boolean;
  onUbah: (m: Membership) => void;
  onHapus: (m: Membership) => void;
  onTambahPaket: () => void;
}) {
  const hariIni = useTanggalHariIni();
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<SaringanStatus>("Semua");
  const data = useMemo(() => saringMember(daftarMember, cari, status), [daftarMember, cari, status]);

  const kolom = useMemo<ColumnDef<Membership>[]>(
    () => [
      {
        id: "pelanggan",
        header: "Pelanggan",
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span className="font-bold text-navy">{row.original.pelanggan?.namaPelanggan ?? "Pelanggan terhapus"}</span>
            {row.original.pelanggan?.nomorHp && <span className="text-kecil text-navy/60">{row.original.pelanggan.nomorHp}</span>}
          </span>
        ),
      },
      { id: "paket", header: "Paket", cell: ({ row }) => <span className="font-semibold">{row.original.paketMembership?.namaPaket ?? "Paket terhapus"}</span> },
      {
        id: "masa",
        header: "Masa berlaku",
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span>{teksMasa(row.original)}</span>
            <span className="text-kecil text-navy/60">{teksSisa(row.original, hariIni)}</span>
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <LencanaStatus aktif={row.original.status === "Aktif"} teks={row.original.status} />,
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <MenuAksi
            label={`Aksi membership ${row.original.pelanggan?.namaPelanggan ?? ""}`}
            item={[
              ...(aksi.ubahMember ? [{ teks: "Ubah", ikon: <Edit className="mr-2 h-4 w-4" />, onPilih: () => onUbah(row.original) }] : []),
              ...(aksi.hapusMember
                ? [{ teks: "Hapus", ikon: <Trash2 className="mr-2 h-4 w-4" />, merah: true, onPilih: () => onHapus(row.original) }]
                : []),
            ]}
          />
        ),
      },
    ],
    [aksi.ubahMember, aksi.hapusMember, hariIni, onUbah, onHapus],
  );

  if (member.isError) {
    return <GalatMuat galat={member.error} onCoba={() => void member.refetch()} memuat={member.isFetching} teks="Gagal memuat membership." />;
  }
  if (member.isSuccess && daftarMember.length === 0 && tanpaPaket) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-navy/20 bg-krem p-6 sm:p-8">
        <h2 className="text-subjudul font-bold text-navy">Belum ada paket membership</h2>
        <p className="text-isi font-medium text-navy/70">
          Member didaftarkan dengan memilih paket. Buat paket pertama dulu, misalnya Member Bulanan 30 hari.
        </p>
        {aksi.buatPaket && (
          <Button type="button" onClick={onTambahPaket} className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold">
            <Plus className="mr-2 h-4 w-4" /> Tambah Paket
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          aria-label="Cari nama pelanggan"
          placeholder="Cari nama pelanggan..."
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          className="sm:max-w-sm h-11 bg-white border-navy/15 text-navy rounded-xl px-4"
        />
        <div role="group" aria-label="Saringan status" className="grid grid-cols-3 gap-1 rounded-lg bg-krem p-1">
          {SARINGAN.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "cursor-pointer rounded-md px-4 py-2 text-kecil font-bold",
                status === s ? "bg-navy text-gading" : "text-navy/70 hover:text-navy",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={kolom}
        data={data}
        loading={member.isPending}
        emptyMessage={daftarMember.length === 0 ? "Belum ada member." : "Tidak ada member yang cocok."}
      />
    </div>
  );
}

function TabPaket({
  aksi,
  paket,
  daftarPaket,
  daftarMember,
  onTambah,
  onUbah,
  onHapus,
}: {
  aksi: Aksi;
  paket: ReturnType<typeof useDaftarPaketMembership>;
  daftarPaket: PaketMembership[];
  daftarMember: Membership[];
  onTambah: () => void;
  onUbah: (p: PaketMembership) => void;
  onHapus: (p: PaketMembership) => void;
}) {
  const jumlah = useMemo(() => jumlahMemberPerPaket(daftarMember), [daftarMember]);
  const urut = useMemo(() => urutPaket(daftarPaket), [daftarPaket]);
  const ubahStatus = useUbahPaket({
    onSuccess: () => toast.success("Status paket diperbarui"),
    onError: (err) => toast.error(pesanError(err, "Gagal mengubah status paket.")),
  });

  if (paket.isError) {
    return <GalatMuat galat={paket.error} onCoba={() => void paket.refetch()} memuat={paket.isFetching} teks="Gagal memuat paket membership." />;
  }
  if (paket.isPending) return <p className="text-isi text-navy/60">Memuat paket...</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {urut.map((p) => {
          const aktif = p.status === "Aktif";
          return (
            <article
              key={p.id}
              aria-label={`Paket ${p.namaPaket}`}
              className={cn("flex flex-col gap-2.5 rounded-2xl border border-navy/10 bg-krem p-4 sm:p-6", !aktif && "opacity-60")}
            >
              <div className="flex items-center justify-between">
                <LencanaStatus aktif={aktif} teks={p.status} />
                <MenuAksi
                  label={`Aksi paket ${p.namaPaket}`}
                  item={[
                    ...(aksi.ubahPaket
                      ? [
                          { teks: "Ubah", ikon: <Edit className="mr-2 h-4 w-4" />, onPilih: () => onUbah(p) },
                          {
                            teks: aktif ? "Nonaktifkan" : "Aktifkan",
                            ikon: <Power className="mr-2 h-4 w-4" />,
                            onPilih: () => ubahStatus.mutate({ id: p.id, payload: { status: aktif ? "Non-Aktif" : "Aktif" } }),
                          },
                        ]
                      : []),
                    ...(aksi.hapusPaket ? [{ teks: "Hapus", ikon: <Trash2 className="mr-2 h-4 w-4" />, merah: true, onPilih: () => onHapus(p) }] : []),
                  ]}
                />
              </div>
              <h2 className="text-subjudul font-bold text-navy">{p.namaPaket}</h2>
              <p className="text-judul font-black text-navy">{formatRupiah(p.harga)}</p>
              <p className="text-isi text-navy/70">
                {p.durasiHari} hari · {jumlah.get(p.id) ?? 0} member aktif
              </p>
              {p.deskripsi && <p className="text-kecil text-navy/70">{p.deskripsi}</p>}
            </article>
          );
        })}
        {aksi.buatPaket && (
          <button
            type="button"
            onClick={onTambah}
            className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-navy/25 text-besar font-bold text-navy/70 hover:border-navy/40 hover:text-navy"
          >
            <Plus className="h-5 w-5" /> Tambah Paket
            <span className="text-kecil font-medium">nama, harga, durasi hari, deskripsi</span>
          </button>
        )}
      </div>
      {urut.length === 0 && !aksi.buatPaket && <p className="text-isi text-navy/70">Belum ada paket membership.</p>}
      <p className="text-kecil text-navy/60">Paket yang sudah dipakai member tidak dapat dihapus, hanya dinonaktifkan.</p>
    </div>
  );
}
