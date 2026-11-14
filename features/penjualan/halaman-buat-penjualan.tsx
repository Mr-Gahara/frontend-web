"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";
import { pesanError } from "@/lib/api/error";
import { useLokasiAktif } from "@/features/inventaris/hooks";
import { useDaftarPelanggan } from "@/features/pelanggan/hooks";
import { useDaftarDiskon } from "@/features/diskon/hooks";
import { diskonAktif } from "@/features/diskon/filter";
import { useDaftarPajak } from "@/features/pajak/hooks";
import { pajakTransaksiAktif } from "@/features/pajak/filter";
import { useBuatPenjualan } from "./hooks";
import { emptyItem, hitungSimulasi, type ItemState } from "./simulasi";
import { KartuItemPenjualan } from "./kartu-item-penjualan";
import { RingkasanTagihan } from "./ringkasan-tagihan";
import { KartuPelanggan } from "./kartu-pelanggan";
import { KartuDiskonGlobal } from "./kartu-diskon-global";
import { toggleDiskonSelection } from "./pilihan-diskon";
import { DialogKonfirmasiPenjualan } from "./dialog-konfirmasi-penjualan";
import { susunPayloadPenjualan, validasiPenjualan, waktuTransaksi, type WaktuTransaksi } from "./payload";
import { InputWaktu } from "@/components/input-waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { waktuLengkap, type NilaiWaktu } from "@/lib/waktu";
import { bolehCakupanPenjualan } from "./izin";
import { JenisPenjualan, PenjualanRequest } from "@/types/penjualan";
import { useDaftarProduk } from "@/features/produk/hooks";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Receipt, ShoppingCart } from "lucide-react";

