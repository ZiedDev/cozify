import { useState, useRef } from "react";
import { Typography } from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { useClock } from "@/hooks/use-clock";
import { FOCUS_GREETINGS } from "@/config/greetings";

export function Clock() {
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
        { opacity: 0, y: 10, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
        },
      );
    },
    { scope: clockRef },
  );

  return (
    <div
      ref={clockRef}
      className="flex flex-col items-center justify-center text-center gap-2 sm:gap-3 select-none"
    >
      {/* Centered Clock Display */}
      <div className="inline-flex items-start justify-center">
        <Typography
          className="font-sans text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight text-foreground tabular-nums leading-none drop-shadow-xs"
          type="h1"
          weight="medium"
        >
          {time12}
        </Typography>
        <Typography
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-accent uppercase r ml-2 sm:ml-3 pt-1 sm:pt-2 select-none font-semibold"
          type="h3"
          weight="medium"
        >
          {period}
        </Typography>
      </div>

      {/* Full Date */}
      <Typography
        className="text-base sm:text-lg md:text-xl lg:text-2xl  mt-0.5 sm:mt-1 font-normal"
        color="muted"
        type="h4"
        weight="normal"
      >
        {fullDate}
      </Typography>

      {/* Greeting Mantra */}
      <Typography
        className="text-xs sm:text-sm md:text-base lg:text-lg opacity-75 font-light text-center mt-1.5 sm:mt-2 max-w-md"
        color="muted"
        type="body"
        weight="normal"
      >
        {timeGreeting}. {greeting}
      </Typography>
    </div>
  );
}
