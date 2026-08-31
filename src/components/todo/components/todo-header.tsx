import { SearchField, Tabs, ScrollShadow, Typography } from "@heroui/react";
import { LayoutList, CheckSquare, Check } from "lucide-react";

import { TodoFilter, TodoViewMode, PRESET_TAGS } from "../types";

import { useTodos } from "@/hooks/use-todos";

export function TodoHeader() {
  const {
    filter,
    setFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    stats,
  } = useTodos();

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

          {/* View Mode Switcher (Icon-only on <= 1024px, icon+label on > 1024px) */}
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

      {/* Bottom row: Filter Tabs & ScrollShadow Tags (Non-wrapping & Smooth Overflow Scroll) */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full flex-nowrap border-b border-separator/30 pb-2 overflow-hidden">
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

        {/* HeroUI ScrollShadow for Horizontal Overflowing Category Tags */}
        <ScrollShadow
          hideScrollBar
          className="flex-1 min-w-0 py-0.5"
          orientation="horizontal"
        >
          <div className="flex items-center gap-1.5 flex-nowrap w-max ml-auto pl-2 pr-1">
            {PRESET_TAGS.map((t) => {
              const isSelected = selectedTag === t.id;

              return (
                <button
                  key={t.id}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-accent text-accent-foreground border-accent shadow-2xs font-semibold"
                      : "bg-surface/60 text-muted/80 border-separator/30 hover:border-separator hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </ScrollShadow>
      </div>
    </div>
  );
}
