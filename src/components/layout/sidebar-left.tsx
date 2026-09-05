import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  DragEvent,
} from "react";
import {
  Typography,
  ScrollShadow,
  Popover,
  Tooltip,
  Separator,
} from "@heroui/react";
import {
  Check,
  CheckCircle2,
  Tag as TagIcon,
  Flag,
  GripVertical,
  ChevronDown,
  FileText,
  Edit2,
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
import { AppMode } from "@/config/modes";

function SidebarTodoItem({
  todo,
  isExpanded,
  onToggleExpand,
  isDragging,
  onDragStart,
  onDragEnd,
  onToggle,
  onUpdateNotes,
}: {
  todo: TodoItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isDragging: boolean;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggle: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const [isEditingNotes, setIsEditingNotes] = useState(!todo.notes);
  const [noteDraft, setNoteDraft] = useState(todo.notes || "");
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const integratedMeta = getIntegratedTagPriorityInfo(todo.tag, todo.priority);

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
      draggable
      className={`group w-full flex flex-col px-2.5 py-1.5 rounded-xl border transition-[background-color,border-color,opacity,transform] duration-150 select-none text-left shrink-0 ${
        isDragging
          ? "opacity-25 bg-transparent border-dashed border-accent/70 scale-[0.98] shadow-none"
          : "bg-surface/80 hover:bg-surface border-separator/40 hover:border-separator/80 shadow-2xs"
      }`}
      onDragEnd={onDragEnd}
      onDragStart={(e) => {
        const target = e.target as HTMLElement;

        if (
          target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.closest("textarea") ||
          target.closest("input")
        ) {
          e.preventDefault();

          return;
        }
        onDragStart(e, todo.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Task Header Row */}
      <div className="w-full flex items-center gap-1.5 min-h-6">
        {/* Drag Grip Handle */}
        <span
          className="text-muted/30 group-hover:text-muted/70 cursor-grab active:cursor-grabbing p-0.5 shrink-0 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="size-3 md:size-3.5" />
        </span>

        {/* Tactile Circular Check Button - ONLY clicking this toggles task */}
        <button
          aria-label={`Mark "${todo.title}" as complete`}
          className="size-3.5 md:size-4 rounded-full border-2 border-muted/50 hover:border-accent hover:scale-110 bg-surface/50 transition-[border-color,transform] duration-150 flex items-center justify-center cursor-pointer shrink-0"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(todo.id);
          }}
        >
          <Check className="size-2 md:size-2.5 opacity-0 hover:opacity-60 transition-opacity" />
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

        {/* Title: Clicking EXPANDS/COLLAPSES notes (does NOT check task) */}
        <button
          className="flex-1 min-w-0 cursor-pointer overflow-hidden flex items-center justify-between gap-1 py-0.5 text-left bg-transparent border-none p-0"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          <div className="flex-1 min-w-0 overflow-hidden">
            <Marquee
              playOnHover
              align="start"
              className="text-xs md:text-sm text-foreground/90 leading-snug hover:text-foreground transition-colors font-medium"
              isHovered={isHovered && !isDragging}
              text={todo.title}
            />
          </div>

          {/* Indicator icons: FileText if notes present + rotating chevron */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {todo.notes && !isExpanded && (
              <FileText className="size-3 text-accent/80 shrink-0" />
            )}
            <ChevronDown
              className={`size-3 text-muted/60 shrink-0 transition-transform duration-200 ${
                isExpanded
                  ? "rotate-180 text-accent"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Expanded Notes Section */}
      {isExpanded && (
        <div className="w-full pl-6 pr-0.5 pt-1.5 pb-0.5 flex flex-col gap-1.5 border-t border-separator/25 mt-1 animate-in fade-in duration-150">
          {isEditingNotes || !todo.notes ? (
            <div className="flex flex-col gap-1.5 w-full">
              <textarea
                ref={textareaRef}
                className="w-full text-xs p-2 rounded-lg bg-surface-secondary/80 text-foreground border border-separator/50 focus:border-accent focus:outline-none resize-none placeholder:text-muted/60 leading-relaxed font-sans"
                placeholder="Add a note... (Enter to save)"
                rows={2}
                value={noteDraft}
                onBlur={handleSaveNotes}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (e.metaKey || e.ctrlKey || !e.shiftKey)
                  ) {
                    e.preventDefault();
                    handleSaveNotes();
                  } else if (e.key === "Escape") {
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
                className="text-xs text-foreground/80 whitespace-pre-wrap break-words leading-relaxed font-normal flex-1"
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
    moveTodoToPosition,
    selectedTag,
    setSelectedTag,
    selectedPriority,
    setSelectedPriority,
  } = useTodos();
  const [visibleCount, setVisibleCount] = useState(15);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverState, setDragOverState] = useState<{
    id: string;
    position: "top" | "bottom";
  } | null>(null);

  const draggedIdRef = useRef<string | null>(null);
  const dragOverStateRef = useRef<{
    id: string;
    position: "top" | "bottom";
  } | null>(null);

  const updateDragOver = useCallback(
    (state: { id: string; position: "top" | "bottom" } | null) => {
      if (
        dragOverStateRef.current?.id === state?.id &&
        dragOverStateRef.current?.position === state?.position
      ) {
        return;
      }
      dragOverStateRef.current = state;
      setDragOverState(state);
    },
    [],
  );

  const updateDraggedId = useCallback((id: string | null) => {
    draggedIdRef.current = id;
    setDraggedId(id);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";

    draggedIdRef.current = id;
    setTimeout(() => {
      setDraggedId(id);
    }, 0);
  }, []);

  const handleItemDragOver = useCallback(
    (e: DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";

      if (id === draggedIdRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position: "top" | "bottom" = e.clientY < midY ? "top" : "bottom";

      updateDragOver({ id, position });
    },
    [updateDragOver],
  );

  const executeDrop = useCallback(() => {
    const sourceId = draggedIdRef.current;
    const targetState = dragOverStateRef.current;

    if (sourceId && targetState && sourceId !== targetState.id) {
      moveTodoToPosition(sourceId, targetState.id, targetState.position);
    }

    updateDraggedId(null);
    updateDragOver(null);
  }, [moveTodoToPosition, updateDraggedId, updateDragOver]);

  const handleDragEnd = useCallback(() => {
    executeDrop();
  }, [executeDrop]);

  const handleItemDrop = useCallback(
    (e: DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const sourceId =
        e.dataTransfer.getData("text/plain") || draggedIdRef.current;
      const targetState = dragOverStateRef.current;
      const pos = targetState?.position || "bottom";

      if (sourceId && sourceId !== targetId) {
        moveTodoToPosition(sourceId, targetId, pos);
      }

      updateDraggedId(null);
      updateDragOver(null);
    },
    [moveTodoToPosition, updateDraggedId, updateDragOver],
  );

  // Collect unique tag options from presets and user tasks
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

  // Priority options list
  const priorityOptions = useMemo(() => {
    return [
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
    ];
  }, []);

  const allActiveTodos = useMemo(
    () => todos.filter((t) => !t.completed && !t.archived),
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
        const p = todo.priority || "none";

        if (p !== selectedPriority) return false;
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

  const listRef = useRef<HTMLDivElement>(null);

  const handleContainerDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const container = listRef.current;

      if (!container || displayedTodos.length === 0) return;

      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;

      if (relativeY < 32) {
        container.scrollTop -= 6;
      } else if (relativeY > rect.height - 32) {
        container.scrollTop += 6;
      }

      const firstItem = displayedTodos[0];
      const lastItem = displayedTodos[displayedTodos.length - 1];

      if (relativeY < 24 && firstItem) {
        updateDragOver({ id: firstItem.id, position: "top" });
      } else if (relativeY > rect.height - 24 && lastItem) {
        updateDragOver({ id: lastItem.id, position: "bottom" });
      }
    },
    [displayedTodos, updateDragOver],
  );

  const handleContainerDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      executeDrop();
    },
    [executeDrop],
  );

  const ActiveTagIcon = selectedTag ? getTagIcon(selectedTag) : TagIcon;
  const activeTagMeta = selectedTag ? getTagInfo(selectedTag) : null;

  return (
    <div
      className={`flex flex-col gap-1.5 sm:gap-2 w-full h-full flex-1 min-h-0 ${
        align === "center" ? "max-w-xs items-center" : "max-w-full items-start"
      } pointer-events-auto`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-1.5 border-b border-separator/30 pb-1.5 px-0.5 w-full shrink-0">
        <Typography
          className="text-xs md:text-sm text-foreground/90 uppercase"
          type="body-xs"
          weight="semibold"
        >
          To-Do
        </Typography>

        <div className="flex items-center gap-1 shrink-0">
          {/* Priority Filter Popover - Icon only */}
          <Popover>
            <Popover.Trigger>
              <button
                aria-label="Filter by priority"
                className={`size-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                  selectedPriority && selectedPriority !== "all"
                    ? `${PRIORITY_THEMES[selectedPriority]?.badgeClass || "bg-accent/15 text-accent border-accent/40"} shadow-2xs`
                    : "bg-surface-secondary/60 hover:bg-surface border-separator/40 text-muted hover:text-foreground"
                }`}
                title={
                  selectedPriority && selectedPriority !== "all"
                    ? `Priority: ${PRIORITY_THEMES[selectedPriority]?.label || selectedPriority}`
                    : "Filter by priority"
                }
                type="button"
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
              </button>
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

          {/* Tag Filter Popover - Icon only */}
          <Popover>
            <Popover.Trigger>
              <button
                aria-label="Filter by tag"
                className={`size-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                  selectedTag
                    ? `${activeTagMeta?.color || "bg-accent/15 text-accent border-accent/40"} shadow-2xs`
                    : "bg-surface-secondary/60 hover:bg-surface border-separator/40 text-muted hover:text-foreground"
                }`}
                title={
                  selectedTag
                    ? `Tag: ${activeTagMeta?.label || selectedTag}`
                    : "Filter by tag"
                }
                type="button"
              >
                <ActiveTagIcon className="size-3 opacity-90" />
              </button>
            </Popover.Trigger>
            <Popover.Content placement="bottom end">
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-0.5 min-w-36 z-50">
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
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Tasks left count */}
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

      {/* Mini Tasks List with ScrollShadow & Load More */}
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
            ref={listRef}
            className="flex-1 min-h-0 max-h-full w-full flex flex-col gap-1.5 pr-0.5 overflow-y-auto no-scrollbar"
            orientation="vertical"
            size={32}
            onDragEnd={handleDragEnd}
            onDragOver={handleContainerDragOver}
            onDrop={handleContainerDrop}
          >
            {displayedTodos.map((todo) => {
              const isDragOverThis =
                dragOverState?.id === todo.id && draggedId !== todo.id;
              const isDropTop =
                isDragOverThis && dragOverState?.position === "top";
              const isDropBottom =
                isDragOverThis && dragOverState?.position === "bottom";
              const isThisDragging = draggedId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={`todo-item-row w-full flex flex-col gap-1 transition-[opacity,transform] duration-150 ${
                    isThisDragging
                      ? "opacity-25 pointer-events-none scale-[0.99]"
                      : "opacity-100"
                  }`}
                  data-todo-id={todo.id}
                  onDragOver={(e) => handleItemDragOver(e, todo.id)}
                  onDrop={(e) => handleItemDrop(e, todo.id)}
                >
                  {isDropTop && (
                    <div className="py-0.5 px-1 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      <Separator className="h-0.5 bg-accent rounded-full shadow-xs" />
                    </div>
                  )}

                  <SidebarTodoItem
                    isDragging={isThisDragging}
                    isExpanded={expandedIds.has(todo.id)}
                    todo={todo}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    onToggle={toggleTodo}
                    onToggleExpand={() => toggleExpand(todo.id)}
                    onUpdateNotes={(id, notes) => updateTodo(id, { notes })}
                  />

                  {isDropBottom && (
                    <div className="py-0.5 px-1 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      <Separator className="h-0.5 bg-accent rounded-full shadow-xs" />
                    </div>
                  )}
                </div>
              );
            })}
          </ScrollShadow>

          {/* Load More Button */}
          {hasMore && (
            <button
              className="w-full py-1.5 px-2 rounded-xl text-center text-xs font-medium text-accent hover:bg-accent/10 border border-accent/20 transition-[background-color,border-color] duration-200 cursor-pointer shrink-0"
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 10)}
            >
              Load more ({totalFiltered - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarLeft({ activeMode }: { activeMode: AppMode }) {
  // Show sidebar and widgets on desktop/tablet (> 950px) when not on To-Do tab
  if (activeMode === "todo") return null;

  return (
    <aside
      aria-label="Workspace Left Sidebar"
      className="hidden min-[951px]:flex fixed top-20 md:top-24 lg:top-28 left-4 md:left-6 lg:left-8 xl:left-12 z-30 select-none pointer-events-none flex-col items-start text-left w-56 md:w-60 lg:w-64 xl:w-72 transition-[opacity,transform] duration-300"
    >
      <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-start max-h-[calc(100vh-14rem)]">
        <SidebarTodoWidget />
      </div>
    </aside>
  );
}
