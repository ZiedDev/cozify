import { useState } from "react";
import { ProgressBar, Tabs, Typography } from "@heroui/react";
import { Flag, Tag } from "lucide-react";

import { PriorityStat, TagStat, OverallStats } from "../types";

import { TodoItem } from "@/components/todo/types";

interface TaskAnalyticsProps {
  todos: TodoItem[];
  priorityStats: PriorityStat[];
  tagStats: TagStat[];
  overallStats: OverallStats;
}

export function TaskAnalytics({
  todos: _todos,
  priorityStats,
  tagStats,
  overallStats,
}: TaskAnalyticsProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("priorities");

  // Section 1: Priorities Breakdown
  const renderPriorityContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Flag className="size-3.5" />
            </div>
            <div>
              <Typography
                className="text-xs sm:text-sm text-foreground"
                type="body-sm"
                weight="semibold"
              >
                Tasks by Priority
              </Typography>
              <Typography
                className="text-[10px] font-light"
                color="muted"
                type="body-xs"
              >
                Completion across urgency levels
              </Typography>
            </div>
          </div>
          <Typography
            className="text-[10px] text-foreground bg-surface-secondary px-2 py-0.5 rounded-full border border-separator/30"
            type="body-xs"
            weight="medium"
          >
            {overallStats.tasksCompleted}/{overallStats.tasksTotal} Done
          </Typography>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          {priorityStats.map((p) => (
            <div key={p.id} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${p.dotColor}`} />
                  <span className="font-medium text-foreground">{p.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                  <Typography
                    className="text-[11px]"
                    color="muted"
                    type="body-xs"
                  >
                    {p.completed}/{p.total}
                  </Typography>
                  <Typography
                    className="text-foreground w-7 text-right"
                    type="body-xs"
                    weight="semibold"
                  >
                    {p.percentage}%
                  </Typography>
                </div>
              </div>

              <ProgressBar
                aria-label={`${p.label} priority completion`}
                value={p.percentage}
              >
                <ProgressBar.Track className="h-1 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                  <ProgressBar.Fill className="bg-accent rounded-full transition-all duration-300 shadow-2xs" />
                </ProgressBar.Track>
              </ProgressBar>
            </div>
          ))}
        </div>
      </div>

      <Typography
        className="text-[10px] opacity-70 font-light mt-2 pt-1.5 border-t border-separator/20"
        color="muted"
        type="body-xs"
      >
        Overall task hit rate:{" "}
        <strong className="text-foreground font-medium">
          {overallStats.taskCompletionRate}%
        </strong>
      </Typography>
    </div>
  );

  // Section 2: Tasks by Category
  const renderCategoryContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Tag className="size-3.5" />
            </div>
            <div>
              <Typography
                className="text-xs sm:text-sm text-foreground"
                type="body-sm"
                weight="semibold"
              >
                Tasks by Tag
              </Typography>
              <Typography
                className="text-[10px] font-light"
                color="muted"
                type="body-xs"
              >
                Completed tasks per category
              </Typography>
            </div>
          </div>
          <Typography
            className="text-[10px]"
            color="muted"
            type="body-xs"
            weight="medium"
          >
            {tagStats.length} Tags
          </Typography>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          {tagStats.length === 0 ? (
            <Typography
              className="py-4 text-center text-[11px]"
              color="muted"
              type="body-xs"
            >
              No tasks with tags yet.
            </Typography>
          ) : (
            tagStats.slice(0, 4).map((tag) => {
              const compPercent =
                tag.taskCount > 0
                  ? Math.round((tag.completedTaskCount / tag.taskCount) * 100)
                  : 0;

              return (
                <div key={tag.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-foreground">
                        {tag.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                      <Typography
                        className="text-[11px]"
                        color="muted"
                        type="body-xs"
                      >
                        {tag.completedTaskCount}/{tag.taskCount}
                      </Typography>
                      <Typography
                        className="text-foreground w-7 text-right"
                        type="body-xs"
                        weight="semibold"
                      >
                        {compPercent}%
                      </Typography>
                    </div>
                  </div>

                  <ProgressBar
                    aria-label={`${tag.label} task completion`}
                    value={compPercent}
                  >
                    <ProgressBar.Track className="h-1 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                      <ProgressBar.Fill
                        className="rounded-full transition-all duration-300 shadow-2xs"
                        style={{ backgroundColor: tag.color }}
                      />
                    </ProgressBar.Track>
                  </ProgressBar>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Typography
        className="text-[10px] opacity-70 font-light mt-2 pt-1.5 border-t border-separator/20"
        color="muted"
        type="body-xs"
      >
        Filter and organize tasks using tags.
      </Typography>
    </div>
  );

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all w-full h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-separator/30">
        <Tabs
          selectedKey={activeSubTab}
          onSelectionChange={(k) => setActiveSubTab(k as string)}
        >
          <Tabs.ListContainer className="rounded-full">
            <Tabs.List
              aria-label="Priorities and Tags"
              className="rounded-full bg-surface-secondary/70 p-0.5 border border-separator/40 text-xs"
            >
              <Tabs.Tab
                className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all"
                id="priorities"
              >
                <Flag className="size-3 shrink-0" />
                <span>Priority</span>
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
              </Tabs.Tab>
              <Tabs.Tab
                className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all"
                id="categories"
              >
                <Tag className="size-3 shrink-0" />
                <span>Tags</span>
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-between">
        {activeSubTab === "priorities"
          ? renderPriorityContent()
          : renderCategoryContent()}
      </div>
    </div>
  );
}
