import { Tabs } from "@heroui/react";

import { TIMER_MODES, TimerMode } from "@/config/timer";

interface TimerTabsProps {
  mode: TimerMode;
  onSwitchMode: (newMode: TimerMode) => void;
}

export function TimerTabs({ mode, onSwitchMode }: TimerTabsProps) {
  return (
    <Tabs
      className="w-fit max-w-full"
      selectedKey={mode}
      onSelectionChange={(key) => onSwitchMode(key as TimerMode)}
    >
      <Tabs.ListContainer className="rounded-full">
        <Tabs.List
          aria-label="Timer Modes"
          className="rounded-full bg-surface p-0.5 sm:p-1"
        >
          {TIMER_MODES.map((m) => (
            <Tabs.Tab
              key={m.id}
              className="h-8 xs:h-8.5 sm:h-9 md:h-10 rounded-full px-3 xs:px-4 sm:px-5 md:px-7 w-auto text-xs xs:text-sm md:text-base font-medium whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer transition-all"
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
