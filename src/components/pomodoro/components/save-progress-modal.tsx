import type { TimeValue } from "@heroui/react";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  TextField,
  InputGroup,
  Label,
  TimeField,
  toast,
} from "@heroui/react";
import { Time } from "@internationalized/date";
import { Bookmark, Clock, CheckCircle2, FileText } from "lucide-react";

import { useTimer } from "@/hooks/use-timer";
import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";

interface SaveProgressModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveProgressModal({
  isOpen,
  onOpenChange,
}: SaveProgressModalProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    currentCycle,
    completedCycles,
    targetCycles,
    durations,
    accumulatedFocusSeconds,
    startNewSession,
    discardSession,
  } = useTimer();

  // In focus mode, only count currentCycle if the user actually started/ran this cycle.
  // Otherwise (if sitting at focus menu without starting, or on break), use completedCycles.
  const hasStartedCurrentFocus =
    mode === "focus" && (timeLeft < durations.focus || isRunning);

  const sprintsDone = Math.max(
    1,
    hasStartedCurrentFocus
      ? Math.max(completedCycles, currentCycle)
      : completedCycles,
  );

  const initialTotalSeconds =
    accumulatedFocusSeconds > 0
      ? accumulatedFocusSeconds
      : durations.focus * sprintsDone;

  const [title, setTitle] = useState("Deep Focus Session");
  const [timeValue, setTimeValue] = useState<TimeValue | null>(() => {
    const h = Math.floor(initialTotalSeconds / 3600);
    const m = Math.floor((initialTotalSeconds % 3600) / 60);
    const s = initialTotalSeconds % 60;

    return new Time(h, m, s);
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      const totalSec =
        accumulatedFocusSeconds > 0
          ? accumulatedFocusSeconds
          : durations.focus * sprintsDone;

      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      setTimeValue(new Time(h, m, s));
    }
  }, [isOpen, accumulatedFocusSeconds, durations.focus, sprintsDone]);

  const handleSave = async () => {
    const totalSecs = timeValue
      ? timeValue.hour * 3600 + timeValue.minute * 60 + timeValue.second
      : Math.max(60, initialTotalSeconds);

    const focusMinutes = Math.max(1, Math.round(totalSecs / 60));

    const record: SessionRecord = {
      id: `session_${Date.now()}`,
      createdAt: Date.now(),
      title: title.trim() || "Focus Session",
      sprintsCompleted: sprintsDone,
      targetSprints: targetCycles,
      focusMinutes,
      notes: notes.trim() || undefined,
    };

    const existingHistory = await storageAdapter.getItem<SessionRecord[]>(
      STORAGE_KEYS.SESSIONS_HISTORY,
      [],
    );

    await storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, [
      record,
      ...existingHistory,
    ]);

    toast("Session Saved! 📊", {
      description: `Logged ${record.focusMinutes}m across ${record.sprintsCompleted} cycles.`,
      variant: "accent",
      timeout: 3000,
    });

    onOpenChange(false);
    startNewSession();
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-110">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>
              <CheckCircle2 className="size-5" />
            </Modal.Icon>
            <div>
              <Modal.Heading>Save Session Progress</Modal.Heading>
              <p className="text-xs text-muted font-normal mt-0.5">
                Completed {sprintsDone} of {targetCycles} cycles
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-3.5">
            {/* Session Goal / Title */}
            <TextField fullWidth name="title" value={title} onChange={setTitle}>
              <Label>Session Goal / Title</Label>
              <InputGroup fullWidth>
                <InputGroup.Prefix>
                  <Bookmark className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder="e.g. Deep Work, Math Study" />
              </InputGroup>
            </TextField>

            {/* Total Focus Time using HeroUI TimeField with hh:mm:ss editing */}
            <TimeField
              fullWidth
              granularity="second"
              hourCycle={24}
              name="focusTime"
              value={timeValue}
              onChange={setTimeValue}
            >
              <Label>Total Focus Time</Label>
              <TimeField.Group>
                <TimeField.Prefix>
                  <Clock className="size-4 text-muted" />
                </TimeField.Prefix>
                <TimeField.Input>
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.Group>
            </TimeField>

            {/* Session Notes with InputGroup.TextArea */}
            <TextField fullWidth name="notes" value={notes} onChange={setNotes}>
              <Label>Session Notes (Optional)</Label>
              <InputGroup fullWidth>
                <InputGroup.Prefix>
                  <FileText className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.TextArea
                  className="resize-none"
                  placeholder="What did you accomplish or learn?"
                  rows={3}
                />
              </InputGroup>
            </TextField>
          </Modal.Body>

          <Modal.Footer className="flex items-center justify-between pt-2">
            <Button
              slot="close"
              variant="danger-soft"
              onPress={() => {
                onOpenChange(false);
                discardSession();
              }}
            >
              Discard Session
            </Button>

            <div className="flex items-center gap-2">
              <Button
                className="text-xs px-3.5"
                slot="close"
                variant="secondary"
                onPress={() => onOpenChange(false)}
              >
                Keep Going
              </Button>
              <Button
                className="text-xs px-3.5"
                variant="primary"
                onPress={handleSave}
              >
                Save Progress
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
