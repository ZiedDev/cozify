import { ReactNode, useState } from "react";
import { Typography, ScrollShadow } from "@heroui/react";
import { Check, CheckCircle2 } from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import { PRIORITY_CONFIG } from "@/components/todo/types";
import { AppMode } from "@/config/modes";

export function SidebarTodoWidget({
  align = "start",
}: {
  align?: "start" | "center";
}) {
  const { todos, toggleTodo } = useTodos();
  const [visibleCount, setVisibleCount] = useState(15);

  const activeTodos = todos.filter((t) => !t.completed);
  const totalActive = activeTodos.length;
  const displayedTodos = activeTodos.slice(0, visibleCount);
  const hasMore = visibleCount < totalActive;

  return (
    <div
      className={`flex flex-col gap-1.5 sm:gap-2 w-full h-full flex-1 min-h-0 ${
        align === "center" ? "max-w-xs items-center" : "max-w-full items-start"
      } pointer-events-auto`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 border-b border-separator/30 pb-1.5 px-0.5 w-full shrink-0">
        <Typography
          className="text-xs md:text-sm text-foreground/90 uppercase"
          type="body-xs"
          weight="semibold"
        >
          To-Do
        </Typography>
        {totalActive > 0 && (
          <Typography
            className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/30"
            color="muted"
            type="body-xs"
            weight="medium"
          >
            {totalActive} left
          </Typography>
        )}
      </div>

      {/* Mini Tasks List with ScrollShadow & Load More */}
      {totalActive === 0 ? (
        <div className="flex-1 flex items-center justify-center gap-2 py-4 px-2.5 rounded-xl bg-surface/40 border border-separator/30 text-muted w-full">
          <CheckCircle2 className="size-3.5 text-accent shrink-0" />
          <Typography
            className="text-xs md:text-sm font-light"
            color="muted"
            type="body-xs"
          >
            All clear
          </Typography>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 w-full">
          <ScrollShadow className="flex-1 min-h-0 max-h-full w-full flex flex-col gap-1.5 pr-0.5 overflow-y-auto no-scrollbar">
            {displayedTodos.map((todo) => {
              const priorityConfig = PRIORITY_CONFIG[todo.priority || "none"];

              return (
                <button
                  key={todo.id}
                  className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface/80 hover:bg-surface border border-separator/40 hover:border-separator/80 shadow-2xs transition-[background-color,border-color] duration-150 cursor-pointer select-none text-left shrink-0"
                  title="Click to complete task"
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                >
                  {/* Tactile Circular Check Button */}
                  <span
                    aria-label={`Mark "${todo.title}" as complete`}
                    className="size-3.5 md:size-4 rounded-full border-2 border-muted/50 group-hover:border-accent group-hover:scale-110 bg-surface/50 transition-[border-color,transform] duration-150 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Check className="size-2 md:size-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </span>

                  {/* Priority Dot */}
                  {todo.priority && todo.priority !== "none" && (
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${priorityConfig.dotColor}`}
                    />
                  )}

                  {/* Title */}
                  <Typography
                    truncate
                    className="text-xs md:text-sm text-foreground/90 flex-1 min-w-0"
                    type="body-xs"
                    weight="medium"
                  >
                    {todo.title}
                  </Typography>
                </button>
              );
            })}
          </ScrollShadow>

          {/* Load More Button */}
          {hasMore && (
            <button
              className="w-full py-1.5 px-2 rounded-xl text-center text-xs font-medium text-accent hover:bg-accent/10 border border-accent/20 transition-[background-color,border-color] duration-200 cursor-pointer shrink-0"
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 10)}
            >
              Load more ({totalActive - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LeftSidebarWidgetWrapperProps {
  show: boolean;
  children: ReactNode;
}

function LeftSidebarWidgetWrapper({
  show,
  children,
}: LeftSidebarWidgetWrapperProps) {
  return (
    <div
      className={`grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out ${
        show
          ? "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0 pointer-events-none"
      }`}
    >
      <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-start max-h-[calc(100vh-14rem)]">
        {children}
      </div>
    </div>
  );
}

interface SidebarLeftProps {
  activeMode: AppMode;
}

export function SidebarLeft({ activeMode }: SidebarLeftProps) {
  // Show sidebar and widgets on desktop/tablet (> 950px) when not on To-Do tab
  const showSidebar = activeMode !== "todo";

  if (!showSidebar) return null;

  return (
    <aside
      aria-label="Workspace Left Sidebar"
      className="hidden min-[951px]:flex fixed top-20 md:top-24 lg:top-28 left-4 md:left-6 lg:left-8 xl:left-12 z-30 select-none pointer-events-none flex-col items-start text-left w-56 md:w-60 lg:w-64 xl:w-72 transition-[opacity,transform] duration-300"
    >
      <LeftSidebarWidgetWrapper show={showSidebar}>
        <SidebarTodoWidget />
      </LeftSidebarWidgetWrapper>
    </aside>
  );
}
