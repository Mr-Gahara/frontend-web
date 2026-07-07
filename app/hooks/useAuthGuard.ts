// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { decodeJWT } from "@/lib/decodeToken";
// import { apiClient } from "@/lib/apiClient";

// export function useAuthGuard() {
//   const router = useRouter();

//   useEffect(() => {
//     const validate = async () => {
//       const accessToken = sessionStorage.getItem("accessToken");
//       if (!accessToken) {
//         router.push("/login");
//         return;
//       }

//       const payload = decodeJWT(accessToken);
//       if (!payload.id) {
//         router.push("/login");
//         return;
//       }

//       if (!payload.tenantID) {
//         router.push("/setup/buatToko");
//         return;
//       }

//       const penggunaToken = sessionStorage.getItem("penggunaToken");
//       if (!penggunaToken) {
//         try {
//           const res = await apiClient.get<{ hasOwner: boolean }>(
//             "/pengguna/check-owner"
//           );
//           router.push(res.hasOwner ? "/login/pengguna" : "/setup/buatOwner");
//         } catch {
//           router.push("/login");
//         }
//         return;
//       }
//     };

//     validate();
//   }, []);
// }

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/decodeToken";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    // Karena tidak ada panggilan API, kita bisa menghapus async
    const validate = () => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken || accessToken === "undefined" || accessToken === "null") {
        router.replace("/login");
        return;
      }

      const payload = decodeJWT(accessToken);
      if (!payload || !payload.id) {
        router.replace("/login");
        return;
      }

      // Jika belum punya toko, arahkan kembali ke login (karena harus setup di App)
      // (Bisa juga diarahkan ke halaman khusus "Silakan Setup di Aplikasi Mobile")
      if (!payload.tenantID) {
        sessionStorage.clear();
        router.replace("/login");
        return;
      }

      const penggunaToken = sessionStorage.getItem("penggunaToken");
      
      // Jika token karyawan/owner tidak ada, langsung lempar ke form PIN
      if (!penggunaToken || penggunaToken === "undefined" || penggunaToken === "null") {
        router.replace("/login/pengguna");
        return;
      }
    };

    validate();
  }, [router]);
} 