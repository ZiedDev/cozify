import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.ico", "favicon.svg", "icons/ios/180.png"],
      manifest: {
        name: "Cozify - Focus Environment",
        short_name: "Cozify",
        description:
          "Build your ideal cozy focus environment with soundscapes, pomodoro timers, and tasks.",
        theme_color: "#a196db",
        background_color: "#a196db",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "./icons/android/launchericon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "./icons/android/launchericon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "./icons/android/launchericon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "./icons/android/launchericon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "./icons/android/launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "./icons/android/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "./icons/android/launchericon-512x512-maskable",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,jpg,svg,mp3,ogg,wav,woff,woff2}",
        ],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@heroui")) return "heroui";
            if (id.includes("gsap") || id.includes("@gsap")) return "gsap";
            if (id.includes("lucide-react")) return "lucide";

            return "vendor";
          }
        },
      },
    },
  },
});
