/** @type {import('next').NextConfig} */

// Header CORS diatur di src/proxy.js supaya bisa mengizinkan beberapa origin.
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
