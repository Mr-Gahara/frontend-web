import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type {
  BuatMembershipPayload,
  Membership,
  PaketMembership,
  PaketMembershipPayload,
  UbahMembershipPayload,
} from "@/types/membership";

/**
 * Membership (milik Nizar) dan paket membership (milik Ridho), backend
 * 4a19be8. Daftar tanpa page dan limit dijawab utuh; paket tanpa paginasi.
 */
export const membershipApi = {
  daftar: () => apiData.get<Membership[]>(EP.membership.list),
  buat: (payload: BuatMembershipPayload) => apiData.post<Membership>(EP.membership.list, payload),
  ubah: (id: string, payload: UbahMembershipPayload) => apiData.put<Membership>(EP.membership.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.membership.detail(id)),

  daftarPaket: () => apiData.get<PaketMembership[]>(EP.paketMembership.list),
  buatPaket: (payload: PaketMembershipPayload) => apiData.post<PaketMembership>(EP.paketMembership.list, payload),
  ubahPaket: (id: string, payload: PaketMembershipPayload) =>
    apiData.put<PaketMembership>(EP.paketMembership.detail(id), payload),
  /** Ditolak 409 selama paket dirujuk membership mana pun. */
  hapusPaket: (id: string) => apiData.delete<unknown>(EP.paketMembership.detail(id)),
};
