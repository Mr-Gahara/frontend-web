import type { PerbaruiTenantPayload, Tenant } from "@/types/tenant";
import type { NilaiFormTenant } from "./schema";

/**
 * Field profil toko yang dikelola web (keputusan PO13a). persenPajak,
 * tipePajak, logoUrl, dan isSetupComplete sengaja tidak termasuk.
 */
export const FIELD_PROFIL_TOKO = [
  "namaToko",
  "alamat",
  "kota",
  "kodePos",
  "nomorTelepon",
  "emailBisnis",
  "footerStruk",
  "idNPWP",
] as const;

/** Nilai awal form dari data tersimpan; field yang masih null menjadi teks kosong. */
export function nilaiAwalTenant(tenant: Tenant): NilaiFormTenant {
  return {
    namaToko: tenant.namaToko,
    alamat: tenant.alamat ?? "",
    kota: tenant.kota ?? "",
    kodePos: tenant.kodePos ?? "",
    nomorTelepon: tenant.nomorTelepon ?? "",
    emailBisnis: tenant.emailBisnis ?? "",
    footerStruk: tenant.footerStruk ?? "",
    idNPWP: tenant.idNPWP ?? "",
  };
}

/**
 * Payload PUT /tenant/:id: hanya field yang berbeda dari data server
 * (keputusan rancangan butir 15). Field yang dikosongkan dikirim sebagai
 * teks kosong, yang diterima validator dan model backend. Hasil kosong
 * berarti tidak ada perubahan; backend menolak body tanpa field dengan 400,
 * sehingga pemanggil tidak mengirimnya.
 */
export function payloadPerbaruiTenant(
  nilai: NilaiFormTenant,
  tenant: Tenant,
): PerbaruiTenantPayload {
  const tersimpan = nilaiAwalTenant(tenant);
  const payload: PerbaruiTenantPayload = {};
  for (const field of FIELD_PROFIL_TOKO) {
    if (nilai[field] !== tersimpan[field]) payload[field] = nilai[field];
  }
  return payload;
}