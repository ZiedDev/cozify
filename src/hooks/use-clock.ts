import { useState, useEffect } from "react";

export function useClock() {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    return () => clearInterval(timer);
  }, []);

  const rawHours = time.getHours();
  const hours12 = rawHours % 12 || 12;
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const period = rawHours >= 12 ? "PM" : "AM";

  const time12 = `${String(hours12).padStart(2, "0")}:${minutes}`;

  const timeGreeting =
    rawHours < 12
      ? "Good morning"
      : rawHours < 18
        ? "Good afternoon"
        : "Good evening";

  const fullDate = time.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const shortDate = time.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return {
    time,
    time12,
    period,
    timeGreeting,
    fullDate,
    shortDate,
  };
}
