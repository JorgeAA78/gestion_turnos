import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Forzar a Webpack a resolver los módulos desde una ruta consistente
    // para evitar el error de "modules with names that only differ in casing"
    config.resolve = {
      ...config.resolve,
      symlinks: false,
    };
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [path.resolve(__dirname, "node_modules")],
    };
    return config;
  },
};

export default nextConfig;
