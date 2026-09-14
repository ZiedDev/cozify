import { ReactNode } from "react";
import { Toast } from "@heroui/react";

import { Navbar } from "@/components/layout/navbar";
import { BackgroundView } from "@/components/theme/background-view";
import { useAchievementTracker } from "@/hooks/use-achievement-tracker";
import { AchievementToastProvider } from "@/components/stats";

export default function DefaultLayout({ children }: { children: ReactNode }) {
  useAchievementTracker();

  return (
    <div className="relative flex flex-col h-dvh max-h-dvh w-full overflow-hidden bg-background select-none">
      <BackgroundView />
      <Toast.Provider className="z-9999" placement="bottom end" />
      <AchievementToastProvider />
      <Navbar />
      <main className="relative z-10 max-w-8xl mx-auto px-4 sm:px-8 md:px-12 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] flex-1 w-full flex flex-col items-center justify-between pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:pb-20 overflow-hidden min-h-0 h-full">
        {children}
      </main>
    </div>
  );
}
