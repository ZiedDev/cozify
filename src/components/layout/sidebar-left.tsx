import { useMemo, useState } from "react";
import { Typography, ScrollShadow, Popover, Tooltip } from "@heroui/react";
import { Check, CheckCircle2, Tag as TagIcon, Flag } from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import {
  TodoPriority,
  PRESET_TAGS,
  PRIORITY_THEMES,
  getTagIcon,
  getTagInfo,
  getIntegratedTagPriorityInfo,
} from "@/menus/todo/types";
import { AppMode } from "@/config/modes";

export function SidebarTodoWidget({
  align = "start",
}: {
  align?: "start" | "center";
}) {
  const {
    todos,
    toggleTodo,
    selectedTag,
    setSelectedTag,
    selectedPriority,
    setSelectedPriority,
  } = useTodos();
  const [visibleCount, setVisibleCount] = useState(15);

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
          <ScrollShadow className="flex-1 min-h-0 max-h-full w-full flex flex-col gap-1.5 pr-0.5 overflow-y-auto no-scrollbar">
            {displayedTodos.map((todo) => {
              const integratedMeta = getIntegratedTagPriorityInfo(
                todo.tag,
                todo.priority,
              );

              return (
                <div
                  key={todo.id}
                  className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface/80 hover:bg-surface border border-separator/40 hover:border-separator/80 shadow-2xs transition-[background-color,border-color] duration-150 select-none text-left shrink-0"
                >
                  {/* Tactile Circular Check Button */}
                  <button
                    aria-label={`Mark "${todo.title}" as complete`}
                    className="size-3.5 md:size-4 rounded-full border-2 border-muted/50 group-hover:border-accent group-hover:scale-110 bg-surface/50 transition-[border-color,transform] duration-150 flex items-center justify-center cursor-pointer shrink-0"
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                  >
                    <Check className="size-2 md:size-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>

                  {/* Integrated Tag & Priority Icon matching the Todo page exactly */}
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

                  {/* Title (Clicking completes/toggles task) */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer overflow-hidden"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTodo(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        toggleTodo(todo.id);
                      }
                    }}
                  >
                    <Typography
                      truncate
                      className="text-xs md:text-sm text-foreground/90 leading-snug"
                      type="body-xs"
                      weight="medium"
                    >
                      {todo.title}
                    </Typography>
                  </div>
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

interface SidebarLeftProps {
  activeMode: AppMode;
}

export function SidebarLeft({ activeMode }: SidebarLeftProps) {
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
