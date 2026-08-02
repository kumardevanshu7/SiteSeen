/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Admin SDK / Firestore out of the webpack bundle so Node can
  // resolve optional deps like @opentelemetry/api correctly.
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "@google-cloud/firestore",
      "@opentelemetry/api",
    ],
  },
};

export default nextConfig;
