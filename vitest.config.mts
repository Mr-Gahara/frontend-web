import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true, // Menggunakan fitur bawaan Vite
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "tests/unit/**/*.{test,spec}.ts?(x)",
      "tests/integration/**/*.{test,spec}.ts?(x)",
    ],
  },
});
