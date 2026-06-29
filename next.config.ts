import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config silences the "webpack config but no turbopack config" error.
  // Turbopack handles Node.js built-in stubs automatically in browser bundles,
  // so no extra resolveAlias entries are needed.
  turbopack: {},

  // Kept for non-Turbopack builds (next build, next start)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;