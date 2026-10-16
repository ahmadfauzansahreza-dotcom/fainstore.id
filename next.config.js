/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "10.80.39.178",
    "localhost",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  serverExternalPackages: ["@prisma/client", "prisma"],

  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },

  // Header keamanan dasar
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
