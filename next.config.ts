import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5004/api/:path*', // Proxy to ASP.NET on HTTP (no SSL cert issues)
      },
    ];
  },
};

export default nextConfig;
