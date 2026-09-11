import { useRef } from "react";
import {
  Button,
  Popover,
  Tooltip,
  Separator,
  NumberField,
  Typography,
} from "@heroui/react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

import {
  TIMER_MODES,
  TIMER_MODE_LABELS,
  DEFAULT_TIMER_DURATIONS,
  TimerDurations,
} from "@/config/timer";

export function DurationsPopover({
  durations,
  isOpen,
  onOpenChange,
  setCustomDurations,
}: {
  durations: TimerDurations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  setCustomDurations: (newDurations: Partial<TimerDurations>) => void;
}) {
  const lastChangeTimeRef = useRef<{ [key: string]: number }>({});

  const handleGuardedChange = (key: string, action: () => void) => {
    const now = Date.now();

    if (now - (lastChangeTimeRef.current[key] || 0) < 150) {
      return;
    }
    lastChangeTimeRef.current[key] = now;
    action();
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
      <Tooltip delay={150} isDisabled={isOpen}>
        <Tooltip.Trigger>
          <Button
            isIconOnly
            aria-label="Customize Durations"
            className="size-12 sm:size-14 rounded-2xl flex items-center justify-center p-0"
            size="lg"
            variant="secondary"
          >
            <SlidersHorizontal className="size-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
          <span className="text-xs font-medium">Customize durations</span>
        </Tooltip.Content>
      </Tooltip>
      <Popover.Content>
        <Popover.Dialog className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Typography
              className="r uppercase text-xs"
              color="muted"
              type="body-xs"
              weight="bold"
            >
              Durations
            </Typography>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setCustomDurations(DEFAULT_TIMER_DURATIONS)}
            >
              <RotateCcw className="size-3" />
              <span>Default</span>
            </Button>
          </div>
          <Separator />

          {TIMER_MODES.map((timerMode) => {
            const totalSeconds = durations[timerMode.id];
            const modeMinutes = Math.floor(totalSeconds / 60);
            const modeSeconds = totalSeconds % 60;

            return (
              <div
                key={timerMode.id}
                className="flex items-center justify-between gap-3"
              >
                <Typography color="muted" type="body-sm" weight="medium">
                  {TIMER_MODE_LABELS[timerMode.id]}
                </Typography>

                <div className="flex items-center gap-2">
                  {/* Minutes NumberField */}
                  <div className="flex items-center gap-1">
                    <NumberField
                      aria-label={`${TIMER_MODE_LABELS[timerMode.id]} Minutes`}
                      className="w-24 h-7"
                      formatOptions={{
                        style: "unit",
                        unit: "minute",
                        unitDisplay: "narrow",
                      }}
                      maxValue={180}
                      minValue={0}
                      step={1}
                      value={modeMinutes}
                      onChange={(minuteValue) => {
                        if (
                          typeof minuteValue === "number" &&
                          !isNaN(minuteValue)
                        ) {
                          handleGuardedChange(`min_${timerMode.id}`, () => {
                            const newTotal = Math.max(
                              5,
                              minuteValue * 60 + modeSeconds,
                            );

                            setCustomDurations({ [timerMode.id]: newTotal });
                          });
                        }
                      }}
                    >
                      <NumberField.Group className="flex h-full items-center rounded-full bg-surface-secondary border border-separator/80 overflow-hidden shadow-sm">
                        <NumberField.DecrementButton className="size-6 h-full text-muted hover:text-foreground" />
                        <NumberField.Input className="flex-1 text-center text-xs font-bold text-foreground bg-transparent p-0 tabular-nums outline-none" />
                        <NumberField.IncrementButton className="size-6 h-full text-muted hover:text-foreground" />
                      </NumberField.Group>
                    </NumberField>
                  </div>

                  {/* Seconds NumberField */}
                  <div className="flex items-center gap-1">
                    <NumberField
                      aria-label={`${TIMER_MODE_LABELS[timerMode.id]} Seconds`}
                      className="w-24 h-7"
                      formatOptions={{
                        style: "unit",
                        unit: "second",
                        unitDisplay: "narrow",
                      }}
                      maxValue={55}
                      minValue={0}
                      step={5}
                      value={modeSeconds}
                      onChange={(secondValue) => {
                        if (
                          typeof secondValue === "number" &&
                          !isNaN(secondValue)
                        ) {
                          handleGuardedChange(`sec_${timerMode.id}`, () => {
                            const newTotal = Math.max(
                              5,
                              modeMinutes * 60 + secondValue,
                            );

                            setCustomDurations({ [timerMode.id]: newTotal });
                          });
                        }
                      }}
                    >
                      <NumberField.Group className="flex h-full items-center rounded-full bg-surface-secondary border border-separator/80 overflow-hidden shadow-sm">
                        <NumberField.DecrementButton className="size-6 h-full text-muted hover:text-foreground" />
                        <NumberField.Input className="flex-1 text-center text-xs font-bold text-foreground bg-transparent p-0 tabular-nums outline-none" />
                        <NumberField.IncrementButton className="size-6 h-full text-muted hover:text-foreground" />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>
              </div>
            );
          })}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
