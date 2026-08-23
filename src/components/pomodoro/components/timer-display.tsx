import { Button } from "@heroui/react";
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
    <div className="group relative flex items-center justify-center gap-3 sm:gap-6 select-none py-1 w-full">
      {/* Minus 5 mins button on left (appears on hover, disabled when <= 1m) */}
      {onAddMinutes && (
        <Button
          isIconOnly
          aria-label="Subtract 5 minutes"
          className="size-10 sm:size-11 rounded-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted hover:text-foreground hover:bg-surface/80"
          isDisabled={isMinusDisabled}
          size="md"
          variant="ghost"
          onPress={() => onAddMinutes(-5)}
        >
          <Minus className="size-5 sm:size-6" />
        </Button>
      )}

      {/* Main Time Digits & Labels */}
      <div className="flex flex-col items-center justify-center">
        <span
          className={`font-sans text-8xl sm:text-9xl md:text-[10rem] font-medium tracking-tight tabular-nums leading-none transition-colors ${
            isOvertime ? "text-accent" : "text-foreground"
          }`}
        >
          {formattedTime}
        </span>
        {/* Minutes and Seconds Indicators */}
        <div className="flex items-center justify-between w-full max-w-60 sm:max-w-75 md:max-w-85 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold tracking-widest text-muted uppercase">
          <span>minutes</span>
          <span>seconds</span>
        </div>
      </div>

      {/* Plus 5 mins button on right (appears on hover, disabled when max time) */}
      {onAddMinutes && (
        <Button
          isIconOnly
          aria-label="Add 5 minutes"
          className="size-10 sm:size-11 rounded-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted hover:text-foreground hover:bg-surface/80"
          isDisabled={isPlusDisabled}
          size="md"
          variant="ghost"
          onPress={() => onAddMinutes(5)}
        >
          <Plus className="size-5 sm:size-6" />
        </Button>
      )}
    </div>
  );
}
