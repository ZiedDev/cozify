import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import gsap from "gsap";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker immediately for offline capability
registerSW({ immediate: true });

// Prevent animation teleporting/skipping when DevTools or console causes browser RAF throttling
gsap.ticker.lagSmoothing(1000, 16);

import { AuthProvider } from "@/services/supabase/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { SoundProvider } from "@/context/sound-context";
import { TimerProvider } from "@/context/timer-context";
import { PipProvider } from "@/context/pip-context";
import { TodoProvider } from "@/context/todo-context";
import { MusicProvider } from "@/context/music-context";
import IndexPage from "@/pages/index";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SoundProvider>
          <TimerProvider>
            <PipProvider>
              <TodoProvider>
                <MusicProvider>
                  <IndexPage />
                </MusicProvider>
              </TodoProvider>
            </PipProvider>
          </TimerProvider>
        </SoundProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
