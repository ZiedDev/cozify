import type { TimeValue } from "@heroui/react";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  TextField,
  InputGroup,
  Label,
  TimeField,
  Typography,
  toast,
} from "@heroui/react";
import { Time } from "@internationalized/date";
import {
  Bookmark,
  Clock,
  CheckCircle2,
  FileText,
  Tag,
  Zap,
} from "lucide-react";

import { secondsToHms } from "../logic/time-utils";
import { calculateCyclesDone } from "../logic/cycle-rules";

import { useTimer } from "@/hooks/use-timer";
import { PRESET_TAGS, getTagIcon } from "@/config/tags";
import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";

export function SaveProgressModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    mode,
    isCycleActive,
    currentCycle,
    completedCycles,
    targetCycles,
    durations,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    startNewSession,
    discardSession,
  } = useTimer();

  const cyclesDone = calculateCyclesDone(
    mode,
    isCycleActive,
    currentCycle,
    completedCycles,
  );

  const initialTotalSeconds =
    accumulatedFocusSeconds > 0
      ? accumulatedFocusSeconds
      : durations.focus * cyclesDone;

  const [title, setTitle] = useState("Deep Focus Session");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [timeValue, setTimeValue] = useState<TimeValue | null>(() => {
    const { hours, minutes, seconds } = secondsToHms(initialTotalSeconds);

    return new Time(hours, minutes, seconds);
  });
  const [overtimeValue, setOvertimeValue] = useState<TimeValue | null>(() => {
    const { hours, minutes, seconds } = secondsToHms(
      accumulatedOvertimeSeconds,
    );

    return new Time(hours, minutes, seconds);
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      const totalSec =
        accumulatedFocusSeconds > 0
          ? accumulatedFocusSeconds
          : durations.focus * cyclesDone;

      const { hours, minutes, seconds } = secondsToHms(totalSec);

      setTimeValue(new Time(hours, minutes, seconds));

      const ovHms = secondsToHms(accumulatedOvertimeSeconds);

      setOvertimeValue(new Time(ovHms.hours, ovHms.minutes, ovHms.seconds));
    }
  }, [
    isOpen,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    durations.focus,
    cyclesDone,
  ]);

  const handleSave = async () => {
    const totalSecs = timeValue
      ? timeValue.hour * 3600 + timeValue.minute * 60 + timeValue.second
      : Math.max(60, initialTotalSeconds);

    const overtimeSecs = overtimeValue
      ? overtimeValue.hour * 3600 +
        overtimeValue.minute * 60 +
        overtimeValue.second
      : accumulatedOvertimeSeconds;

    const focusMinutes = Math.max(1, Math.round(totalSecs / 60));
    const overtimeMinutes = Math.round(overtimeSecs / 60);

    const record: SessionRecord = {
      id: `session_${Date.now()}`,
      createdAt: Date.now(),
      title: title.trim() || "Focus Session",
      tag,
      cyclesCompleted: cyclesDone,
      targetCycles: targetCycles,
      focusMinutes,
      overtimeMinutes: overtimeMinutes > 0 ? overtimeMinutes : undefined,
      overtimeSeconds: overtimeSecs > 0 ? overtimeSecs : undefined,
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

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));

    toast("Session Saved! 📊", {
      description: `Logged ${record.focusMinutes}m${
        record.overtimeMinutes ? ` (+${record.overtimeMinutes}m OT)` : ""
      } across ${record.cyclesCompleted} cycles.`,
      variant: "accent",
      timeout: 3000,
    });

    onOpenChange(false);
    startNewSession();
  };

  if (!isOpen) return null;

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
              <Typography
                className="font-normal mt-0.5"
                color="muted"
                type="body-xs"
              >
                Completed {cyclesDone} of {targetCycles} cycles
              </Typography>
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

            {/* Tag Selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Tag className="size-3.5" />
                <span>Category Tag</span>
              </Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    !tag
                      ? "bg-accent text-accent-foreground border-accent font-semibold"
                      : "bg-surface-secondary/40 text-muted border-separator/30 hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => setTag(undefined)}
                >
                  None
                </button>
                {PRESET_TAGS.map((t) => {
                  const TagIconComp = getTagIcon(t.id);

                  return (
                    <button
                      key={t.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        tag === t.id
                          ? `${t.color} font-semibold ring-1 ring-accent/30`
                          : "bg-surface-secondary/40 text-muted/80 border-separator/30 hover:text-foreground hover:bg-surface-secondary"
                      }`}
                      type="button"
                      onClick={() => setTag(t.id)}
                    >
                      <TagIconComp className="size-3.5 opacity-80" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Focus Time TimeField with hh:mm:ss editing */}
            <TimeField
              fullWidth
              granularity="second"
              hourCycle={24}
              name="focusTime"
              value={timeValue}
              onChange={setTimeValue}
            >
              <Label>Focus Time</Label>
              <TimeField.Group>
                <TimeField.Prefix>
                  <Clock className="size-4 text-muted" />
                </TimeField.Prefix>
                <TimeField.Input>
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.Group>
            </TimeField>

            {/* Total Overtime TimeField with hh:mm:ss editing */}
            <TimeField
              fullWidth
              granularity="second"
              hourCycle={24}
              name="overtime"
              value={overtimeValue}
              onChange={setOvertimeValue}
            >
              <Label className="flex items-center gap-1.5">
                <span>Overtime Duration</span>
              </Label>
              <TimeField.Group>
                <TimeField.Prefix>
                  <Zap className="size-4 text-amber-400" />
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
