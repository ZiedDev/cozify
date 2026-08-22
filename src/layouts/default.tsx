import { Toast } from "@heroui/react";

import { Navbar } from "@/components/layout/navbar";
import { BackgroundView } from "@/components/theme/background-view";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <BackgroundView />
      <Toast.Provider className="z-[9999]" placement="bottom end" />
      <Navbar />
      <main className="relative z-10 max-w-8xl mx-auto px-8 md:px-12 grow w-full flex flex-col items-center justify-center pb-24">
        {children}
      </main>
    </div>
  );
}
