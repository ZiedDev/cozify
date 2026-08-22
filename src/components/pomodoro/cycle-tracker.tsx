import { Plus, Minus } from "lucide-react";
import { Button, Tooltip } from "@heroui/react";

import { useTimer } from "@/hooks/use-timer";
import { MIN_TARGET_CYCLES, MAX_TARGET_CYCLES } from "@/config/timer";

export function CycleTracker() {
  const { currentCycle, targetCycles, setCurrentCycle, setTargetCycles } =
    useTimer();

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
              <Tooltip.Content className="text-xs px-2.5 py-1 rounded-xl bg-surface border border-separator/80 shadow-lg text-foreground font-medium">
                Jump to cycle {cycleNumber}
              </Tooltip.Content>
            </Tooltip>
          );
        })}
      </div>

      {/* Cycle count and target stepper */}
      <div className="flex items-center gap-2.5 text-xs md:text-sm text-muted font-medium">
        <span>
          Cycle <strong className="text-foreground">{currentCycle}</strong> of
        </span>

        <div className="flex items-center gap-1 bg-surface-secondary px-1.5 py-0.5 rounded-full border border-separator/60">
          <Button
            isIconOnly
            aria-label="Decrease Target Cycles"
            className="size-5 min-w-0 p-0 rounded-full"
            isDisabled={targetCycles <= MIN_TARGET_CYCLES}
            size="sm"
            variant="secondary"
            onPress={() => setTargetCycles(targetCycles - 1)}
          >
            <Minus className="size-3 text-muted" />
          </Button>

          <span className="w-5 text-center font-mono font-bold text-foreground text-xs">
            {targetCycles}
          </span>

          <Button
            isIconOnly
            aria-label="Increase Target Cycles"
            className="size-5 min-w-0 p-0 rounded-full"
            isDisabled={targetCycles >= MAX_TARGET_CYCLES}
            size="sm"
            variant="secondary"
            onPress={() => setTargetCycles(targetCycles + 1)}
          >
            <Plus className="size-3 text-muted" />
          </Button>
        </div>
      </div>
    </div>
  );
}
