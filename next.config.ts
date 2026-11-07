import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produksi di VPS: build menghasilkan .next/standalone (server.js beserta
  // node_modules yang dibutuhkan saja), dijalankan di container di belakang
  // Caddy (deploy/README.md). Dev server dan e2e tetap memakai next dev.
  output: "standalone",
  allowedDevOrigins: [
    "*.ngrok-free.app",  // wildcard semua ngrok URL
    "192.168.1.12",
    "100.89.5.127",
    "archlinux.tail5e846b.ts.net"
  ],
  // Di produksi Caddy meneruskan /api/* langsung ke backend sebelum sampai ke
  // Next.js, sehingga rewrite ini hanya dipakai di development, atau sebagai
  // cadangan bila server frontend dibuka tanpa Caddy.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;