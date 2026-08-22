import { useState } from "react";
import { Tabs } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { Dock } from "@/components/layout/dock";
import { Clock } from "@/components/home/clock";
import { Timer } from "@/components/pomodoro/timer";
import { AppMode } from "@/config/modes";

export default function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>("home");

  return (
    <DefaultLayout>
      <Sidebar activeMode={activeMode} />

      <Tabs
        className="flex flex-col flex-1 items-center justify-center w-full"
        selectedKey={activeMode}
        onSelectionChange={(key) => setActiveMode(key as AppMode)}
      >
        <Dock />

        <section className="flex flex-col items-center justify-center flex-1 w-full py-10 md:py-8">
          <Tabs.Panel id="home">
            <Clock />
          </Tabs.Panel>

          <Tabs.Panel id="pomodoro">
            <Timer />
          </Tabs.Panel>

          {(["todo", "music", "stats"] as const).map((m) => (
            <Tabs.Panel
              key={m}
              className="text-center text-muted font-light text-xl capitalize"
              id={m}
            >
              {m} mode coming up next...
            </Tabs.Panel>
          ))}
        </section>
      </Tabs>
    </DefaultLayout>
  );
}
