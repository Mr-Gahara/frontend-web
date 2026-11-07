import { defineConfig } from "@playwright/test";
import { NILAI_SAKLAR_MATI, SAKLAR_OTOMATIS } from "./lib/panduan";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    // Tur sorotan (lib/panduan.ts) tidak tampil sendiri dan menutupi layar
    // di spec lain. Berlaku juga untuk browser.newContext() dan
    // request.newContext() di dalam test; spec tur mengosongkannya sendiri.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:3000",
          localStorage: [{ name: SAKLAR_OTOMATIS, value: NILAI_SAKLAR_MATI }],
        },
      ],
    },
  },
});