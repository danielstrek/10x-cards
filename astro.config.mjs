// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Warunkowy import Cloudflare adapter (tylko na Cloudflare Pages)
let cloudflareAdapter = null;
const isCloudflare = process.env.CF_PAGES === "1";

if (isCloudflare) {
  // Dynamiczny import tylko gdy budujemy na Cloudflare
  const cloudflareModule = await import("@astrojs/cloudflare");
  cloudflareAdapter = cloudflareModule.default;
}

// Wybór adaptera w zależności od środowiska
const adapter = isCloudflare && cloudflareAdapter
  ? cloudflareAdapter()
  : node({ mode: "standalone" });

console.log(`🚀 Building with ${isCloudflare ? "Cloudflare" : "Node.js"} adapter`);

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter,
});
