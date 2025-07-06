import type { NextConfig } from "next";

const r2PublicUrlPrefix = process.env.R2_PUBLIC_URL_PREFIX;
let r2Hostname = '';
if (r2PublicUrlPrefix) {
  try {
    const url = new URL(r2PublicUrlPrefix);
    r2Hostname = url.hostname;
  } catch (error) {
    console.error('Invalid R2_PUBLIC_URL_PREFIX for image optimization:', error);
  }
}

const remotePatterns = [];
if (r2Hostname) {
  remotePatterns.push({
    protocol: 'https', // Assuming R2 URLs are HTTPS
    hostname: r2Hostname,
    port: '', // Usually empty for default HTTPS port
    pathname: '/**', // Allow any path under this hostname
  });
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: remotePatterns,
  },
};

export default nextConfig;
