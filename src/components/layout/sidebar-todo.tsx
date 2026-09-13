import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Typography,
  ScrollShadow,
  Popover,
  Tooltip,
  Button,
} from "@heroui/react";
import {
  Check,
  CheckCircle2,
  Tag as TagIcon,
  Flag,
  FileText,
  Edit2,
  Calendar,
} from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import { Marquee } from "@/components/ui/marquee";
import {
  TodoItem,
  TodoPriority,
  PRESET_TAGS,
  PRIORITY_THEMES,
  getTagIcon,
  getTagInfo,
  getIntegratedTagPriorityInfo,
} from "@/menus/todo/types";
import { SortableList, SortableItem } from "@/components/ui/sortable-list";

interface SidebarTodoItemProps {
  todo: TodoItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggle: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export function SidebarTodoItem({
  todo,
  isExpanded,
  onToggleExpand,
  onToggle,
  onUpdateNotes,
}: SidebarTodoItemProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(!todo.notes);
  const [noteDraft, setNoteDraft] = useState(todo.notes || "");
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const integratedMeta = getIntegratedTagPriorityInfo(todo.tag, todo.priority);

  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue =
    Boolean(todo.dueDate) && !todo.completed && (todo.dueDate || "") < todayStr;
  const isDueToday = todo.dueDate === todayStr;

  useEffect(() => {
    setNoteDraft(todo.notes || "");
    if (!todo.notes) {
      setIsEditingNotes(true);
    }
  }, [todo.notes]);

  useEffect(() => {
    if (isExpanded && (!todo.notes || isEditingNotes)) {
      textareaRef.current?.focus();
    }
  }, [isExpanded, isEditingNotes, todo.notes]);

  const handleSaveNotes = () => {
    const trimmed = noteDraft.trim();

    onUpdateNotes(todo.id, trimmed);
    if (trimmed) {
      setIsEditingNotes(false);
    }
  };

  return (
    <div
      className="sidebar-todo-item group w-full flex flex-col px-2.5 py-1.5 rounded-xl border transition-[background-color,border-color,transform] duration-150 select-none text-left shrink-0 bg-surface/85 hover:bg-surface border-separator/40 hover:border-separator/80 shadow-2xs cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Row */}
      <div className="w-full flex items-center gap-1.5 min-h-6">
        {/* Toggle Check Circle */}
        <button
          aria-label={
            todo.completed
              ? `Mark "${todo.title}" as active`
              : `Mark "${todo.title}" as complete`
          }
          className={`size-3.5 md:size-4 rounded-full border-2 transition-[background-color,border-color,transform] duration-150 flex items-center justify-center cursor-pointer shrink-0 ${
            todo.completed
              ? "bg-accent border-accent text-accent-foreground scale-95"
              : "border-muted/50 hover:border-accent hover:scale-110 bg-surface/50"
          }`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(todo.id);
          }}
        >
          <Check
            className={`size-2 md:size-2.5 transition-opacity ${
              todo.completed ? "opacity-100" : "opacity-0 hover:opacity-60"
            }`}
          />
        </button>

        {/* Integrated Tag & Priority Icon */}
        {(integratedMeta.hasTag || integratedMeta.hasPriority) && (
          <Tooltip delay={200}>
            <Tooltip.Trigger>
              <span className="flex items-center justify-center shrink-0 cursor-default">
                <integratedMeta.Icon
                  className={`size-3.5 md:size-4 shrink-0 transition-colors ${integratedMeta.iconColor}`}
                />
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-foreground border border-separator shadow-lg">
              {integratedMeta.tooltipText}
            </Tooltip.Content>
          </Tooltip>
        )}

        {/* Title area: Click expands/collapses notes */}
        <div
          className="flex-1 min-w-0 overflow-hidden flex items-center justify-between gap-1 py-0.5 text-left"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleExpand();
            }
          }}
        >
          <div className="flex-1 min-w-0 overflow-hidden pointer-events-none">
            <Marquee
              playOnHover
              align="start"
              className={`text-xs md:text-sm leading-snug transition-colors font-medium ${
                todo.completed
                  ? "line-through text-muted/70"
                  : "text-foreground/90 group-hover:text-foreground"
              }`}
              isHovered={isHovered}
              text={todo.title}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {todo.dueDate && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-medium border flex items-center gap-0.5 ${
                  isOverdue
                    ? "text-danger border-danger/30 bg-danger/10"
                    : isDueToday
                      ? "text-accent border-accent/40 bg-accent/15 font-semibold"
                      : "text-muted/70 border-separator/30 bg-surface-secondary/40"
                }`}
              >
                <Calendar className="size-2.5 opacity-70" />
                <span>{isDueToday ? "Today" : todo.dueDate.slice(5)}</span>
              </span>
            )}
            {todo.notes && !isExpanded && (
              <FileText className="size-3 text-accent/80 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Notes Section */}
      {isExpanded && (
        <div className="w-full pl-5 pr-0.5 pt-1.5 pb-0.5 flex flex-col gap-1.5 border-t border-separator/25 mt-1 animate-in fade-in duration-150">
          {isEditingNotes || !todo.notes ? (
            <div className="flex flex-col gap-1.5 w-full">
              <textarea
                ref={textareaRef}
                className="w-full text-xs p-2 rounded-lg bg-surface-secondary/80 text-foreground border border-separator/50 focus:border-accent focus:outline-none resize-none placeholder:text-muted/60 leading-relaxed font-sans"
                placeholder="Add a note... (Enter to save)"
                rows={2}
                value={noteDraft}
                onBlur={handleSaveNotes}
                onChange={(event) => setNoteDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey || !event.shiftKey)
                  ) {
                    event.preventDefault();
                    handleSaveNotes();
                  } else if (event.key === "Escape") {
                    setNoteDraft(todo.notes || "");
                    if (todo.notes) {
                      setIsEditingNotes(false);
                    } else {
                      onToggleExpand();
                    }
                  }
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-muted px-0.5">
                <span>Enter to save, Esc to cancel</span>
                <div className="flex items-center gap-1.5">
                  {todo.notes && (
                    <button
                      className="hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded text-[10px]"
                      type="button"
                      onClick={() => {
                        setNoteDraft(todo.notes || "");
                        setIsEditingNotes(false);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    className="text-accent hover:underline cursor-pointer font-medium px-2 py-0.5 rounded bg-accent/10 text-[10px]"
                    type="button"
                    onClick={handleSaveNotes}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="group/note w-full flex items-start justify-between gap-2 p-2 rounded-lg bg-surface-secondary/40 hover:bg-surface-secondary/70 border border-separator/30 cursor-pointer transition-colors text-left"
              title="Click to edit note"
              type="button"
              onClick={() => setIsEditingNotes(true)}
            >
              <Typography
                className="text-xs text-foreground/80 whitespace-pre-wrap wrap-break-word leading-relaxed font-normal flex-1"
                type="body-xs"
              >
                {todo.notes}
              </Typography>
              <span className="text-muted opacity-0 group-hover/note:opacity-100 transition-opacity p-0.5 shrink-0">
                <Edit2 className="size-3 text-muted hover:text-accent" />
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarTodoWidget({
  align = "start",
}: {
  align?: "start" | "center";
}) {
  const {
    todos,
    toggleTodo,
    updateTodo,
    reorderTodos,
    selectedTag,
    setSelectedTag,
    selectedPriority,
    setSelectedPriority,
  } = useTodos();

  const [visibleCount, setVisibleCount] = useState(15);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }, []);

  // Collect unique tags
  const tagOptions = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; icon: ReturnType<typeof getTagIcon> }
    >();

    for (const preset of PRESET_TAGS) {
      map.set(preset.id, {
        id: preset.id,
        name: preset.label,
        icon: getTagIcon(preset.id),
      });
    }

    for (const todo of todos) {
      if (todo.tag && !map.has(todo.tag.toLowerCase())) {
        const info = getTagInfo(todo.tag);

        map.set(todo.tag.toLowerCase(), {
          id: todo.tag.toLowerCase(),
          name: info?.label || todo.tag,
          icon: getTagIcon(todo.tag),
        });
      }
    }

    return Array.from(map.values());
  }, [todos]);

  // Priority options
  const priorityOptions = useMemo(
    () => [
      {
        id: "high",
        name: "High Priority",
        color: "text-rose-400",
        dot: "bg-rose-400",
      },
      {
        id: "medium",
        name: "Medium Priority",
        color: "text-amber-400",
        dot: "bg-amber-400",
      },
      {
        id: "low",
        name: "Low Priority",
        color: "text-blue-400",
        dot: "bg-blue-400",
      },
      {
        id: "none",
        name: "No Priority",
        color: "text-muted",
        dot: "bg-muted/40",
      },
    ],
    [],
  );

  const allActiveTodos = useMemo(
    () => todos.filter((todo) => !todo.completed && !todo.archived),
    [todos],
  );

  const filteredActiveTodos = useMemo(() => {
    return allActiveTodos.filter((todo) => {
      if (
        selectedTag &&
        selectedTag !== "all" &&
        todo.tag?.toLowerCase() !== selectedTag.toLowerCase()
      ) {
        return false;
      }
      if (selectedPriority && selectedPriority !== "all") {
        const taskPriority = todo.priority || "none";

        if (taskPriority !== selectedPriority) return false;
      }

      return true;
    });
  }, [allActiveTodos, selectedTag, selectedPriority]);

  const totalActive = allActiveTodos.length;
  const totalFiltered = filteredActiveTodos.length;
  const isFiltered = Boolean(
    selectedTag || (selectedPriority && selectedPriority !== "all"),
  );

  const displayedTodos = filteredActiveTodos.slice(0, visibleCount);
  const hasMore = visibleCount < totalFiltered;

  const ActiveTagIcon = selectedTag ? getTagIcon(selectedTag) : TagIcon;
  const activeTagMeta = selectedTag ? getTagInfo(selectedTag) : null;

  return (
    <div
      className={`flex flex-col gap-1.5 sm:gap-2 w-full h-full flex-1 min-h-0 ${
        align === "center" ? "max-w-xs items-center" : "max-w-full items-start"
      } pointer-events-auto`}
    >
      {/* Header */}
      <div className="sidebar-todo-header flex items-center justify-between gap-1.5 border-b border-separator/30 pb-1.5 px-0.5 w-full shrink-0">
        <Typography
          className="text-xs md:text-sm text-foreground/90 uppercase"
          type="body-xs"
          weight="semibold"
        >
          To-Do
        </Typography>

        <div className="flex items-center gap-1 shrink-0">
          {/* Priority Filter */}
          <Popover>
            <Popover.Trigger>
              <Button
                isIconOnly
                aria-label={
                  selectedPriority && selectedPriority !== "all"
                    ? `Priority: ${PRIORITY_THEMES[selectedPriority]?.label || selectedPriority}`
                    : "Filter by priority"
                }
                className={`size-6 min-w-6 p-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                  selectedPriority && selectedPriority !== "all"
                    ? `${PRIORITY_THEMES[selectedPriority]?.badgeClass || "bg-accent/15 text-accent border-accent/40"} shadow-2xs`
                    : "bg-surface-secondary/60 hover:bg-surface border-separator/40 text-muted hover:text-foreground"
                }`}
                size="sm"
                variant="ghost"
              >
                <Flag
                  className={`size-3 ${
                    selectedPriority === "high"
                      ? "text-rose-400 fill-rose-400/30"
                      : selectedPriority === "medium"
                        ? "text-amber-400 fill-amber-400/30"
                        : selectedPriority === "low"
                          ? "text-blue-400 fill-blue-400/30"
                          : "opacity-80"
                  }`}
                />
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom end">
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-0.5 min-w-36 z-50">
                <button
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                    !selectedPriority || selectedPriority === "all"
                      ? "bg-accent/15 text-accent font-semibold"
                      : "hover:bg-surface-secondary/60 text-foreground"
                  }`}
                  type="button"
                  onClick={() => setSelectedPriority(null)}
                >
                  <Flag className="size-3.5 opacity-60 shrink-0 text-muted" />
                  <span>All Priorities</span>
                </button>
                {priorityOptions.map((item) => {
                  const isSelected = selectedPriority === item.id;

                  return (
                    <button
                      key={item.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-accent/15 text-accent font-semibold"
                          : "hover:bg-surface-secondary/60 text-foreground"
                      }`}
                      type="button"
                      onClick={() =>
                        setSelectedPriority(
                          isSelected ? null : (item.id as TodoPriority),
                        )
                      }
                    >
                      <span
                        className={`size-2 rounded-full shrink-0 ${item.dot}`}
                      />
                      <span className={item.color}>{item.name}</span>
                    </button>
                  );
                })}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Tag Filter */}
          <Popover>
            <Popover.Trigger>
              <Button
                isIconOnly
                aria-label={
                  selectedTag
                    ? `Tag: ${activeTagMeta?.label || selectedTag}`
                    : "Filter by tag"
                }
                className={`size-6 min-w-6 p-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                  selectedTag
                    ? `${activeTagMeta?.color || "bg-accent/15 text-accent border-accent/40"} shadow-2xs`
                    : "bg-surface-secondary/60 hover:bg-surface border-separator/40 text-muted hover:text-foreground"
                }`}
                size="sm"
                variant="ghost"
              >
                <ActiveTagIcon className="size-3 opacity-90" />
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom end">
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-0.5 min-w-36 z-50">
                <ScrollShadow
                  className="max-h-52 overflow-y-auto flex flex-col gap-0.5 no-scrollbar pr-0.5"
                  orientation="vertical"
                  size={20}
                >
                  <button
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      !selectedTag
                        ? "bg-accent/15 text-accent font-semibold"
                        : "hover:bg-surface-secondary/60 text-foreground"
                    }`}
                    type="button"
                    onClick={() => setSelectedTag(null)}
                  >
                    <TagIcon className="size-3.5 opacity-60 shrink-0 text-muted" />
                    <span>All Tags</span>
                  </button>
                  {tagOptions.map((item) => {
                    const isSelected =
                      selectedTag?.toLowerCase() === item.id.toLowerCase();
                    const ItemIcon = item.icon;

                    return (
                      <button
                        key={item.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent/15 text-accent font-semibold"
                            : "hover:bg-surface-secondary/60 text-foreground"
                        }`}
                        type="button"
                        onClick={() =>
                          setSelectedTag(isSelected ? null : item.id)
                        }
                      >
                        <ItemIcon className="size-3.5 opacity-80 shrink-0" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </ScrollShadow>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Active Count */}
          {totalActive > 0 && (
            <Typography
              className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/30 tabular-nums ml-0.5"
              color="muted"
              type="body-xs"
              weight="medium"
            >
              {isFiltered
                ? `${totalFiltered}/${totalActive}`
                : `${totalActive} left`}
            </Typography>
          )}
        </div>
      </div>

      {/* List Container */}
      {totalActive === 0 ? (
        <div className="flex-1 flex items-center justify-center gap-2 py-4 px-2.5 rounded-xl bg-surface/40 border border-separator/30 text-muted w-full">
          <CheckCircle2 className="size-3.5 text-accent shrink-0" />
          <Typography
            className="text-xs md:text-sm font-light"
            color="muted"
            type="body-xs"
          >
            All clear
          </Typography>
        </div>
      ) : totalFiltered === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2.5 rounded-xl bg-surface/40 border border-separator/30 text-muted w-full">
          <Typography
            className="text-xs font-light"
            color="muted"
            type="body-xs"
          >
            No matching tasks
          </Typography>
          <button
            className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
            type="button"
            onClick={() => {
              setSelectedTag(null);
              setSelectedPriority(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 w-full">
          <ScrollShadow
            className="flex-1 min-h-0 max-h-full w-full flex flex-col gap-1.5 px-1"
            orientation="vertical"
            size={32}
          >
            <SortableList onReorder={reorderTodos}>
              <div className="flex flex-col gap-1.5 w-full">
                {displayedTodos.map((todo, index) => (
                  <SortableItem key={todo.id} id={todo.id} index={index}>
                    <SidebarTodoItem
                      isExpanded={expandedIds.has(todo.id)}
                      todo={todo}
                      onToggle={toggleTodo}
                      onToggleExpand={() => toggleExpand(todo.id)}
                      onUpdateNotes={(id, notes) => updateTodo(id, { notes })}
                    />
                  </SortableItem>
                ))}
              </div>
            </SortableList>
          </ScrollShadow>

          {hasMore && (
            <button
              className="w-full py-1.5 px-2 rounded-xl text-center text-xs font-medium text-accent hover:bg-accent/10 border border-accent/20 transition-[background-color,border-color] duration-200 cursor-pointer shrink-0"
              type="button"
              onClick={() => setVisibleCount((prevCount) => prevCount + 10)}
            >
              Load more ({totalFiltered - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
