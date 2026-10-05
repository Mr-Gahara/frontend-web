"use client";

import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IZIN_DASAR,
  IZIN_TERLARANG,
  PENJELASAN_IZIN_DASAR,
  PENJELASAN_IZIN_DASAR_UMUM,
} from "./constants";
import { nilaiAwalRole } from "./nilai-awal";
import { adaPerubahanRole, payloadBuatRole, payloadPerbaruiRole } from "./payload";
import { buatSkemaRole, type NilaiFormRole } from "./schema";
import {
  useDaftarPermission,
  useDaftarRole,
  useLevelPenggunaAktif,
  useRole,
  useSimpanRole,
} from "./hooks";
import { pesanError } from "@/lib/api/error";
import type { Permission } from "@/types/role";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Form role, dipakai untuk membuat maupun mengubah posisi.
 *
 * Kedua halaman sebelumnya berupa salinan 500-an baris yang dua pertiga
 * isinya sama. Yang membedakan hanya sumber nilai awal, operasi simpan,
 * dan beberapa teks, sehingga seluruhnya dijadikan prop.
 */
export interface PropsFormRole {
  /** Diisi saat mengubah posisi yang sudah ada; kosong berarti membuat baru. */
  roleId?: string;
  judul: string;
  deskripsiHalaman: string;
  /** Tujuan tombol kembali, yang tidak selalu sama dengan tujuan setelah simpan. */
  urlKembali: string;
  labelKembali: string;
  /** Tujuan setelah berhasil menyimpan; bawaannya daftar posisi. */
  urlSelesai?: string;
}

type DetailRole = NonNullable<ReturnType<typeof useRole>["data"]>;

export default function FormRole(props: PropsFormRole) {
  const { roleId, urlKembali, labelKembali } = props;
  const modeEdit = !!roleId;

  // Detail hanya dimuat saat mengubah posisi yang sudah ada, dan selalu
  // dimuat ulang saat halaman dibuka, agar form dipasang dengan data
  // terbaru (keputusan rancangan butir 8).
  const {
    data: roleDetail,
    error: detailError,
    isFetchedAfterMount,
  } = useRole(roleId ?? "");

  if (modeEdit && detailError) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <p className="text-sm font-bold text-[#0A2947]">
          Posisi tidak dapat dimuat.
        </p>
        <p className="text-sm font-medium text-[#0A2947]/60">
          {pesanError(detailError, "Data posisi tidak ditemukan.")}
        </p>
        <Link
          href={urlKembali}
          className="text-sm font-bold text-[#0A2947] underline"
        >
          {labelKembali}
        </Link>
      </div>
    );
  }

  if (modeEdit && (!roleDetail || !isFetchedAfterMount)) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/60">
          Memuat rincian posisi...
        </p>
      </div>
    );
  }

  return (
    <IsiFormRole
      key={roleDetail?.id ?? "baru"}
      {...props}
      awal={roleDetail}
    />
  );
}

