module.exports = {
  experimental: {
    outputStandalone: true
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
}