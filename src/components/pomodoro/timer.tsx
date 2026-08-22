import { useState, useEffect } from "react";
import {
  Button,
  AlertDialog,
  Modal,
  Tabs,
  Popover,
  Separator,
  Chip,
} from "@heroui/react";
import {
  Play,
  Pause,
  Plus,
  Minus,
  Coffee,
  SlidersHorizontal,
  SquareCheck,
} from "lucide-react";

import { useTimer } from "@/hooks/use-timer";
import { TIMER_MODES, TimerMode, TIMER_MODE_LABELS } from "@/config/timer";
import { CycleTracker } from "@/components/pomodoro/cycle-tracker";
import { SaveProgressModal } from "@/components/pomodoro/save-progress-modal";

export function Timer() {
  const {
    mode,
    durations,
    formattedTime,
    isRunning,
    isOvertime,
    hasActiveSession,
    isSaveModalOpen,
    setIsSaveModalOpen,
    switchMode,
    toggle,
    addMinutes,
    finishCycleAndTakeBreak,
    setCustomDurations,
  } = useTimer();

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState<boolean>(false);
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] =
    useState<boolean>(false);

  // Always close popovers when any modal or alert dialog is opened
  useEffect(() => {
    if (isBreakModalOpen || isSaveModalOpen || pendingAction !== null) {
      setIsDurationPopoverOpen(false);
    }
  }, [isBreakModalOpen, isSaveModalOpen, pendingAction]);

  const confirmOrRun = (action: () => void) => {
    setIsDurationPopoverOpen(false);
    if (hasActiveSession) setPendingAction(() => action);
    else action();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const isFocus = mode === "focus";

  const adjustMinutes = (targetMode: TimerMode, delta: number) => {
    const total = durations[targetMode];
    const curMin = Math.floor(total / 60);
    const curSec = total % 60;
    const newMin = Math.max(0, Math.min(180, curMin + delta));
    const newTotal = Math.max(5, newMin * 60 + curSec);

    setCustomDurations({ [targetMode]: newTotal });
  };

  const adjustSeconds = (targetMode: TimerMode, delta: number) => {
    const total = durations[targetMode];
    const curMin = Math.floor(total / 60);
    const curSec = total % 60;
    let newSec = curSec + delta;
    let newMin = curMin;

    if (newSec >= 60) {
      newSec -= 60;
      newMin = Math.min(180, newMin + 1);
    } else if (newSec < 0) {
      if (newMin > 0) {
        newSec += 60;
        newMin -= 1;
      } else {
        newSec = 0;
      }
    }
    const newTotal = Math.max(5, newMin * 60 + newSec);

    setCustomDurations({ [targetMode]: newTotal });
  };

  const formatMinSec = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    if (s === 0) return `${m} min`;

    return `${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-xl mx-auto">
      {/* Interactive Cycle Tracker */}
      <CycleTracker />

      {/* Mode Switching Tabs */}
      <Tabs
        className="w-fit"
        selectedKey={mode}
        onSelectionChange={(key) => {
          const newMode = key as TimerMode;

          if (newMode !== mode) confirmOrRun(() => switchMode(newMode));
        }}
      >
        <Tabs.ListContainer className="rounded-full">
          <Tabs.List
            aria-label="Timer Modes"
            className="rounded-full bg-surface p-1"
          >
            {TIMER_MODES.map((m) => (
              <Tabs.Tab
                key={m.id}
                className="h-10 sm:h-11 rounded-full px-5 sm:px-7 w-auto text-sm sm:text-base font-medium whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer"
                id={m.id}
              >
                <span>{m.label}</span>
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-sm" />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* Main Large Timer Display with Clean Overtime Chip */}
      <div className="relative flex flex-col items-center justify-center select-none py-1">
        {isOvertime && (
          <div className="mb-2">
            <Chip color="accent" size="sm" variant="soft">
              Overtime +{formattedTime.replace("+", "")}
            </Chip>
          </div>
        )}
        <span
          className={`font-sans text-8xl sm:text-9xl md:text-[10rem] font-medium tracking-tight tabular-nums leading-none transition-colors ${
            isOvertime ? "text-accent" : "text-foreground"
          }`}
        >
          {formattedTime}
        </span>
      </div>

      {/* ALL Controls in ONE Single Row */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
        {/* Start / Pause */}
        <Button
          className="px-7 sm:px-9 py-6 sm:py-7 rounded-2xl text-base sm:text-lg font-medium shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          size="lg"
          variant="primary"
          onPress={toggle}
        >
          {isRunning ? (
            <>
              <Pause className="size-5 sm:size-6 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="size-5 sm:size-6 fill-current" />
              <span>Start</span>
            </>
          )}
        </Button>

        {/* Quick +5m */}
        <Button
          className="px-3.5 sm:px-4 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1"
          size="lg"
          variant="secondary"
          onPress={() => addMinutes(5)}
        >
          <Plus className="size-4" />
          <span>5m</span>
        </Button>

        {/* Finish Cycle Early & Take Break Button -> Opens Break Selection Modal */}
        {isFocus && hasActiveSession && (
          <Button
            className="px-3.5 sm:px-4 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
            size="lg"
            variant="secondary"
            onPress={() => {
              setIsDurationPopoverOpen(false);
              setIsBreakModalOpen(true);
            }}
          >
            <Coffee className="size-4" />
            <span>Break</span>
          </Button>
        )}

        {/* Ultra-Compact Duration Customization Popover */}
        <Popover
          isOpen={isDurationPopoverOpen}
          onOpenChange={setIsDurationPopoverOpen}
        >
          <Popover.Trigger>
            <Button
              isIconOnly
              aria-label="Customize Durations"
              className="px-6 sm:px-7 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
              size="lg"
              variant="secondary"
            >
              <SlidersHorizontal className="size-5" />
            </Button>
          </Popover.Trigger>
          <Popover.Content className="p-3 bg-surface rounded-2xl border border-separator/80 shadow-2xl w-fit">
            <Popover.Dialog className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-muted/70 tracking-wider uppercase text-center">
                Durations
              </h4>
              <Separator />

              {TIMER_MODES.map((m) => {
                const totalSec = durations[m.id];
                const mMin = Math.floor(totalSec / 60);
                const mSec = totalSec % 60;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2.5 text-xs"
                  >
                    <span className="text-muted font-medium w-16 truncate">
                      {TIMER_MODE_LABELS[m.id]}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Minutes Stepper Pill */}
                      <div className="flex items-center gap-0.5 bg-surface-secondary px-1 py-0.5 rounded-full border border-separator/60">
                        <Button
                          isIconOnly
                          className="size-4 min-w-0 p-0 rounded-full"
                          isDisabled={mMin <= 0 && mSec <= 5}
                          size="sm"
                          variant="secondary"
                          onPress={() => adjustMinutes(m.id, -1)}
                        >
                          <Minus className="size-2.5 text-muted" />
                        </Button>
                        <span className="w-6 text-center font-mono font-bold text-foreground text-[11px]">
                          {mMin}m
                        </span>
                        <Button
                          isIconOnly
                          className="size-4 min-w-0 p-0 rounded-full"
                          isDisabled={mMin >= 180}
                          size="sm"
                          variant="secondary"
                          onPress={() => adjustMinutes(m.id, 1)}
                        >
                          <Plus className="size-2.5 text-muted" />
                        </Button>
                      </div>

                      {/* Seconds Stepper Pill */}
                      <div className="flex items-center gap-0.5 bg-surface-secondary px-1 py-0.5 rounded-full border border-separator/60">
                        <Button
                          isIconOnly
                          className="size-4 min-w-0 p-0 rounded-full"
                          isDisabled={mMin <= 0 && mSec <= 5}
                          size="sm"
                          variant="secondary"
                          onPress={() => adjustSeconds(m.id, -5)}
                        >
                          <Minus className="size-2.5 text-muted" />
                        </Button>
                        <span className="w-6 text-center font-mono font-bold text-foreground text-[11px]">
                          {String(mSec).padStart(2, "0")}s
                        </span>
                        <Button
                          isIconOnly
                          className="size-4 min-w-0 p-0 rounded-full"
                          isDisabled={mMin >= 180 && mSec >= 55}
                          size="sm"
                          variant="secondary"
                          onPress={() => adjustSeconds(m.id, 5)}
                        >
                          <Plus className="size-2.5 text-muted" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Popover.Dialog>
          </Popover.Content>
        </Popover>

        {/* Finish Session Button -> Opens Save/Discard Progress Modal */}
        <Button
          isIconOnly
          aria-label="Finish Session"
          className="px-6 sm:px-7 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
          size="lg"
          variant="secondary"
          onPress={() => {
            setIsDurationPopoverOpen(false);
            setIsSaveModalOpen(true);
          }}
        >
          <SquareCheck className="size-5" />
        </Button>
      </div>

      <p className="text-xs text-muted/60 font-mono tracking-wider uppercase">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-surface border border-separator/40 text-muted">
          Space
        </kbd>{" "}
        to {isRunning ? "pause" : "start"}
      </p>

      {/* Gentle & Clear Break Selection Modal with Default HeroUI Modal Styling */}
      <Modal.Backdrop
        isOpen={isBreakModalOpen}
        onOpenChange={setIsBreakModalOpen}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon>
                <Coffee className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Time to Recharge</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-3">
              <p className="text-muted text-sm leading-relaxed">
                You’re completing this cycle. Stepping away helps reset your
                attention and keeps your mind sharp.
              </p>

              {/* Break Options Cards */}
              <div className="space-y-2 pt-1">
                {/* Short Break Option */}
                <button
                  className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                  type="button"
                  onClick={() => {
                    setIsBreakModalOpen(false);
                    finishCycleAndTakeBreak("shortBreak");
                  }}
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                      Short Break
                    </span>
                    <span className="text-xs text-muted">
                      Quick stretch, water, or eye rest
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-muted group-hover:text-accent shrink-0 pl-2">
                    {formatMinSec(durations.shortBreak)}
                  </span>
                </button>

                {/* Long Break Option */}
                <button
                  className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                  type="button"
                  onClick={() => {
                    setIsBreakModalOpen(false);
                    finishCycleAndTakeBreak("longBreak");
                  }}
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                      Long Break
                    </span>
                    <span className="text-xs text-muted">
                      Walk around, snack, or mental reset
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-muted group-hover:text-accent shrink-0 pl-2">
                    {formatMinSec(durations.longBreak)}
                  </span>
                </button>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                slot="close"
                variant="tertiary"
                onPress={() => setIsBreakModalOpen(false)}
              >
                Keep Focusing
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Session Interruption Warning using Default HeroUI AlertDialog Styling */}
      <AlertDialog.Backdrop
        isOpen={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>Switch active session?</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              <p className="text-muted text-sm leading-relaxed">
                You currently have an active{" "}
                {TIMER_MODE_LABELS[mode].toLowerCase()} countdown running.
                Switching or resetting now will end your current progress.
              </p>
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button
                slot="close"
                variant="tertiary"
                onPress={() => setPendingAction(null)}
              >
                Keep Going
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  pendingAction?.();
                  setPendingAction(null);
                }}
              >
                Confirm Switch
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

      {/* Save Session Progress Modal */}
      <SaveProgressModal
        isOpen={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
      />
    </div>
  );
}
