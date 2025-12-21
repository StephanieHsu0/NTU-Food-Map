import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com'],
  },
  // Disable static optimization for dynamic routes to avoid window is not defined errors
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  webpack: (config, { isServer }) => {
    // Fix for next-auth/react module resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    // Ensure next-auth/react is properly resolved
    try {
      const nextAuthReactPath = require.resolve('next-auth/react');
      config.resolve.alias = {
        ...config.resolve.alias,
        'next-auth/react': nextAuthReactPath,
      };
    } catch (e) {
      console.warn('Could not resolve next-auth/react:', e);
    }
    // Fix for @formatjs module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);

