import { ScrollShadow } from "@heroui/react";

import { StatsHeader } from "./components/stats-header";
import { StatsHero } from "./components/stats-hero";
import { FocusChart } from "./components/focus-chart";
import { FocusGrid } from "./components/activity-heatmap";
import { TimeAndTagsBreakdown } from "./components/time-and-tags-breakdown";
import { TaskAnalytics } from "./components/task-analytics";
import { AchievementsModal } from "./components/achievements-modal";

import { useStats } from "@/hooks/use-stats";

export function StatsPage() {
  const {
    sessions,
    todos,
    range,
    setRange,
    customDateRange,
    setCustomDateRange,
    isAchievementsModalOpen,
    setIsAchievementsModalOpen,
    overallStats,
    dailyChartData,
    heatmapData,
    timeOfDayStats,
    tagStats,
    priorityStats,
    milestones,
    copySummaryToClipboard,
    exportStatsJson,
  } = useStats();

  const hasData = sessions.length > 0 || todos.some((t) => t.completed);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-1 h-full flex-1 min-h-0 justify-between overflow-hidden transition-all select-none">
      {/* Header with Title, Subtitle, Range Tabs, Custom Date Picker, and Achievements */}
      <div className="shrink-0 w-full">
        <StatsHeader
          customDateRange={customDateRange}
          hasData={hasData}
          milestones={milestones}
          overallStats={overallStats}
          range={range}
          onCopySummary={copySummaryToClipboard}
          onCustomDateRangeChange={setCustomDateRange}
          onExportJson={exportStatsJson}
          onOpenAchievements={() => setIsAchievementsModalOpen(true)}
          onRangeChange={setRange}
        />
      </div>

      {/* Main Unified Scrollable Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col my-1">
        <ScrollShadow
          className="h-full w-full pr-1 sm:pr-1.5 space-y-3 sm:space-y-3.5 overflow-y-auto"
          hideScrollBar={false}
        >
          {/* 1. Executive Summary Hero Banner */}
          <StatsHero
            customDateRange={customDateRange}
            range={range}
            stats={overallStats}
          />

          {/* 2. Primary Focus Trend Visualizer */}
          <FocusChart
            data={dailyChartData}
            onSelectRange={(selectedRange) => {
              setCustomDateRange(selectedRange);
              setRange("custom");
            }}
          />

          {/* 3. Focus Grid Consistency Matrix */}
          <FocusGrid
            heatmapData={heatmapData}
            overallStats={overallStats}
            onSelectDate={(dateStr) => {
              setCustomDateRange({ start: dateStr, end: dateStr });
              setRange("custom");
            }}
          />

          {/* 4. Deep-Dive Analytical Insights (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 w-full">
            <TimeAndTagsBreakdown
              overallStats={overallStats}
              tagStats={tagStats}
              timeOfDayStats={timeOfDayStats}
            />
            <TaskAnalytics
              overallStats={overallStats}
              priorityStats={priorityStats}
              tagStats={tagStats}
              todos={todos}
            />
          </div>
        </ScrollShadow>
      </div>

      {/* Achievements & Trophies Modal */}
      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        milestones={milestones}
        onClose={() => setIsAchievementsModalOpen(false)}
      />
    </div>
  );
}
