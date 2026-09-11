import { useState } from "react";
import { Typography, Button, Drawer } from "@heroui/react";
import { Settings, LayoutGrid } from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import { useTimer } from "@/hooks/use-timer";
import { SettingsModal } from "@/components/settings";
import { SidebarTodoWidget } from "@/components/layout/sidebar-todo";
import { SidebarClock, SidebarTimer } from "@/components/layout/sidebar";
import { ThemePopover } from "@/components/theme/theme-popover";
import { DrawerMusicPlayer } from "@/components/music";

export function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { todos } = useTodos();
  const { hasActiveSession } = useTimer();

  const activeTodoCount = todos.filter((todo) => !todo.completed).length;

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-20 md:h-24 items-center justify-between px-6 sm:px-8 md:px-12">
        <Typography
          className="font-serif font-black text-3xl md:text-4xl tracking-tight text-foreground select-none"
          type="h1"
        >
          Cozify
        </Typography>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Quick Glance Trigger (Triggers at <= 950px) */}
          <Button
            isIconOnly
            aria-label="Open Workspace Widgets"
            className="flex min-[951px]:hidden size-9 md:size-10 rounded-2xl bg-surface/80 border text-foreground duration-200 cursor-pointer shadow-2xs relative"
            size="md"
            variant="ghost"
            onClick={() => setIsDrawerOpen(true)}
          >
            <LayoutGrid className="size-4 md:size-5" />
            {(activeTodoCount > 0 || hasActiveSession) && (
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent ring-2 ring-background" />
            )}
          </Button>

          {/* Theme & Wallpapers (Appearance) Trigger */}
          <ThemePopover />

          {/* Settings Trigger */}
          <Button
            isIconOnly
            aria-label="Settings"
            className="size-9 md:size-10 rounded-2xl bg-surface/80 hover:bg-surface border border-separator/40 hover:border-separator/80 text-foreground transition-[background-color,border-color] duration-200 cursor-pointer shadow-2xs"
            size="md"
            variant="ghost"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="size-4 md:size-5" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Mobile Glance Drawer */}
      <Drawer.Backdrop isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="h-full max-h-dvh flex flex-col justify-between p-4 sm:p-5 max-w-xs sm:max-w-sm w-full bg-surface/98 backdrop-blur-xl border-l border-separator shadow-2xl overflow-hidden">
            <Drawer.Header className="shrink-0 flex items-center justify-between pb-2 border-b border-separator/30">
              <Drawer.Heading className="text-base font-semibold flex items-center gap-2 text-foreground">
                <LayoutGrid className="size-4 text-accent" />
                <span>Widgets</span>
              </Drawer.Heading>
            </Drawer.Header>

            {/* 1. Sticky Top: Clock & Day Progress (Centered, bigger) */}
            <div className="shrink-0 pt-2 pb-2.5 border-b border-separator/20 flex flex-col gap-4 items-center justify-center w-full">
              <SidebarClock align="center" />
              <SidebarTimer align="center" />
            </div>

            {/* 2. Flexible Middle Area: To-Do Tasks taking remaining space */}
            <div className="flex-1 min-h-0 flex flex-col gap-1 py-2 overflow-hidden">
              <SidebarTodoWidget align="start" />
            </div>

            {/* 3. Sticky Bottom: Roomy & Unconstrained Music & Audio Player */}
            <div className="shrink-0 mt-auto pt-2 border-t border-separator/30 flex flex-col gap-2">
              <DrawerMusicPlayer onCloseDrawer={() => setIsDrawerOpen(false)} />
            </div>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </header>
  );
}
