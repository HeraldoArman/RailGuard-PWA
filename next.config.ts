// ❌ jangan begini
// import type { NextConfig } from "next";

// ✅ cukup begini
import withPWA from "next-pwa";

const nextConfig = {
  /* config options */
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// tanpa typing strict
export default pwaConfig(nextConfig);
