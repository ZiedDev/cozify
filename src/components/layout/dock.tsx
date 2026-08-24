import { Tabs } from "@heroui/react";

import { DOCK_ITEMS } from "@/config/modes";

export function Dock() {
  return (
    <Tabs.ListContainer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-fit">
      <Tabs.List
        aria-label="App Navigation"
        className="rounded-full bg-surface"
      >
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Tabs.Tab
              key={item.id}
              className="flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-medium whitespace-nowrap w-auto shrink-0 cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
              id={item.id}
            >
              <Icon className="size-4 sm:size-4.5" />
              <span>{item.label}</span>
              <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-md" />
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs.ListContainer>
  );
}
