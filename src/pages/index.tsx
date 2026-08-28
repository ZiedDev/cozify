import { useState } from "react";
import { Tabs, Typography } from "@heroui/react";

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

      <Tabs
        className="flex flex-col flex-1 items-center justify-between w-full h-full min-h-0 overflow-hidden"
        selectedKey={activeMode}
        onSelectionChange={(k) => setActiveMode(k as AppMode)}
      >
        <Dock />

        <section className="flex flex-col items-center justify-center flex-1 w-full h-full py-1 min-h-0 overflow-hidden">
          <div className="w-full h-full flex flex-col items-center justify-center flex-1 min-h-0 overflow-hidden">
            <Tabs.Panel
              className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 animate-in fade-in duration-150"
              id="home"
            >
              <Clock />
            </Tabs.Panel>

            <Tabs.Panel
              className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 animate-in fade-in duration-150"
              id="pomodoro"
            >
              <Timer />
            </Tabs.Panel>

            <Tabs.Panel
              className="w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden animate-in fade-in duration-150"
              id="todo"
            >
              <TodoPage />
            </Tabs.Panel>

            <Tabs.Panel
              className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden animate-in fade-in duration-150"
              id="cozy"
            >
              <CozyView />
            </Tabs.Panel>

            <Tabs.Panel
              className="w-full h-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden animate-in fade-in duration-150"
              id="stats"
            >
              <StatsPage />
            </Tabs.Panel>

            <Tabs.Panel
              className="flex items-center justify-center animate-in fade-in duration-150"
              id="music"
            >
              <Typography
                className="font-light capitalize"
                color="muted"
                type="h4"
              >
                Music mode coming up next...
              </Typography>
            </Tabs.Panel>
          </div>
        </section>
      </Tabs>
    </DefaultLayout>
  );
}
