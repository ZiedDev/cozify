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
    <div className="flex flex-col items-center justify-center text-center gap-3 select-none">
      {/* Centered Clock Display */}
      <div className="inline-flex items-start justify-center">
        <h1 className="font-sans text-8xl sm:text-9xl md:text-[9.5rem] font-medium tracking-tight text-foreground tabular-nums leading-none">
          {time12}
        </h1>
        <span className="text-xl sm:text-2xl font-medium text-accent uppercase tracking-wider ml-3 pt-2 select-none">
          {period}
        </span>
      </div>

      {/* Full Date */}
      <p className="text-xl md:text-2xl text-muted font-normal tracking-wide mt-1">
        {fullDate}
      </p>

      {/* Greeting Mantra */}
      <p className="text-base md:text-lg text-muted/75 font-light mt-3 tracking-wide">
        {timeGreeting}. {greeting}
      </p>
    </div>
  );
}
