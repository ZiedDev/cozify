import type { TimeValue } from "@heroui/react";

import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Drawer,
  Button,
  TextField,
  InputGroup,
  Label,
  TimeField,
  Typography,
  toast,
  Popover,
  ScrollShadow,
  cn,
} from "@heroui/react";
import { Time } from "@internationalized/date";
import {
  Bookmark,
  Clock,
  CheckCircle2,
  FileText,
  Tag,
  Zap,
  ChevronDown,
  X,
  Plus,
} from "lucide-react";

import { secondsToHms } from "../logic/time-utils";

import { useTimer } from "@/hooks/use-timer";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { PRESET_TAGS, getTagIcon, getTagInfo } from "@/config/tags";
import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";
import { StatsRollupEngine } from "@/services/stats-rollup-engine";

export function SaveProgressModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    completedCycles,
    targetCycles,
    durations,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    startNewSession,
    discardSession,
  } = useTimer();

  const cyclesDone = completedCycles;


  const initialTotalSeconds = accumulatedFocusSeconds;

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
  const [customTagInput, setCustomTagInput] = useState("");
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [sessionTags, setSessionTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const totalSec = accumulatedFocusSeconds;

      const { hours, minutes, seconds } = secondsToHms(totalSec);

      setTimeValue(new Time(hours, minutes, seconds));

      const ovHms = secondsToHms(accumulatedOvertimeSeconds);

      setOvertimeValue(new Time(ovHms.hours, ovHms.minutes, ovHms.seconds));

      // Load distinct tags used in past sessions
      const history = storageAdapter.getItem<SessionRecord[]>(
        STORAGE_KEYS.SESSIONS_HISTORY,
        [],
      );
      const customSet = new Set<string>();

      history?.forEach((session) => {
        if (
          session.tag &&
          !PRESET_TAGS.some(
            (presetTag) => presetTag.id === session.tag?.toLowerCase(),
          )
        ) {
          customSet.add(session.tag.toLowerCase());
        }
      });
      setSessionTags(Array.from(customSet));
    }
  }, [
    isOpen,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    durations.focus,
    cyclesDone,
  ]);

  // Combine preset and stored custom tags with filtering
  const filteredTags = useMemo(() => {
    const query = customTagInput.trim().toLowerCase().replace(/^#/, "");
    const all = [
      ...PRESET_TAGS.map((presetTag) => ({
        id: presetTag.id,
        label: presetTag.label,
        icon: getTagIcon(presetTag.id),
        isPreset: true,
        dotColor: presetTag.dotColor,
      })),
      ...sessionTags.map((tagItem) => ({
        id: tagItem,
        label: getTagInfo(tagItem)?.label || tagItem,
        icon: getTagIcon(tagItem),
        isPreset: false,
        dotColor: getTagInfo(tagItem)?.dotColor || "bg-accent",
      })),
    ];

    if (!query) return all;

    return all.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query),
    );
  }, [customTagInput, sessionTags]);

  const showCreateOption = useMemo(() => {
    const query = customTagInput.trim().toLowerCase().replace(/^#/, "");

    if (!query) return false;

    return !filteredTags.some(
      (tagItem) =>
        tagItem.id === query || tagItem.label.toLowerCase() === query,
    );
  }, [customTagInput, filteredTags]);

  const handleSelectTag = (selectedTagId?: string) => {
    setTag(selectedTagId);
    setCustomTagInput("");
    setIsTagPopoverOpen(false);
  };

  const handleCreateCustomTag = () => {
    const clean = customTagInput.trim().toLowerCase().replace(/^#/, "");

    if (clean) {
      handleSelectTag(clean);
    }
  };

  const activeTagMeta = tag ? getTagInfo(tag) : null;
  const ActiveTagIcon = tag ? getTagIcon(tag) : Tag;

  const isMobile = useIsMobile();

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
      id: crypto.randomUUID(),
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

    StatsRollupEngine.recordSession(record);

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

  const formBody = (
    <div className="space-y-3.5">
      {/* Session Goal / Title */}
      <TextField fullWidth name="title" value={title} onChange={setTitle}>
        <Label>Session Goal / Title</Label>
        <InputGroup
          fullWidth
          className="border-transparent bg-surface-secondary hover:bg-surface-tertiary"
        >
          <InputGroup.Prefix>
            <Bookmark className="size-4 text-muted" />
          </InputGroup.Prefix>
          <InputGroup.Input placeholder="e.g. Deep Work, Math Study" />
        </InputGroup>
      </TextField>

      {/* Category Tag Dropdown */}
      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-1.5">
          <Tag className="size-3.5" />
          <span>Category Tag</span>
        </Label>
        <Popover
          isOpen={isTagPopoverOpen}
          onOpenChange={setIsTagPopoverOpen}
        >
          <Popover.Trigger>
            <button
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors",
                tag
                  ? "bg-accent-soft text-accent font-semibold"
                  : "bg-surface-secondary text-muted hover:bg-surface-tertiary",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`size-2 rounded-full shrink-0 ${activeTagMeta?.dotColor || (tag ? "bg-accent" : "bg-muted/40")}`}
                />
                <ActiveTagIcon className="size-3.5 shrink-0 opacity-80" />
                <span className="truncate">
                  {tag
                    ? activeTagMeta?.label || tag
                    : "Select or create category tag..."}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {tag && (
                  <span
                    aria-label="Clear tag"
                    className="p-0.5 rounded-md hover:bg-foreground/10 text-muted hover:text-foreground transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setTag(undefined);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                        setTag(undefined);
                      }
                    }}
                  >
                    <X className="size-3.5" />
                  </span>
                )}
                <ChevronDown className="size-3.5 opacity-60" />
              </div>
            </button>
          </Popover.Trigger>
          <Popover.Content placement="bottom start">
            <Popover.Dialog className="p-2 rounded-2xl bg-surface/98 backdrop-blur-xl border border-separator/50 shadow-xl flex flex-col gap-2 w-72 max-w-[90vw] z-50">
              {/* Custom Tag Input & Search */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-secondary/40 rounded-xl border border-separator/30 focus-within:border-accent focus-within:bg-surface-secondary/70 transition-colors">
                <Tag className="size-3.5 text-muted shrink-0" />
                <input
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted/60 focus:outline-none font-sans"
                  placeholder="Search or create custom tag..."
                  value={customTagInput}
                  onChange={(event) =>
                    setCustomTagInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (showCreateOption) {
                        handleCreateCustomTag();
                      } else if (filteredTags.length > 0) {
                        handleSelectTag(filteredTags[0].id);
                      }
                    }
                  }}
                />
                {showCreateOption && (
                  <Button
                    className="h-6 px-2.5 text-[11px] rounded-lg bg-accent text-accent-foreground cursor-pointer shrink-0 font-medium shadow-2xs hover:bg-accent/90 transition-colors"
                    size="sm"
                    variant="secondary"
                    onPress={handleCreateCustomTag}
                  >
                    <Plus className="size-3" />
                    <span>Add</span>
                  </Button>
                )}
              </div>

              {/* Scrollable list */}
              <ScrollShadow
                className="max-h-52 overflow-y-auto flex flex-col gap-1 no-scrollbar pr-0.5"
                orientation="vertical"
                size={20}
              >
                {/* Create Custom Tag Row */}
                {showCreateOption && (
                  <button
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-left cursor-pointer transition-colors bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 mb-1 shadow-2xs"
                    type="button"
                    onClick={handleCreateCustomTag}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Plus className="size-3.5 shrink-0" />
                      <span className="truncate">
                        Create &quot;
                        {customTagInput.trim().replace(/^#/, "")}&quot;
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-accent/80 shrink-0">
                      Custom
                    </span>
                  </button>
                )}

                {/* No Tag Option */}
                <button
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-left cursor-pointer transition-colors border ${
                    !tag
                      ? "bg-accent/20 border-accent text-accent font-semibold shadow-xs"
                      : "border-transparent bg-surface-secondary/40 text-muted hover:text-foreground hover:bg-surface-secondary/70"
                  }`}
                  type="button"
                  onClick={() => handleSelectTag(undefined)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2 rounded-full bg-muted/40 shrink-0" />
                    <Tag className="size-3.5 opacity-60 text-muted shrink-0" />
                    <span>No Tag (None)</span>
                  </div>
                </button>

                {filteredTags.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected =
                    tag?.toLowerCase() === item.id.toLowerCase();

                  return (
                    <button
                      key={item.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-left cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-accent/20 border-accent text-accent font-semibold shadow-xs"
                          : "border-transparent bg-surface-secondary/40 text-muted hover:text-foreground hover:bg-surface-secondary/70"
                      }`}
                      type="button"
                      onClick={() => handleSelectTag(item.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`size-2 rounded-full ${item.dotColor} shrink-0`}
                        />
                        <ItemIcon className="size-3.5 opacity-80 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!item.isPreset && (
                          <span className="text-[10px] text-muted/50 font-mono">
                            #{item.id}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredTags.length === 0 && !showCreateOption && (
                  <div className="py-3 text-center text-xs text-muted">
                    No matching tags found.
                  </div>
                )}
              </ScrollShadow>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
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
        <TimeField.Group className="border-transparent bg-surface-secondary hover:bg-surface-tertiary">
          <TimeField.Prefix>
            <Clock className="size-4 text-blue-400" />
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
        <TimeField.Group className="border-transparent bg-surface-secondary hover:bg-surface-tertiary">
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
        <InputGroup
          fullWidth
          className="border-transparent bg-surface-secondary hover:bg-surface-tertiary"
        >
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
    </div>
  );

  const footerActions = (
    <>
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
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Drawer.Content placement="bottom">
          <Drawer.Dialog className="h-[85dvh] max-h-[90dvh] flex flex-col p-4 shadow-2xl rounded-t-3xl rounded-b-none border-t border-separator/40 bg-surface/98 backdrop-blur-xl">
            <Drawer.Handle />
            <Drawer.Header className="flex-row items-center justify-between pb-2 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-2xl bg-accent/15 text-accent shrink-0">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <Drawer.Heading className="text-base font-semibold text-foreground">
                    Save Session Progress
                  </Drawer.Heading>
                  <Typography color="muted" type="body-xs">
                    Completed {cyclesDone} of {targetCycles} cycles
                  </Typography>
                </div>
              </div>
              <Drawer.CloseTrigger />
            </Drawer.Header>

            <Drawer.Body className="flex-1 min-h-0 overflow-y-auto p-0 mt-2">
              <ScrollShadow
                className="h-full pr-1"
                orientation="vertical"
                size={20}
              >
                {formBody}
              </ScrollShadow>
            </Drawer.Body>

            <Drawer.Footer className="flex items-center justify-between pt-3 shrink-0">
              {footerActions}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    );
  }
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
            {formBody}
          </Modal.Body>

          <Modal.Footer className="flex items-center justify-between pt-2">
            {footerActions}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

