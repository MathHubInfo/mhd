const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})


module.exports = withBundleAnalyzer({
  experimental: {
    outputStandalone: true,
  },
  eslint: {
    dirs: ["."], 
  },
  async rewrites() {
    return [
      {
        source: "/api/admin/static/:path*",
        destination: `${process.env.DJANGO_URL}/api/admin/static/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.DJANGO_URL}/api/:path*/`,
      },
    ]
  },
})
