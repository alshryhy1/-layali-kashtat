/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Force Vercel to ignore type errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aslnkubwrdvtmlntfaee.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        destination: "/api/apple-domain-association",
      },
    ];
  },
};

module.exports = nextConfig;
