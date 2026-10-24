/** @type {import('next').NextConfig} */

// Origin yang boleh memanggil API dari browser. "*" = semua (hanya untuk development).
// Untuk produksi isi CORS_ORIGIN dengan domain frontend, misal https://app.contoh.com
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: corsOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;