const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const singleCollection = process.env.NEXT_PUBLIC_SINGLE_COLLECTION_MODE

module.exports = withBundleAnalyzer({
  experimental: {
    outputStandalone: true,
  },
  eslint: {
    dirs: ["."], 
  },
  async redirects() {
    if (singleCollection) return []

    // normal mode: homepage goes to /home/1
    return [{
      source: "/",
      destination: "/home/1",
      permanent: false,
    }]
  },
  async rewrites() {
    const single_mode_rewrites = singleCollection ? single_collection_mode(singleCollection) : []
    
    return [
      //
      // backend rewrites for api routes
      //
      {
        source: "/api/admin/static/:path*",
        destination: `${process.env.DJANGO_URL}/api/admin/static/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.DJANGO_URL}/api/:path*/`,
      },
      
      //
      // SINGLE_COLLECTION_MODE
      //
      ...single_mode_rewrites,
    ]
  },
})

function single_collection_mode(slug) {
  return [
    {
      source: "/",
      destination: `/collection/${slug}`,
    },
    {
      source: "/provenance",
      destination: `/collection/${slug}/provenance`,
    },
    {
      source: "/item/:uuid",
      destination: `/item/${slug}/:uuid`,
    },
  ]
}