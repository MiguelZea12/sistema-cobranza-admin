/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // No procesar módulos nativos en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        odbc: false,
      };
      
      // Ignorar módulos problemáticos de node-pre-gyp
      config.externals = config.externals || [];
      config.externals.push({
        'odbc': 'commonjs odbc',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
