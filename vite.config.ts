import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react(), tailwindcss()],
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
