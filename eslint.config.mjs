import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Kode aplikasi tidak boleh mengimpor file test, fixture, atau mock,
  // baik milik proyek maupun milik paket di node_modules. Mencegah
  // kecelakaan auto-import dari IDE.
  // Seluruh input tanggal dan waktu memakai komponen kostum
  // (keputusan K-TW1 dan K-TW2): PilihTanggal dengan components/calendar.tsx,
  // dan InputWaktu. Kalender shadcn murni dan input tanggal atau waktu bawaan
  // browser ditolak. Kedua larangan impor digabung dalam satu aturan, karena
  // blok kedua untuk aturan yang sama akan menimpa opsi blok ini.
  {
    files: ["app/**", "components/**", "features/**", "hooks/**", "lib/**", "types/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/__tests__/**", "**/__fixtures__/**", "**/__mocks__/**"],
              message:
                "Jangan mengimpor file test, fixture, atau mock ke kode aplikasi.",
            },
            {
              group: ["@/components/ui/calendar", "**/components/ui/calendar"],
              message:
                "Pakai PilihTanggal (components/pilih-tanggal) atau kalender kostum components/calendar.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='type'][value.value=/^(date|time|datetime-local|month|week)$/]",
          message:
            "Input tanggal dan waktu bawaan browser dilarang. Pakai PilihTanggal atau InputWaktu.",
        },
      ],
    },
  },
]);

export default eslintConfig;
