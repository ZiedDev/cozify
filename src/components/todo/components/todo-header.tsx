import type { Key } from "@heroui/react";

import { useMemo } from "react";
import {
  SearchField,
  Tabs,
  Typography,
  Autocomplete,
  ListBox,
  EmptyState,
  useFilter,
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

  const { contains } = useFilter({ sensitivity: "base" });

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
      {/* Top row: Title + Stats & Search + View Switcher (Strictly Non-wrapping) */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full flex-nowrap">
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
          {/* HeroUI SearchField */}
          <SearchField
            aria-label="Search tasks"
            className="w-28 xs:w-36 md:w-44"
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
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
            onSelectionChange={(k) => setViewMode(k as TodoViewMode)}
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

      {/* Bottom row: Filter Tabs + HeroUI Autocomplete Filter Pickers */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full flex-wrap sm:flex-nowrap border-b border-separator/30 pb-2">
        {/* Filter Tabs */}
        <div className="shrink-0">
          <Tabs
            selectedKey={filter}
            onSelectionChange={(key) => setFilter(key as TodoFilter)}
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

        {/* Right Filter Autocomplete Controls: Tags & Priority */}
        <div className="flex items-center gap-1.5 md:gap-2 ml-auto shrink-0">
          {/* 1. HeroUI Autocomplete for Tag Filtering */}
          <Autocomplete
            className="w-24 xs:w-28 sm:w-32"
            placeholder="Tags"
            selectionMode="single"
            value={selectedTag as Key | null}
            onChange={(val) => setSelectedTag(val ? String(val) : null)}
          >
            <Autocomplete.Trigger
              className={`h-6.5 md:h-7 px-2 md:px-2.5 rounded-full text-[11px] md:text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedTag
                  ? `${activeTagMeta?.color || "bg-accent/15 text-accent border-accent/40"} font-semibold shadow-2xs`
                  : "bg-surface/80 text-muted/80 border-separator/30 hover:border-separator hover:text-foreground"
              }`}
            >
              <ActiveTagIcon className="size-3 shrink-0 opacity-80" />
              <Autocomplete.Value>
                {({ isPlaceholder }: any) =>
                  isPlaceholder || !selectedTag
                    ? "Tags"
                    : activeTagMeta?.label || selectedTag
                }
              </Autocomplete.Value>
              <Autocomplete.ClearButton />
              <Autocomplete.Indicator />
            </Autocomplete.Trigger>

            <Autocomplete.Popover className="z-50 min-w-44 p-1 rounded-2xl bg-surface border border-separator shadow-xl">
              <Autocomplete.Filter filter={contains}>
                <SearchField name="searchTag" variant="secondary">
                  <SearchField.Group className="h-7 text-xs px-2 rounded-xl bg-surface-secondary/70">
                    <SearchField.SearchIcon className="size-3 text-muted" />
                    <SearchField.Input
                      className="text-xs"
                      placeholder="Search tags..."
                    />
                    <SearchField.ClearButton className="size-3.5" />
                  </SearchField.Group>
                </SearchField>
                <ListBox
                  aria-label="Filter by tag"
                  className="max-h-52 overflow-y-auto p-1"
                  renderEmptyState={() => (
                    <EmptyState className="p-3 text-center text-xs text-muted">
                      No tags found
                    </EmptyState>
                  )}
                >
                  {tagOptions.map((item) => (
                    <ListBox.Item
                      key={item.id}
                      id={item.id}
                      textValue={item.name}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="size-3.5 shrink-0 opacity-80" />
                        <span>{item.name}</span>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Autocomplete.Filter>
            </Autocomplete.Popover>
          </Autocomplete>

          {/* 2. HeroUI Autocomplete for Priority Filtering */}
          <Autocomplete
            className="w-24 xs:w-28 sm:w-32"
            placeholder="Priority"
            selectionMode="single"
            value={selectedPriority as Key | null}
            onChange={(val) =>
              setSelectedPriority(val ? (String(val) as TodoPriority) : null)
            }
          >
            <Autocomplete.Trigger
              className={`h-6.5 md:h-7 px-2 md:px-2.5 rounded-full text-[11px] md:text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedPriority && selectedPriority !== "all"
                  ? `${PRIORITY_THEMES[selectedPriority]?.badgeClass || "bg-accent/15 text-accent border-accent/40"} font-semibold shadow-2xs`
                  : "bg-surface/80 text-muted/80 border-separator/30 hover:border-separator hover:text-foreground"
              }`}
            >
              <Flag className="size-3 shrink-0 opacity-80" />
              <Autocomplete.Value>
                {({ isPlaceholder }: any) =>
                  isPlaceholder ||
                  !selectedPriority ||
                  selectedPriority === "all"
                    ? "Priority"
                    : PRIORITY_THEMES[selectedPriority]?.label.split(" ")[0] ||
                      "Priority"
                }
              </Autocomplete.Value>
              <Autocomplete.ClearButton />
              <Autocomplete.Indicator />
            </Autocomplete.Trigger>

            <Autocomplete.Popover className="z-50 min-w-44 p-1 rounded-2xl bg-surface border border-separator shadow-xl">
              <Autocomplete.Filter filter={contains}>
                <SearchField name="searchPriority" variant="secondary">
                  <SearchField.Group className="h-7 text-xs px-2 rounded-xl bg-surface-secondary/70">
                    <SearchField.SearchIcon className="size-3 text-muted" />
                    <SearchField.Input
                      className="text-xs"
                      placeholder="Search priorities..."
                    />
                    <SearchField.ClearButton className="size-3.5" />
                  </SearchField.Group>
                </SearchField>
                <ListBox
                  aria-label="Filter by priority"
                  className="max-h-52 overflow-y-auto p-1"
                  renderEmptyState={() => (
                    <EmptyState className="p-3 text-center text-xs text-muted">
                      No priorities found
                    </EmptyState>
                  )}
                >
                  {priorityOptions.map((item) => (
                    <ListBox.Item
                      key={item.id}
                      id={item.id}
                      textValue={item.name}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${item.dot}`} />
                        <span className={item.color}>{item.name}</span>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Autocomplete.Filter>
            </Autocomplete.Popover>
          </Autocomplete>
        </div>
      </div>
    </div>
  );
}
