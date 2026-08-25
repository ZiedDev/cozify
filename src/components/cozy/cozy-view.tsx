import { SidebarTodoWidget } from "@/components/layout/sidebar-left";
import { SidebarClock, SidebarTimer } from "@/components/layout/sidebar";
import { useTimer } from "@/hooks/use-timer";

export function CozyView() {
  const { hasActiveSession } = useTimer();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-0 overflow-y-auto no-scrollbar select-none">
      {/* Mobile & Tablet (<= 950px): Centered, pure transparent floating widgets */}
      <div className="flex min-[951px]:hidden flex-col items-center justify-center w-full max-w-xs sm:max-w-sm mx-auto my-auto px-4 py-4 gap-6 animate-in fade-in zoom-in-98 duration-200">
        {/* Centered Clock & Day Progress */}
        <SidebarClock align="center" />

        {/* Optional Centered Focus Timer */}
        {hasActiveSession && <SidebarTimer align="center" />}

        {/* Centered To-Do Widget */}
        <SidebarTodoWidget align="center" />
      </div>

      {/* On Desktop (> 950px): Open ambient center space while desktop sidebars float on left and right */}
      <div className="hidden min-[951px]:flex flex-1 w-full pointer-events-none" />
    </div>
  );
}
