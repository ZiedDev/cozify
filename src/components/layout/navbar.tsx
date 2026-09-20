import { useState, lazy, Suspense } from "react";
import { Typography, Button, Drawer, Avatar, Spinner } from "@heroui/react";
import { Settings, LayoutGrid, User } from "lucide-react";

import { useAuth } from "@/services/supabase/auth-context";
import { SidebarTodoWidget } from "@/components/layout/sidebar-todo";
import { SidebarClock, SidebarTimer } from "@/components/layout/sidebar";
import { ThemePopover } from "@/components/theme/theme-popover";
import { DrawerMusicPlayer } from "@/components/music";

const SettingsModal = lazy(() =>
  import("@/components/settings").then((m) => ({ default: m.SettingsModal })),
);
const AuthModal = lazy(() =>
  import("@/components/auth").then((m) => ({ default: m.AuthModal })),
);
const AccountModal = lazy(() =>
  import("@/components/auth").then((m) => ({ default: m.AccountModal })),
);

export function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 shrink-0">
      <div className="mx-auto flex h-16 sm:h-20 md:h-24 items-center justify-between px-6 sm:px-8 md:px-12">
        <Typography
          className="font-serif italic font-black text-3xl md:text-4xl tracking-wide text-foreground select-none"
          type="h1"
        >
          Cozify
        </Typography>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Quick Glance Trigger (Triggers at <= 950px) */}
          <Button
            isIconOnly
            aria-label="Open Workspace Widgets"
            className="flex size-9 min-[951px]:hidden md:size-10 rounded-2xl bg-surface/80 hover:bg-surface relative"
            size="md"
            variant="ghost"
            onClick={() => setIsDrawerOpen(true)}
          >
            <LayoutGrid className="size-4 md:size-5" />
          </Button>

          {/* Theme & Wallpapers (Appearance) Trigger */}
          <ThemePopover />

          {/* User Account / Cloud Sync Trigger */}
          <Button
            isIconOnly
            aria-label="Account & Cloud Sync"
            className="size-9 md:size-10 rounded-2xl bg-surface/80 hover:bg-surface relative"
            size="md"
            variant="ghost"
            onClick={() => setIsAuthOpen(true)}
          >
            {user ? (
              <>
                <Avatar className="size-6 rounded-lg text-[10px]">
                  {profile?.avatarUrl && (
                    <Avatar.Image src={profile.avatarUrl} />
                  )}
                  <Avatar.Fallback>
                    {(profile?.displayName || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
              </>
            ) : (
              <User className="size-4 md:size-5" />
            )}
          </Button>

          {/* Settings Trigger */}
          <Button
            isIconOnly
            aria-label="Settings"
            className="size-9 md:size-10 rounded-2xl bg-surface/80 hover:bg-surface"
            size="md"
            variant="ghost"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="size-4 md:size-5" />
          </Button>
        </div>
      </div>

      {/* Auth Modal for Guests / Account Modal for Logged in Users */}
      <Suspense
        fallback={
          isSettingsOpen || isAuthOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="p-6 rounded-3xl bg-surface/90 border border-separator/40 shadow-2xl flex flex-col items-center gap-3">
                <Spinner color="accent" size="md" />
                <Typography color="muted" type="body-xs">
                  Loading...
                </Typography>
              </div>
            </div>
          ) : null
        }
      >
        {isAuthOpen &&
          (user ? (
            <AccountModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
          ) : (
            <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
          ))}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          />
        )}
      </Suspense>

      {/* Mobile Glance Drawer */}
      <Drawer.Backdrop isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="h-full max-h-dvh flex flex-col justify-between p-4 sm:p-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] max-w-xs sm:max-w-sm w-full bg-surface/98 backdrop-blur-xl border-l border-separator shadow-2xl overflow-hidden">
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
