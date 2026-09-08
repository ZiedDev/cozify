import { useRef } from "react";
import { cn } from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { TodoHeader } from "./components/todo-header";
import { TodoInputBar } from "./components/todo-input-bar";
import { TodoList } from "./components/todo-list";
import { TodoStatsBar } from "./components/todo-stats-bar";

export function TodoView({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const elements = containerRef.current.children;

      gsap.fromTo(
        elements,
        { opacity: 0, y: 10, scale: 0.99 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.08,
          ease: "power2.out",
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-2.5 sm:gap-3 w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-1 h-full flex-1 min-h-0 justify-between overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Header & Quick Add anchored at top */}
      <div className="flex flex-col gap-3 w-full shrink-0">
        <TodoHeader />
        <TodoInputBar />
      </div>

      {/* Task List (The ONLY scrollable part of the page) */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col my-1">
        <TodoList />
      </div>

      {/* Progress & Summary Bar anchored at bottom */}
      <div className="shrink-0 w-full pt-1">
        <TodoStatsBar />
      </div>
    </div>
  );
}

export { TodoView as TodoPage };
