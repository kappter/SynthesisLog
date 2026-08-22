import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

/**
 * Isolated browser-only build for GitHub Pages. This does not alter the
 * production Vite configuration or the Express deployment path.
 */
export default defineConfig({
  base: "/SynthesisLog/",
  plugins: [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    {
      name: "strip-static-analytics",
      transformIndexHtml(html) {
        // The production entrypoint contains a platform analytics tag across
        // multiple lines. Remove the complete tagged script in static mode so
        // the proof of concept has no analytics or platform endpoint request.
        return html.replace(/\s*<script\b(?=[^>]*\bdata-website-id=)[\s\S]*?<\/script>/gi, "");
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-static"),
    emptyOutDir: true,
  },
});
