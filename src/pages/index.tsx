import { useState, useRef } from "react";
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

export function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>("home");
  const [dockMode, setDockMode] = useState<AppMode>("home");
  const containerRef = useRef<HTMLDivElement>(null);
  const targetModeRef = useRef<AppMode>("home");
  const isTransitioningRef = useRef<boolean>(false);

  const handleSelectMode = (newMode: AppMode) => {
    if (newMode === targetModeRef.current && newMode === activeMode) return;

    targetModeRef.current = newMode;
    setDockMode(newMode);

    if (isTransitioningRef.current) return;

    if (!containerRef.current) {
      setActiveMode(newMode);
      return;
    }

    isTransitioningRef.current = true;
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        isTransitioningRef.current = false;
        const destination = targetModeRef.current;

        setDockMode(destination);

        if (destination === activeMode) {
          if (containerRef.current) {
            gsap.to(containerRef.current, {
              opacity: 1,
              duration: 0.25,
              ease: "power2.out",
            });
          }
        } else {
          setActiveMode(destination);
        }
      },
    });
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.25,
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

      <Dock activeMode={dockMode} onSelectMode={handleSelectMode} />

      <MusicWidget activeMode={activeMode} />
      <PlaylistPickerModal />

      <section
        ref={containerRef}
        className="w-full h-full overflow-hidden relative"
      >
        {activeMode === "home" && <HomeView />}
        {activeMode === "pomodoro" && <PomodoroView />}
        {activeMode === "todo" && <TodoView />}
        <div
          aria-hidden={activeMode !== "music"}
          className={`w-full h-full ${
            activeMode === "music"
              ? ""
              : "absolute inset-0 pointer-events-none opacity-0 -z-50"
          }`}
        >
          <MusicView isActive={activeMode === "music"} />
        </div>
        {activeMode === "stats" && <StatsView />}
      </section>
    </DefaultLayout>
  );
}

export default IndexPage;
