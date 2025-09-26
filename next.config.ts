import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    '000d201c-cc4e-4193-9338-45e7617aaf05-00-xvs4jxi1c7am.kirk.replit.dev'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    // Allow setting a public base URL for OAuth/reset links in previews
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    MPESA_ENV: process.env.MPESA_ENV,
    MPESA_BUSINESS_SHORTCODE: process.env.MPESA_BUSINESS_SHORTCODE,
    MPESA_PASSKEY: process.env.MPESA_PASSKEY,
    MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
    MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
    MPESA_CALLBACK_SECRET: process.env.MPESA_CALLBACK_SECRET,
  },
};

export default nextConfig;
