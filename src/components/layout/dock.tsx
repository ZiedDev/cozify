import { Tabs, Typography } from "@heroui/react";

import { DOCK_ITEMS, AppMode } from "@/config/modes";

export function Dock({
  activeMode,
  onSelectMode,
}: {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}) {
  return (
    <div className="fixed bottom-[max(1.75rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-fit max-w-[96vw] select-none">
      <Tabs
        selectedKey={activeMode}
        onSelectionChange={(selectedKey) =>
          onSelectMode(selectedKey as AppMode)
        }
      >
        <Tabs.ListContainer className="rounded-full">
          <Tabs.List
            aria-label="App Navigation"
            className="rounded-full bg-surface/95 border border-separator/40 shadow-xl p-1.5 sm:p-1 backdrop-blur-md"
          >
            {DOCK_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Tabs.Tab
                  key={item.id}
                  className="flex items-center gap-2 min-[701px]:gap-2 rounded-full px-3.5 sm:px-4 min-[701px]:px-5 py-2.5 sm:py-2 min-[701px]:py-2.5 text-xs min-[701px]:text-sm md:text-base font-medium whitespace-nowrap w-auto shrink-0 cursor-pointer transition-[opacity,transform,scale] duration-200 hover:opacity-90 active:scale-95"
                  id={item.id}
                >
                  {({ isSelected }) => (
                    <>
                      <Icon className="size-4.5 sm:size-4 min-[701px]:size-4.5 shrink-0" />
                      <Typography
                        className={
                          isSelected
                            ? "inline text-xs sm:text-xs min-[701px]:text-sm"
                            : "hidden min-[701px]:inline"
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
      </Tabs>
    </div>
  );
}
