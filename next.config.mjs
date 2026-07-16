/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suno cover-art images are served from arbitrary provider hosts in this MVP.
  // We render them via plain <img>, so no next/image remotePatterns needed.
};

export default nextConfig;
