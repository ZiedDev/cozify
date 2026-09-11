import { ReactNode } from "react";

import { SidebarClock } from "./sidebar-clock";
import { SidebarTimer } from "./sidebar-timer";

import { useTimer } from "@/hooks/use-timer";
import { AppMode } from "@/config/modes";

export { SidebarClock, SidebarTimer };

function SidebarWidget({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid w-full transition-all duration-300 ease-out ${
        show
          ? "grid-rows-[1fr] opacity-100 translate-x-0"
          : "grid-rows-[0fr] opacity-0 translate-x-4 pointer-events-none"
      }`}
    >
      <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-end">
        {children}
      </div>
    </div>
  );
}

export function Sidebar({ activeMode }: { activeMode: AppMode }) {
  const { hasActiveSession } = useTimer();
  const showClock = activeMode !== "home";
  const showTimer =
    activeMode !== "pomodoro" && (hasActiveSession || activeMode !== "home");

  return (
    <aside
      aria-label="Workspace Right Sidebar"
      className="hidden min-[951px]:flex fixed top-20 md:top-24 lg:top-28 right-4 md:right-6 lg:right-8 xl:right-12 z-30 select-none pointer-events-none flex-col items-end text-right w-56 md:w-60 lg:w-64 xl:w-72"
    >
      <SidebarWidget show={showClock}>
        <SidebarClock />
      </SidebarWidget>

      <SidebarWidget show={showTimer}>
        <SidebarTimer />
      </SidebarWidget>
    </aside>
  );
}
