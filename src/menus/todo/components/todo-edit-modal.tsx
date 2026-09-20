import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Drawer,
  Button,
  TextField,
  Input,
  TextArea,
  Label,
  Calendar,
  Typography,
  Popover,
  ScrollShadow,
  cn,
  InputGroup,
} from "@heroui/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import {
  Edit3,
  Flag,
  Calendar as CalendarIcon,
  Tag,
  ChevronDown,
  X,
  Plus,
  Check,
} from "lucide-react";

import {
  TodoItem,
  TodoPriority,
  PRIORITY_CONFIG,
  PRESET_TAGS,
  getTagIcon,
  getTagInfo,
} from "../types";
import { formatFriendlyDate } from "../logic/date-parser";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { useTodos } from "@/hooks/use-todos";
import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";

export function TodoEditModal({
  todo,
  isOpen,
  onClose,
}: {
  todo: TodoItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { updateTodo, todos } = useTodos();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [availableCustomTags, setAvailableCustomTags] = useState<string[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();

  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  useEffect(() => {
    if (todo && isOpen) {
      setTitle(todo.title);
      setNotes(todo.notes || "");
      setPriority(todo.priority || "none");
      setDueDate(todo.dueDate || "");
      setTag(todo.tag);
      setCustomTagInput("");
      setIsPriorityPopoverOpen(false);
      setIsTagPopoverOpen(false);
      setIsDatePopoverOpen(false);

      // Load distinct tags used in past sessions and todos
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

      todos?.forEach((t) => {
        if (
          t.tag &&
          !PRESET_TAGS.some(
            (presetTag) => presetTag.id === t.tag?.toLowerCase(),
          )
        ) {
          customSet.add(t.tag.toLowerCase());
        }
      });

      if (
        todo.tag &&
        !PRESET_TAGS.some(
          (presetTag) => presetTag.id === todo.tag?.toLowerCase(),
        )
      ) {
        customSet.add(todo.tag.toLowerCase());
      }

      setAvailableCustomTags(Array.from(customSet));
    }
  }, [todo, isOpen, todos]);

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
        textClass: presetTag.textClass,
      })),
      ...availableCustomTags.map((tagItem) => {
        const info = getTagInfo(tagItem);

        return {
          id: tagItem,
          label: info?.label || tagItem,
          icon: getTagIcon(tagItem),
          isPreset: false,
          dotColor: info?.dotColor || "bg-accent",
          textClass: info?.textClass || "text-accent",
        };
      }),
    ];

    if (!query) return all;

    return all.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query),
    );
  }, [customTagInput, availableCustomTags]);

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
      if (!availableCustomTags.includes(clean)) {
        setAvailableCustomTags((prev) => [...prev, clean]);
      }
      handleSelectTag(clean);
    }
  };

  const activeTagMeta = tag ? getTagInfo(tag) : null;
  const ActiveTagIcon = tag ? getTagIcon(tag) : Tag;

  const handleSave = () => {
    if (!todo || !title.trim()) return;

    updateTodo(todo.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      tag,
    });

    onClose();
  };

  const isMobile = useIsMobile();

  if (!isOpen || !todo) return null;

  const formBody = (
    <div className="space-y-4">
      {/* Task Title */}
      <TextField fullWidth name="title" value={title} onChange={setTitle}>
        <Label>Task Title</Label>
        <Input placeholder="What needs to be done?" variant="secondary" />
      </TextField>

      {/* Notes */}
      <TextField fullWidth name="notes" value={notes} onChange={setNotes}>
        <Label>Notes & Subtasks (Optional)</Label>
        <TextArea
          className="resize-none"
          placeholder="Add additional context or steps..."
          rows={3}
          variant="secondary"
        />
      </TextField>

      {/* 3-Column Compact & Colored Attribute Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* 1. Priority Attribute */}
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <Flag className="size-3.5" />
            <span>Priority</span>
          </Label>
          <Popover
            isOpen={isPriorityPopoverOpen}
            onOpenChange={setIsPriorityPopoverOpen}
          >
            <Popover.Trigger>
              <Button
                className={cn(
                  "w-full h-9 justify-between px-3 font-medium text-xs border transition-colors",
                  priority === "high" &&
                    "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25",
                  priority === "medium" &&
                    "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25",
                  priority === "low" &&
                    "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25",
                  priority === "none" &&
                    "bg-surface-secondary/50 border-separator/40 text-muted hover:bg-surface-secondary",
                )}
                variant="secondary"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      PRIORITY_CONFIG[priority].dotColor,
                    )}
                  />
                  <span className="truncate">
                    {PRIORITY_CONFIG[priority].label}
                  </span>
                </div>
                <ChevronDown className="size-3.5 opacity-60 shrink-0" />
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom start">
              <Popover.Dialog className="flex flex-col gap-1 w-44 z-50 p-1">
                {(["high", "medium", "low", "none"] as TodoPriority[]).map(
                  (priorityOption) => {
                    const isSelected = priority === priorityOption;
                    const config = PRIORITY_CONFIG[priorityOption];

                    return (
                      <Button
                        key={priorityOption}
                        className={cn(
                          "w-full justify-between text-xs shrink-0 h-8",
                          isSelected
                            ? "bg-accent-soft font-semibold text-accent"
                            : "text-muted hover:text-foreground",
                        )}
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setPriority(priorityOption);
                          setIsPriorityPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "size-2 rounded-full shrink-0",
                              config.dotColor,
                            )}
                          />
                          <span className={cn(isSelected ? "" : config.color)}>
                            {config.label}
                          </span>
                        </div>
                        {isSelected && <Check className="size-3 text-accent" />}
                      </Button>
                    );
                  },
                )}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>

        {/* 2. Category Tag Attribute */}
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <Tag className="size-3.5" />
            <span>Category</span>
          </Label>
          <Popover isOpen={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
            <Popover.Trigger>
              <Button
                className={cn(
                  "w-full h-9 justify-between px-3 font-medium text-xs border transition-colors",
                  tag && activeTagMeta
                    ? cn(
                        activeTagMeta.bgClass,
                        activeTagMeta.borderClass,
                        activeTagMeta.textClass,
                        "hover:opacity-90",
                      )
                    : "bg-surface-secondary/50 border-separator/40 text-muted hover:bg-surface-secondary",
                )}
                variant="secondary"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ActiveTagIcon
                    className={cn(
                      "size-3.5 shrink-0",
                      tag
                        ? activeTagMeta?.textClass || "text-accent"
                        : "text-muted",
                    )}
                  />
                  <span className="truncate">
                    {tag ? activeTagMeta?.label || tag : "No Tag"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {tag ? (
                    <span
                      aria-label="Clear tag"
                      className="p-0.5 rounded hover:bg-foreground/10 text-muted hover:text-foreground transition-colors cursor-pointer"
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
                  ) : (
                    <ChevronDown className="size-3.5 opacity-60" />
                  )}
                </div>
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom start">
              <Popover.Dialog className="flex flex-col gap-2 w-72 max-w-[90vw] z-50 p-2">
                {/* Custom Tag Input & Search */}
                <InputGroup variant="secondary">
                  <InputGroup.Prefix>
                    <Tag className="size-3.5 text-muted" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    placeholder="Search or create tag..."
                    value={customTagInput}
                    onChange={(event) => setCustomTagInput(event.target.value)}
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
                </InputGroup>

                {/* Scrollable list */}
                <ScrollShadow
                  className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-0.5"
                  orientation="vertical"
                  size={20}
                >
                  {/* Create Custom Tag Row */}
                  {showCreateOption && (
                    <Button
                      className="w-full justify-start shrink-0 text-xs h-8"
                      variant="primary"
                      onClick={handleCreateCustomTag}
                    >
                      <Plus className="size-3.5" />
                      <span>
                        Create &quot;
                        {customTagInput.trim().replace(/^#/, "")}&quot;
                      </span>
                    </Button>
                  )}

                  {/* No Tag Option */}
                  <Button
                    className={cn(
                      "w-full justify-between shrink-0 text-xs h-8",
                      !tag
                        ? "bg-accent-soft text-accent font-semibold"
                        : "text-muted hover:text-foreground",
                    )}
                    variant="secondary"
                    onClick={() => handleSelectTag(undefined)}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="size-3.5" />
                      <span>No Tag</span>
                    </div>
                    {!tag && <Check className="size-3 text-accent" />}
                  </Button>

                  {filteredTags.map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected =
                      tag?.toLowerCase() === item.id.toLowerCase();

                    return (
                      <Button
                        key={item.id}
                        className={cn(
                          "w-full justify-between shrink-0 text-xs h-8",
                          isSelected
                            ? "bg-accent-soft text-accent font-semibold"
                            : "text-muted hover:text-foreground",
                        )}
                        variant="secondary"
                        onClick={() => handleSelectTag(item.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemIcon
                            className={cn("size-3.5 shrink-0", item.textClass)}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!item.isPreset && (
                            <span className="text-[10px] text-muted/50 font-mono">
                              #{item.id}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="size-3 text-accent" />
                          )}
                        </div>
                      </Button>
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

        {/* 3. Due Date Attribute */}
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <CalendarIcon className="size-3.5" />
            <span>Due Date</span>
          </Label>
          <Popover
            isOpen={isDatePopoverOpen}
            onOpenChange={setIsDatePopoverOpen}
          >
            <Popover.Trigger>
              <Button
                className={cn(
                  "w-full h-9 justify-between px-3 font-medium text-xs border transition-colors",
                  dueDate
                    ? dueDate === todayStr
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                      : dueDate === tomorrowStr
                        ? "bg-accent/15 border-accent/30 text-accent hover:bg-accent/25"
                        : dueDate < todayStr
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                          : "bg-accent/15 border-accent/30 text-accent hover:bg-accent/25"
                    : "bg-surface-secondary/50 border-separator/40 text-muted hover:bg-surface-secondary",
                )}
                variant="secondary"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon
                    className={cn(
                      "size-3.5 shrink-0",
                      dueDate ? "text-current" : "text-muted",
                    )}
                  />
                  <span className="truncate">
                    {dueDate ? formatFriendlyDate(dueDate) : "No Date"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {dueDate ? (
                    <span
                      aria-label="Clear date"
                      className="p-0.5 rounded hover:bg-foreground/10 text-muted hover:text-foreground transition-colors cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDueDate("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.stopPropagation();
                          setDueDate("");
                        }
                      }}
                    >
                      <X className="size-3.5" />
                    </span>
                  ) : (
                    <ChevronDown className="size-3.5 opacity-60" />
                  )}
                </div>
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom start">
              <Popover.Dialog className="flex flex-col gap-2.5 w-72 max-w-[90vw] z-50 p-2.5">
                {/* Quick Date Shortcuts */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-separator/30">
                  <Button
                    className={cn(
                      "flex-1 text-xs h-7.5",
                      dueDate === todayStr
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold"
                        : "text-muted",
                    )}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setDueDate(todayStr);
                      setIsDatePopoverOpen(false);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    className={cn(
                      "flex-1 text-xs h-7.5",
                      dueDate === tomorrowStr
                        ? "bg-accent/15 border border-accent/30 text-accent font-semibold"
                        : "text-muted",
                    )}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setDueDate(tomorrowStr);
                      setIsDatePopoverOpen(false);
                    }}
                  >
                    Tomorrow
                  </Button>
                  {dueDate && (
                    <Button
                      className="text-danger text-xs h-7.5 px-2"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDueDate("");
                        setIsDatePopoverOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Calendar Picker */}
                <Calendar
                  aria-label="Pick due date"
                  className="p-0 bg-transparent w-full"
                  value={
                    dueDate
                      ? parseDate(dueDate.slice(0, 10))
                      : today(getLocalTimeZone())
                  }
                  onChange={(selectedDate) => {
                    setDueDate(selectedDate ? selectedDate.toString() : "");
                    setIsDatePopoverOpen(false);
                  }}
                >
                  <Calendar.Header>
                    <Calendar.YearPickerTrigger>
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(dayName) => (
                        <Calendar.HeaderCell>{dayName}</Calendar.HeaderCell>
                      )}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(calendarDate) => <Calendar.Cell date={calendarDate} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                  <Calendar.YearPickerGrid>
                    <Calendar.YearPickerGridBody>
                      {({ year: calendarYear }) => (
                        <Calendar.YearPickerCell year={calendarYear} />
                      )}
                    </Calendar.YearPickerGridBody>
                  </Calendar.YearPickerGrid>
                </Calendar>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </div>
  );

  const footerActions = (
    <>
      <Button slot="close" variant="secondary" onPress={onClose}>
        Cancel
      </Button>
      <Button isDisabled={!title.trim()} variant="primary" onPress={handleSave}>
        Save Changes
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <Drawer.Content placement="bottom">
          <Drawer.Dialog className="max-h-[88dvh] flex flex-col p-4 shadow-2xl rounded-t-3xl rounded-b-none border-t border-separator/40 bg-surface/98 backdrop-blur-xl space-y-3">
            <Drawer.Handle />
            <Drawer.Header className="flex-row items-center justify-between pb-1 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-2xl bg-accent/15 text-accent shrink-0">
                  <Edit3 className="size-5" />
                </div>
                <div>
                  <Drawer.Heading className="text-base font-semibold text-foreground">
                    Edit Task
                  </Drawer.Heading>
                  <Typography color="muted" type="body-xs">
                    Customize task details, notes, & tags
                  </Typography>
                </div>
              </div>
              <Drawer.CloseTrigger />
            </Drawer.Header>
            <Drawer.Body className="p-0 overflow-y-auto mt-2">
              {formBody}
            </Drawer.Body>
            <Drawer.Footer className="flex items-center justify-end gap-2 pt-3">
              {footerActions}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    );
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog className="sm:max-w-120 space-y-5">
          <Modal.Header className="flex-row items-center gap-3">
            <Modal.Icon>
              <Edit3 className="text-accent" />
            </Modal.Icon>
            <div>
              <Modal.Heading>Edit Task</Modal.Heading>
              <Typography color="muted" type="body-xs">
                Customize task details, notes, priority, tag, and due date.
              </Typography>
            </div>
          </Modal.Header>
          <Modal.CloseTrigger />
          <Modal.Body className="space-y-4">{formBody}</Modal.Body>
          <Modal.Footer className="flex items-center justify-end gap-2">
            {footerActions}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
