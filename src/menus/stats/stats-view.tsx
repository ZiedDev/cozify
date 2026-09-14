import { useRef } from "react";
import { cn, ScrollShadow, Skeleton } from "@heroui/react";
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
import { useAuth } from "@/services/supabase/auth-context";

export function StatsView({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isLoading } = useAuth();
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
  const hasData = sessions.length > 0 || todos.some((todo) => todo.completed);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const elements = containerRef.current.querySelectorAll(
        ".stats-header-wrapper, .stats-animated-card",
      );

      gsap.fromTo(
        elements,
        { opacity: 0, y: 14, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: "power3.out",
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-2.5 sm:gap-3 w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-1 h-full flex-1 min-h-0 justify-between overflow-x-hidden overflow-y-hidden select-none",
        className,
      )}
      {...props}
    >
      {/* Header with Title, Subtitle, Range Tabs, Custom Date Picker, and Achievements */}
      <div className="stats-header-wrapper shrink-0 w-full">
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
      {isLoading && !hasData ? (
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col my-1 space-y-3 sm:space-y-3.5 animate-in fade-in duration-200">
          {/* Hero Banner Skeleton */}
          <div className="w-full h-32 sm:h-36 rounded-2xl bg-surface/70 border border-separator/30 p-4 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md opacity-60" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
          {/* Chart Card Skeleton */}
          <div className="w-full h-44 sm:h-52 rounded-2xl bg-surface/70 border border-separator/30 p-4 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md opacity-60" />
            </div>
            <div className="flex items-end gap-2 h-28 pt-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t-lg"
                  style={{ height: `${30 + (i % 4) * 20}%` }}
                />
              ))}
            </div>
          </div>
          {/* Heatmap Grid Skeleton */}
          <div className="w-full h-36 rounded-2xl bg-surface/70 border border-separator/30 p-4 flex flex-col gap-3 shrink-0">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-20 w-full rounded-xl opacity-80" />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col my-1">
          <ScrollShadow
            className="h-full w-full pr-1 sm:pr-1.5 space-y-3 sm:space-y-3.5 overflow-y-auto overflow-x-hidden"
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
      )}

      {/* Achievements & Trophies Modal */}
      {isAchievementsModalOpen && (
        <AchievementsModal
          isOpen={isAchievementsModalOpen}
          milestones={milestones}
          onClose={() => setIsAchievementsModalOpen(false)}
        />
      )}
    </div>
  );
}

export { StatsView as StatsPage };
