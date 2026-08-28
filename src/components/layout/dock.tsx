import { Tabs, Typography } from "@heroui/react";

import { DOCK_ITEMS } from "@/config/modes";

export function Dock() {
  return (
    <Tabs.ListContainer className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-fit max-w-[95vw]">
      <Tabs.List
        aria-label="App Navigation"
        className="rounded-full bg-surface/95 border border-separator/40 shadow-lg p-1"
      >
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Tabs.Tab
              key={item.id}
              className="flex items-center gap-1.5 min-[701px]:gap-2 rounded-full px-3 min-[701px]:px-5 py-2 min-[701px]:py-2.5 text-xs min-[701px]:text-sm md:text-base font-medium whitespace-nowrap w-auto shrink-0 cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
              id={item.id}
            >
              {({ isSelected }) => (
                <>
                  <Icon className="size-4 min-[701px]:size-4.5 shrink-0" />
                  <Typography
                    className={
                      isSelected ? "inline" : "hidden min-[701px]:inline"
                    }
                    type="body-sm"
                    weight="medium"
                  >
                    {item.label}
                  </Typography>
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-md" />
                </>
              )}
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs.ListContainer>
  );
}
