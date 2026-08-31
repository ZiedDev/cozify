import { useState } from "react";
import { Typography } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { Dock } from "@/components/layout/dock";
import { Clock } from "@/components/home/clock";
import { Timer } from "@/components/pomodoro/timer";
import { TodoPage } from "@/components/todo/todo-page";
import { CozyView } from "@/components/cozy/cozy-view";
import { StatsPage } from "@/components/stats/stats-page";
import { AppMode } from "@/config/modes";

export default function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>("home");

  return (
    <DefaultLayout>
      <SidebarLeft activeMode={activeMode} />
      <Sidebar activeMode={activeMode} />

      <Dock activeMode={activeMode} onSelectMode={setActiveMode} />

      <section className="flex flex-col items-center justify-center flex-1 w-full h-full py-1 min-h-0 overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center flex-1 min-h-0 overflow-hidden">
          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 ${
              activeMode === "home" ? "" : "hidden"
            }`}
          >
            <Clock />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 ${
              activeMode === "pomodoro" ? "" : "hidden"
            }`}
          >
            <Timer />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden ${
              activeMode === "todo" ? "" : "hidden"
            }`}
          >
            <TodoPage />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden ${
              activeMode === "cozy" ? "" : "hidden"
            }`}
          >
            <CozyView />
          </div>

          <div
            className={`w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden ${
              activeMode === "stats" ? "" : "hidden"
            }`}
          >
            <StatsPage />
          </div>

          <div
            className={`flex items-center justify-center ${
              activeMode === "music" ? "" : "hidden"
            }`}
          >
            <Typography
              className="font-light capitalize"
              color="muted"
              type="h4"
            >
              Music mode coming up next...
            </Typography>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
