import { useRef } from "react";
import { ProgressBar, Tooltip } from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

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

interface SidebarWidgetProps {
  show: boolean;
  children: React.ReactNode;
}

function SidebarWidget({ show, children }: SidebarWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useGSAP(
    () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      if (isFirstRender.current) {
        isFirstRender.current = false;
        if (show) {
          gsap.set(container, { height: "auto", display: "block" });
          gsap.set(content, { opacity: 1, x: 0, y: 0, scale: 1 });
        } else {
          gsap.set(container, { height: 0, display: "none" });
          gsap.set(content, { opacity: 0, x: 24, y: -4, scale: 0.94 });
        }
        return;
      }

      if (show) {
        gsap.killTweensOf([container, content]);
        gsap.set(container, { display: "block" });
        const targetHeight = content.offsetHeight;

        gsap.fromTo(
          container,
          { height: container.offsetHeight },
          {
            height: targetHeight,
            duration: 0.32,
            ease: "power2.out",
            onComplete: () => {
              gsap.set(container, { height: "auto" });
            },
          },
        );

        gsap.fromTo(
          content,
          { opacity: 0, x: 24, y: 4, scale: 0.94 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          },
        );
      } else {
        gsap.killTweensOf([container, content]);
        const currentHeight = container.offsetHeight;

        gsap.fromTo(
          container,
          { height: currentHeight },
          {
            height: 0,
            duration: 0.25,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.set(container, { display: "none" });
            },
          },
        );

        gsap.to(content, {
          opacity: 0,
          x: 24,
          y: -4,
          scale: 0.94,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    },
    { dependencies: [show], scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="overflow-hidden w-full flex flex-col items-end pointer-events-none"
    >
      <div
        ref={contentRef}
        className="pb-6 w-full flex flex-col items-end transform-gpu"
      >
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
      aria-label="Workspace Sidebar"
      className="fixed top-24 md:top-28 right-8 md:right-12 z-30 select-none pointer-events-none flex flex-col items-end text-right"
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
