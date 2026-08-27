import { useState } from "react";
import { Button, Drawer, Typography } from "@heroui/react";
import { Settings as SettingsIcon, LayoutGrid } from "lucide-react";

import { SidebarTodoWidget } from "./sidebar-left";
import { SidebarClock, SidebarTimer } from "./sidebar";

import { SettingsModal } from "@/components/settings/settings-modal";
import { ThemePopover } from "@/components/theme/theme-popover";
import { useTodos } from "@/hooks/use-todos";
import { useTimer } from "@/hooks/use-timer";

export function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { todos } = useTodos();
  const { isRunning, hasActiveSession } = useTimer();

  const activeTodoCount = todos.filter((t) => !t.completed).length;

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-20 md:h-24 items-center justify-between px-6 sm:px-8 md:px-12">
        <Typography
          type="h1"
          className="font-serif font-black text-3xl md:text-4xl tracking-tight text-foreground select-none"
        >
          Cozify
        </Typography>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Creative Mobile Quick Glance Trigger (Triggers at <= 950px) */}
          <div className="flex min-[951px]:hidden items-center">
            <Button
              aria-label="Open Workspace Widgets"
              className="relative flex items-center gap-1.5 px-3 h-8 rounded-full bg-surface/80 hover:bg-surface border border-separator/40 text-xs font-medium shadow-2xs cursor-pointer"
              size="sm"
              variant="secondary"
              onPress={() => setIsDrawerOpen(true)}
            >
              <LayoutGrid className="size-3.5 text-accent" />
              <Typography color="muted" type="body-xs" className="hidden xs:inline text-[11px]">
                Widgets
              </Typography>
              {activeTodoCount > 0 && (
                <span className="size-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeTodoCount}
                </span>
              )}
              {isRunning && (
                <span className="size-2 rounded-full bg-accent animate-pulse" />
              )}
            </Button>
          </div>

          {/* Wallpapers & Theming Popover */}
          <ThemePopover />

          {/* Settings Button */}
          <Button
            isIconOnly
            aria-label="Settings"
            className="rounded-full text-muted hover:text-foreground"
            size="sm"
            variant="ghost"
            onPress={() => setIsSettingsOpen(true)}
          >
            <SettingsIcon className="size-5" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Mobile Glance Drawer (HeroUI Drawer) */}
      <Drawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="h-full max-h-dvh flex flex-col justify-between p-5 max-w-xs w-full bg-surface/98 backdrop-blur-xl border-l border-separator shadow-2xl overflow-hidden">
              <Drawer.Header className="shrink-0 flex items-center justify-between pb-3 border-b border-separator/30">
                <Drawer.Heading className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <LayoutGrid className="size-4 text-accent" />
                  <span>Widgets</span>
                </Drawer.Heading>
              </Drawer.Header>

              <Drawer.Body className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3.5 my-2">
                {/* To-Do Quick List Card */}
                <div className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-surface-secondary/40 border border-separator/30">
                  <SidebarTodoWidget align="start" />
                </div>

                {/* Clock & Day Progress Card */}
                <div className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-surface-secondary/40 border border-separator/30">
                  <Typography
                    color="muted"
                    type="body-xs"
                    weight="bold"
                    className="text-[10px] uppercase tracking-wider mb-1"
                  >
                    Clock & Day
                  </Typography>
                  <div className="w-full">
                    <SidebarClock align="start" />
                  </div>
                </div>

                {/* Focus Timer if active */}
                {hasActiveSession && (
                  <div className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-surface-secondary/40 border border-separator/30">
                    <Typography
                      color="muted"
                      type="body-xs"
                      weight="bold"
                      className="text-[10px] uppercase tracking-wider mb-1"
                    >
                      Focus Timer
                    </Typography>
                    <div className="w-full">
                      <SidebarTimer align="start" />
                    </div>
                  </div>
                )}
              </Drawer.Body>

              <Drawer.Footer className="shrink-0 pt-3 border-t border-separator/30 flex justify-end">
                <Button
                  className="w-full text-xs"
                  slot="close"
                  variant="secondary"
                  onPress={() => setIsDrawerOpen(false)}
                >
                  Close
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </header>
  );
}
