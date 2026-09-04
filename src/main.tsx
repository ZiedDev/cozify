import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

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
  </StrictMode>,
);