function IsiFormRole({
  roleId,
  judul,
  deskripsiHalaman,
  urlKembali,
  labelKembali,
  urlSelesai = "/dashboard/outlet/pengaturan/roles",
  awal,
}: PropsFormRole & { awal?: DetailRole }) {
  const modeEdit = !!roleId;
  const router = useRouter();

  // Nilai awal dihitung sekali saat form dipasang: wewenang dasar untuk
  // posisi baru, atau isi posisi yang diubah.
  const [awalForm] = useState(() => nilaiAwalRole(awal));
  // Penolakan backend saat simpan; galat validasi tampil di bawah tiap
  // isian (keputusan RL1a).
  const [formError, setFormError] = useState("");

  const [warningDialog, setWarningDialog] = useState<{
    isOpen: boolean;
    nama: string;
    penjelasan: string;
  } | null>(null);

  const { data: allPermissions = [], isLoading: permissionsLoading } =
    useDaftarPermission();

  // Daftar role dipakai untuk menentukan level pengguna aktif, karena
  // token hanya membawa nama role tanpa level.
  const { data: roles = [] } = useDaftarRole();
  const currentUserLevel = useLevelPenggunaAktif(roles);

  // Skema dibentuk ulang setiap render, sehingga batas atas level mengikuti
  // level pengguna begitu daftar role termuat (keputusan RL3a).
  const {
    register,
    handleSubmit: tanganiSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<NilaiFormRole>({
    resolver: zodResolver(buatSkemaRole(currentUserLevel)),
    defaultValues: {
      namaRole: awalForm.namaRole,
      deskripsi: awalForm.deskripsi,
      level: awalForm.level,
      izin: awalForm.izinTerpilih,
    },
  });
  const selectedPermissions = useWatch({ control, name: "izin" });
  const [namaTampil, deskripsiTampil, levelTampil] = useWatch({
    control,
    name: ["namaRole", "deskripsi", "level"],
  });
  const setSelectedPermissions = (
    pembaru: string[] | ((sebelumnya: string[]) => string[]),
  ) =>
    setValue(
      "izin",
      typeof pembaru === "function" ? pembaru(getValues("izin")) : pembaru,
      { shouldDirty: true, shouldValidate: true },
    );

  // LOGIKA RBAC KLIEN
  const allowedPermissions = useMemo(() => {
    return allPermissions.filter((p) => !IZIN_TERLARANG.includes(p.nama));
  }, [allPermissions]);

  const groupedPermissions = useMemo(() => {
    return allowedPermissions.reduce<Record<string, Permission[]>>(
      (acc, permission) => {
        if (!acc[permission.grup]) acc[permission.grup] = [];
        acc[permission.grup].push(permission);
        return acc;
      },
      {},
    );
  }, [allowedPermissions]);

  // Mode ubah: payload dihitung dari isian saat ini, sehingga simpan
  // nonaktif selama tidak ada perubahan (keputusan RL2a). Wewenang
  // terlarang yang sudah dimiliki posisi ini tidak ditampilkan, tetapi
  // tetap ikut dikirim lewat payload agar tidak hilang.
  const tanpaPerubahan =
    modeEdit &&
    !adaPerubahanRole(
      payloadPerbaruiRole(
        awalForm,
        {
          namaRole: namaTampil,
          deskripsi: deskripsiTampil,
          level: levelTampil,
          izin: selectedPermissions,
        },
        allPermissions,
      ),
    );

  // MUTATION: UPDATE ROLE
  const simpanRoleMutation = useSimpanRole();

  const hasilSimpan = {
    onSuccess: () => {
      toast.success("Berhasil", {
        description: modeEdit
          ? "Perubahan posisi berhasil disimpan."
          : "Posisi karyawan baru telah berhasil dibuat.",
      });
      router.push(urlSelesai);
    },
    onError: (err: unknown) => {
      setFormError(
        pesanError(
          err,
          modeEdit ? "Gagal memperbarui posisi." : "Gagal membuat posisi baru.",
        ),
      );
    },
  };

  // HANDLERS SELEKSI PERMISSION
  const handleCheckbox = (nama: string) => {
    const isBasic = IZIN_DASAR.includes(nama);
    const isUnchecking = selectedPermissions.includes(nama);

    if (isBasic && isUnchecking) {
      const penjelasan =
        PENJELASAN_IZIN_DASAR[nama] ?? PENJELASAN_IZIN_DASAR_UMUM;

      setWarningDialog({ isOpen: true, nama, penjelasan });
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(nama) ? prev.filter((p) => p !== nama) : [...prev, nama],
    );
  };

  const confirmUncheckBasic = () => {
    if (warningDialog) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => p !== warningDialog.nama),
      );
      setWarningDialog(null);
    }
  };

  const handleSelectGroup = (items: Permission[]) => {
    const itemNames = items.map((i) => i.nama);
    const isAllGroupSelected = itemNames.every((name) =>
      selectedPermissions.includes(name),
    );

    if (isAllGroupSelected) {
      setSelectedPermissions((prev) =>
        prev.filter(
          (name) =>
            !itemNames.includes(name) || IZIN_DASAR.includes(name),
        ),
      );

      const containsBasic = itemNames.some((name) =>
        IZIN_DASAR.includes(name),
      );
      if (containsBasic) {
        toast.info(
          "Grup dikosongkan, namun hak akses dasar tetap dipertahankan demi kestabilan.",
        );
      }
    } else {
      setSelectedPermissions((prev) => {
        const next = [...prev];
        itemNames.forEach((name) => {
          if (!next.includes(name)) next.push(name);
        });
        return next;
      });
    }
  };

  const handleSelectAllGlobal = () => {
    if (selectedPermissions.length === allowedPermissions.length) {
      setSelectedPermissions(IZIN_DASAR);
    } else {
      setSelectedPermissions(allowedPermissions.map((p) => p.nama));
    }
  };

  // Dipanggil setelah skema lolos; nama dan deskripsi sudah dipangkas.
  const kirim = (data: NilaiFormRole) => {
    setFormError("");
    if (modeEdit && roleId) {
      const perubahan = payloadPerbaruiRole(awalForm, data, allPermissions);
      if (!adaPerubahanRole(perubahan)) return;
      simpanRoleMutation.mutate({ id: roleId, data: perubahan }, hasilSimpan);
      return;
    }
    simpanRoleMutation.mutate(
      { data: payloadBuatRole(data, awalForm.izinTersembunyi, allPermissions) },
      hasilSimpan,
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push(urlKembali)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {labelKembali}
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            {judul}
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            {deskripsiHalaman}
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm">
        <form onSubmit={tanganiSubmit(kirim)} noValidate className="flex flex-col gap-7">
          <div className="space-y-2">
            <label htmlFor="namaRole" className="text-sm font-bold text-[#0A2947]">Nama Posisi / Jabatan</label>
            <Input
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              id="namaRole"
              {...register("namaRole")}
              aria-invalid={!!errors.namaRole}
              placeholder="Contoh: Manajer Toko, Kasir Depan, Barista"
            />
            {errors.namaRole && (
              <p className="text-xs font-bold text-red-600">{errors.namaRole.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="deskripsiRole" className="text-sm font-bold text-[#0A2947]">
              Deskripsi Pekerjaan{" "}
              <span className="text-[#0A2947]/50 font-medium">
                (opsional)
              </span>
            </label>
            <Input
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              id="deskripsiRole"
              {...register("deskripsi")}
              aria-invalid={!!errors.deskripsi}
              placeholder="Contoh: Bertanggung jawab atas transaksi penjualan dan laporan kas harian"
            />
            {errors.deskripsi && (
              <p className="text-xs font-bold text-red-600">{errors.deskripsi.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="levelRole" className="text-sm font-bold text-[#0A2947]">Level Otoritas</label>
            <Input
              type="number"
              className="no-spinner bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30"
              id="levelRole"
              {...register("level")}
              aria-invalid={!!errors.level}
              placeholder="Contoh: 100"
            />
            {errors.level && (
              <p className="text-xs font-bold text-red-600">{errors.level.message}</p>
            )}
            {currentUserLevel > 0 && (
              <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                Level harus antara 1 hingga {currentUserLevel - 1}. Semakin
                tinggi angka, semakin tinggi otoritas jabatan.
              </p>
            )}
          </div>

          {/* Area Hak Akses */}
          <div className="flex flex-col gap-4 pt-4 border-t border-[#0A2947]/10 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-[#0A2947]">
                  Wewenang Menu Sistem
                </label>
                <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                  {selectedPermissions.length} dari {allowedPermissions.length}{" "}
                  pilihan aktif.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllGlobal}
                className="h-8 text-xs font-bold cursor-pointer transition-colors border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 shadow-sm"
                disabled={permissionsLoading}
              >
                {selectedPermissions.length === allowedPermissions.length &&
                allowedPermissions.length > 0
                  ? "Reset Pilihan"
                  : "Pilih Seluruh Sistem"}
              </Button>
            </div>

            {permissionsLoading ? (
              <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#0A2947]/20 bg-[#FFFAF3]">
                <Loader2 className="h-6 w-6 animate-spin text-[#0A2947]/40" />
                <p className="text-sm font-bold text-[#0A2947]/60">
                  Memuat daftar wewenang...
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] overflow-hidden shadow-inner">
                {Object.entries(groupedPermissions).map(([grup, items], i) => {
                  const itemNames = items.map((item) => item.nama);
                  const isGroupAllSelected = itemNames.every((name) =>
                    selectedPermissions.includes(name),
                  );

                  return (
                    <div
                      key={grup}
                      className={`px-5 py-5 ${
                        i < Object.keys(groupedPermissions).length - 1
                          ? "border-b border-[#0A2947]/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-5 border-b border-[#0A2947]/5 pb-2">
                        <p className="text-xs font-bold text-[#0A2947]/50 uppercase tracking-wider">
                          {grup}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectGroup(items)}
                          className={`h-7 px-3 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                            isGroupAllSelected
                              ? "text-[#D4A373] hover:bg-[#D4A373]/10" 
                              : "text-[#718355] hover:bg-[#718355]/10" 
                          }`}
                        >
                          {isGroupAllSelected
                            ? "Kosongkan Grup"
                            : "Pilih Semua di Grup"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                        {items.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={selectedPermissions.includes(
                                permission.nama,
                              )}
                              onCheckedChange={() =>
                                handleCheckbox(permission.nama)
                              }
                              className="mt-0.5 cursor-pointer border-[#0A2947]/30 data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                            />
                            <div className="grid gap-1 leading-none">
                              <label
                                htmlFor={`edit-${permission.id}`}
                                className="text-sm font-bold cursor-pointer text-[#0A2947]"
                              >
                                {permission.deskripsi || permission.nama}
                              </label>
                              <p className="text-xs font-medium text-[#0A2947]/50 font-mono">
                                {permission.nama}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {errors.izin && (
            <p className="text-sm font-bold text-red-600 px-2">{errors.izin.message}</p>
          )}

          {formError && (
            <p className="text-sm font-bold text-red-600 px-2">{formError}</p>
          )}

          {/* Tombol Simpan Bawah */}
          <div className="flex justify-end gap-3 border-t border-[#0A2947]/10 pt-6 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(urlKembali)}
              disabled={simpanRoleMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                simpanRoleMutation.isPending ||
                permissionsLoading ||
                tanpaPerubahan
              }
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm px-6"
            >
              {simpanRoleMutation.isPending
                ? "Menyimpan Perubahan..."
                : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>

      {/* ALERT DIALOG */}
      <AlertDialog
        open={warningDialog?.isOpen || false}
        onOpenChange={(open) => {
          if (!open) setWarningDialog(null);
        }}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#0A2947]">
              <AlertTriangle className="h-5 w-5 text-[#D4A373]" />
              Peringatan Hak Akses Vital
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#0A2947]/70 leading-relaxed pt-2">
              Anda mencoba menonaktifkan hak akses dasar{" "}
              <strong className="text-[#0A2947]">{warningDialog?.nama}</strong>.
              <br />
              <br />
              {warningDialog?.penjelasan}
              <br />
              <br />
              Apakah Anda yakin ingin tetap menghapus hak akses ini untuk staf
              Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold">
              Batal (Tetap Aktifkan)
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold"
              onClick={confirmUncheckBasic}
            >
              Ya, Hapus Akses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}