import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { Dock } from "@/components/layout/dock";
import { Clock } from "@/components/home/clock";
import { Timer } from "@/components/pomodoro/timer";
import { MusicWidget } from "@/components/music/music-widget";
import { PlaylistPickerModal } from "@/components/music/playlist-picker-modal";
import { AppMode } from "@/config/modes";
import { TodoPage } from "@/components/todo/todo-page";
import { StatsPage } from "@/components/stats/stats-page";
import { MusicView } from "@/components/music/music-view";

export function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>("home");
  const containerRef = useRef<HTMLDivElement>(null);
  const prevModeRef = useRef<AppMode>(activeMode);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const activeEl = containerRef.current.querySelector(
        `[data-mode-view="${activeMode}"]`,
      );

      if (activeEl) {
        gsap.fromTo(
          activeEl,
          { opacity: 0, scale: 0.985, y: 6 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.28,
            ease: "power2.out",
            overwrite: "auto",
          },
        );
      }

      prevModeRef.current = activeMode;
    },
    { dependencies: [activeMode], scope: containerRef },
  );

  return (
    <DefaultLayout>
      <SidebarLeft activeMode={activeMode} />
      <Sidebar activeMode={activeMode} />

      <Dock activeMode={activeMode} onSelectMode={setActiveMode} />

      {/* Floating Audio Deck & Library Modal */}
      <MusicWidget activeMode={activeMode} />
      <PlaylistPickerModal />

      <section
        ref={containerRef}
        className="flex flex-col items-center justify-center flex-1 w-full h-full py-1 min-h-0 overflow-hidden"
      >
        <div className="w-full h-full flex flex-col items-center justify-center flex-1 min-h-0 overflow-hidden relative">
          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 ${
              activeMode === "home" ? "" : "hidden"
            }`}
            data-mode-view="home"
          >
            <Clock />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 ${
              activeMode === "pomodoro" ? "" : "hidden"
            }`}
            data-mode-view="pomodoro"
          >
            <Timer />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden ${
              activeMode === "todo" ? "" : "hidden"
            }`}
            data-mode-view="todo"
          >
            <TodoPage />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden ${
              activeMode === "stats" ? "" : "hidden"
            }`}
            data-mode-view="stats"
          >
            <StatsPage />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden ${
              activeMode === "music" ? "" : "hidden"
            }`}
            data-mode-view="music"
          >
            <MusicView />
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}

export default IndexPage;
