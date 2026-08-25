import { useState, useRef } from "react";
import { Tabs } from "@heroui/react";
import gsap from "gsap";

import DefaultLayout from "@/layouts/default";
import { Sidebar } from "@/components/layout/sidebar";
import { Dock } from "@/components/layout/dock";
import { Clock } from "@/components/home/clock";
import { Timer } from "@/components/pomodoro/timer";
import { AppMode } from "@/config/modes";

export default function IndexPage() {
  const [activeMode, setActiveMode] = useState<AppMode>("home");
  const [displayedMode, setDisplayedMode] = useState<AppMode>("home");
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = (newKey: string | number) => {
    const nextMode = newKey as AppMode;
    if (nextMode === activeMode) return;

    setActiveMode(nextMode);

    const el = sectionRef.current;
    if (!el) {
      setDisplayedMode(nextMode);
      return;
    }

    // 1. Smooth exit transition on outgoing page content
    gsap.to(el, {
      opacity: 0,
      y: -6,
      scale: 0.985,
      duration: 0.14,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: () => {
        setDisplayedMode(nextMode);
        // 2. Smooth entrance transition on incoming page content
        gsap.fromTo(
          el,
          { opacity: 0, y: 6, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.24,
            ease: "power2.out",
            overwrite: "auto",
          },
        );
      },
    });
  };

  return (
    <DefaultLayout>
      <Sidebar activeMode={activeMode} />

      <Tabs
        className="flex flex-col flex-1 items-center justify-center w-full"
        selectedKey={displayedMode}
        onSelectionChange={handleSelectionChange}
      >
        <Dock />

        <section className="flex flex-col items-center justify-center flex-1 w-full py-10 md:py-8">
          <div
            ref={sectionRef}
            className="w-full flex flex-col items-center justify-center flex-1"
          >
            <Tabs.Panel
              className="w-full flex flex-col items-center justify-center"
              id="home"
            >
              <Clock />
            </Tabs.Panel>

            <Tabs.Panel
              className="w-full flex flex-col items-center justify-center"
              id="pomodoro"
            >
              <Timer />
            </Tabs.Panel>

            <Tabs.Panel className="w-full flex-1" id="cozy">
              <div className="w-full flex-1 pointer-events-none" />
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
          </div>
        </section>
      </Tabs>
    </DefaultLayout>
  );
}
