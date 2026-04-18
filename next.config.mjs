/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // node-ical and its deps use BigInt/fs/etc. Webpack bundling strips or
    // mangles those refs; marking it external tells Next to require() it
    // straight from node_modules at runtime.
    serverComponentsExternalPackages: ["node-ical"],
  },
};

export default nextConfig;
