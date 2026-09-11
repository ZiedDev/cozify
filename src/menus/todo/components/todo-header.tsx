import { useMemo } from "react";
import {
  SearchField,
  Tabs,
  Typography,
  Popover,
  Button,
  ScrollShadow,
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
                className={`h-6.5 md:h-7 px-2.5 md:px-3 rounded-full text-[11px] md:text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedTag
                    ? `${activeTagMeta?.color || "bg-accent/15 text-accent border-accent/40"} font-semibold shadow-2xs`
                    : "bg-surface/80 text-muted/80 border-separator/30 hover:border-separator hover:text-foreground"
                }`}
                size="sm"
                variant="ghost"
              >
                <ActiveTagIcon className="size-3 shrink-0 opacity-80" />
                <span>{activeTagMeta?.label || selectedTag || "Tags"}</span>
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-1 min-w-36 z-50">
                <ScrollShadow
                  className="max-h-52 overflow-y-auto flex flex-col gap-1 no-scrollbar pr-0.5"
                  orientation="vertical"
                  size={20}
                >
                  <button
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      !selectedTag
                        ? "bg-accent/15 text-accent font-semibold"
                        : "hover:bg-surface-secondary/60 text-foreground"
                    }`}
                    type="button"
                    onClick={() => setSelectedTag(null)}
                  >
                    <TagIcon className="size-3.5 opacity-80 shrink-0 text-muted" />
                    <span>All Tags</span>
                  </button>
                  {tagOptions.map((item) => {
                    const isSelected =
                      selectedTag?.toLowerCase() === item.id.toLowerCase();

                    return (
                      <button
                        key={item.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent/15 text-accent font-semibold"
                            : "hover:bg-surface-secondary/60 text-foreground"
                        }`}
                        type="button"
                        onClick={() =>
                          setSelectedTag(isSelected ? null : item.id)
                        }
                      >
                        <item.icon className="size-3.5 opacity-80 shrink-0" />
                        <span>{item.name}</span>
                      </button>
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
                className={`h-6.5 md:h-7 px-2.5 md:px-3 rounded-full text-[11px] md:text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedPriority && selectedPriority !== "all"
                    ? `${PRIORITY_THEMES[selectedPriority]?.badgeClass || "bg-accent/15 text-accent border-accent/40"} font-semibold shadow-2xs`
                    : "bg-surface/80 text-muted/80 border-separator/30 hover:border-separator hover:text-foreground"
                }`}
                size="sm"
                variant="ghost"
              >
                <Flag className="size-3 shrink-0 opacity-80" />
                <span>
                  {!selectedPriority || selectedPriority === "all"
                    ? "Priority"
                    : PRIORITY_THEMES[selectedPriority]?.label || "Priority"}
                </span>
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-1 min-w-36 z-50">
                <ScrollShadow
                  className="max-h-52 overflow-y-auto flex flex-col gap-1 no-scrollbar pr-0.5"
                  orientation="vertical"
                  size={20}
                >
                  <button
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      !selectedPriority || selectedPriority === "all"
                        ? "bg-accent/15 text-accent font-semibold"
                        : "hover:bg-surface-secondary/60 text-foreground"
                    }`}
                    type="button"
                    onClick={() => setSelectedPriority(null)}
                  >
                    <Flag className="size-3.5 opacity-80 shrink-0 text-muted" />
                    <span>All Priorities</span>
                  </button>
                  {priorityOptions.map((item) => {
                    const isSelected = selectedPriority === item.id;

                    return (
                      <button
                        key={item.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
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
                        <span className={`size-2 rounded-full ${item.dot}`} />
                        <span className={item.color}>{item.name}</span>
                      </button>
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
