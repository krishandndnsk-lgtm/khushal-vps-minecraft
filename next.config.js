/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['ts', 'tsx'],
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    config.externals.push({
      'sqlite3': 'commonjs sqlite3',
      'ssh2': 'commonjs ssh2',
    });
    return config;
  },
};

module.exports = nextConfig;
