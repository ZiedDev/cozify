import { Button, cn, Typography } from "@heroui/react";
import { Plus, Minus } from "lucide-react";

import { RollingTimerText } from "./rolling-timer-text";

import { MAX_DURATION_SECONDS, TimerMode } from "@/config/timer";

export function TimerDisplay({
  formattedTime,
  isOvertime,
  timeLeft,
  onAddMinutes,
  mode,
}: {
  formattedTime: string;
  isOvertime: boolean;
  timeLeft: number;
  onAddMinutes?: (minutes: number) => void;
  mode?: TimerMode;
}) {
  const isMinusDisabled = timeLeft <= 60;
  const isPlusDisabled = timeLeft >= MAX_DURATION_SECONDS;

  return (
    <div className="group relative flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-4 md:gap-6 select-none py-0.5 sm:py-1 w-full">
      {/* Minus 5 mins button on left */}
      {onAddMinutes && (
        <Button
          isIconOnly
          aria-label="Subtract 5 minutes"
          className="size-10 rounded-xl text-muted"
          isDisabled={isMinusDisabled}
          size="sm"
          variant="ghost"
          onPress={() => onAddMinutes(-5)}
        >
          <Minus className="size-6" />
        </Button>
      )}

      {/* Main Time Digits & Labels */}
      <div className="flex flex-col items-center justify-center">
        <Typography
          aria-label={formattedTime}
          className={cn(
            "text-6xl xs:text-7xl sm:text-7xl md:text-8xl lg:text-9xl transition-colors ",
            isOvertime ? "text-accent" : "text-foreground",
          )}
          type="h1"
          weight="medium"
        >
          <RollingTimerText formattedTime={formattedTime} mode={mode} />
        </Typography>
        {/* Minutes and Seconds Indicators */}
        <div className="flex items-center justify-between w-full max-w-44 xs:max-w-52 sm:max-w-64 md:max-w-80 px-2 sm:px-4 text-[9px] xs:text-[10px] sm:text-xs font-semibold uppercase mt-0.5 sm:mt-1">
          <Typography color="muted" type="body-xs" weight="semibold">
            minutes
          </Typography>
          <Typography color="muted" type="body-xs" weight="semibold">
            seconds
          </Typography>
        </div>
      </div>

      {/* Plus 5 mins button on right */}
      {onAddMinutes && (
        <Button
          isIconOnly
          aria-label="Add 5 minutes"
          className="size-10 rounded-xl text-muted"
          isDisabled={isPlusDisabled}
          size="sm"
          variant="ghost"
          onPress={() => onAddMinutes(5)}
        >
          <Plus className="size-6" />
        </Button>
      )}
    </div>
  );
}
