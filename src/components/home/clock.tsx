import { useState } from "react";

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
        <h1 className="font-sans text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl font-medium tracking-tight text-foreground tabular-nums leading-none">
          {time12}
        </h1>
        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-accent uppercase tracking-wider ml-2 sm:ml-3 pt-1 sm:pt-2 select-none">
          {period}
        </span>
      </div>

      {/* Full Date */}
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted font-normal tracking-wide mt-0.5 sm:mt-1">
        {fullDate}
      </p>

      {/* Greeting Mantra */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted/75 font-light mt-1.5 sm:mt-2 tracking-wide">
        {timeGreeting}. {greeting}
      </p>
    </div>
  );
}
