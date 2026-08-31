import { useState, useRef } from "react";
import { Button, Input, Popover, Calendar } from "@heroui/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import {
  Plus,
  Flag,
  Calendar as CalendarIcon,
  Tag,
  X,
  ChevronDown,
} from "lucide-react";

import { TodoPriority, PRIORITY_CONFIG, PRESET_TAGS } from "../types";

import { useTodos } from "@/hooks/use-todos";

export function TodoInputBar() {
  const { addTodo, viewMode } = useTodos();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("none");
  const [dueDate, setDueDate] = useState<string>("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    addTodo({
      title: title.trim(),
      priority,
      dueDate: dueDate || undefined,
      tag,
      notes: notes.trim() || undefined,
    });

    // Reset fields
    setTitle("");
    setPriority("none");
    setDueDate("");
    setTag(undefined);
    setNotes("");
    setIsExpanded(false);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();

  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  const hasExtraConfig =
    priority !== "none" || Boolean(dueDate) || Boolean(tag) || Boolean(notes);

  return (
    <form
      className="flex flex-col gap-2.5 w-full rounded-2xl bg-surface p-2.5 md:p-3 border border-separator/40 shadow-sm transition-colors focus-within:border-accent/60 shrink-0"
      onSubmit={handleAdd}
    >
      <div className="flex items-center gap-2 w-full">
        <Input
          ref={inputRef}
          className="w-full bg-transparent border-none text-sm md:text-base placeholder:text-muted/60"
          placeholder="Add a new task... (Press Enter)"
          value={title}
          variant="secondary"
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => {
            if (viewMode === "detailed") setIsExpanded(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />

        <Button
          isIconOnly
          aria-label="Add task"
          className="size-8 md:size-9 rounded-xl bg-accent text-accent-foreground shrink-0 shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-[opacity,transform]"
          isDisabled={!title.trim()}
          size="sm"
          type="submit"
        >
          <Plus className="size-4 stroke-[2.5]" />
        </Button>
      </div>

      {/* Expanded Actions Row */}
      {(isExpanded || viewMode === "detailed" || hasExtraConfig) && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-separator/20 text-xs">
          {/* Priority Popover */}
          <Popover>
            <Popover.Trigger>
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  priority !== "none"
                    ? PRIORITY_CONFIG[priority].badgeClass
                    : "bg-surface-secondary/40 text-muted border-separator/30 hover:text-foreground hover:bg-surface-secondary/60"
                }`}
                type="button"
              >
                <Flag className="size-3" />
                <span>
                  {priority === "none"
                    ? "Priority"
                    : PRIORITY_CONFIG[priority].label}
                </span>
                <ChevronDown className="size-2.5 opacity-60" />
              </button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-1 min-w-32 z-50">
                {(["none", "low", "medium", "high"] as TodoPriority[]).map(
                  (p) => (
                    <button
                      key={p}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                        priority === p
                          ? "bg-accent/15 text-accent font-semibold"
                          : "hover:bg-surface-secondary/60 text-foreground"
                      }`}
                      type="button"
                      onClick={() => setPriority(p)}
                    >
                      <span
                        className={`size-2 rounded-full ${PRIORITY_CONFIG[p].dotColor}`}
                      />
                      <span>{PRIORITY_CONFIG[p].label}</span>
                    </button>
                  ),
                )}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Due Date Popover (Single Clean Dialog) */}
          <Popover>
            <Popover.Trigger>
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  dueDate
                    ? "bg-accent/10 text-accent border-accent/30 font-semibold"
                    : "bg-surface-secondary/40 text-muted border-separator/30 hover:text-foreground hover:bg-surface-secondary/60"
                }`}
                type="button"
              >
                <CalendarIcon className="size-3" />
                <span>
                  {dueDate === todayStr
                    ? "Today"
                    : dueDate === tomorrowStr
                      ? "Tomorrow"
                      : dueDate || "Due Date"}
                </span>
                {dueDate && (
                  <span
                    aria-label="Clear due date"
                    className="hover:text-danger ml-0.5 inline-flex items-center cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDueDate("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setDueDate("");
                      }
                    }}
                  >
                    <X className="size-2.5" />
                  </span>
                )}
              </button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="p-3 rounded-2xl bg-surface border border-separator shadow-2xl flex flex-col gap-3 min-w-64 z-50">
                <div className="flex items-center gap-2 pb-2 border-b border-separator/30">
                  <button
                    className={`flex-1 py-1 px-2 rounded-xl text-xs font-medium border transition-colors text-center cursor-pointer ${
                      dueDate === todayStr
                        ? "bg-accent/20 text-accent border-accent font-semibold"
                        : "bg-surface-secondary/60 border-separator/30 hover:bg-surface-secondary text-foreground"
                    }`}
                    type="button"
                    onClick={() => setDueDate(todayStr)}
                  >
                    Today
                  </button>
                  <button
                    className={`flex-1 py-1 px-2 rounded-xl text-xs font-medium border transition-colors text-center cursor-pointer ${
                      dueDate === tomorrowStr
                        ? "bg-accent/20 text-accent border-accent font-semibold"
                        : "bg-surface-secondary/60 border-separator/30 hover:bg-surface-secondary text-foreground"
                    }`}
                    type="button"
                    onClick={() => setDueDate(tomorrowStr)}
                  >
                    Tomorrow
                  </button>
                </div>

                {/* HeroUI Calendar Direct Render */}
                <Calendar
                  aria-label="Pick due date"
                  className="p-1 rounded-xl bg-transparent"
                  value={
                    dueDate ? parseDate(dueDate) : today(getLocalTimeZone())
                  }
                  onChange={(val) => setDueDate(val ? val.toString() : "")}
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
                      {(day) => (
                        <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                      )}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => <Calendar.Cell date={date} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                  <Calendar.YearPickerGrid>
                    <Calendar.YearPickerGridBody>
                      {({ year }) => <Calendar.YearPickerCell year={year} />}
                    </Calendar.YearPickerGridBody>
                  </Calendar.YearPickerGrid>
                </Calendar>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Tag Popover */}
          <Popover>
            <Popover.Trigger>
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  tag
                    ? "bg-accent/10 text-accent border-accent/30 font-semibold"
                    : "bg-surface-secondary/40 text-muted border-separator/30 hover:text-foreground hover:bg-surface-secondary/60"
                }`}
                type="button"
              >
                <Tag className="size-3" />
                <span>
                  {tag
                    ? PRESET_TAGS.find((p) => p.id === tag)?.label || tag
                    : "Tag"}
                </span>
                {tag && (
                  <span
                    aria-label="Clear tag"
                    className="hover:text-danger ml-0.5 inline-flex items-center cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTag(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setTag(undefined);
                      }
                    }}
                  >
                    <X className="size-2.5" />
                  </span>
                )}
              </button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-1 min-w-32 z-50">
                {PRESET_TAGS.map((t) => (
                  <button
                    key={t.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      tag === t.id
                        ? "bg-accent/15 text-accent font-semibold"
                        : "hover:bg-surface-secondary/60 text-foreground"
                    }`}
                    type="button"
                    onClick={() => setTag(t.id)}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${t.color}`}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      )}
    </form>
  );
}
