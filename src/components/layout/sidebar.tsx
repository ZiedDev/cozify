import React from "react";

import { useClock } from "@/hooks/use-clock";

interface SidebarProps {
  visible?: boolean;
  children?: React.ReactNode;
}

export function Sidebar({ visible = true, children }: SidebarProps) {
  return (
    <aside
      aria-label="Workspace Sidebar"
      className={`fixed top-24 md:top-28 right-8 md:right-12 z-30 select-none pointer-events-none flex flex-col items-end gap-6 text-right transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {children}
    </aside>
  );
}

Sidebar.Clock = function SidebarClock() {
  const { time12, period, shortDate } = useClock();

  return (
    <div className="flex flex-col items-end">
      <div className="inline-flex items-baseline gap-1.5 font-sans text-2xl md:text-3xl font-medium text-foreground tabular-nums leading-none">
        <span>{time12}</span>
        <span className="text-xs md:text-sm font-normal text-muted uppercase">
          {period}
        </span>
      </div>
      <p className="text-xs text-muted/70 font-light mt-1 tracking-wide">
        {shortDate}
      </p>
    </div>
  );
};
