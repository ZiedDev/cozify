import { ProgressBar, Tooltip } from "@heroui/react";

import { useClock } from "@/hooks/use-clock";
import { useTimer } from "@/hooks/use-timer";
import { AppMode } from "@/config/modes";
import { TIMER_MODE_LABELS } from "@/config/timer";

function SidebarClock() {
  const {
    time12,
    period,
    sidebarDate,
    dayPercent,
    hoursLeft,
    minutesLeft,
  } = useClock();

  return (
    <div className="flex flex-col items-end">
      <div className="inline-flex items-baseline gap-1.5 font-sans text-2xl md:text-3xl font-medium text-foreground tabular-nums leading-none">
        <span>{time12}</span>
        <span className="text-xs md:text-sm font-normal text-muted uppercase">
          {period}
        </span>
      </div>
      <p className="text-xs text-muted/70 font-light mt-1 tracking-wide">
        {sidebarDate}
      </p>

      {/* Day Progress Bar with Tooltip */}
      <Tooltip delay={100}>
        <Tooltip.Trigger>
          <div
            className="w-28 sm:w-32 mt-2 pointer-events-auto cursor-pointer group"
            tabIndex={0}
          >
            <ProgressBar aria-label="Day progress" value={dayPercent}>
              <ProgressBar.Track className="h-1 sm:h-1.5 bg-surface-secondary/90 rounded-full overflow-hidden border border-separator/40">
                <ProgressBar.Fill className="bg-accent/85 group-hover:bg-accent rounded-full transition-all duration-300" />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg pointer-events-auto">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground text-xs">
              {Math.round(dayPercent)}% of day completed
            </span>
            <span className="text-[11px] text-muted">
              Ending in {hoursLeft}h {minutesLeft}m
            </span>
          </div>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

function SidebarTimer() {
  const {
    mode,
    formattedTime,
    isRunning,
    isOvertime,
    hasActiveSession,
    accumulatedFocusSeconds,
  } = useTimer();

  if (!hasActiveSession) return null;

  const focusMinutes = Math.floor(accumulatedFocusSeconds / 60);
  const focusHours = Math.floor(focusMinutes / 60);
  const remainingFocusMins = focusMinutes % 60;
  const focusSecs = accumulatedFocusSeconds % 60;

  const formattedFocus =
    focusHours > 0
      ? `${focusHours}h ${remainingFocusMins}m`
      : focusMinutes > 0
        ? `${focusMinutes}m ${focusSecs}s`
        : `${focusSecs}s`;

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
      <p className="text-[11px] text-muted/80 font-normal mt-0.5 tracking-wide tabular-nums">
        Focus elapsed:{" "}
        <span className="text-foreground/90 font-medium">
          {formattedFocus}
        </span>
      </p>
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
      className="fixed top-24 md:top-28 right-8 md:right-12 z-30 select-none pointer-events-none flex flex-col items-end gap-6 text-right"
    >
      {showClock && (
        <div className="animate-fade-in-up">
          <SidebarClock />
        </div>
      )}

      {showTimer && (
        <div className="animate-fade-in-up">
          <SidebarTimer />
        </div>
      )}
    </aside>
  );
}
