import { ReactNode } from "react";
import { Toast } from "@heroui/react";

import { Navbar } from "@/components/layout/navbar";
import { BackgroundView } from "@/components/theme/background-view";
import { useAchievementTracker } from "@/hooks/use-achievement-tracker";
import { AchievementToastProvider } from "@/components/stats";

export default function DefaultLayout({ children }: { children: ReactNode }) {
  useAchievementTracker();

  return (
    <div className="relative h-dvh max-h-dvh w-full overflow-hidden bg-background select-none">
      <BackgroundView />

      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
        <Toast.Provider className="z-9999" placement="bottom end" />
        <AchievementToastProvider />
        <Navbar />
        <main className="relative max-w-8xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full flex flex-col items-center justify-between pb-18 sm:pb-20 overflow-hidden min-h-0 h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
