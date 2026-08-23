import { defineConfig } from "vite";

/* The application is deployed to GitHub Pages under /<repo>/, so assets are
   requested from that path. Override with BASE_PATH=/ for a root deploy
   (an intranet path, S3, Netlify) or for a local file:// copy. */
export default defineConfig({
  base: process.env.BASE_PATH ?? "/talent-ascend-bfwa/",
  build: {
    outDir: "dist",
    target: "es2020",
    sourcemap: false
  },
  server: { port: 5173, open: true },
  preview: { port: 4173 }
});
