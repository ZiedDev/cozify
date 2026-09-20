import { useState, useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { Dock } from "@/components/layout/dock";
import { HomeView } from "@/menus/home";
import { PomodoroView } from "@/menus/pomodoro";
import { MusicView } from "@/menus/music";
import { MusicWidget, PlaylistPickerModal } from "@/components/music";
import { TodoView } from "@/menus/todo";
import { StatsView } from "@/menus/stats";
import { AppMode } from "@/config/modes";
import { storageAdapter } from "@/services/storage";

const LAST_TAB_STORAGE_KEY = "cozify_last_active_tab";

export function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>(() => {
    return storageAdapter.getItem<AppMode>(LAST_TAB_STORAGE_KEY, "home");
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectMode = useCallback((newMode: AppMode) => {
    setActiveMode(newMode);
    storageAdapter.setItem(LAST_TAB_STORAGE_KEY, newMode);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 8, scale: 0.995 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [activeMode], scope: containerRef },
  );

  return (
    <DefaultLayout>
      <SidebarLeft activeMode={activeMode} />
      <Sidebar activeMode={activeMode} />

      <Dock activeMode={activeMode} onSelectMode={handleSelectMode} />

      <MusicWidget activeMode={activeMode} />
      <PlaylistPickerModal />

      <section
        ref={containerRef}
        className="w-full h-full overflow-hidden relative"
      >
        {activeMode === "home" && <HomeView />}
        {activeMode === "pomodoro" && <PomodoroView />}
        {activeMode === "todo" && <TodoView />}
        {activeMode === "music" && <MusicView />}
        {activeMode === "stats" && <StatsView />}
      </section>
    </DefaultLayout>
  );
}

export default IndexPage;
