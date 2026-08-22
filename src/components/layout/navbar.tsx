import { useState } from "react";
import { Button } from "@heroui/react";
import { Settings as SettingsIcon } from "lucide-react";

import { SettingsModal } from "@/components/settings/settings-modal";
import { ThemePopover } from "@/components/theme/theme-popover";

export function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-20 md:h-24 items-center justify-between px-8 md:px-12">
        <span className="font-serif font-black text-3xl md:text-4xl tracking-tight text-foreground select-none">
          Cozify
        </span>

        <div className="flex items-center gap-2 md:gap-3">
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

      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </header>
  );
}
