import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/styles/**",
      },
      {
        protocol: "https",
        hostname: "tileserver-guatemala.fly.dev",
        pathname: "/styles/**",
      },
    ],
  },
};

export default nextConfig;
