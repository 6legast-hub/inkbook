/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public bucket (заменишь <project> на свой ref)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
