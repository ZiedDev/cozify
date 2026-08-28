import { Toast } from "@heroui/react";

import { Navbar } from "@/components/layout/navbar";
import { BackgroundView } from "@/components/theme/background-view";
import { useAchievementTracker } from "@/hooks/use-achievement-tracker";
import { AchievementToastProvider } from "@/components/stats/components/achievement-toast";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAchievementTracker();

  return (
    <div className="relative flex flex-col h-screen h-dvh overflow-hidden">
      <BackgroundView />
      <Toast.Provider className="z-[9999]" placement="bottom end" />
      <AchievementToastProvider />
      <Navbar />
      <main className="relative z-10 max-w-8xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full flex flex-col items-center justify-between pb-18 sm:pb-20 overflow-hidden min-h-0 h-full">
        {children}
      </main>
    </div>
  );
}
