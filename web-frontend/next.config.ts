import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['www.google.com', 'tse3.mm.bing.net', 'avatars.githubusercontent.com', process.env.NEXT_PUBLIC_CLOUDFRONT || ''],
  },
};

export default nextConfig;
