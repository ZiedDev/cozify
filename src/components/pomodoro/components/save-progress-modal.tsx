import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  TextField,
  InputGroup,
  Label,
  toast,
} from "@heroui/react";
import { Bookmark, Clock, Flame, CheckCircle2, FileText } from "lucide-react";

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
    currentCycle,
    targetCycles,
    durations,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    startNewSession,
    discardSession,
  } = useTimer();

  const initialFocusMins = Math.max(
    1,
    Math.round(
      accumulatedFocusSeconds > 0
        ? accumulatedFocusSeconds / 60
        : (durations.focus * currentCycle) / 60,
    ),
  );
  const initialOvertimeMins = Math.round(accumulatedOvertimeSeconds / 60);

  const [title, setTitle] = useState("Deep Focus Session");
  const [focusMins, setFocusMins] = useState(initialFocusMins);
  const [overtimeMins, setOvertimeMins] = useState(initialOvertimeMins);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFocusMins(
        Math.max(
          1,
          Math.round(
            accumulatedFocusSeconds > 0
              ? accumulatedFocusSeconds / 60
              : (durations.focus * currentCycle) / 60,
          ),
        ),
      );
      setOvertimeMins(Math.round(accumulatedOvertimeSeconds / 60));
    }
  }, [
    isOpen,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    durations.focus,
    currentCycle,
  ]);

  const handleSave = async () => {
    const record: SessionRecord = {
      id: `session_${Date.now()}`,
      createdAt: Date.now(),
      title: title.trim() || "Focus Session",
      sprintsCompleted: currentCycle,
      targetSprints: targetCycles,
      focusMinutes: Number(focusMins) || 1,
      overtimeMinutes: Number(overtimeMins) || 0,
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
                Completed {currentCycle} of {targetCycles} cycles
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-3.5">
            {/* Session Goal / Title with official HeroUI InputGroup */}
            <TextField fullWidth name="title" value={title} onChange={setTitle}>
              <Label>Session Goal / Title</Label>
              <InputGroup fullWidth>
                <InputGroup.Prefix>
                  <Bookmark className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder="e.g. Study session" />
              </InputGroup>
            </TextField>

            {/* Focus & Overtime inputs with InputGroup Prefix & Suffix */}
            <div className="flex w-full gap-2">
              <TextField
                fullWidth
                name="focus"
                value={String(focusMins)}
                onChange={(val) => setFocusMins(Number(val))}
              >
                <Label>Focus Time</Label>
                <InputGroup fullWidth>
                  <InputGroup.Prefix>
                    <Clock className="size-4 text-muted" />
                  </InputGroup.Prefix>
                  <InputGroup.Input className="w-12" min={1} type="number" />
                  <InputGroup.Suffix>mins</InputGroup.Suffix>
                </InputGroup>
              </TextField>

              <TextField
                fullWidth
                className="flex"
                name="overtime"
                value={String(overtimeMins)}
                onChange={(val) => setOvertimeMins(Number(val))}
              >
                <Label>Overtime Logged</Label>
                <InputGroup fullWidth>
                  <InputGroup.Prefix>
                    <Flame className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input className="w-12" min={0} type="number" />
                  <InputGroup.Suffix>mins</InputGroup.Suffix>
                </InputGroup>
              </TextField>
            </div>

            {/* Session Notes with official HeroUI InputGroup.TextArea */}
            <TextField fullWidth name="notes" value={notes} onChange={setNotes}>
              <Label>Session Notes (optional)</Label>
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
              className="text-muted hover:text-danger text-xs px-2"
              slot="close"
              variant="tertiary"
              onPress={discardSession}
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
