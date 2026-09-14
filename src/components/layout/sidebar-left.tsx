import { SidebarTodoWidget } from "./sidebar-todo";

import { AppMode } from "@/config/modes";

export { SidebarTodoWidget };

export function SidebarLeft({ activeMode }: { activeMode: AppMode }) {
  const showTodo = activeMode !== "todo";

  return (
    <aside
      aria-label="Workspace Left Sidebar"
      className="hidden min-[951px]:flex fixed top-[calc(5rem+env(safe-area-inset-top,0px))] md:top-24 lg:top-28 left-4 md:left-6 lg:left-8 xl:left-12 z-30 select-none pointer-events-none flex-col items-start text-left w-56 md:w-60 lg:w-64 xl:w-72"
    >
      <div
        className={`grid w-full transition-all duration-300 ease-out ${
          showTodo
            ? "grid-rows-[1fr] opacity-100 translate-x-0"
            : "grid-rows-[0fr] opacity-0 -translate-x-4 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-start max-h-[calc(100vh-14rem)]">
          <SidebarTodoWidget />
        </div>
      </div>
    </aside>
  );
}
