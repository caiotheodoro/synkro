// const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // transpilePackages: ['@module-federation/nextjs-mf'],
  env: {
    NEXT_PRIVATE_LOCAL_WEBPACK: 'true',
  },
  webpack(config, options) {
    const { isServer } = options;
    
    // Temporarily disable Module Federation
    /*
    config.plugins.push(
      new NextFederationPlugin({
        name: 'dashboard',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          // Define remotes here if needed
          // auth: `auth@${process.env.NEXT_PUBLIC_AUTH_URL}/remoteEntry.js`,
        },
        exposes: {
          // Components to expose to other microfrontends
          './DashboardLayout': './src/components/layouts/DashboardLayout.tsx',
          './DashboardNav': './src/components/navigation/DashboardNav.tsx',
          './UserProfile': './src/components/user/UserProfile.tsx',
        },
        shared: {
          // Shared dependencies
          react: {
            singleton: true,
            requiredVersion: false,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: false,
          },
        },
      })
    );
    */

    return config;
  },
};

module.exports = nextConfig; 