import { ProgressBar, Tooltip, Typography } from "@heroui/react";

import { useClock } from "@/hooks/use-clock";
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
