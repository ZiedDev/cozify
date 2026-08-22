interface TimerDisplayProps {
  formattedTime: string;
  isOvertime: boolean;
}

export function TimerDisplay({ formattedTime, isOvertime }: TimerDisplayProps) {
  return (
    <div className="relative flex flex-col items-center justify-center select-none py-1">
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
  );
}
