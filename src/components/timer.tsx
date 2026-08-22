import { useState, useEffect } from "react";
import { Button, AlertDialog } from "@heroui/react";
import { Play, Pause, RotateCcw, AlertCircle, Sparkles } from "lucide-react";

import { useTimer, TimerMode } from "@/hooks/use-timer";

const MODES: { id: TimerMode; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "shortBreak", label: "Short Break" },
  { id: "longBreak", label: "Long Break" },
];

export function Timer() {
  const {
    mode,
    formattedTime,
    isRunning,
    isOvertime,
    hasActiveSession,
    switchMode,
    toggle,
    reset,
  } = useTimer();

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const confirmOrRun = (action: () => void) => {
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

  return (
    <div className="flex flex-col items-center gap-8 md:gap-12 w-full max-w-xl mx-auto">
      {/* Mode Selector */}
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-surface/80 border border-separator/50 backdrop-blur-sm">
        {MODES.map((m) => {
          const active = mode === m.id;

          return (
            <button
              key={m.id}
              className={`px-6 py-2.5 rounded-full text-sm md:text-base font-medium transition-all cursor-pointer ${
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-secondary"
              }`}
              onClick={() =>
                m.id !== mode && confirmOrRun(() => switchMode(m.id))
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Main Large Timer Display */}
      <div className="relative flex flex-col items-center justify-center select-none py-2">
        {isOvertime && (
          <div className="flex items-center gap-1.5 text-sm md:text-base font-medium text-accent mb-2 animate-pulse">
            <Sparkles className="size-4" />
            <span>Overtime In Flow</span>
          </div>
        )}
        <span
          className={`font-serif text-8xl sm:text-9xl md:text-[11rem] font-bold tracking-normal tabular-nums leading-none transition-colors ${
            isOvertime ? "text-accent" : "text-foreground"
          }`}
        >
          {formattedTime}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          className="px-10 py-7 rounded-2xl text-lg font-medium shadow-lg transition-transform active:scale-95"
          size="lg"
          variant="primary"
          onPress={toggle}
        >
          {isRunning ? (
            <>
              <Pause className="size-6 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="size-6 fill-current" />
              <span>Start</span>
            </>
          )}
        </Button>

        <Button
          aria-label="Reset Timer"
          className="p-5 rounded-2xl text-muted hover:text-foreground transition-all"
          size="lg"
          variant="secondary"
          onPress={() => confirmOrRun(reset)}
        >
          <RotateCcw className="size-5" />
        </Button>
      </div>

      <p className="text-xs text-muted/60 font-mono tracking-wider uppercase">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-surface border border-separator/40 text-muted">
          Space
        </kbd>{" "}
        to {isRunning ? "pause" : "start"}
      </p>

      {/* Gentle Interruption Warning Dialog */}
      <AlertDialog.Backdrop
        isOpen={pendingAction !== null}
        variant="blur"
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog className="p-8 max-w-md bg-surface rounded-3xl border border-separator/80 shadow-2xl space-y-5">
            <AlertDialog.Header className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-accent/15 text-accent">
                <AlertCircle className="size-6" />
              </div>
              <AlertDialog.Heading className="text-xl font-bold text-foreground">
                Switch active session?
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="text-muted text-base leading-relaxed">
              You currently have an active session running. Starting a new
              session will reset your ongoing progress.
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex justify-end gap-3 pt-2">
              <Button
                className="rounded-xl px-5 py-2.5"
                variant="secondary"
                onPress={() => setPendingAction(null)}
              >
                Keep Going
              </Button>
              <Button
                className="rounded-xl px-5 py-2.5"
                variant="primary"
                onPress={() => {
                  pendingAction?.();
                  setPendingAction(null);
                }}
              >
                Start New Session
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
