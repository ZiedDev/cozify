import { Button, Typography } from "@heroui/react";
import { Plus, Minus } from "lucide-react";

import { MAX_DURATION_SECONDS } from "@/config/timer";

interface TimerDisplayProps {
  formattedTime: string;
  isOvertime: boolean;
  timeLeft: number;
  onAddMinutes?: (minutes: number) => void;
}

export function TimerDisplay({
  formattedTime,
  isOvertime,
  timeLeft,
  onAddMinutes,
}: TimerDisplayProps) {
  const isMinusDisabled = timeLeft <= 60;
  const isPlusDisabled = timeLeft >= MAX_DURATION_SECONDS;

  return (
    <div className="group relative flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-4 md:gap-6 select-none py-0.5 sm:py-1 w-full">
      {/* Minus 5 mins button on left */}
      {onAddMinutes && (
        <Button
          isIconOnly
          aria-label="Subtract 5 minutes"
          className="shrink-0 size-8 xs:size-9 sm:size-10 md:size-11 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted hover:text-foreground hover:bg-surface/80"
          isDisabled={isMinusDisabled}
          size="sm"
          variant="ghost"
          onPress={() => onAddMinutes(-5)}
        >
          <Minus className="size-4 sm:size-5 md:size-6" />
        </Button>
      )}

      {/* Main Time Digits & Labels */}
      <div className="flex flex-col items-center justify-center">
        <Typography
          className={`font-sans text-6xl xs:text-7xl sm:text-8xl md:text-9xl lg:text-[9.5rem] tracking-tight tabular-nums leading-none transition-colors ${
            isOvertime ? "text-accent" : "text-foreground"
          }`}
          type="h1"
          weight="medium"
        >
          {formattedTime}
        </Typography>
        {/* Minutes and Seconds Indicators */}
        <div className="flex items-center justify-between w-full max-w-44 xs:max-w-52 sm:max-w-64 md:max-w-80 px-2 sm:px-4 text-[9px] xs:text-[10px] sm:text-xs font-semibold st uppercase mt-0.5 sm:mt-1">
          <Typography
            className="text-[9px] xs:text-[10px] sm:text-xs st uppercase"
            color="muted"
            type="body-xs"
            weight="semibold"
          >
            minutes
          </Typography>
          <Typography
            className="text-[9px] xs:text-[10px] sm:text-xs st uppercase"
            color="muted"
            type="body-xs"
            weight="semibold"
          >
            seconds
          </Typography>
        </div>
      </div>

      {/* Plus 5 mins button on right */}
      {onAddMinutes && (
        <Button
          isIconOnly
          aria-label="Add 5 minutes"
          className="shrink-0 size-8 xs:size-9 sm:size-10 md:size-11 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted hover:text-foreground hover:bg-surface/80"
          isDisabled={isPlusDisabled}
          size="sm"
          variant="ghost"
          onPress={() => onAddMinutes(5)}
        >
          <Plus className="size-4 sm:size-5 md:size-6" />
        </Button>
      )}
    </div>
  );
}
