/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // 👈 permite cargar imágenes desde Supabase
      },
    ],
  },
};

module.exports = nextConfig;
