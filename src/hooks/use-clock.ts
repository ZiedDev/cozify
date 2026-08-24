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

  const time12 = `${hours12}:${minutes}`;

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

  // Sidebar date format: "Monday, 24 Aug '26"
  const weekday = time.toLocaleDateString("en-US", { weekday: "long" });
  const day = time.getDate();
  const month = time.toLocaleDateString("en-US", { month: "short" });
  const year2Digit = String(time.getFullYear()).slice(-2);
  const sidebarDate = `${weekday}, ${day} ${month} '${year2Digit}`;

  // Day progress calculations (24-hour cycle)
  const totalSecondsInDay = 86400;
  const secondsPassedToday =
    time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
  const dayPercent = Math.min(
    100,
    Math.max(0, (secondsPassedToday / totalSecondsInDay) * 100),
  );

  const secondsRemaining = Math.max(0, totalSecondsInDay - secondsPassedToday);
  const hoursLeft = Math.floor(secondsRemaining / 3600);
  const minutesLeft = Math.floor((secondsRemaining % 3600) / 60);

  return {
    time,
    time12,
    period,
    timeGreeting,
    fullDate,
    shortDate,
    sidebarDate,
    dayPercent,
    hoursLeft,
    minutesLeft,
  };
}
