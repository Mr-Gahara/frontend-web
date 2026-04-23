"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/decodeToken";
import { apiClient } from "@/lib/apiClient";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const validate = async () => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        router.push("/login");
        return;
      }

      const payload = decodeJWT(accessToken);
      if (!payload.id) {
        router.push("/login");
        return;
      }

      if (!payload.tenantID) {
        router.push("/setup/buatToko");
        return;
      }

      const penggunaToken = sessionStorage.getItem("penggunaToken");
      if (!penggunaToken) {
        try {
          const res = await apiClient.get<{ hasOwner: boolean }>(
            "/pengguna/check-owner"
          );
          router.push(res.hasOwner ? "/login/pengguna" : "/setup/buatOwner");
        } catch {
          router.push("/login");
        }
        return;
      }
    };

    validate();
  }, []);
}