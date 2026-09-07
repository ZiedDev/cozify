import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@heroui/styles";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { Dock } from "@/components/layout/dock";
import { Clock } from "@/menus/home/clock";
import { Timer } from "@/menus/pomodoro/timer";
import { MusicWidget } from "@/components/music/music-widget";
import { PlaylistPickerModal } from "@/components/music/playlist-picker-modal";
import { AppMode } from "@/config/modes";
import { TodoPage } from "@/menus/todo/todo-page";
import { StatsPage } from "@/menus/stats/stats-page";
import { MusicView } from "@/menus/music/music-view";

export function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>("home");
  const [nextMode, setNextMode] = useState<AppMode>("home");
  const containerRef = useRef<HTMLDivElement>(null);
  const prevModeRef = useRef<AppMode>(activeMode);

  // Enter animation
  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            setActiveMode(nextMode);
          },
        },
      );

      prevModeRef.current = activeMode;
    },
    { dependencies: [activeMode], scope: containerRef },
  );

  // Exit animation
  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 1, scale: 1, y: 0 },
        {
          opacity: 0,
          scale: 0.9,
          y: 20,
          duration: 0.15,
          ease: "power2.in",
          onComplete: () => {
            setActiveMode(nextMode);
          },
        },
      );

      prevModeRef.current = activeMode;
    },
    { dependencies: [nextMode], scope: containerRef },
  );

  return (
    <DefaultLayout>
      <SidebarLeft activeMode={activeMode} />
      <Sidebar activeMode={activeMode} />

      <Dock activeMode={nextMode} onSelectMode={setNextMode} />

      {/* Floating Audio Deck & Library Modal */}
      <MusicWidget activeMode={activeMode} />
      <PlaylistPickerModal />

      <section ref={containerRef} className="w-full h-full overflow-hidden">
        {activeMode === "home" && <Clock />}
        {activeMode === "pomodoro" && <Timer />}
        {activeMode === "todo" && <TodoPage />}
        {activeMode === "music" && <MusicView />}
        {activeMode === "stats" && <StatsPage />}
      </section>
    </DefaultLayout>
  );
}

export default IndexPage;
