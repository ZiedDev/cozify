import { ScrollShadow } from "@heroui/react";

import { StatsHeader } from "./components/stats-header";
import { StatsKpiCard } from "./components/stats-kpi-card";
import { FocusChart } from "./components/focus-chart";
import { ActivityHeatmap } from "./components/activity-heatmap";
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
    loadSampleData,
    copySummaryToClipboard,
    exportStatsJson,
  } = useStats();

  const hasData = sessions.length > 0 || todos.some((t) => t.completed);

  return (
    <div className="flex flex-col h-full w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-auto px-3 md:px-4 pt-1.5 pb-20 select-none overflow-hidden">
      {/* Header with Title, Subtitle, Range Tabs, Custom Date Picker, and Achievements */}
      <StatsHeader
        customDateRange={customDateRange}
        hasData={hasData}
        milestones={milestones}
        overallStats={overallStats}
        range={range}
        onCopySummary={copySummaryToClipboard}
        onCustomDateRangeChange={setCustomDateRange}
        onExportJson={exportStatsJson}
        onLoadSampleData={loadSampleData}
        onOpenAchievements={() => setIsAchievementsModalOpen(true)}
        onRangeChange={setRange}
      />

      {/* Main Unified Scrollable Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col my-1">
        <ScrollShadow
          className="h-full w-full pr-1 sm:pr-1.5 space-y-2.5 sm:space-y-3 overflow-y-auto"
          hideScrollBar={false}
        >
          {/* 1. Key Metrics (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
            <StatsKpiCard stats={overallStats} type="kpi_focus_time" />
            <StatsKpiCard stats={overallStats} type="kpi_pomodoros" />
            <StatsKpiCard stats={overallStats} type="kpi_streaks" />
            <StatsKpiCard stats={overallStats} type="kpi_tasks" />
          </div>

          {/* 2. Focus Trend Chart */}
          <FocusChart data={dailyChartData} />

          {/* 3. Side-by-Side: Productivity Rhythm & Task Analytics */}
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

          {/* 4. 16-Week Activity Contribution Heatmap */}
          <ActivityHeatmap
            heatmapData={heatmapData}
            overallStats={overallStats}
          />
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
