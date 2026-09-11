import { useState, useMemo, memo } from "react";
import { ProgressBar, Tabs, Typography, ScrollShadow } from "@heroui/react";
import { Tag, Clock, CheckCircle2 } from "lucide-react";

import { TagStat } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

import { getTagInfo, getTagIcon } from "@/config/tags";
import { TodoItem } from "@/menus/todo/types";

function TagsAnalyticsComponent({
  tagStats,
  todos,
}: {
  tagStats: TagStat[];
  todos: TodoItem[];
}) {
  const [activeSubTab, setActiveSubTab] = useState<string>("focus");

  // Calculate task tag stats directly from todos
  const taskTagStats = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();

    for (const todo of todos) {
      if (!todo.tag) continue;
      const tagId = todo.tag.toLowerCase();
      const existing = map.get(tagId) || { total: 0, completed: 0 };

      existing.total += 1;
      if (todo.completed) existing.completed += 1;
      map.set(tagId, existing);
    }

    return Array.from(map.entries()).map(([id, data]) => {
      const tagMeta = getTagInfo(id);
      const percentage =
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

      return {
        id,
        label: tagMeta?.label || id,
        total: data.total,
        completed: data.completed,
        percentage,
        colorInfo: {
          dot: tagMeta?.dotColor || "bg-accent",
          fill: tagMeta?.chartFill || "bg-accent",
        },
      };
    });
  }, [todos]);

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors w-full h-full flex flex-col justify-between select-none">
      <div>
        {/* Clean Header: Title appears BEFORE tabs */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-foreground text-xs sm:text-sm font-semibold">
              <Tag className="size-3.5 text-accent shrink-0" />
              <span>Category Tags</span>
            </div>
            <Typography
              className="text-xs font-light mt-0.5"
              color="muted"
              type="body-xs"
            >
              Focus allocation and task completion
            </Typography>
          </div>

          <Typography
            className="text-xs tabular-nums"
            color="muted"
            type="body-xs"
            weight="medium"
          >
            {Math.max(tagStats.length, taskTagStats.length)} Tags
          </Typography>
        </div>

        {/* Tabs Placed Below the Title */}
        <div className="mb-2.5 pb-2 border-b border-separator/20">
          <Tabs
            selectedKey={activeSubTab}
            onSelectionChange={(selectedSubTab) =>
              setActiveSubTab(selectedSubTab as string)
            }
          >
            <Tabs.ListContainer className="rounded-full">
              <Tabs.List
                aria-label="Category Analytics"
                className="rounded-full bg-surface-secondary/70 p-0.5 border border-separator/40 text-xs w-full grid grid-cols-2"
              >
                <Tabs.Tab
                  className="h-6.5 sm:h-7 px-2 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  id="focus"
                >
                  <Clock className="size-3.5 shrink-0" />
                  <span>Focus Time</span>
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
                <Tabs.Tab
                  className="h-6.5 sm:h-7 px-2 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  id="tasks"
                >
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>Tasks Done</span>
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        {/* Tab 1: Focus Time Allocation */}
        {activeSubTab === "focus" && (
          <ScrollShadow
            className="max-h-48 sm:max-h-56 overflow-y-auto flex flex-col gap-2.5 pt-0.5 no-scrollbar pr-1"
            orientation="vertical"
            size={20}
          >
            {tagStats.length === 0 ? (
              <Typography
                className="py-5 text-center text-xs"
                color="muted"
                type="body-xs"
              >
                No tagged focus sessions recorded yet.
              </Typography>
            ) : (
              tagStats.map((tag) => {
                const tagMeta = getTagInfo(tag.id);
                const TagIcon = getTagIcon(tag.id);
                const colorInfo = {
                  dot: tagMeta?.dotColor || "bg-accent",
                  fill: tagMeta?.chartFill || "bg-accent",
                };

                return (
                  <div key={tag.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <TagIcon className="size-3.5 text-muted shrink-0" />
                        <span
                          className={`size-1.5 rounded-full ${colorInfo.dot}`}
                        />
                        <span className="font-medium text-foreground">
                          {tag.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs tabular-nums">
                        <span className="font-semibold text-foreground">
                          {formatMinutesDisplay(tag.focusMinutes)}
                        </span>
                        {tag.overtimeMinutes && tag.overtimeMinutes > 0 ? (
                          <span className="text-[10px] text-accent font-medium">
                            (+{formatMinutesDisplay(tag.overtimeMinutes)})
                          </span>
                        ) : null}
                        <span className="text-xs text-muted w-8 text-right">
                          {tag.percentage}%
                        </span>
                      </div>
                    </div>

                    <ProgressBar
                      aria-label={`${tag.label} focus distribution`}
                      value={tag.percentage}
                    >
                      <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                        <ProgressBar.Fill
                          className={`rounded-full transition-[width] duration-300 shadow-2xs ${colorInfo.fill}`}
                        />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                );
              })
            )}
          </ScrollShadow>
        )}

        {/* Tab 2: Task Completion by Tag */}
        {activeSubTab === "tasks" && (
          <ScrollShadow
            className="max-h-48 sm:max-h-56 overflow-y-auto flex flex-col gap-2.5 pt-0.5 no-scrollbar pr-1"
            orientation="vertical"
            size={20}
          >
            {taskTagStats.length === 0 ? (
              <Typography
                className="py-5 text-center text-xs"
                color="muted"
                type="body-xs"
              >
                No tagged tasks created yet.
              </Typography>
            ) : (
              taskTagStats.map((item) => {
                const TagIcon = getTagIcon(item.id);

                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <TagIcon className="size-3.5 text-muted shrink-0" />
                        <span
                          className={`size-1.5 rounded-full ${item.colorInfo.dot}`}
                        />
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs tabular-nums">
                        <span className="font-semibold text-foreground">
                          {item.completed}/{item.total}
                        </span>
                        <span className="text-xs text-muted w-8 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    <ProgressBar
                      aria-label={`${item.label} task completion`}
                      value={item.percentage}
                    >
                      <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                        <ProgressBar.Fill
                          className={`rounded-full transition-[width] duration-300 shadow-2xs ${item.colorInfo.fill}`}
                        />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                );
              })
            )}
          </ScrollShadow>
        )}
      </div>

      {/* Footer Note */}
      <Typography
        className="text-xs opacity-75 font-light mt-3 pt-2 border-t border-separator/20"
        color="muted"
        type="body-xs"
      >
        Track focus and task progress categorized by tag.
      </Typography>
    </div>
  );
}

export const TagsAnalytics = memo(TagsAnalyticsComponent);
