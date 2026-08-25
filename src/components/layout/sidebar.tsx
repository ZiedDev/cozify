import { ProgressBar, Tooltip } from "@heroui/react";

import { useClock } from "@/hooks/use-clock";
import { useTimer } from "@/hooks/use-timer";
import { AppMode } from "@/config/modes";
import { TIMER_MODE_LABELS } from "@/config/timer";

export function SidebarClock({
  align = "end",
}: {
  align?: "end" | "center" | "start";
}) {
  const { time12, period, sidebarDate, dayPercent, hoursLeft, minutesLeft } =
    useClock();

  return (
    <div
      className={`flex flex-col ${
        align === "center"
          ? "items-center text-center"
          : align === "start"
            ? "items-start text-left"
            : "items-end text-right"
      }`}
    >
      <div className="inline-flex items-baseline gap-1 md:gap-1.5 font-sans text-xl md:text-2xl lg:text-3xl font-medium text-foreground tabular-nums leading-none">
        <span>{time12}</span>
        <span className="text-[10px] md:text-xs lg:text-sm font-normal text-muted uppercase">
          {period}
        </span>
      </div>
      <p className="text-[11px] md:text-xs text-muted/70 font-light mt-1 tracking-wide">
        {sidebarDate}
      </p>

      {/* Day Progress Bar with Tooltip */}
      <Tooltip delay={100}>
        <Tooltip.Trigger>
          <div className="w-24 md:w-28 lg:w-32 mt-1.5 md:mt-2 pointer-events-auto cursor-pointer group">
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

export function SidebarTimer({
  align = "end",
}: {
  align?: "end" | "center" | "start";
}) {
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
    <div
      className={`flex flex-col ${
        align === "center"
          ? "items-center text-center"
          : align === "start"
            ? "items-start text-left"
            : "items-end text-right"
      }`}
    >
      <div className="inline-flex items-baseline gap-1 md:gap-1.5 font-sans text-xl md:text-2xl lg:text-3xl font-medium tabular-nums leading-none">
        <span className={isOvertime ? "text-accent" : "text-foreground"}>
          {formattedTime}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        {isRunning && (
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        )}
        <p className="text-[11px] md:text-xs text-muted/70 font-light tracking-wide">
          {TIMER_MODE_LABELS[mode]} {isRunning ? "• In Progress" : "• Paused"}
        </p>
      </div>
      <p className="text-[10px] md:text-[11px] text-muted/80 font-normal mt-0.5 tracking-wide tabular-nums">
        Focus elapsed:{" "}
        <span className="text-foreground/90 font-medium">{formattedFocus}</span>
      </p>
    </div>
  );
}

interface SidebarWidgetProps {
  show: boolean;
  children: React.ReactNode;
}

function SidebarWidget({ show, children }: SidebarWidgetProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        show
          ? "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0 pointer-events-none"
      }`}
    >
      <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-end">
        {children}
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
      aria-label="Workspace Right Sidebar"
      className="hidden min-[951px]:flex fixed top-20 md:top-24 lg:top-28 right-4 md:right-6 lg:right-8 xl:right-12 z-30 select-none pointer-events-none flex-col items-end text-right"
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
