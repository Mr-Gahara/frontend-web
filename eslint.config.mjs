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
  {
    files: ["app/**", "components/**", "hooks/**", "lib/**", "types/**"],
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
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
