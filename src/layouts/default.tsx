import { Toast } from "@heroui/react";

import { Navbar } from "@/components/layout/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Toast.Provider placement="bottom end" />
      <Navbar />
      <main className="max-w-6xl mx-auto px-8 md:px-12 grow w-full flex flex-col items-center justify-center pb-24">
        {children}
      </main>
    </div>
  );
}
