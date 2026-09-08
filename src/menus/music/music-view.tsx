import { useRef } from "react";
import { cn } from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { CozyMusicCard } from "./components/cozy-music-player";

export function MusicView({
  className,
  isActive = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !isActive) return;
      const elements = containerRef.current.children;

      gsap.fromTo(
        elements,
        { opacity: 0, y: 10, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [isActive], scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full flex flex-col items-center justify-center min-h-0 overflow-y-auto sm:overflow-hidden no-scrollbar select-none py-1 sm:py-2 px-2 sm:px-4",
        className,
      )}
      {...props}
    >
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl flex flex-col items-center justify-center my-auto">
        <CozyMusicCard />
      </div>
    </div>
  );
}
