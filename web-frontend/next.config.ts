import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'modelslab-bom.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'shutterstock.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_CLOUDFRONT || 'https://d26dkrocm93qz4.cloudfront.net').hostname },
      { protocol: 'https', hostname: '**.blob.core.windows.net' },
    ]
    // domains: ['avatars.githubusercontent.com', 'modelslab-bom.s3.amazonaws.com', process.env.NEXT_PUBLIC_CLOUDFRONT || ''],
  },
  allowedDevOrigins: ["http://localhost:3000", "https://github.com", "https://bfldeliveryscus.blob.core.windows.net"]
};

export default nextConfig;
