import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-8 md:px-12 grow py-12 md:py-20 w-full">
        {children}
      </main>
    </div>
  );
}
