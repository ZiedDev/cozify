import { useState, useRef, lazy, Suspense } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Spinner } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { Dock } from "@/components/layout/dock";
import { Clock } from "@/components/home/clock";
import { Timer } from "@/components/pomodoro/timer";
import { MusicWidget } from "@/components/music/music-widget";
import { PlaylistPickerModal } from "@/components/music/playlist-picker-modal";
import { AppMode } from "@/config/modes";

const TodoPage = lazy(() =>
  import("@/components/todo/todo-page").then((m) => ({ default: m.TodoPage })),
);
const StatsPage = lazy(() =>
  import("@/components/stats/stats-page").then((m) => ({
    default: m.StatsPage,
  })),
);
const MusicView = lazy(() =>
  import("@/components/music/music-view").then((m) => ({
    default: m.MusicView,
  })),
);

function ViewFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-48">
      <Spinner className="text-accent" size="md" />
    </div>
  );
}

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
          {activeMode === "home" && (
            <div
              className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0"
              data-mode-view="home"
            >
              <Clock />
            </div>
          )}

          {activeMode === "pomodoro" && (
            <div
              className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0"
              data-mode-view="pomodoro"
            >
              <Timer />
            </div>
          )}

          {activeMode === "todo" && (
            <div
              className="w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden"
              data-mode-view="todo"
            >
              <Suspense fallback={<ViewFallback />}>
                <TodoPage />
              </Suspense>
            </div>
          )}

          {activeMode === "stats" && (
            <div
              className="w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden"
              data-mode-view="stats"
            >
              <Suspense fallback={<ViewFallback />}>
                <StatsPage />
              </Suspense>
            </div>
          )}

          {activeMode === "music" && (
            <div
              className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden"
              data-mode-view="music"
            >
              <Suspense fallback={<ViewFallback />}>
                <MusicView />
              </Suspense>
            </div>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}

export default IndexPage;
