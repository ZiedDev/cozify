import { useContext } from "react";

import { TimerContext, TimerContextValue } from "@/context/timer-context";

export { type TimerMode } from "@/config/timer";

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }

  return context;
}
