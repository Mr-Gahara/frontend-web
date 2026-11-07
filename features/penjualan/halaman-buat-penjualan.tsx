"use client";

import { SyaratDiskon } from "@/features/diskon/syarat-diskon";
import { useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";
import { pesanError } from "@/lib/api/error";
import { useLokasiAktif } from "@/features/inventaris/hooks";
import { useDaftarPelanggan } from "@/features/pelanggan/hooks";
import { cocokCariPelanggan, labelPelangganTerpilih } from "@/features/pelanggan/tampilan";
import { useDaftarDiskon } from "@/features/diskon/hooks";
import { diskonAktif } from "@/features/diskon/filter";
import { useDaftarPajak } from "@/features/pajak/hooks";
import { pajakTransaksiAktif } from "@/features/pajak/filter";
import { useBuatPenjualan } from "./hooks";
import { emptyItem, hitungSimulasi, type ItemState } from "./simulasi";
import { KartuItemPenjualan } from "./kartu-item-penjualan";
import { RingkasanTagihan } from "./ringkasan-tagihan";
import { DialogKonfirmasiPenjualan } from "./dialog-konfirmasi-penjualan";
import { susunPayloadPenjualan, validasiPenjualan, waktuTransaksi, type WaktuTransaksi } from "./payload";
import { InputWaktu } from "@/components/input-waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { waktuLengkap, type NilaiWaktu } from "@/lib/waktu";
import { bolehCakupanPenjualan } from "./izin";
import { JenisPenjualan, PenjualanRequest } from "@/types/penjualan";
import type { Diskon } from "@/types/diskon";
import { useDaftarProduk } from "@/features/produk/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useJamBerjalan } from "@/hooks/use-jam-berjalan";
import { formatRupiah } from "@/lib/format";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Plus,
  Tag,
  Receipt,
  Users,
  ShoppingCart,
} from "lucide-react";

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
  const [openPelanggan, setOpenPelanggan] = useState(false);
  const [pelangganSearch, setPelangganSearch] = useState("");
  const [openProduk, setOpenProduk] = useState<number | null>(null);
  const [openDiskonItem, setOpenDiskonItem] = useState<number | null>(null);
  const [openDiskonGlobal, setOpenDiskonGlobal] = useState(false);

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

  // DEBOUNCE SEARCH PELANGGAN
  const debouncedPelangganSearch = useDebounce(pelangganSearch, 300);
  const filteredPelanggan = useMemo(() => {
    if (!debouncedPelangganSearch) return pelangganList;
    return pelangganList.filter((p) =>
      cocokCariPelanggan(p, debouncedPelangganSearch),
    );
  }, [pelangganList, debouncedPelangganSearch]);

  // --- HELPER LOGIKA "BISA DIGABUNG" ---
  const toggleDiskonSelection = (
    currentIds: string[],
    newId: string,
    availableList: Diskon[],
  ) => {
    const target = availableList.find((d) => (d.id) === newId);
    if (!target) return currentIds;

    // Toggle (Unselect)
    if (currentIds.includes(newId))
      return currentIds.filter((id) => id !== newId);

    // Jika diskon baru BUKAN tipe yang bisa digabung, reset seluruhnya ke dia saja
    if (!target.bisaDigabung) return [newId];

    // Cek apakah diskon yang *sudah terpilih* ada yang tidak bisa digabung
    const currentSelected = availableList.filter((d) =>
      currentIds.includes(d.id),
    );
    const hasNonGabung = currentSelected.some((d) => !d.bisaDigabung);
    if (hasNonGabung) return [newId]; // Paksa ganti

    return [...currentIds, newId];
  };

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
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
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
          {/* PELANGGAN */}
          <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Users className="w-5 h-5 text-karamel" /> Pelanggan
            </h2>
            <div className="space-y-2">
              <Popover open={openPelanggan} onOpenChange={setOpenPelanggan}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPelanggan}
                    className="w-full justify-between font-bold cursor-pointer bg-gading border-navy/20 text-navy"
                  >
                    <span
                      className={
                        pelangganID ? "" : "text-navy/50 font-medium"
                      }
                    >
                      {pelangganID
                        ? (labelPelangganTerpilih(pelangganList, pelangganID) ??
                          "Pelanggan tidak ditemukan")
                        : "Pilih pelanggan..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 border-navy/10"
                  align="start"
                >
                  <Command shouldFilter={false} className="bg-gading">
                    <CommandInput
                      placeholder="Cari pelanggan..."
                      value={pelangganSearch}
                      onValueChange={setPelangganSearch}
                      className="text-navy"
                    />
                    <CommandList>
                      <CommandEmpty className="py-4 text-center text-xs font-medium text-navy/60">
                        Pelanggan tidak ditemukan.
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredPelanggan.map((p) => {
                          const idPelanggan = p.id;
                          return (
                            <CommandItem
                              key={idPelanggan}
                              onSelect={() => {
                                setPelangganID(idPelanggan);
                                setOpenPelanggan(false);
                                setPelangganSearch("");
                              }}
                              className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-sage",
                                  pelangganID === idPelanggan
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span>{p.namaPelanggan}</span>
                              {p.nomorHp ? (
                                <span className="ml-2 text-xs font-medium text-navy/60">
                                  {p.nomorHp}
                                </span>
                              ) : null}
                              <span className="ml-auto text-xs font-bold text-navy/50 capitalize">
                                {p.tipePelanggan}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* DISKON GLOBAL & KETERANGAN */}
          <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <Tag className="h-4 w-4 text-karamel" /> Diskon Global
                </h2>
                <Popover
                  open={openDiskonGlobal}
                  onOpenChange={setOpenDiskonGlobal}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs cursor-pointer font-bold border-navy/20 text-navy hover:bg-navy/5"
                    >
                      Pilih Diskon
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-64 p-0 border-navy/10"
                  >
                    <Command className="bg-gading">
                      <CommandInput
                        placeholder="Cari diskon transaksi..."
                        className="text-navy"
                      />
                      <CommandList>
                        <CommandEmpty className="py-4 text-center text-xs font-medium text-navy/60">
                          Belum ada diskon aktif.
                        </CommandEmpty>
                        <CommandGroup>
                          {activeDiskonGlobal.map((d, index) => {
                            const targetId = d.id;
                            const isSelected =
                              diskonGlobalIDs.includes(targetId);
                            const safeKey =
                              targetId || `global-diskon-${index}`;
                            return (
                              <CommandItem
                                key={safeKey}
                                onSelect={() =>
                                  setDiskonGlobalIDs((prev) =>
                                    toggleDiskonSelection(
                                      prev,
                                      targetId,
                                      activeDiskonGlobal,
                                    ),
                                  )
                                }
                                className="cursor-pointer text-navy hover:bg-navy/5 font-medium"
                              >
                                <div className="flex flex-1 items-center gap-2">
                                  {/* Checkbox Custom */}
                                  <div
                                    className={cn(
                                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                                      isSelected
                                        ? "bg-navy border-navy"
                                        : "border-navy/30",
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-gading" />
                                    )}
                                  </div>
                                  <span className="flex flex-col"><span>{d.namaDiskon}</span><SyaratDiskon diskon={d} /></span>
                                </div>
                                <Badge className="text-[10px] bg-karamel text-navy hover:bg-karamel border-none font-bold">
                                  {d.tipe === "persen" ? `${d.nilai}%` : "Rp"}
                                </Badge>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {diskonGlobalIDs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {diskonGlobalIDs.map((id, idx) => {
                    const d = activeDiskonGlobal.find(
                      (x) => (x.id) === id,
                    );
                    if (!d) return null;
                    return (
                      <Badge
                        key={d.id || `badge-global-${idx}`}
                        className="bg-karamel text-navy border-none hover:bg-karamel text-[11px] px-2.5 py-1 font-bold shadow-sm"
                      >
                        {d.namaDiskon} (
                        {d.tipe === "persen"
                          ? `${d.nilai}%`
                          : formatRupiah(d.nilai)}
                        )
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-navy/10 pt-4">
              <label className="text-sm font-bold text-navy" htmlFor="keterangan">
                Keterangan{" "}
                <span className="font-medium text-navy/50">
                  (Opsional)
                </span>
              </label>
              <Input
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan transaksi..."
                className="text-sm bg-gading border-navy/20 text-navy placeholder:text-navy/30"
              />
            </div>
          </div>

          {/* RINGKASAN TAGIHAN */}
          <RingkasanTagihan calc={calc} />
        </div>

        {/* ================= AKSI & SUBMIT ================= */}
        <div className="lg:col-span-12 flex flex-col gap-3">
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
