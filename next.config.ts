import type { NextConfig } from "next";

// Statik export: `npm run build` -> out/ qovluğu (cPanel public_html-ə yüklənir).
// Backend: cPanel-də PHP API (api/). Vercel-də (VERCEL=1) hostinq hazır olana qədər Supabase.
const nextConfig: NextConfig = {
  output: "export",
  // /admin -> admin/index.html: Apache-də rewrite qaydası olmadan açılır
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    BACKEND: process.env.BACKEND ?? (process.env.VERCEL ? "supabase" : "php"),
  },
};

export default nextConfig;
