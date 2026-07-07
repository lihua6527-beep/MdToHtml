/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  // 根据 NEXT_EXPORT 环境变量动态启用静态导出
  output: isExport ? 'export' : undefined,

  trailingSlash: false, // Generate file.html instead of folder/index.html
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
