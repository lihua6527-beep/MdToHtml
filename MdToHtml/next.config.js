/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  output: isExport ? 'export' : undefined, // Enable static export only when explicitly requested

  // To build static site, use a specific build script that handles API exclusion
  trailingSlash: false, // Generate file.html instead of folder/index.html
  // assetPrefix removed: handled by post-build script for correct relative paths
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
