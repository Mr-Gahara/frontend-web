import { describe, expect, it } from "vitest";
import { BATAS_LOGO_BYTE, jalurLogo, periksaBerkasLogo } from "@/features/tenant/logo";

describe("periksaBerkasLogo (B203)", () => {
  it("menerima JPEG, PNG, dan WebP sampai 2 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(periksaBerkasLogo({ type, size: BATAS_LOGO_BYTE })).toBeNull();
    }
  });
  it("menolak format lain dan berkas di atas 2 MB dengan pesan backend", () => {
    expect(periksaBerkasLogo({ type: "image/gif", size: 10 })).toBe(
      "Format logo tidak valid. Gunakan JPEG, PNG, atau WebP.",
    );
    expect(periksaBerkasLogo({ type: "image/png", size: BATAS_LOGO_BYTE + 1 })).toBe("Ukuran logo maksimal 2MB.");
  });
});

describe("jalurLogo (B204)", () => {
  it("membuang awalan /api karena apiClient sudah berawalan /api", () => {
    expect(jalurLogo("/api/tenant/abc/logo/0f1e.webp")).toBe("/tenant/abc/logo/0f1e.webp");
    expect(jalurLogo("/tenant/abc/logo/0f1e.webp")).toBe("/tenant/abc/logo/0f1e.webp");
  });
});
