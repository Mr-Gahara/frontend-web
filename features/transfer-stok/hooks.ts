import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { transferStokApi, type TransferDariPengajuan, type TransferDibuat } from "./api";

type OpsiMutasi<D, V> = Pick<UseMutationOptions<D, Error, V>, "onSuccess" | "onError">;

/** Surat jalan dari pengajuan APPROVED atau PENDING; pengajuan ikut berubah, jadi keduanya diinvalidasi. */
export function useBuatSuratJalan(opsi: OpsiMutasi<TransferDibuat, TransferDariPengajuan> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferDariPengajuan) => transferStokApi.buatDariPengajuan(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transferStok.semua });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}