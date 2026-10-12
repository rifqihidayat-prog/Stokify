import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build mandiri untuk image Docker (lihat Dockerfile)
  output: "standalone",
  experimental: {
    serverActions: {
      // Foto lampiran pengajuan equipment (maks 8 MB, lihat src/lib/uploads.ts)
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
