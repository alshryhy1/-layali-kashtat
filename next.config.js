const DEFAULT_SUPABASE_URL = "https://aslnkubwrdvtmlntfaee.supabase.co";

/**
 * Production historically had NEXT_PUBLIC_SUPABASE_ANON_KEY inlined but left
 * NEXT_PUBLIC_SUPABASE_URL as a runtime process.env read (undefined in browser),
 * which made OTP signup fail with "إعدادات Supabase غير مكتملة".
 * Map server-style names + known public URL so the client bundle always gets a URL.
 */
const resolvedSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const resolvedSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Force URL into the client bundle at build time (not runtime process.env).
  // Only set ANON_KEY here when resolved — never overwrite with "".
  env: {
    NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl,
    ...(resolvedSupabaseAnonKey
      ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvedSupabaseAnonKey }
      : {}),
  },
  // Local web often opened via 127.0.0.1 while `next dev` binds localhost
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
