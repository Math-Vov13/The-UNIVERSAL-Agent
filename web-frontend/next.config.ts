import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['avatars.githubusercontent.com', 'modelslab-bom.s3.amazonaws.com', process.env.NEXT_PUBLIC_CLOUDFRONT || ''],
  },
};

export default nextConfig;
