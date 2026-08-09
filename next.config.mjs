import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Pin the file-tracing root to this app's directory so Next.js doesn't
  // walk up the tree and pick up a stray parent lockfile.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
