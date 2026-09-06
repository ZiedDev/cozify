import { ReactNode } from "react";
import { Button, ProgressBar, Tooltip, Typography } from "@heroui/react";
import { PictureInPicture2 } from "lucide-react";

import { useClock } from "@/hooks/use-clock";
import { useTimer } from "@/hooks/use-timer";
import { usePip } from "@/hooks/use-pip";
import { AppMode } from "@/config/modes";
import { TIMER_MODE_LABELS } from "@/config/timer";
import { RollingText } from "@/components/ui/rolling-text";

export function SidebarClock({
  align = "end",
}: {
  align?: "end" | "center" | "start";
}) {
  const { time12, period, sidebarDate, dayPercent, hoursLeft, minutesLeft } =
    useClock();

  return (
    <div
      className={`flex flex-col w-full ${
        align === "center"
          ? "items-center text-center"
          : align === "start"
            ? "items-start text-left"
            : "items-end text-right"
      }`}
    >
      <div className="inline-flex items-baseline gap-1 md:gap-1.5 font-sans text-xl md:text-2xl lg:text-3xl font-medium text-foreground tabular-nums leading-none">
        <RollingText value={time12} />
        <Typography
          className="text-xs md:text-sm font-normal uppercase"
          color="muted"
          type="body-xs"
        >
          {period}
        </Typography>
      </div>
      <Typography
        className="text-xs md:text-sm font-light mt-1 opacity-80"
        color="muted"
        type="body-xs"
      >
        {sidebarDate}
      </Typography>

      {/* Day Progress Bar with Tooltip */}
      <Tooltip delay={100}>
        <Tooltip.Trigger>
          <div className="w-28 md:w-32 lg:w-36 mt-1.5 md:mt-2 pointer-events-auto cursor-pointer group">
            <ProgressBar aria-label="Day progress" value={dayPercent}>
              <ProgressBar.Track className="h-1 sm:h-1.5 bg-surface-secondary/90 rounded-full overflow-hidden border border-separator/40">
                <ProgressBar.Fill className="bg-accent/85 group-hover:bg-accent rounded-full transition-[width,background-color] duration-300" />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg pointer-events-auto">
          <div className="flex flex-col gap-0.5">
            <Typography
              className="text-foreground text-xs"
              type="body-xs"
              weight="semibold"
            >
              {Math.round(dayPercent)}% of day completed
            </Typography>
            <Typography className="text-xs" color="muted" type="body-xs">
              Ending in {hoursLeft}h {minutesLeft}m
            </Typography>
          </div>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

function formatElapsedDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  const secs = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${remainingMins}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;

  return `${secs}s`;
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
    isPaused,
    isOvertime,
    hasActiveSession,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
  } = useTimer();
  const { isPipActive, togglePip } = usePip();

  if (align === "center" && !hasActiveSession) return null;

  const formattedFocus =
    accumulatedFocusSeconds === 0
      ? "0s"
      : formatElapsedDuration(accumulatedFocusSeconds);
  const formattedOvertime = formatElapsedDuration(accumulatedOvertimeSeconds);

  return (
    <div
      className={`flex flex-col w-full pointer-events-auto ${
        align === "center"
          ? "items-center text-center"
          : align === "start"
            ? "items-start text-left"
            : "items-end text-right"
      }`}
    >
      <div className="flex items-center gap-2">
        {align === "end" && (
          <Tooltip delay={150}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label={
                  isPipActive ? "Close pop-out window" : "Pop out timer"
                }
                className={`size-7 rounded-xl border transition-all duration-150 cursor-pointer pointer-events-auto shadow-xs ${
                  isPipActive
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-surface-secondary/60 hover:bg-surface-secondary border-separator/40 hover:border-separator text-muted hover:text-foreground"
                }`}
                size="sm"
                variant={isPipActive ? "primary" : "ghost"}
                onPress={togglePip}
              >
                <PictureInPicture2 className="size-3.5" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg pointer-events-auto">
              <Typography className="text-xs font-medium" type="body-xs">
                {isPipActive ? "Close pop-out window" : "Pop out timer"}
              </Typography>
            </Tooltip.Content>
          </Tooltip>
        )}

        <div className="inline-flex items-baseline gap-1 md:gap-1.5 font-sans text-xl md:text-2xl lg:text-3xl font-medium tabular-nums leading-none">
          <span className={isOvertime ? "text-accent" : "text-foreground"}>
            <RollingText triggerKey={mode} value={formattedTime} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        {isRunning && (
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        )}
        <Typography
          className="text-xs md:text-sm font-light opacity-80"
          color="muted"
          type="body-xs"
        >
          {TIMER_MODE_LABELS[mode]}{" "}
          {isRunning ? "• In Progress" : isPaused ? "• Paused" : "• Ready"}
        </Typography>
      </div>
      <Typography
        className={`text-xs md:text-sm font-normal mt-0.5 tabular-nums flex items-center gap-1 flex-wrap ${
          align === "center"
            ? "justify-center"
            : align === "start"
              ? "justify-start"
              : "justify-end"
        }`}
        color="muted"
        type="body-xs"
      >
        <span>Focus elapsed:</span>
        <span className="text-foreground/90 font-medium">{formattedFocus}</span>
        {accumulatedOvertimeSeconds > 0 && (
          <span className="text-accent font-medium ml-0.5">
            +{formattedOvertime}
          </span>
        )}
      </Typography>
    </div>
  );
}

function SidebarWidget({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out ${
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
