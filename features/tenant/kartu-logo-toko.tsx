"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUrlObjek } from "@/hooks/use-url-objek";
import { pesanError } from "@/lib/api/error";
import type { Tenant } from "@/types/tenant";
import { useHapusLogo, useLogoToko, useUnggahLogo } from "./hooks";
import { TERIMA_LOGO, periksaBerkasLogo } from "./logo";

const KELAS_LABEL = "text-kecil font-bold text-navy/75";

/** Logo toko dari logoUrl, atau ikon kosong. Dipakai kartu ini dan pratinjau struk. */
function GambarLogo({ url, ukuran, alt }: { url: string | null; ukuran: string; alt: string }) {
  if (!url) return null;
  // Blob lokal dari URL objek; next/image tidak menangani blob: URL.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`${ukuran} object-contain`} />;
}

/**
 * Logo toko dengan pratinjau struk (desain C pemilik proyek, 12 November
 * 2026; B203 sampai B205). Kolom Logo: area seret-lepas krem bergaris putus
 * karamel berisi logo saat ini, tombol Pilih berkas, dan format, lalu
 * tautan Hapus logo bila ada logo. Kolom Pratinjau struk: logo, nama toko,
 * alamat, contoh item, total, dan catatan kaki. Kedua kolom sejajar dalam
 * grid dan bertumpuk di layar sempit. Unggah dan hapus menuntut
 * update-tenant (keputusan rancangan butir 14).
 */
export function KartuLogoToko({ tenant, bolehUbah }: { tenant: Tenant; bolehUbah: boolean }) {
  const masukan = useRef<HTMLInputElement>(null);
  const [galat, setGalat] = useState("");
  const [diseret, setDiseret] = useState(false);
  const logo = useLogoToko(tenant.logoUrl);
  const urlLogo = useUrlObjek(tenant.logoUrl ? logo.data : null);
  const adaLogo = Boolean(tenant.logoUrl);

  const unggah = useUnggahLogo({
    onSuccess: () => toast.success("Logo toko disimpan."),
    onError: (e) => setGalat(pesanError(e, "Logo gagal diunggah.")),
  });
  const hapus = useHapusLogo({
    onSuccess: () => toast.success("Logo toko dihapus."),
    onError: (e) => toast.error(pesanError(e, "Logo gagal dihapus.")),
  });
  const memproses = unggah.isPending || hapus.isPending;

  const kirim = (berkas: File | undefined) => {
    if (!berkas || memproses) return;
    const pesan = periksaBerkasLogo(berkas);
    setGalat(pesan ?? "");
    if (!pesan) unggah.mutate({ id: tenant.id, berkas });
  };

  const lepas = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDiseret(false);
    if (bolehUbah) kirim(e.dataTransfer.files[0]);
  };

  const alamat = [tenant.alamat, tenant.kota].filter(Boolean).join(", ");

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 items-stretch text-navy">
      <div className="flex min-w-0 flex-col gap-2">
        <p className={KELAS_LABEL}>Logo</p>
        <div
          onDragOver={(e) => {
            if (!bolehUbah) return;
            e.preventDefault();
            setDiseret(true);
          }}
          onDragLeave={() => setDiseret(false)}
          onDrop={lepas}
          className={`flex flex-1 min-h-75 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-krem p-5 text-center transition-colors ${
            diseret ? "border-navy bg-karamel/20" : "border-karamel/70"
          }`}
        >
          <div className="flex h-22 w-22 items-center justify-center rounded-2xl border border-navy/10 bg-permukaan">
            {urlLogo ? (
              <GambarLogo url={urlLogo} ukuran="h-18 w-18" alt="Logo toko saat ini" />
            ) : adaLogo && logo.isError ? (
              <span className="px-1 text-mikro font-medium text-rose-700">Logo gagal dimuat</span>
            ) : (
              <ImageIcon className="h-9 w-9 text-navy/45" role="img" aria-label="Belum ada logo" />
            )}
          </div>
          {bolehUbah ? (
            <>
              <p className="text-isi font-semibold">
                {adaLogo ? "Seret gambar baru ke sini, atau" : "Seret gambar ke sini, atau"}
              </p>
              <input
                ref={masukan}
                type="file"
                accept={TERIMA_LOGO}
                className="sr-only"
                aria-label="Berkas logo toko"
                tabIndex={-1}
                onChange={(e) => {
                  kirim(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                disabled={memproses}
                onClick={() => masukan.current?.click()}
                className="h-10 bg-navy px-4 font-bold text-gading hover:bg-navy/90 cursor-pointer"
              >
                {unggah.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Pilih berkas
              </Button>
              <p className="text-kecil text-navy/75">JPEG, PNG, atau WebP, maksimal 2 MB</p>
            </>
          ) : (
            <p className="text-kecil font-medium text-navy/75">
              Mengubah logo membutuhkan izin mengubah toko.
            </p>
          )}
        </div>
        {galat && (
          <p role="alert" className="text-kecil font-medium text-rose-700">
            {galat}
          </p>
        )}
        {bolehUbah && adaLogo && (
          <button
            type="button"
            disabled={memproses}
            onClick={() => hapus.mutate(tenant.id)}
            className="h-6 self-start text-isi font-semibold text-rose-700 underline decoration-2 underline-offset-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hapus logo
          </button>
        )}
      </div>

      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <figcaption className={KELAS_LABEL}>Pratinjau struk</figcaption>
        <div
          data-testid="pratinjau-struk"
          className="flex flex-1 min-h-75 flex-col items-center justify-center gap-1 rounded border border-border bg-permukaan px-4.5 py-5 font-mono text-kecil text-neutral-900 shadow-[0_4px_14px_rgba(10,41,71,0.08)]"
        >
          {urlLogo && <GambarLogo url={urlLogo} ukuran="mb-1.5 h-14 w-14" alt="Logo di struk" />}
          <p className="text-isi font-bold uppercase">{tenant.namaToko}</p>
          {alamat && <p className="text-center text-neutral-600">{alamat}</p>}
          <div className="my-2 self-stretch border-t border-dashed border-neutral-400" />
          <div className="flex self-stretch justify-between">
            <span>Kopi Susu x2</span>
            <span>36.000</span>
          </div>
          <div className="flex self-stretch justify-between">
            <span>Roti Bakar x1</span>
            <span>22.000</span>
          </div>
          <div className="my-2 self-stretch border-t border-dashed border-neutral-400" />
          <div className="flex self-stretch justify-between font-bold">
            <span>TOTAL</span>
            <span>58.000</span>
          </div>
          {tenant.footerStruk && (
            <p className="mt-2.5 whitespace-pre-line text-center text-neutral-600">{tenant.footerStruk}</p>
          )}
        </div>
        <p className="flex min-h-6 items-center text-kecil text-navy/75">
          {adaLogo
            ? "Contoh tampilan; struk asli dicetak aplikasi kasir."
            : "Tanpa logo, struk dimulai dari nama toko."}
        </p>
      </figure>
    </div>
  );
}
