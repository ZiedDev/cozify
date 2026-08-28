import { useState } from "react";
import { Typography } from "@heroui/react";

import { useClock } from "@/hooks/use-clock";
import { FOCUS_GREETINGS } from "@/config/greetings";

export function Clock() {
  const { time12, period, fullDate, timeGreeting } = useClock();

  // One random mantra per visit
  const [greeting] = useState(
    () => FOCUS_GREETINGS[Math.floor(Math.random() * FOCUS_GREETINGS.length)],
  );

  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 sm:gap-3 select-none">
      {/* Centered Clock Display */}
      <div className="inline-flex items-start justify-center">
        <Typography
          className="font-sans text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight text-foreground tabular-nums leading-none"
          type="h1"
          weight="medium"
        >
          {time12}
        </Typography>
        <Typography
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-accent uppercase tracking-wider ml-2 sm:ml-3 pt-1 sm:pt-2 select-none"
          type="h3"
          weight="medium"
        >
          {period}
        </Typography>
      </div>

      {/* Full Date */}
      <Typography
        className="text-base sm:text-lg md:text-xl lg:text-2xl tracking-wide mt-0.5 sm:mt-1 font-normal"
        color="muted"
        type="h4"
        weight="normal"
      >
        {fullDate}
      </Typography>

      {/* Greeting Mantra */}
      <Typography
        className="text-xs sm:text-sm md:text-base lg:text-lg opacity-75 font-light mt-1.5 sm:mt-2 tracking-wide"
        color="muted"
        type="body"
        weight="normal"
      >
        {timeGreeting}. {greeting}
      </Typography>
    </div>
  );
}
