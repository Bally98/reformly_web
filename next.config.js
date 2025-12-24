/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use standalone output in production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  // Disable caching in development for better hot reload
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),
  // Enable webpack polling for hot reload in Docker (especially on Windows)
  webpack: (config, { dev }) => {
    if (dev) {
      // Enable polling for file watching in Docker (both client and server)
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding once the first file changed
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
      // Disable caching in development
      config.cache = false
    }
    return config
  },
}

module.exports = nextConfig
