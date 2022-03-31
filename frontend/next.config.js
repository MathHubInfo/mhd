module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.DJANGO_URL}/api/:path*/`,
      },
    ]
  },
}