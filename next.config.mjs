/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "@google-cloud/firestore",
      "@opentelemetry/api",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  // Stop Next from using eval-source-map in the browser (causes layout.js SyntaxError).
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      Object.defineProperty(config, "devtool", {
        get: () => "cheap-module-source-map",
        set: () => {},
        enumerable: true,
        configurable: false,
      });
    }
    return config;
  },
};

export default nextConfig;
