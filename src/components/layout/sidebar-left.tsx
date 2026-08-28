import { Typography } from "@heroui/react";
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

  const activeTodos = todos.filter((t) => !t.completed).slice(0, 4);
  const totalActive = todos.filter((t) => !t.completed).length;

  return (
    <div
      className={`flex flex-col gap-1.5 sm:gap-2 w-full ${
        align === "center" ? "max-w-xs items-center" : "max-w-full items-start"
      } pointer-events-auto`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 border-b border-separator/30 pb-1.5 px-0.5 w-full">
        <Typography
          className="text-[11px] md:text-xs text-foreground/90 tracking-wide uppercase"
          type="body-xs"
          weight="semibold"
        >
          To-Do
        </Typography>
        {totalActive > 0 && (
          <Typography
            className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/30"
            color="muted"
            type="body-xs"
            weight="medium"
          >
            {totalActive} left
          </Typography>
        )}
      </div>

      {/* Mini Tasks List */}
      {activeTodos.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-surface/40 border border-separator/30 text-muted w-full">
          <CheckCircle2 className="size-3.5 text-accent shrink-0" />
          <Typography
            className="text-[11px] md:text-xs font-light"
            color="muted"
            type="body-xs"
          >
            All clear
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 w-full">
          {activeTodos.map((todo) => {
            const priorityConfig = PRIORITY_CONFIG[todo.priority || "none"];

            return (
              <button
                key={todo.id}
                className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface/80 hover:bg-surface border border-separator/40 hover:border-separator/80 shadow-2xs transition-all duration-150 cursor-pointer select-none text-left"
                title="Click to complete task"
                type="button"
                onClick={() => toggleTodo(todo.id)}
              >
                {/* Tactile Circular Check Button */}
                <span
                  aria-label={`Mark "${todo.title}" as complete`}
                  className="size-3.5 md:size-4 rounded-full border-2 border-muted/50 group-hover:border-accent group-hover:scale-110 bg-surface/50 transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0"
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
                  className="text-[11px] md:text-xs text-foreground/90 flex-1 min-w-0"
                  type="body-xs"
                  weight="medium"
                >
                  {todo.title}
                </Typography>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface LeftSidebarWidgetWrapperProps {
  show: boolean;
  children: React.ReactNode;
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
      <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-start">
        {children}
      </div>
    </div>
  );
}

interface SidebarLeftProps {
  activeMode: AppMode;
}

export function SidebarLeft({ activeMode }: SidebarLeftProps) {
  // Show To-Do widget on desktop/tablet (> 950px) when not on To-Do or Stats tab
  const showTodo = activeMode !== "todo" && activeMode !== "stats";

  return (
    <aside
      aria-label="Workspace Left Sidebar"
      className="hidden min-[951px]:flex fixed top-20 md:top-24 lg:top-28 left-4 md:left-6 lg:left-8 xl:left-12 z-30 select-none pointer-events-none flex-col items-start text-left w-56 md:w-60 lg:w-64 xl:w-72"
    >
      <LeftSidebarWidgetWrapper show={showTodo}>
        <SidebarTodoWidget />
      </LeftSidebarWidgetWrapper>
    </aside>
  );
}
