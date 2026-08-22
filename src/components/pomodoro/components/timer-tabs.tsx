import { Tabs } from "@heroui/react";

import { TIMER_MODES, TimerMode } from "@/config/timer";

interface TimerTabsProps {
  mode: TimerMode;
  onSwitchMode: (newMode: TimerMode) => void;
}

export function TimerTabs({ mode, onSwitchMode }: TimerTabsProps) {
  return (
    <Tabs
      className="w-fit"
      selectedKey={mode}
      onSelectionChange={(key) => onSwitchMode(key as TimerMode)}
    >
      <Tabs.ListContainer className="rounded-full">
        <Tabs.List
          aria-label="Timer Modes"
          className="rounded-full bg-surface p-1"
        >
          {TIMER_MODES.map((m) => (
            <Tabs.Tab
              key={m.id}
              className="h-10 sm:h-11 rounded-full px-5 sm:px-7 w-auto text-sm sm:text-base font-medium whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer"
              id={m.id}
            >
              <span>{m.label}</span>
              <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-sm" />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
