import { useState, useEffect } from "react";

export function useIsMobile(breakpointPx = 640): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < breakpointPx;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mql.matches);

    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, [breakpointPx]);

  return isMobile;
}
