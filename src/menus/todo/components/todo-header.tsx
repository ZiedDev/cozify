import { useMemo } from "react";
import {
  SearchField,
  Tabs,
  Typography,
  Popover,
  Button,
  ScrollShadow,
  cn,
} from "@heroui/react";
import {
  LayoutList,
  CheckSquare,
  Check,
  Tag as TagIcon,
  Flag,
} from "lucide-react";

import {
  TodoFilter,
  TodoViewMode,
  TodoPriority,
  PRESET_TAGS,
  PRIORITY_THEMES,
  getTagIcon,
  getTagInfo,
} from "../types";

import { useTodos } from "@/hooks/use-todos";

export function TodoHeader() {
  const {
    todos,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedPriority,
    setSelectedPriority,
    stats,
  } = useTodos();

  // Gather unique tags from presets + existing active tasks
  const tagOptions = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; icon: typeof TagIcon }
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

  const ActiveTagIcon = selectedTag ? getTagIcon(selectedTag) : TagIcon;
  const activeTagMeta = selectedTag ? getTagInfo(selectedTag) : null;

  return (
    <div className="flex flex-col gap-2.5 md:gap-3 w-full shrink-0">
      {/* Top row: Title + Stats & Search + View Switcher */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full min-w-0">
        {/* Left Title & Counter */}
        <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
          <Typography
            className="text-xl md:text-2xl lg:text-3xl font-serif font-medium tracking-tight text-foreground select-none"
            type="h1"
          >
            To-Do
          </Typography>
          <div className="flex items-center px-2 md:px-2.5 py-0.5 h-6 md:h-7 rounded-full text-[11px] md:text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1.5 shadow-2xs tabular-nums select-none">
            <Check className="size-3" />
            <span>
              {stats.completed}/{stats.total}
            </span>
          </div>
        </div>

        {/* Right Controls: Search + View Switcher */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <SearchField
            aria-label="Search tasks"
            className="w-28 xs:w-36 md:w-44"
            value={searchQuery}
            onChange={(query) => setSearchQuery(query)}
          >
            <SearchField.Group className="h-7 md:h-8 rounded-full bg-surface/90 border border-separator/40 text-xs px-2 md:px-2.5">
              <SearchField.SearchIcon className="size-3 text-muted" />
              <SearchField.Input
                className="text-xs placeholder:text-muted/60"
                placeholder="Search..."
              />
              <SearchField.ClearButton className="size-4 rounded-full" />
            </SearchField.Group>
          </SearchField>

          {/* View Mode Switcher */}
          <Tabs
            selectedKey={viewMode}
            onSelectionChange={(selectedMode) =>
              setViewMode(selectedMode as TodoViewMode)
            }
          >
            <Tabs.ListContainer className="rounded-full">
              <Tabs.List
                aria-label="View Mode"
                className="rounded-full bg-surface/90 p-0.5 border border-separator/40 text-xs"
              >
                <Tabs.Tab
                  className="h-7 px-2 md:px-3 rounded-full text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                  id="minimal"
                >
                  {({ isSelected }) => (
                    <>
                      <CheckSquare className="size-3.5 shrink-0" />
                      <Typography
                        className={
                          isSelected
                            ? "hidden min-[426px]:inline text-xs"
                            : "hidden lg:inline text-xs"
                        }
                        type="body-xs"
                        weight="medium"
                      >
                        Minimal
                      </Typography>
                      <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                    </>
                  )}
                </Tabs.Tab>
                <Tabs.Tab
                  className="h-7 px-2 md:px-3 rounded-full text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                  id="detailed"
                >
                  {({ isSelected }) => (
                    <>
                      <LayoutList className="size-3.5 shrink-0" />
                      <Typography
                        className={
                          isSelected
                            ? "hidden min-[426px]:inline text-xs"
                            : "hidden lg:inline text-xs"
                        }
                        type="body-xs"
                        weight="medium"
                      >
                        Detailed
                      </Typography>
                      <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                    </>
                  )}
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      </div>

      {/* Bottom row: Filter Tabs + Autocomplete Filter Pickers */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full min-w-0 flex-wrap border-b border-separator/30 pb-2">
        {/* Filter Tabs */}
        <div className="shrink-0">
          <Tabs
            selectedKey={filter}
            onSelectionChange={(selectedFilter) =>
              setFilter(selectedFilter as TodoFilter)
            }
          >
            <Tabs.ListContainer className="rounded-full">
              <Tabs.List
                aria-label="Todo Filters"
                className="rounded-full bg-surface/80 p-0.5 border border-separator/30 text-xs"
              >
                <Tabs.Tab
                  className="h-6.5 md:h-7 px-2 md:px-3 rounded-full text-[11px] md:text-xs font-medium cursor-pointer"
                  id="all"
                >
                  All
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
                <Tabs.Tab
                  className="h-6.5 md:h-7 px-2 md:px-3 rounded-full text-[11px] md:text-xs font-medium cursor-pointer"
                  id="today"
                >
                  Today
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
                <Tabs.Tab
                  className="h-6.5 md:h-7 px-2 md:px-3 rounded-full text-[11px] md:text-xs font-medium cursor-pointer"
                  id="active"
                >
                  Active
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
                <Tabs.Tab
                  className="h-6.5 md:h-7 px-2 md:px-3 rounded-full text-[11px] md:text-xs font-medium cursor-pointer"
                  id="completed"
                >
                  Done
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        {/* Right Filter Popovers: Tags & Priority */}
        <div className="flex items-center gap-1.5 md:gap-2 ml-auto shrink-0">
          {/* 1. Popover for Tag Filtering */}
          <Popover>
            <Popover.Trigger>
              <Button
                className={cn(
                  "h-6.5 md:h-7 px-2.5 md:px-3 text-[11px] md:text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                  selectedTag
                    ? "bg-accent-soft text-accent font-semibold"
                    : "text-muted",
                )}
                size="sm"
                variant="secondary"
              >
                <ActiveTagIcon
                  className={cn(
                    "size-3 shrink-0",
                    selectedTag
                      ? activeTagMeta?.textClass || "text-accent"
                      : "text-muted",
                  )}
                />
                <span>{activeTagMeta?.label || selectedTag || "Tags"}</span>
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="flex flex-col gap-1 min-w-40 z-50">
                <ScrollShadow
                  className="max-h-52 overflow-y-auto flex flex-col gap-1 no-scrollbar pr-0.5"
                  orientation="vertical"
                  size={20}
                >
                  <Button
                    className={cn(
                      "w-full justify-start text-muted shrink-0",
                      !selectedTag &&
                        "bg-accent-soft text-accent font-semibold",
                    )}
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedTag(null)}
                  >
                    <TagIcon className="size-3.5" />
                    <span>All Tags</span>
                  </Button>
                  {tagOptions.map((item) => {
                    const isSelected =
                      selectedTag?.toLowerCase() === item.id.toLowerCase();
                    const info = getTagInfo(item.id);

                    return (
                      <Button
                        key={item.id}
                        className={cn(
                          "w-full justify-start text-muted shrink-0",
                          isSelected &&
                            "bg-accent-soft text-accent font-semibold",
                        )}
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setSelectedTag(isSelected ? null : item.id)
                        }
                      >
                        <item.icon
                          className={cn(
                            "size-3.5 shrink-0",
                            info?.textClass || "text-accent",
                          )}
                        />
                        <span>{item.name}</span>
                      </Button>
                    );
                  })}
                </ScrollShadow>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* 2. Popover for Priority Filtering */}
          <Popover>
            <Popover.Trigger>
              <Button
                className={cn(
                  "h-6.5 md:h-7 px-2.5 md:px-3 text-[11px] md:text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                  selectedPriority && selectedPriority !== "all"
                    ? "bg-accent-soft font-semibold"
                    : "text-muted",
                )}
                size="sm"
                variant="secondary"
              >
                <Flag
                  className={cn(
                    "size-3 shrink-0",
                    selectedPriority && selectedPriority !== "all"
                      ? PRIORITY_THEMES[selectedPriority]?.textColor
                      : "text-muted",
                  )}
                />
                <span
                  className={cn(
                    selectedPriority &&
                      selectedPriority !== "all" &&
                      PRIORITY_THEMES[selectedPriority]?.textColor,
                  )}
                >
                  {!selectedPriority || selectedPriority === "all"
                    ? "Priority"
                    : PRIORITY_THEMES[selectedPriority]?.label || "Priority"}
                </span>
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="flex flex-col gap-1 min-w-40 z-50">
                <ScrollShadow
                  className="max-h-52 overflow-y-auto flex flex-col gap-1 no-scrollbar pr-0.5"
                  orientation="vertical"
                  size={20}
                >
                  <Button
                    className={cn(
                      "w-full justify-start text-muted shrink-0",
                      (!selectedPriority || selectedPriority === "all") &&
                        "bg-accent-soft text-accent font-semibold",
                    )}
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedPriority(null)}
                  >
                    <Flag className="size-3.5" />
                    <span>All Priorities</span>
                  </Button>
                  {priorityOptions.map((item) => {
                    const isSelected = selectedPriority === item.id;

                    return (
                      <Button
                        key={item.id}
                        className={cn(
                          "w-full justify-start text-muted shrink-0",
                          isSelected && "bg-accent-soft font-semibold",
                        )}
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setSelectedPriority(
                            isSelected ? null : (item.id as TodoPriority),
                          )
                        }
                      >
                        <span className={cn(isSelected && item.color)}>
                          {item.name}
                        </span>
                      </Button>
                    );
                  })}
                </ScrollShadow>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </div>
  );
}
