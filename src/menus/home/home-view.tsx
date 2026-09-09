import { useState, useRef } from "react";
import { cn, Surface, Typography } from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { RollingText } from "@/components/ui/rolling-text";
import { useClock } from "@/hooks/use-clock";
import { FOCUS_GREETINGS } from "@/config/greetings";

export function HomeView({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { time12, period, fullDate, timeGreeting } = useClock();
  const clockRef = useRef<HTMLDivElement>(null);

  // One random mantra per visit
  const [greeting] = useState(
    () => FOCUS_GREETINGS[Math.floor(Math.random() * FOCUS_GREETINGS.length)],
  );

  useGSAP(
    () => {
      if (!clockRef.current) return;

      const elements = clockRef.current.children;

      gsap.fromTo(
        elements,
        { opacity: 0, y: 14, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: "power3.out",
        },
      );
    },
    { scope: clockRef },
  );

  return (
    <Surface
      ref={clockRef}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center text-center select-none space-y-2 overflow-x-hidden",
        className,
      )}
      variant="transparent"
      {...props}
    >
      {/* Centered Clock Display */}
      <Surface
        className="inline-flex items-start justify-center"
        variant="transparent"
      >
        <Typography
          aria-label={time12}
          className="text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl"
          type="h1"
          weight="medium"
        >
          <RollingText value={time12} />
        </Typography>
        <Typography
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-accent uppercase ml-2 sm:ml-3 mt-1 sm:mt-4 select-none font-semibold"
          type="h3"
          weight="medium"
        >
          <RollingText duration={0.6} stagger={0.08} value={period} />
        </Typography>
      </Surface>

      {/* Full Date */}
      <Typography color="muted" type="h4" weight="normal">
        {fullDate}
      </Typography>

      {/* Greeting Mantra */}
      <Typography
        className="text-center"
        color="muted"
        type="body"
        weight="normal"
      >
        {timeGreeting}. {greeting}
      </Typography>
    </Surface>
  );
}

export { HomeView as Clock };
