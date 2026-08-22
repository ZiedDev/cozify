import { useRef } from "react";
import { NumberField, Tooltip } from "@heroui/react";

import { useTimer } from "@/hooks/use-timer";
import { MIN_TARGET_CYCLES, MAX_TARGET_CYCLES } from "@/config/timer";

export function CycleTracker() {
  const { currentCycle, targetCycles, setCurrentCycle, setTargetCycles } =
    useTimer();
  const lastChangeTimeRef = useRef<number>(0);

  const handleCyclesChange = (val: number | undefined) => {
    if (typeof val !== "number" || isNaN(val)) return;

    const now = Date.now();

    // Guard against React Aria step timer + click event double-triggering
    if (now - lastChangeTimeRef.current < 150) {
      return;
    }
    lastChangeTimeRef.current = now;
    setTargetCycles(val);
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Interactive Cycle Indicators with Tooltips */}
      <div className="flex items-center gap-2">
        {Array.from({ length: targetCycles }).map((_, index) => {
          const cycleNumber = index + 1;
          const isCompleted = cycleNumber < currentCycle;
          const isCurrent = cycleNumber === currentCycle;

          return (
            <Tooltip key={cycleNumber} delay={200}>
              <Tooltip.Trigger>
                <button
                  aria-label={`Jump to cycle ${cycleNumber}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? "w-8 bg-accent shadow-sm shadow-accent/40"
                      : isCompleted
                        ? "w-4 bg-accent/50 hover:bg-accent/70"
                        : "w-2.5 bg-surface-secondary border border-separator/80 hover:bg-muted/40"
                  }`}
                  onClick={() => setCurrentCycle(cycleNumber)}
                />
              </Tooltip.Trigger>
              <Tooltip.Content>Jump to cycle {cycleNumber}</Tooltip.Content>
            </Tooltip>
          );
        })}
      </div>

      {/* Cycle count and target stepper */}
      <div className="flex items-center gap-2.5 text-xs md:text-sm text-muted font-medium">
        <span>
          Cycle <strong className="text-foreground">{currentCycle}</strong> of
        </span>

        <NumberField
          aria-label="Target Cycles"
          className="w-24 h-8"
          maxValue={MAX_TARGET_CYCLES}
          minValue={MIN_TARGET_CYCLES}
          step={1}
          value={targetCycles}
          onChange={handleCyclesChange}
        >
          <NumberField.Group className="flex h-full items-center rounded-full bg-surface-secondary border border-separator/80 overflow-hidden shadow-sm">
            <NumberField.DecrementButton className="size-6 h-full text-muted hover:text-foreground" />
            <NumberField.Input className="flex-1 text-center text-xs font-bold text-foreground bg-transparent p-0 tabular-nums outline-none" />
            <NumberField.IncrementButton className="size-6 h-full text-muted hover:text-foreground" />
          </NumberField.Group>
        </NumberField>
      </div>
    </div>
  );
}
