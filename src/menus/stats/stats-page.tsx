import { useRef } from "react";
import { cn, ScrollShadow } from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { StatsHeader } from "./components/stats-header";
import { StatsHero } from "./components/stats-hero";
import { FocusChart } from "./components/focus-chart";
import { FocusGrid } from "./components/activity-heatmap";
import { ProductivityRhythm } from "./components/productivity-rhythm";
import { TagsAnalytics } from "./components/tags-analytics";
import { AchievementsModal } from "./components/achievements-modal";

import { useStats } from "@/hooks/use-stats";

export function StatsPage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
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
    milestones,
  } = useStats();

  const containerRef = useRef<HTMLDivElement>(null);
  const hasData = sessions.length > 0 || todos.some((t) => t.completed);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const cards = containerRef.current.querySelectorAll(
        ".stats-animated-card",
      );

      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 10, scale: 0.99 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            stagger: 0.06,
            ease: "power2.out",
          },
        );
      }
    },
    { dependencies: [range, customDateRange], scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-2.5 sm:gap-3 w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-1 h-full flex-1 min-h-0 justify-between overflow-hidden select-none",
        className,
      )}
      {...props}
    >
      {/* Header with Title, Subtitle, Range Tabs, Custom Date Picker, and Achievements */}
      <div className="shrink-0 w-full">
        <StatsHeader
          customDateRange={customDateRange}
          hasData={hasData}
          milestones={milestones}
          overallStats={overallStats}
          range={range}
          onCustomDateRangeChange={setCustomDateRange}
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
          <div className="stats-animated-card">
            <StatsHero
              customDateRange={customDateRange}
              range={range}
              stats={overallStats}
            />
          </div>

          {/* 2. Primary Focus Trend Visualizer */}
          <div className="stats-animated-card">
            <FocusChart
              data={dailyChartData}
              onSelectRange={(selectedRange) => {
                setCustomDateRange(selectedRange);
                setRange("custom");
              }}
            />
          </div>

          {/* 3. Focus Grid Consistency Matrix */}
          <div className="stats-animated-card">
            <FocusGrid
              heatmapData={heatmapData}
              overallStats={overallStats}
              onSelectDate={(dateStr) => {
                setCustomDateRange({ start: dateStr, end: dateStr });
                setRange("custom");
              }}
            />
          </div>

          {/* 4. Side-by-Side: Productivity Rhythm & Unified Category Tags Analytics */}
          <div className="stats-animated-card grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 w-full">
            <ProductivityRhythm
              overallStats={overallStats}
              timeOfDayStats={timeOfDayStats}
            />
            <TagsAnalytics tagStats={tagStats} todos={todos} />
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