export default function HalamanBuatPenjualan() {
  const router = useRouter();

  // Kasir dicatat backend dari token (backend 465b438), sehingga id pengguna
  // tidak dikirim; sesi hanya dibutuhkan untuk izin lokasi.
  const { permissions } = useSession();
  // Outlet tenant hanya dapat dibaca pemegang read-location (keputusan K11b
  // dan K13a); tanpa izin itu locationID tidak dikirim.
  const outletTenant = useLokasiAktif({ aktif: bolehCakupanPenjualan(permissions) });
  // Satu kunci idempotensi per pengisian form (keputusan K3a): dibuat saat form
  // pertama kali lolos validasi dan dipakai ulang bila permintaan diulang.
  const kunciIdempotensi = useRef<string | null>(null);

  // FORM STATE
  const [pelangganID, setPelangganID] = useState("");
  const [jenisPenjualan, setJenisPenjualan] = useState<
    "dine-in" | "takeaway" | "booking"
  >("dine-in");
  // Tanggal dan jam transaksi mengikuti jam berjalan sampai kasir mengubah
  // salah satunya; yang tidak diubah memakai waktu saat simpan, sehingga
  // penjualan yang dikonfirmasi lewat tengah malam tidak masuk hari kemarin
  // (keputusan pemilik proyek, 26 Oktober 2026).
  const jamBerjalan = useJamBerjalan();
  const [waktuDipilih, setWaktuDipilih] = useState<WaktuTransaksi | null>(null);
  const { tanggal: tanggalInput, waktu } = waktuTransaksi(waktuDipilih, jamBerjalan);
  const setTanggalInput = (tanggal: Date) => setWaktuDipilih({ tanggal, waktu });
  const setWaktu = (baru: NilaiWaktu) => setWaktuDipilih({ tanggal: tanggalInput, waktu: baru });
  const [keterangan, setKeterangan] = useState("");
  const [items, setItems] = useState<ItemState[]>([emptyItem()]);
  const [diskonGlobalIDs, setDiskonGlobalIDs] = useState<string[]>([]); // State Diskon Global
  const [formError, setFormError] = useState("");

  // ALERT DIALOG STATE
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PenjualanRequest | null>(
    null,
  );

  // COMBOBOX & POPOVER STATE
  const [openProduk, setOpenProduk] = useState<number | null>(null);
  const [openDiskonItem, setOpenDiskonItem] = useState<number | null>(null);

  // --- QUERY FETCHING ---
  const { data: pelangganList = [] } = useDaftarPelanggan();
  const { data: produkList = [] } = useDaftarProduk();
  const { data: diskonList = [] } = useDaftarDiskon();
  const { data: pajakList = [] } = useDaftarPajak();

  // --- FILTERING AKTIF SAJA ---
  const activeDiskonItem = useMemo(
    () =>
      diskonAktif(diskonList, "Item"),
    [diskonList],
  );
  const activeDiskonGlobal = useMemo(
    () =>
      diskonAktif(diskonList, "Global"),
    [diskonList],
  );
  const activePajakGlobal = useMemo(
    () =>
      pajakTransaksiAktif(pajakList),
    [pajakList],
  );


  // --- ITEM HANDLERS ---
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handlePilihProduk = useCallback((index: number, produkID: string) => {
    setItems((prev) => {
      const exist = prev.findIndex(
        (item, i) => i !== index && item.produkID === produkID,
      );
      if (exist !== -1) {
        return prev
          .map((item, i) => {
            if (i !== exist) return item;
            const newJumlah = item.jumlah + prev[index].jumlah;
            return { ...item, jumlah: newJumlah, jumlahStr: String(newJumlah) };
          })
          .filter((_, i) => i !== index);
      }
      return prev.map((item, i) =>
        i === index ? { ...item, produkID } : item,
      );
    });
    setOpenProduk(null);
  }, []);

  const handleJumlahChange = (index: number, raw: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, jumlahStr: raw } : item)),
    );
  };

  const handleJumlahBlur = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const parsed = parseInt(item.jumlahStr, 10);
        const jumlah = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        return { ...item, jumlah, jumlahStr: String(jumlah) };
      }),
    );
  };

  const toggleItemDiskon = (index: number, diskonId: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          diskonItemIDs: toggleDiskonSelection(
            item.diskonItemIDs,
            diskonId,
            activeDiskonItem,
          ),
        };
      }),
    );
  };

  const getProdukNama = (produkID: string) =>
    produkList.find((p) => p.id === produkID)?.namaProduk ?? "";

  // ==========================================
  //  ENGINE SIMULASI KALKULASI FRONTEND
  // ==========================================
  const calc = useMemo(
    () =>
      hitungSimulasi({
        items,
        produkList,
        activeDiskonItem,
        activeDiskonGlobal,
        diskonGlobalIDs,
        activePajakGlobal,
      }),
    [items, produkList, activeDiskonItem, activeDiskonGlobal, diskonGlobalIDs, activePajakGlobal],
  );

  // --- SUBMIT LOGIC ---
  // Dialog konfirmasi hanya tertutup saat berhasil; saat gagal tetap terbuka
  // beserta pesannya (keputusan Fase 0).
  const createMutation = useBuatPenjualan({
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Penjualan berhasil dibuat (Draft).",
      });
      setShowConfirm(false);
      router.push("/dashboard/outlet/penjualan");
    },
    onError: (err) => {
      toast.error("Gagal Memproses", {
        description: pesanError(err, "Gagal membuat penjualan."),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pesan = validasiPenjualan({ pelangganID, items, waktu });
    setFormError(pesan ?? "");
    if (pesan) return;
    setPendingPayload(
      susunPayloadPenjualan({
        pelangganID,
        jenisPenjualan,
        ...waktuTransaksi(waktuDipilih, new Date()),
        items,
        diskonGlobalIDs,
        keterangan,
        locationID: outletTenant.lokasiId || undefined,
      }),
    );
    kunciIdempotensi.current ??= crypto.randomUUID();
    setShowConfirm(true);
  };

  const executeCreate = () => {
    if (!pendingPayload) return;
    createMutation.mutate({
      payload: pendingPayload,
      kunci: kunciIdempotensi.current ?? crypto.randomUUID(),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/penjualan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Penjualan
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Buat Penjualan
          </h1>
          <p className="text-sm font-medium text-navy/60">
            Isi detail transaksi untuk membuat struk/invoice penjualan baru.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {/* Kedua kolom dibungkus grid sendiri: kolom kanan yang sticky
            dibatasi pembungkusnya, sehingga berhenti di atas baris aksi dan
            tidak menutupi tombol Buat Penjualan saat digulir. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= KOLOM KIRI (UTAMA) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* INFO TRANSAKSI */}
          <div className="rounded-2xl border border-navy/10 bg-krem p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Receipt className="w-5 h-5 text-karamel" />
              Informasi Transaksi
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-bold text-navy">
                Jenis Penjualan
              </label>
              <Select
                value={jenisPenjualan}
                onValueChange={(val) => setJenisPenjualan(val as JenisPenjualan)}
              >
                <SelectTrigger className="w-full h-12 cursor-pointer font-bold bg-gading border-navy/20 text-navy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gading border-navy/10 text-navy">
                  <SelectItem
                    value="dine-in"
                    className="cursor-pointer py-3 font-bold hover:bg-navy/5"
                  >
                    Dine-in
                  </SelectItem>
                  <SelectItem
                    value="takeaway"
                    className="cursor-pointer py-3 font-bold hover:bg-navy/5"
                  >
                    Takeaway
                  </SelectItem>
                  <SelectItem
                    value="booking"
                    className="cursor-pointer py-3 font-bold hover:bg-navy/5"
                  >
                    Booking
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tanggal-transaksi" className="text-sm font-bold text-navy">
                  Tanggal Transaksi
                </label>
                <PilihTanggal
                  id="tanggal-transaksi"
                  label="Tanggal Transaksi"
                  value={tanggalInput}
                  onChange={setTanggalInput}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="jam-transaksi" className="text-sm font-bold text-navy">
                  Jam Transaksi
                </label>
                <InputWaktu
                  id="jam-transaksi"
                  label="Jam Transaksi"
                  value={waktu}
                  onChange={setWaktu}
                  invalid={formError !== "" && !waktuLengkap(waktu)}
                />
              </div>
            </div>
          </div>

          {/* ITEM PENJUALAN */}
          <div className="rounded-2xl border border-navy/10 bg-krem p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-karamel" />
                Item Penjualan
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="cursor-pointer border-navy/20 bg-gading text-navy font-bold hover:bg-navy/5 shadow-sm"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item, index) => {
                const selectedProduk = produkList.find(
                  (p) => p.id === item.produkID,
                );
                const itemCalc = calc.itemsCalc[index];

                return (
                  <KartuItemPenjualan
                    key={index}
                    item={item}
                    index={index}
                    jumlahItem={items.length}
                    selectedProduk={selectedProduk}
                    itemCalc={itemCalc}
                    namaProduk={getProdukNama(item.produkID)}
                    produkList={produkList}
                    activeDiskonItem={activeDiskonItem}
                    produkTerbuka={openProduk === index}
                    diskonTerbuka={openDiskonItem === index}
                    onProdukTerbuka={(open) => setOpenProduk(open ? index : null)}
                    onDiskonTerbuka={(o) => setOpenDiskonItem(o ? index : null)}
                    onHapus={() => removeItem(index)}
                    onPilihProduk={(produkID) => handlePilihProduk(index, produkID)}
                    onJumlahChange={(raw) => handleJumlahChange(index, raw)}
                    onJumlahBlur={() => handleJumlahBlur(index)}
                    onToggleDiskon={(diskonId) => toggleItemDiskon(index, diskonId)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN (SIDEBAR) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          <KartuPelanggan pelangganList={pelangganList} pelangganID={pelangganID} onPilih={setPelangganID} />


          <KartuDiskonGlobal
            diskonList={activeDiskonGlobal}
            terpilih={diskonGlobalIDs}
            onUbah={setDiskonGlobalIDs}
            keterangan={keterangan}
            onKeterangan={setKeterangan}
          />

          {/* RINGKASAN TAGIHAN */}
          <RingkasanTagihan calc={calc} />
        </div>
        </div>

        {/* ================= AKSI & SUBMIT ================= */}
        <div className="flex flex-col gap-3">
          {formError && (
            <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              {formError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-krem p-4 shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/outlet/penjualan")}
              disabled={createMutation.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold px-8 shadow-sm"
            >
              {createMutation.isPending ? "Memproses..." : "Buat Penjualan"}
            </Button>
          </div>
        </div>
      </form>

      <DialogKonfirmasiPenjualan
        buka={showConfirm}
        onBukaChange={setShowConfirm}
        memproses={createMutation.isPending}
        onLanjutkan={executeCreate}
      />
    </div>
  );
}
