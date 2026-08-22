import { useClock } from "@/hooks/use-clock";
import { useTimer } from "@/hooks/use-timer";
import { AppMode } from "@/config/modes";
import { TIMER_MODE_LABELS } from "@/config/timer";

function SidebarClock() {
  const { time12, period, shortDate } = useClock();

  return (
    <div className="flex flex-col items-end">
      <div className="inline-flex items-baseline gap-1.5 font-sans text-2xl md:text-3xl font-medium text-foreground tabular-nums leading-none">
        <span>{time12}</span>
        <span className="text-xs md:text-sm font-normal text-muted uppercase">
          {period}
        </span>
      </div>
      <p className="text-xs text-muted/70 font-light mt-1 tracking-wide">
        {shortDate}
      </p>
    </div>
  );
}

function SidebarTimer() {
  const { mode, formattedTime, isRunning, isOvertime, hasActiveSession } =
    useTimer();

  if (!hasActiveSession) return null;

  return (
    <div className="flex flex-col items-end">
      <div className="inline-flex items-baseline gap-1.5 font-sans text-2xl md:text-3xl font-medium tabular-nums leading-none">
        <span className={isOvertime ? "text-accent" : "text-foreground"}>
          {formattedTime}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        {isRunning && (
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        )}
        <p className="text-xs text-muted/70 font-light tracking-wide">
          {TIMER_MODE_LABELS[mode]} {isRunning ? "• In Progress" : "• Paused"}
        </p>
      </div>
    </div>
  );
}

interface SidebarProps {
  activeMode: AppMode;
}

export function Sidebar({ activeMode }: SidebarProps) {
  const { hasActiveSession } = useTimer();
  const showClock = activeMode !== "home";
  const showTimer = activeMode !== "pomodoro" && hasActiveSession;

  return (
    <aside
      aria-label="Workspace Sidebar"
      className="fixed top-24 md:top-28 right-8 md:right-12 z-30 select-none pointer-events-none flex flex-col items-end gap-6 text-right transition-all duration-300 ease-out"
    >
      {showClock && <SidebarClock />}
      {showTimer && <SidebarTimer />}
    </aside>
  );
}
