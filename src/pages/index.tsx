import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Spinner } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { Dock } from "@/components/layout/dock";
import { HomeView } from "@/menus/home";
import { PomodoroView } from "@/menus/pomodoro";
import { MusicWidget } from "@/components/music/music-widget";
import { TodoView } from "@/menus/todo";
import { AppMode } from "@/config/modes";
import { storageAdapter } from "@/services/storage";

const StatsView = lazy(() =>
  import("@/menus/stats").then((m) => ({ default: m.StatsView })),
);
const MusicView = lazy(() =>
  import("@/menus/music").then((m) => ({ default: m.MusicView })),
);
const PlaylistPickerModal = lazy(() =>
  import("@/components/music/playlist-picker-modal").then((m) => ({
    default: m.PlaylistPickerModal,
  })),
);

const LAST_TAB_STORAGE_KEY = "cozify_last_active_tab";

export function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>(() => {
    return storageAdapter.getItem<AppMode>(LAST_TAB_STORAGE_KEY, "home");
  });

  const [visitedModes, setVisitedModes] = useState<Set<AppMode>>(() => {
    const initial = storageAdapter.getItem<AppMode>(
      LAST_TAB_STORAGE_KEY,
      "home",
    );

    return new Set<AppMode>([initial]);
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectMode = useCallback((newMode: AppMode) => {
    setActiveMode(newMode);
    storageAdapter.setItem(LAST_TAB_STORAGE_KEY, newMode);
    setVisitedModes((prev) => {
      if (prev.has(newMode)) return prev;
      const next = new Set(prev);

      next.add(newMode);

      return next;
    });
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const activeEl = containerRef.current.querySelector(
        `[data-mode-view="${activeMode}"]`,
      );

      if (activeEl) {
        gsap.fromTo(
          activeEl,
          { opacity: 0, y: 8, scale: 0.995 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.22,
            ease: "power2.out",
            overwrite: "auto",
          },
        );
      }
    },
    { dependencies: [activeMode], scope: containerRef },
  );

  return (
    <DefaultLayout>
      <SidebarLeft activeMode={activeMode} />
      <Sidebar activeMode={activeMode} />

      <Dock activeMode={activeMode} onSelectMode={handleSelectMode} />

      <MusicWidget activeMode={activeMode} />
      <Suspense fallback={null}>
        <PlaylistPickerModal />
      </Suspense>

      <section
        ref={containerRef}
        className="w-full h-full overflow-hidden relative"
      >
        <div
          className={`w-full h-full flex items-center justify-center ${
            activeMode === "home" ? "" : "hidden"
          }`}
          data-mode-view="home"
        >
          {visitedModes.has("home") && <HomeView />}
        </div>

        <div
          className={`w-full h-full flex items-center justify-center ${
            activeMode === "pomodoro" ? "" : "hidden"
          }`}
          data-mode-view="pomodoro"
        >
          {visitedModes.has("pomodoro") && <PomodoroView />}
        </div>

        <div
          className={`w-full h-full flex flex-col items-center justify-between overflow-hidden ${
            activeMode === "todo" ? "" : "hidden"
          }`}
          data-mode-view="todo"
        >
          {visitedModes.has("todo") && <TodoView />}
        </div>

        <div
          className={`w-full h-full flex flex-col items-center justify-between overflow-hidden ${
            activeMode === "stats" ? "" : "hidden"
          }`}
          data-mode-view="stats"
        >
          {visitedModes.has("stats") && (
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <StatsView />
            </Suspense>
          )}
        </div>

        <div
          className={`w-full h-full flex flex-col items-center justify-center overflow-hidden ${
            activeMode === "music" ? "" : "hidden"
          }`}
          data-mode-view="music"
        >
          {visitedModes.has("music") && (
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <MusicView />
            </Suspense>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}

export default IndexPage;
